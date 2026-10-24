import type { Contract, CreateContractPayload, ContractStatus } from '../types/contract.ts'
import type { User } from '../types/auth.ts'
import type { Opportunity } from '../types/opportunity.ts'
import { API_BASE_URL } from './authService.ts'
import { opportunityService } from './opportunityService.ts'
import { quoteService } from './quoteService.ts'
import { opportunityActivityService } from './opportunityActivityService.ts'
import { customerService } from './customerService.ts'

const STORAGE_KEY = 'crm_contracts_v1'
const THRESHOLD_STORAGE_KEY = 'contract_expiry_warning_threshold_days'

function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

async function parseErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    if (data.message && typeof data.message === 'string') return data.message
  } catch {}
  return defaultMessage
}

/**
 * Tính toán số ngày còn lại đến khi hợp đồng hết hạn (S7-07 AC)
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

function mapBackendToContract(b: any): Contract {
  return {
    id: String(b.id),
    contract_number: b.contract_number,
    quote_id: String(b.quote_id || ''),
    quote_number: b.quote_number,
    opportunity_id: String(b.opportunity_id || ''),
    opportunity_title: b.opportunity_title || '',
    customer_id: String(b.customer_id || 1),
    customer_name: b.customer_name || 'Khách hàng',
    sign_date: b.signed_date || b.sign_date || '',
    effective_date: b.effective_date || '',
    expiration_date: b.expiration_date || '',
    payment_terms: b.payment_terms || 'Theo thỏa thuận báo giá',
    total_value: Number(b.grand_total ?? b.total_value ?? 0),
    status: (b.validity_status || b.status || 'ACTIVE') as ContractStatus,
    items: b.items || [],
    created_at: b.created_at || new Date().toISOString(),
    updated_at: b.updated_at || b.created_at || new Date().toISOString(),
    renewal_opportunity_id: b.renewal_opportunity_id ? String(b.renewal_opportunity_id) : undefined,
  }
}

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: '1',
    contract_number: 'HD-2026-001',
    quote_id: '1',
    quote_number: 'BG-20261021-001',
    opportunity_id: '1',
    opportunity_title: 'Triển khai CRM Cloud 50 Users - FPT Smart',
    customer_id: '1',
    customer_name: 'Công ty Cổ phần Công nghệ & Giải pháp FPT Smart',
    sign_date: '2026-02-01',
    effective_date: '2026-02-01',
    expiration_date: '2027-02-01',
    payment_terms: 'Thanh toán 50% sau khi ký hợp đồng, 50% sau khi nghiệm thu.',
    total_value: 90000000,
    status: 'ACTIVE',
    items: [
      {
        id: 'item-1',
        product_name: 'Gói giải pháp CRM Cloud Enterprise 50 Users',
        quantity: 1,
        unit: 'Gói',
        unit_price: 90000000,
        discount_type: 'PERCENT',
        discount_value: 0,
        line_discount_amount: 0,
        vat_rate: 0,
        line_total: 90000000,
      },
    ],
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-02-01T08:00:00Z',
  },
]

function getStoredContracts(): Contract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONTRACTS))
  return INITIAL_CONTRACTS
}

function saveStoredContracts(contracts: Contract[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts))
}

export const contractService = {
  getWarningThreshold(): number {
    try {
      const stored = localStorage.getItem(THRESHOLD_STORAGE_KEY)
      if (stored) {
        const val = parseInt(stored, 10)
        if (!isNaN(val) && val > 0) return val
      }
    } catch {}
    return 30
  },

  setWarningThreshold(days: number): void {
    const clean = Math.max(1, Math.min(365, Math.round(days)))
    localStorage.setItem(THRESHOLD_STORAGE_KEY, String(clean))
  },

  getContracts(opportunityId?: string, customerId?: string): Contract[] {
    const all = getStoredContracts()
    const threshold = this.getWarningThreshold()

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

  async fetchContracts(opportunityId?: string, customerId?: string): Promise<Contract[]> {
    try {
      const query = new URLSearchParams()
      query.set('limit', '100')
      if (customerId && !isNaN(Number(customerId))) query.set('customer_id', customerId)

      const response = await fetch(`${API_BASE_URL}/contracts?${query.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        const rawList = Array.isArray(data) ? data : (data.contracts || data.items || data.data || [])
        const mapped = rawList.map(mapBackendToContract)
        saveStoredContracts(mapped)
        return this.getContracts(opportunityId, customerId)
      }
    } catch (err) {
      console.warn('Lỗi kết nối tải danh sách hợp đồng từ backend:', err)
    }

    return this.getContracts(opportunityId, customerId)
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
    const cleanNum = payload.contract_number.trim()
    if (!cleanNum) {
      throw new Error('Vui lòng nhập số hợp đồng!')
    }

    if (!payload.sign_date || !payload.effective_date || !payload.expiration_date) {
      throw new Error('Vui lòng điền đầy đủ ngày ký, ngày hiệu lực và ngày hết hạn hợp đồng!')
    }

    const backendPayload: Record<string, any> = {
      contract_number: cleanNum,
      title: `Hợp đồng kinh tế - ${payload.quote_number || cleanNum}`,
      signed_date: payload.sign_date,
      effective_date: payload.effective_date,
      expiration_date: payload.expiration_date,
      payment_terms: payload.payment_terms || 'Theo thỏa thuận báo giá',
      total_value: Number(payload.total_value) || 0,
      customer_id: Number(payload.customer_id) || 1,
      customer_name: payload.customer_name,
      opportunity_id: payload.opportunity_id ? Number(payload.opportunity_id) || null : null,
      opportunity_title: payload.opportunity_title,
      quote_id: payload.quote_id ? Number(payload.quote_id) || 0 : 0,
      quote_number: payload.quote_number,
      items: payload.items || [],
    }

    let savedContract: Contract | null = null

    try {
      const response = await fetch(`${API_BASE_URL}/contracts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendPayload),
      })

      if (response.ok) {
        const data = await response.json()
        savedContract = mapBackendToContract(data)
      } else {
        const errorMsg = await parseErrorMessage(response, 'Lỗi khi lưu hợp đồng trên máy chủ.')
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      if (err instanceof Error && !err.message.includes('Failed to fetch')) {
        throw err
      }
      console.warn('Backend không phản hồi khi tạo hợp đồng, lưu tạm cục bộ:', err)
    }

    if (!savedContract) {
      savedContract = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    const all = getStoredContracts()
    all.unshift(savedContract)
    saveStoredContracts(all)

    // Cập nhật Báo giá sang ACCEPTED
    try {
      const quote = quoteService.getQuoteById(payload.quote_id)
      if (quote) {
        quote.status = 'ACCEPTED'
        quote.is_converted_to_contract = true
        quote.contract_id = savedContract.id
        quote.contract_number = savedContract.contract_number
        quoteService.updateQuote(quote.id, {}, currentUser)
      }
    } catch {}

    // Đóng thắng cơ hội tương ứng
    try {
      await opportunityService.closeWon(payload.opportunity_id, {
        actual_revenue: savedContract.total_value,
        actual_close_date: savedContract.sign_date,
        win_reason_name: 'Ký hợp đồng chính thức',
        win_notes: `Tự động chuyển Đóng Thắng khi tạo Hợp đồng số ${savedContract.contract_number} từ báo giá ${savedContract.quote_number || ''}.`,
        closed_by_name: currentUser?.full_name || currentUser?.email || 'Kế toán',
      })
    } catch (err) {
      console.warn('Lưu ý khi đóng thắng cơ hội:', err)
    }

    try {
      opportunityActivityService.createActivity({
        opportunity_id: payload.opportunity_id,
        opportunity_title: payload.opportunity_title,
        customer_id: payload.customer_id,
        customer_name: payload.customer_name,
        type: 'STAGE_CHANGE',
        title: `[Hợp đồng] Ký Hợp đồng ${savedContract.contract_number}`,
        content: `Chuyển đổi thành công từ báo giá ${savedContract.quote_number || ''} sang Hợp đồng ${savedContract.contract_number}. Giá trị chốt: ${savedContract.total_value.toLocaleString('vi-VN')} đ. Cơ hội tự động chuyển sang Đóng Thắng.`,
        performed_by_name: currentUser?.full_name || currentUser?.email || 'Kế toán',
      }).catch(() => {})
    } catch {}

    if (payload.customer_id) {
      try {
        customerService.addDeal({
          customer_id: payload.customer_id,
          title: `Hợp đồng ${savedContract.contract_number}: ${savedContract.opportunity_title || ''}`,
          value: savedContract.total_value,
          stage: 'WON',
          status: 'CLOSED_WON',
          expected_close_date: savedContract.sign_date,
        })
      } catch {}
    }

    return savedContract
  },

  /**
   * S7-07 AC: Tạo cơ hội gia hạn từ một hợp đồng sắp hết hạn
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
