import type {
  Quote,
  QuoteItem,
  CreateQuotePayload,
  QuoteStatus,
  QuoteApprovalHistory,
} from '../types/quote.ts'
import type { User } from '../types/auth.ts'
import { opportunityActivityService } from './opportunityActivityService.ts'
import { opportunityHistoryService } from './opportunityHistoryService.ts'

const STORAGE_KEY = 'crm_quotes_v1'

// Ngưỡng chiết khấu (S7-01 & S7-02)
export const DISCOUNT_TIER_1_THRESHOLD = 10 // >= 10%: Trưởng nhóm duyệt
export const DISCOUNT_TIER_2_THRESHOLD = 20 // >= 20% hoặc dưới giá sàn: Giám đốc duyệt

export interface QuoteCalculationResult {
  subtotal: number
  total_line_discount: number
  total_discount_amount: number
  discount_percentage: number
  vat_amount: number
  grand_total: number
  requires_approval: boolean
  approval_level: 'NONE' | 'MANAGER' | 'DIRECTOR'
  approval_reason?: string
  calculatedItems: QuoteItem[]
}

/**
 * Tính toán tài chính báo giá theo đúng Acceptance Criteria của S7-01 & S7-02
 */
export function calculateQuoteFinancials(
  items: QuoteItem[],
  overallDiscountType?: 'PERCENT' | 'AMOUNT',
  overallDiscountValue: number = 0
): QuoteCalculationResult {
  let subtotal = 0
  let totalLineDiscount = 0
  let totalVat = 0
  let hasBelowFloorPrice = false

  const calculatedItems = items.map((it) => {
    const qty = Math.max(1, it.quantity || 1)
    const price = Math.max(0, it.unit_price || 0)
    const lineSubtotal = price * qty

    // Chiết khấu từng dòng theo % hoặc số tiền
    let lineDiscount = 0
    if (it.discount_type === 'PERCENT') {
      const pct = Math.max(0, Math.min(100, it.discount_value || 0))
      lineDiscount = Math.round(lineSubtotal * (pct / 100))
    } else {
      lineDiscount = Math.max(0, Math.min(lineSubtotal, it.discount_value || 0))
    }

    const afterDiscount = lineSubtotal - lineDiscount
    const unitPriceAfterDiscount = qty > 0 ? afterDiscount / qty : 0

    // Kiểm tra giá sàn (Floor price)
    if (it.floor_price && unitPriceAfterDiscount < it.floor_price) {
      hasBelowFloorPrice = true
    }

    // Thuế VAT
    const vatRate = it.vat_rate || 0
    const lineVat = Math.round(afterDiscount * (vatRate / 100))
    const lineTotal = afterDiscount + lineVat

    subtotal += lineSubtotal
    totalLineDiscount += lineDiscount
    totalVat += lineVat

    return {
      ...it,
      quantity: qty,
      unit_price: price,
      line_discount_amount: lineDiscount,
      line_total: lineTotal,
    }
  })

  // Chiết khấu tổng toàn báo giá
  let overallDiscountAmount = 0
  const remainingAfterLineDiscount = Math.max(0, subtotal - totalLineDiscount)
  if (overallDiscountType === 'PERCENT') {
    const ovPct = Math.max(0, Math.min(100, overallDiscountValue || 0))
    overallDiscountAmount = Math.round(remainingAfterLineDiscount * (ovPct / 100))
  } else if (overallDiscountType === 'AMOUNT') {
    overallDiscountAmount = Math.max(0, Math.min(remainingAfterLineDiscount, overallDiscountValue || 0))
  }

  const totalDiscountAmount = totalLineDiscount + overallDiscountAmount
  const discountPercentage = subtotal > 0 ? Number(((totalDiscountAmount / subtotal) * 100).toFixed(1)) : 0
  const grandTotal = Math.max(0, subtotal - totalDiscountAmount + totalVat)

  // Kiểm tra ngưỡng phê duyệt (S7-02 AC)
  let requiresApproval = false
  let approvalLevel: 'NONE' | 'MANAGER' | 'DIRECTOR' = 'NONE'
  let approvalReason: string | undefined = undefined

  if (hasBelowFloorPrice || discountPercentage >= DISCOUNT_TIER_2_THRESHOLD) {
    requiresApproval = true
    approvalLevel = 'DIRECTOR'
    approvalReason = hasBelowFloorPrice
      ? 'Có dòng sản phẩm bán dưới giá sàn niêm yết (Bắt buộc Giám đốc kinh doanh duyệt)'
      : `Mức chiết khấu tổng ${discountPercentage}% chạm ngưỡng cấp 2 (>= ${DISCOUNT_TIER_2_THRESHOLD}%, cần Giám đốc kinh doanh duyệt)`
  } else if (discountPercentage >= DISCOUNT_TIER_1_THRESHOLD) {
    requiresApproval = true
    approvalLevel = 'MANAGER'
    approvalReason = `Mức chiết khấu tổng ${discountPercentage}% chạm ngưỡng cấp 1 (>= ${DISCOUNT_TIER_1_THRESHOLD}%, cần Trưởng nhóm duyệt)`
  }

  return {
    subtotal,
    total_line_discount: totalLineDiscount,
    total_discount_amount: totalDiscountAmount,
    discount_percentage: discountPercentage,
    vat_amount: totalVat,
    grand_total: grandTotal,
    requires_approval: requiresApproval,
    approval_level: approvalLevel,
    approval_reason: approvalReason,
    calculatedItems,
  }
}

