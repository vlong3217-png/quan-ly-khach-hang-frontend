import type { Contract, CreateContractPayload, ContractStatus } from '../types/contract.ts'
import type { User } from '../types/auth.ts'
import { opportunityService } from './opportunityService.ts'
import { quoteService } from './quoteService.ts'
import { opportunityActivityService } from './opportunityActivityService.ts'
import { customerService } from './customerService.ts'

const STORAGE_KEY = 'crm_contracts_v1'

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
    sign_date: '2025-02-15',
    effective_date: '2025-02-15',
    expiration_date: '2026-02-15',
    payment_terms: 'Thanh toán 50% khi ký hợp đồng, 50% sau khi nghiệm thu.',
    total_value: 156750000,
    status: 'ACTIVE',
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
    created_at: '2025-02-15T10:00:00Z',
    updated_at: '2025-02-15T10:00:00Z',
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
  getContracts(opportunityId?: string, customerId?: string): Contract[] {
    const all = getStoredContracts()
    return all.filter((c) => {
      if (opportunityId && c.opportunity_id !== opportunityId) return false
      if (customerId && c.customer_id !== customerId) return false
      return true
    })
  },

  getContractById(id: string): Contract | null {
    const all = getStoredContracts()
    return all.find((c) => c.id === id) || null
  },

  /**
   * Chuyển báo giá thành hợp đồng (S7-04)
   * AC:
   * • Hợp đồng kế thừa toàn bộ dòng sản phẩm và giá đã chốt, không nhập lại
   * • Khai báo số hợp đồng, ngày ký, ngày hiệu lực, ngày hết hạn, điều khoản thanh toán
   * • Cơ hội tương ứng tự động chuyển sang Đóng thắng với giá trị đúng bằng giá trị hợp đồng
   * • Số hợp đồng là duy nhất
   */
  async createContract(
    payload: CreateContractPayload,
    currentUser?: User | null
  ): Promise<Contract> {
    const all = getStoredContracts()

    // 1. AC: Số hợp đồng là duy nhất
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

    // 2. Validate dates
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
      items: payload.items, // Kế thừa toàn bộ dòng sản phẩm
      created_at: now,
      updated_at: now,
    }

    all.unshift(newContract)
    saveStoredContracts(all)

    // 3. Cập nhật Báo giá sang ACCEPTED và gắn mã hợp đồng
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

    // 4. AC: Cơ hội tương ứng tự động chuyển sang Đóng thắng với giá trị đúng bằng giá trị hợp đồng
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

    // 5. Ghi lịch sử hoạt động vào Cơ hội
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

    // 6. Cập nhật vào Customer Deals nếu có
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
