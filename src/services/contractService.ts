import type { Contract, CreateContractPayload, ContractStatus } from '../types/contract.ts'
import type { User } from '../types/auth.ts'
import type { Opportunity } from '../types/opportunity.ts'
import { opportunityService } from './opportunityService.ts'
import { quoteService } from './quoteService.ts'
import { opportunityActivityService } from './opportunityActivityService.ts'
import { customerService } from './customerService.ts'

const STORAGE_KEY = 'crm_contracts_v1'
const THRESHOLD_STORAGE_KEY = 'contract_expiry_warning_threshold_days'

/**
 * Tính toán số ngày còn lại đến khi hợp đồng hết hạn (S7-07 AC)
 * - Dương (>0): Còn N ngày
 * - Bằng 0: Hết hạn hôm nay
 * - Âm (<0): Đã quá hạn |N| ngày
 */
export function calculateRemainingDays(expirationDate: string): number {
  if (!expirationDate) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expirationDate)
  exp.setHours(0, 0, 0, 0)
  const diffTime = exp.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Đánh giá trạng thái hợp đồng theo thời gian thực và ngưỡng cảnh báo cấu hình
 */
export function evaluateContractStatus(
  contract: Contract,
  thresholdDays: number = 30
): ContractStatus {
  if (contract.renewal_opportunity_id) return 'RENEWED'
  if (contract.status === 'TERMINATED') return 'TERMINATED'

  const remaining = calculateRemainingDays(contract.expiration_date)
  if (remaining < 0) return 'EXPIRED'
  if (remaining <= thresholdDays) return 'EXPIRING_SOON'
  return 'ACTIVE'
}

// Generate sample dates relative to today
const today = new Date()
const datePlusDays = (days: number) => {
  const d = new Date()
  d.setDate(today.getDate() + days)
  return d.toISOString().split('T')[0]
}
const dateMinusDays = (days: number) => {
  const d = new Date()
  d.setDate(today.getDate() - days)
  return d.toISOString().split('T')[0]
}

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'contract-001',
    contract_number: 'HD-2025-001',
    quote_id: 'quote-001',
    quote_number: 'BG-2025-001',
    opportunity_id: 'opp-1',
    opportunity_title: 'Triển khai CRM cho Tập đoàn Alpha',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    sign_date: dateMinusDays(300),
    effective_date: dateMinusDays(300),
    expiration_date: datePlusDays(14), // Sắp hết hạn trong 14 ngày -> EXPIRING_SOON
    payment_terms: 'Thanh toán 50% khi ký hợp đồng, 50% sau khi nghiệm thu.',
    total_value: 156750000,
    status: 'EXPIRING_SOON',
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
        vat_rate: 10,
        line_total: 156750000,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'contract-002',
    contract_number: 'HD-2024-088',
    quote_id: 'quote-002',
    quote_number: 'BG-2024-088',
    opportunity_id: 'opp-2',
    opportunity_title: 'Nâng cấp bảo mật & Email Marketing Beta Corp',
    customer_id: 'cust-002',
    customer_name: 'Tập đoàn Bán Lẻ Toàn Cầu Beta',
    sign_date: dateMinusDays(380),
    effective_date: dateMinusDays(380),
    expiration_date: dateMinusDays(15), // Đã quá hạn 15 ngày -> EXPIRED
    payment_terms: 'Thanh toán 100% trước khi kích hoạt tài khoản.',
    total_value: 88000000,
    status: 'EXPIRED',
    items: [
      {
        id: 'item-2',
        product_name: 'Hệ thống Email Marketing Tự Động',
        product_code: 'MKT-AUTO',
        unit: 'Gói/Năm',
        unit_price: 80000000,
        quantity: 1,
        discount_type: 'PERCENT',
        discount_value: 0,
        line_discount_amount: 0,
        vat_rate: 10,
        line_total: 88000000,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'contract-003',
    contract_number: 'HD-2025-015',
    quote_id: 'quote-003',
    quote_number: 'BG-2025-015',
    opportunity_id: 'opp-3',
    opportunity_title: 'Thuê bao CRM Chăm sóc Khách hàng Gamma Ltd',
    customer_id: 'cust-003',
    customer_name: 'Công ty TNHH Logistics Gamma',
    sign_date: dateMinusDays(40),
    effective_date: dateMinusDays(40),
    expiration_date: datePlusDays(200), // Đang hiệu lực hơn 200 ngày -> ACTIVE
    payment_terms: 'Thanh toán theo quý.',
    total_value: 65000000,
    status: 'ACTIVE',
    items: [
      {
        id: 'item-3',
        product_name: 'Gói Người dùng CRM Bán Hàng (10 User)',
        product_code: 'USER-10',
        unit: 'Gói/Năm',
        unit_price: 65000000,
        quantity: 1,
        discount_type: 'PERCENT',
        discount_value: 0,
        line_discount_amount: 0,
        vat_rate: 0,
        line_total: 65000000,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getStoredContracts(): Contract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONTRACTS))
  return INITIAL_CONTRACTS
}

function saveStoredContracts(contracts: Contract[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts))
}