// Mock initial quotes
const INITIAL_QUOTES: Quote[] = [
  {
    id: 'quote-001',
    quote_number: 'BG-2025-001',
    version: 1,
    is_active_version: true,
    opportunity_id: 'opp-1',
    opportunity_title: 'Triển khai CRM cho Tập đoàn Alpha',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    customer_contact_name: 'Nguyễn Văn An',
    customer_contact_email: 'contact@alphatech.vn',
    customer_contact_phone: '024 3768 9999',
    created_by_name: 'Nguyễn Văn An',
    status: 'APPROVED',
    items: [
      {
        id: 'item-1',
        product_name: 'Phần mềm CRM Cloud Doanh Nghiệp',
        product_code: 'CRM-ENT',
        unit: 'Gói/Năm',
        unit_price: 150000000,
        quantity: 1,
        discount_type: 'PERCENT',
        discount_value: 5,
        line_discount_amount: 7500000,
        floor_price: 120000000,
        vat_rate: 10,
        line_total: 156750000,
      },
    ],
    subtotal: 150000000,
    total_line_discount: 7500000,
    overall_discount_type: 'PERCENT',
    overall_discount_value: 0,
    total_discount_amount: 7500000,
    discount_percentage: 5.0,
    vat_amount: 14250000,
    grand_total: 156750000,
    valid_until: '2025-12-31',
    payment_terms: 'Thanh toán 50% khi ký hợp đồng, 50% sau khi nghiệm thu.',
    delivery_terms: 'Bàn giao tài khoản hệ thống trong vòng 3 ngày làm việc.',
    notes: 'Ưu đãi bao gồm 2 buổi đào tạo trực tiếp tại văn phòng khách hàng.',
    requires_approval: false,
    approval_level: 'NONE',
    approval_history: [
      {
        id: 'appr-1',
        action: 'AUTO_APPROVED',
        performed_by_name: 'Hệ thống tự động',
        performed_by_role: 'SYSTEM',
        comments: 'Chiết khấu 5% dưới ngưỡng 10%, tự động thông qua.',
        timestamp: '2025-02-15T09:00:00Z',
      },
    ],
    access_token: 'token-alpha-001',
    is_converted_to_contract: false,
    created_at: '2025-02-15T09:00:00Z',
    updated_at: '2025-02-15T09:00:00Z',
  },
]

function getStoredQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUOTES))
  return INITIAL_QUOTES
}

function saveStoredQuotes(quotes: Quote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
}

export const quoteService = {
  getQuotes(opportunityId?: string): Quote[] {
    const all = getStoredQuotes()
    if (!opportunityId) return all
    return all.filter((q) => q.opportunity_id === opportunityId)
  },

  getQuoteById(id: string): Quote | null {
    const all = getStoredQuotes()
    return all.find((q) => q.id === id) || null
  },

  getQuoteByToken(token: string): Quote | null {
    const all = getStoredQuotes()
    return all.find((q) => q.access_token === token) || null
  },

  /**
   * Tạo báo giá mới từ cơ hội (S7-01)
   */
  createQuote(payload: CreateQuotePayload, currentUser?: User | null): Quote {
    const all = getStoredQuotes()
    const calc = calculateQuoteFinancials(
      payload.items,
      payload.overall_discount_type,
      payload.overall_discount_value
    )

    const quoteNum = `BG-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    const isDraft = payload.is_draft ?? false

    let status: QuoteStatus = 'DRAFT'
    if (!isDraft) {
      if (calc.requires_approval) {
        status = 'PENDING_APPROVAL'
      } else {
        status = 'APPROVED'
      }
    }

    const history: QuoteApprovalHistory[] = []
    if (isDraft) {
      history.push({
        id: `hist-${Date.now()}`,
        action: 'SUBMITTED',
        performed_by_name: currentUser?.full_name || currentUser?.email || 'Nhân viên kinh doanh',
        performed_by_role: currentUser?.role || 'SALES_REP',
        comments: 'Tạo bản nháp báo giá',
        timestamp: now,
      })
    } else if (calc.requires_approval) {
      history.push({
        id: `hist-${Date.now()}`,
        action: 'SUBMITTED',
        performed_by_name: currentUser?.full_name || currentUser?.email || 'Nhân viên kinh doanh',
        performed_by_role: currentUser?.role || 'SALES_REP',
        comments: `Gửi duyệt báo giá: ${calc.approval_reason}`,
        timestamp: now,
      })
    } else {
      history.push({
        id: `hist-${Date.now()}`,
        action: 'AUTO_APPROVED',
        performed_by_name: 'Hệ thống tự động',
        performed_by_role: 'SYSTEM',
        comments: `Chiết khấu ${calc.discount_percentage}% dưới ngưỡng ${DISCOUNT_TIER_1_THRESHOLD}%, tự động thông qua.`,
        timestamp: now,
      })
    }

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quote_number: quoteNum,
      version: 1,
      is_active_version: true,
      opportunity_id: payload.opportunity_id,
      opportunity_title: payload.opportunity_title,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      customer_contact_name: payload.customer_contact_name,
      customer_contact_email: payload.customer_contact_email,
      customer_contact_phone: payload.customer_contact_phone,
      created_by_id: currentUser?.id,
      created_by_name: currentUser?.full_name || currentUser?.email || 'Nhân viên kinh doanh',
      status,
      items: calc.calculatedItems,
      subtotal: calc.subtotal,
      total_line_discount: calc.total_line_discount,
      overall_discount_type: payload.overall_discount_type,
      overall_discount_value: payload.overall_discount_value,
      total_discount_amount: calc.total_discount_amount,
      discount_percentage: calc.discount_percentage,
      vat_amount: calc.vat_amount,
      grand_total: calc.grand_total,
      valid_until: payload.valid_until,
      payment_terms: payload.payment_terms,
      delivery_terms: payload.delivery_terms,
      notes: payload.notes,
      requires_approval: calc.requires_approval,
      approval_level: calc.approval_level,
      approval_reason: calc.approval_reason,
      approval_history: history,
      access_token: `token-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      is_converted_to_contract: false,
      created_at: now,
      updated_at: now,
    }

    all.unshift(newQuote)
    saveStoredQuotes(all)

    // Log to Opportunity Timeline & History
    opportunityActivityService.createActivity({
      opportunity_id: payload.opportunity_id,
      opportunity_title: payload.opportunity_title,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      type: 'STAGE_CHANGE',
      title: `[Báo giá] Tạo báo giá ${newQuote.quote_number} (v${newQuote.version})`,
      content: `Giá trị: ${calc.grand_total.toLocaleString('vi-VN')} đ (Chiết khấu: ${calc.discount_percentage}%) - Trạng thái: ${status}`,
      performed_by_name: newQuote.created_by_name,
    }).catch(() => {})

    opportunityHistoryService.recordChange({
      opportunity_id: payload.opportunity_id,
      field: 'quote',
      field_label: 'Báo giá',
      old_value: 'Chưa có',
      new_value: newQuote.quote_number,
      old_display: 'Chưa có',
      new_display: `${newQuote.quote_number} (${calc.grand_total.toLocaleString('vi-VN')} đ)`,
      changed_by_name: newQuote.created_by_name,
    }).catch(() => {})

    return newQuote
  },

  /**
   * Cập nhật bản nháp báo giá (S7-01: Lưu nháp và sửa tiếp được)
   */
  updateQuote(
    quoteId: string,
    payload: Partial<CreateQuotePayload>,
    currentUser?: User | null
  ): Quote {
    const all = getStoredQuotes()
    const idx = all.findIndex((q) => q.id === quoteId)
    if (idx === -1) throw new Error('Không tìm thấy báo giá')

    const current = all[idx]
    if (current.status !== 'DRAFT' && current.status !== 'RETURNED') {
      throw new Error('Chỉ có thể chỉnh sửa trực tiếp báo giá ở trạng thái Nháp hoặc Bị trả lại')
    }

    const items = payload.items || current.items
    const ovType = payload.overall_discount_type ?? current.overall_discount_type
    const ovVal = payload.overall_discount_value ?? current.overall_discount_value ?? 0

    const calc = calculateQuoteFinancials(items, ovType, ovVal)
    const isDraft = payload.is_draft ?? true

    let status: QuoteStatus = current.status
    if (!isDraft) {
      status = calc.requires_approval ? 'PENDING_APPROVAL' : 'APPROVED'
    }

    const updated: Quote = {
      ...current,
      items: calc.calculatedItems,
      subtotal: calc.subtotal,
      total_line_discount: calc.total_line_discount,
      overall_discount_type: ovType,
      overall_discount_value: ovVal,
      total_discount_amount: calc.total_discount_amount,
      discount_percentage: calc.discount_percentage,
      vat_amount: calc.vat_amount,
      grand_total: calc.grand_total,
      valid_until: payload.valid_until ?? current.valid_until,
      payment_terms: payload.payment_terms ?? current.payment_terms,
      delivery_terms: payload.delivery_terms ?? current.delivery_terms,
      notes: payload.notes ?? current.notes,
      requires_approval: calc.requires_approval,
      approval_level: calc.approval_level,
      approval_reason: calc.approval_reason,
      status,
      updated_at: new Date().toISOString(),
    }

    if (!isDraft) {
      updated.approval_history.push({
        id: `hist-${Date.now()}`,
        action: calc.requires_approval ? 'SUBMITTED' : 'AUTO_APPROVED',
        performed_by_name: currentUser?.full_name || currentUser?.email || 'Nhân viên kinh doanh',
        performed_by_role: currentUser?.role || 'SALES_REP',
        comments: calc.requires_approval
          ? `Gửi duyệt lại: ${calc.approval_reason}`
          : `Chiết khấu ${calc.discount_percentage}% dưới ngưỡng, tự động thông qua.`,
        timestamp: new Date().toISOString(),
      })
    }

    all[idx] = updated
    saveStoredQuotes(all)
    return updated
  },

  deleteQuote(id: string): void {
    const all = getStoredQuotes().filter((q) => q.id !== id)
    saveStoredQuotes(all)
  },
}