export const contractService = {
  /**
   * Ngưỡng số ngày cảnh báo sắp hết hạn (Mặc định 30 ngày, có thể tùy chỉnh)
   */
  getWarningThreshold(): number {
    try {
      const stored = localStorage.getItem(THRESHOLD_STORAGE_KEY)
      if (stored) {
        const val = parseInt(stored, 10)
        if (!isNaN(val) && val > 0) return val
      }
    } catch {}
    return 30 // Mặc định 30 ngày
  },

  setWarningThreshold(days: number): void {
    const clean = Math.max(1, Math.min(365, Math.round(days)))
    localStorage.setItem(THRESHOLD_STORAGE_KEY, String(clean))
  },

  getContracts(opportunityId?: string, customerId?: string): Contract[] {
    const all = getStoredContracts()
    const threshold = this.getWarningThreshold()

    // Đồng bộ lại status dựa trên số ngày còn lại
    return all
      .filter((c) => {
        if (opportunityId && c.opportunity_id !== opportunityId) return false
        if (customerId && c.customer_id !== customerId) return false
        return true
      })
      .map((c) => ({
        ...c,
        status: evaluateContractStatus(c, threshold),
      }))
  },

  getContractById(id: string): Contract | null {
    const all = getStoredContracts()
    const found = all.find((c) => c.id === id)
    if (!found) return null
    return {
      ...found,
      status: evaluateContractStatus(found, this.getWarningThreshold()),
    }
  },

  /**
   * Chuyển báo giá thành hợp đồng (S7-04)
   */
  async createContract(
    payload: CreateContractPayload,
    currentUser?: User | null
  ): Promise<Contract> {
    const all = getStoredContracts()

    const cleanNum = payload.contract_number.trim()
    if (!cleanNum) {
      throw new Error('Vui lòng nhập số hợp đồng!')
    }

    const isDuplicate = all.some(
      (c) => c.contract_number.trim().toLowerCase() === cleanNum.toLowerCase()
    )
    if (isDuplicate) {
      throw new Error(`Số hợp đồng "${cleanNum}" đã tồn tại trên hệ thống. Số hợp đồng phải là duy nhất!`)
    }

    if (!payload.sign_date || !payload.effective_date || !payload.expiration_date) {
      throw new Error('Vui lòng điền đầy đủ ngày ký, ngày hiệu lực và ngày hết hạn hợp đồng!')
    }

    const now = new Date().toISOString()
    const newContract: Contract = {
      id: `contract-${Date.now()}`,
      contract_number: cleanNum,
      quote_id: payload.quote_id,
      quote_number: payload.quote_number,
      opportunity_id: payload.opportunity_id,
      opportunity_title: payload.opportunity_title,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      sign_date: payload.sign_date,
      effective_date: payload.effective_date,
      expiration_date: payload.expiration_date,
      payment_terms: payload.payment_terms || 'Theo thỏa thuận báo giá',
      total_value: Number(payload.total_value) || 0,
      status: 'ACTIVE',
      items: payload.items,
      created_at: now,
      updated_at: now,
    }

    all.unshift(newContract)
    saveStoredContracts(all)

    // Cập nhật Báo giá sang ACCEPTED
    const quote = quoteService.getQuoteById(payload.quote_id)
    if (quote) {
      quote.status = 'ACCEPTED'
      quote.is_converted_to_contract = true
      quote.contract_id = newContract.id
      quote.contract_number = newContract.contract_number
      quote.approval_history.push({
        id: `hist-${Date.now()}`,
        action: 'APPROVED',
        performed_by_name: currentUser?.full_name || currentUser?.email || 'Kế toán',
        performed_by_role: currentUser?.role || 'ACCOUNTANT',
        comments: `Đã chuyển đổi báo giá thành Hợp đồng ${newContract.contract_number}.`,
        timestamp: now,
      })
      quoteService.updateQuote(quote.id, {}, currentUser)
    }

    // Đóng thắng cơ hội tương ứng
    try {
      await opportunityService.closeWon(payload.opportunity_id, {
        actual_revenue: newContract.total_value,
        actual_close_date: newContract.sign_date,
        win_reason_name: 'Ký hợp đồng chính thức',
        win_notes: `Tự động chuyển Đóng Thắng khi tạo Hợp đồng số ${newContract.contract_number} từ báo giá ${newContract.quote_number}.`,
        closed_by_name: currentUser?.full_name || currentUser?.email || 'Kế toán',
      })
    } catch (err) {
      console.warn('Lưu ý khi đóng thắng cơ hội:', err)
    }

    opportunityActivityService.createActivity({
      opportunity_id: payload.opportunity_id,
      opportunity_title: payload.opportunity_title,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      type: 'STAGE_CHANGE',
      title: `[Hợp đồng] Ký Hợp đồng ${newContract.contract_number}`,
      content: `Chuyển đổi thành công từ báo giá ${newContract.quote_number} sang Hợp đồng ${newContract.contract_number}. Giá trị chốt: ${newContract.total_value.toLocaleString('vi-VN')} đ. Cơ hội tự động chuyển sang Đóng Thắng.`,
      performed_by_name: currentUser?.full_name || currentUser?.email || 'Kế toán',
    }).catch(() => {})

    if (payload.customer_id) {
      try {
        customerService.addDeal({
          customer_id: payload.customer_id,
          title: `Hợp đồng ${newContract.contract_number}: ${newContract.opportunity_title}`,
          value: newContract.total_value,
          stage: 'WON',
          status: 'CLOSED_WON',
          expected_close_date: newContract.sign_date,
        })
      } catch {}
    }

    return newContract
  },

  /**
   * S7-07 AC: Tạo cơ hội gia hạn từ một hợp đồng sắp hết hạn
   * Kế thừa khách hàng, giá trị dự kiến, ngày dự kiến chốt (ngày hết hạn HĐ cũ)
   */
  async createRenewalOpportunity(
    contractId: string,
    currentUser?: User | null,
    renewalTitle?: string
  ): Promise<{ opportunity: Opportunity; contract: Contract }> {
    const all = getStoredContracts()
    const idx = all.findIndex((c) => c.id === contractId)
    if (idx === -1) throw new Error('Không tìm thấy hợp đồng!')

    const contract = all[idx]
    if (contract.renewal_opportunity_id) {
      throw new Error(`Hợp đồng này đã được tạo cơ hội gia hạn trước đó!`)
    }

    const title =
      renewalTitle?.trim() ||
      `[Gia hạn HĐ ${contract.contract_number}] ${contract.opportunity_title || contract.customer_name}`

    // Tạo cơ hội mới thông qua opportunityService
    const createdOpp = await opportunityService.createOpportunity({
      title,
      customer_id: contract.customer_id,
      customer_name: contract.customer_name,
      stage_id: 'stage-1',
      stage_name: 'Tiếp cận & Đánh giá',
      expected_revenue: contract.total_value,
      expected_close_date: contract.expiration_date,
      source: 'Tái ký / Gia hạn',
      description: `Cơ hội gia hạn tự động từ Hợp đồng số ${contract.contract_number} (Hết hạn ngày: ${contract.expiration_date}). Giá trị hợp đồng cũ: ${contract.total_value.toLocaleString('vi-VN')} đ.`,
      owner_id: currentUser?.id,
      owner_name: currentUser?.full_name || currentUser?.email,
    })

    // Cập nhật hợp đồng với renewal_opportunity_id và status RENEWED
    const updatedContract: Contract = {
      ...contract,
      renewal_opportunity_id: createdOpp.id,
      status: 'RENEWED',
      updated_at: new Date().toISOString(),
    }
    all[idx] = updatedContract
    saveStoredContracts(all)

    // Ghi nhật ký hoạt động
    opportunityActivityService.createActivity({
      opportunity_id: createdOpp.id,
      opportunity_title: createdOpp.title,
      customer_id: contract.customer_id,
      customer_name: contract.customer_name,
      type: 'STAGE_CHANGE',
      title: `[Gia hạn hợp đồng] Khởi tạo cơ hội gia hạn từ HĐ ${contract.contract_number}`,
      content: `Kế thừa khách hàng ${contract.customer_name}, giá trị ${contract.total_value.toLocaleString('vi-VN')} đ từ hợp đồng số ${contract.contract_number}.`,
      performed_by_name: currentUser?.full_name || currentUser?.email || 'Kế toán',
    }).catch(() => {})

    return { opportunity: createdOpp, contract: updatedContract }
  },

  updateContractStatus(id: string, status: ContractStatus): Contract {
    const all = getStoredContracts()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Không tìm thấy hợp đồng!')

    all[idx] = {
      ...all[idx],
      status,
      updated_at: new Date().toISOString(),
    }
    saveStoredContracts(all)
    return all[idx]
  },
}
