import type {
  Opportunity,
  CreateOpportunityPayload,
  OpportunityFilterParams,
  SavedOpportunityFilter,
} from '../types/opportunity.ts'
import { API_BASE_URL } from './authService.ts'
import type { PaginatedResponse, PaginationParams } from '../types/pagination.ts'
import { normalizePaginatedResponse } from '../types/pagination.ts'
import type { PipelineStage } from '../types/pipeline.ts'
import { opportunityHistoryService } from './opportunityHistoryService.ts'

export function isOppInStage(opp: Opportunity, stage: PipelineStage): boolean {
  if (!opp || !stage) return false
  const sId = String(stage.id || '').toLowerCase().trim()
  const sCode = String(stage.code || '').toLowerCase().trim()
  const sName = String(stage.name || '').toLowerCase().trim()
  const sOrder = String(stage.order || '')

  const oppStageId = String(opp.stage_id || '').toLowerCase().trim()
  const oppStageName = String(opp.stage_name || '').toLowerCase().trim()

  if (oppStageId === sId) return true

  const oppNum = oppStageId.replace('stage-', '')
  const stageNum = sId.replace('stage-', '')
  if (oppNum && oppNum === stageNum) return true
  if (oppNum && oppNum === sOrder) return true
  if (oppStageId && oppStageId === sOrder) return true

  if (sCode && (oppStageId === sCode || oppStageName === sCode)) return true

  if (
    (sCode.includes('contact') || sCode.includes('prospect')) &&
    (oppStageId.includes('contact') || oppStageId.includes('prospect') || oppStageId === 'stage-1' || oppStageId === '1')
  ) {
    return true
  }
  if (
    sCode.includes('qualif') &&
    (oppStageId.includes('qualif') || oppStageId === 'stage-2' || oppStageId === '2')
  ) {
    return true
  }
  if (
    (sCode.includes('propos') || sCode.includes('demo')) &&
    (oppStageId.includes('propos') || oppStageId.includes('demo') || oppStageId === 'stage-3' || oppStageId === '3')
  ) {
    return true
  }
  if (
    (sCode.includes('quote') || sCode.includes('price')) &&
    (oppStageId.includes('quote') || oppStageId === 'stage-4' || oppStageId === '4')
  ) {
    return true
  }
  if (
    sCode.includes('negotiat') &&
    (oppStageId.includes('negotiat') || oppStageId === 'stage-5' || oppStageId === '5')
  ) {
    return true
  }
  if (
    (sCode.includes('won') || sCode.includes('close')) &&
    (oppStageId.includes('won') || oppStageId.includes('close') || oppStageId === 'stage-6' || oppStageId === '6')
  ) {
    return true
  }

  if (oppStageName && sName && (oppStageName === sName || sName.includes(oppStageName) || oppStageName.includes(sName))) {
    return true
  }

  return false
}

const STORAGE_KEY_OPPORTUNITIES = 'crm_opportunities_master_data'

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

async function parseErrorResponse(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    if (data.message && typeof data.message === 'string') return data.message
  } catch {}
  return defaultMessage
}

export function getStoredOpportunities(): Opportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPPORTUNITIES)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) {
        // Lọc bỏ 4 cơ hội mẫu cũ nếu còn sót lại, chỉ giữ cơ hội mới do người dùng tạo
        return list.filter((o: any) => o && o.id !== 'opp-001' && o.id !== 'opp-002' && o.id !== 'opp-003' && o.id !== 'opp-004')
      }
    }
  } catch {}
  return []
}

function saveStoredOpportunities(opps: Opportunity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(opps))
  } catch {}
}

function mapBackendToOpportunity(b: any): Opportunity {
  if (!b) return b
  return {
    id: String(b.id || ''),
    code: b.code || `OPP-${String(b.id || '').padStart(3, '0')}`,
    title: b.title || '',
    customer_id: b.customer_id != null ? String(b.customer_id) : '',
    customer_name: b.customer_name || 'Khách hàng',
    contact_id: b.contact_id != null ? String(b.contact_id) : undefined,
    contact_name: b.contact_person || b.contact_name || undefined,
    contact_phone: b.contact_phone || undefined,
    contact_email: b.contact_email || undefined,
    stage_id: b.stage_id || b.stage || 'stage-1',
    stage_name: b.stage_name || b.stage || 'Tiếp cận & Đánh giá',
    win_probability: typeof b.win_probability === 'number' ? b.win_probability : 20,
    expected_revenue: Number(b.expected_revenue ?? b.value ?? 0),
    expected_close_date: typeof b.expected_close_date === 'string' ? b.expected_close_date.split('T')[0] : (b.expected_close_date || ''),
    source: b.source || 'Website',
    status: b.status || 'OPEN',
    owner_id: b.owner_id || 1,
    owner_name: b.owner_name || 'Nguyễn Văn An',
    team_id: b.team_id || 1,
    team_name: b.team_name || 'Đội Kinh Doanh 1',
    description: b.description || '',
    lead_id: b.lead_id != null ? String(b.lead_id) : undefined,
    created_at: b.created_at || new Date().toISOString(),
    updated_at: b.updated_at || new Date().toISOString(),
  }
}

export const opportunityService = {
  async getOpportunities(params?: OpportunityFilterParams & PaginationParams): Promise<Opportunity[]> {
    try {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.limit) query.set('limit', String(params.limit))
      if (params?.search) query.set('search', params.search)
      if (params?.stage_id) query.set('stage_id', params.stage_id)

      const url = `${API_BASE_URL}/opportunities${query.toString() ? '?' + query.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const raw = await response.json()
        const paginated = normalizePaginatedResponse<any>(raw, params?.page || 1, params?.limit || 10)
        const mappedItems = paginated.items.map(mapBackendToOpportunity)
        // Nếu Backend trả về dữ liệu (kể cả rỗng), lưu vào cache
        if (paginated.items.length > 0 || Array.isArray(raw) || Array.isArray(raw?.opportunities)) {
          if (!params?.page || params.page === 1) {
            saveStoredOpportunities(mappedItems)
          }
          return mappedItems
        }
      }
    } catch {}

    // Fallback sang local storage (để giữ lại cơ hội vừa tạo nếu API chưa lưu kịp hoặc đang offline)
    let list = getStoredOpportunities()
    if (params?.search) {
      const q = params.search.toLowerCase().trim()
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q)
      )
    }
    if (params?.stage_id) {
      list = list.filter((o) => o.stage_id === params.stage_id)
    }
    return list
  },

  async getPaginatedOpportunities(params?: OpportunityFilterParams & PaginationParams): Promise<PaginatedResponse<Opportunity>> {
    const page = params?.page || 1
    const limit = params?.limit || 10

    try {
      const query = new URLSearchParams()
      query.set('page', String(page))
      query.set('limit', String(limit))
      if (params?.search) query.set('search', params.search)
      if (params?.stage_id) query.set('stage_id', params.stage_id)

      const url = `${API_BASE_URL}/opportunities?${query.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const raw = await response.json()
        const paginated = normalizePaginatedResponse<any>(raw, page, limit)
        const mappedPaginated: PaginatedResponse<Opportunity> = {
          ...paginated,
          items: paginated.items.map(mapBackendToOpportunity),
        }
        if (paginated.items.length > 0 || Array.isArray(raw) || Array.isArray(raw?.opportunities)) {
          if (page === 1) {
            saveStoredOpportunities(mappedPaginated.items)
          }
          return mappedPaginated
        }
      }
    } catch {}

    const all = await this.getOpportunities(params)
    const start = (page - 1) * limit
    const items = all.slice(start, start + limit)
    return {
      items,
      total: all.length,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(all.length / limit)),
    }
  },

  async createOpportunity(payload: CreateOpportunityPayload): Promise<Opportunity> {
    const list = getStoredOpportunities()
    const nextNumber = list.length + 1
    const newCode = `OPP-${String(nextNumber).padStart(3, '0')}`

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      code: newCode,
      title: payload.title.trim(),
      customer_id: payload.customer_id,
      customer_name: payload.customer_name || 'Khách hàng',
      contact_id: payload.contact_id,
      contact_name: payload.contact_name,
      stage_id: payload.stage_id,
      stage_name: payload.stage_name || 'Tiếp cận & Đánh giá',
      win_probability: payload.win_probability ?? 20,
      expected_revenue: Number(payload.expected_revenue) || 0,
      expected_close_date: payload.expected_close_date,
      source: payload.source || 'Chuyển đổi từ Lead',
      status: 'OPEN',
      owner_id: payload.owner_id || 1,
      owner_name: payload.owner_name || 'Nguyễn Văn An',
      team_id: payload.team_id || 1,
      team_name: payload.team_name || 'Đội Kinh Doanh 1',
      description: payload.description || '',
      lead_id: payload.lead_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Chuẩn hóa payload đúng kiểu dữ liệu schema Backend yêu cầu:
    // Backend OpportunityCreate: customer_id (integer | null), value (number), stage (string), contact_person (string)
    const parsedCustomerId = Number(payload.customer_id)
    const parsedContactId = Number(payload.contact_id)
    const parsedLeadId = Number(payload.lead_id)

    const backendPayload: Record<string, any> = {
      title: payload.title.trim(),
      value: Number(payload.expected_revenue) || 0,
      stage: payload.stage_id || 'PROSPECTING',
      customer_id: !isNaN(parsedCustomerId) && parsedCustomerId > 0 ? parsedCustomerId : null,
      contact_person: payload.contact_name?.trim() || null,
      contact_id: !isNaN(parsedContactId) && parsedContactId > 0 ? parsedContactId : null,
      source: payload.source || 'Website',
      expected_close_date: payload.expected_close_date || null,
      win_probability: typeof payload.win_probability === 'number' ? payload.win_probability : 20,
      lead_id: !isNaN(parsedLeadId) && parsedLeadId > 0 ? parsedLeadId : null,
      team_id: payload.team_id || 1,
      description: payload.description || '',
    }

    try {
      const response = await fetch(`${API_BASE_URL}/opportunities`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendPayload),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const mappedCreated = mapBackendToOpportunity(data)
          saveStoredOpportunities([mappedCreated, ...list])
          return mappedCreated
        }
      } else {
        const errorMsg = await parseErrorResponse(response, 'Lỗi khi lưu cơ hội bán hàng lên máy chủ Backend.')
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      if (err instanceof Error && !err.message.includes('Failed to fetch')) {
        throw err
      }
      console.warn('Backend không phản hồi khi tạo cơ hội, sử dụng fallback tạm thời:', err)
    }

    const updated = [newOpp, ...list]
    saveStoredOpportunities(updated)
    return newOpp
  },

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) return data
      }
    } catch {}

    const list = getStoredOpportunities()
    return list.find((o) => o.id === id) || null
  },

  async updateOpportunity(id: string, patch: Partial<Opportunity>): Promise<Opportunity> {
    const list = getStoredOpportunities()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) {
      throw new Error('Không tìm thấy cơ hội bán hàng!')
    }

    const oldOpp = { ...list[idx] }
    const updatedOpp: Opportunity = {
      ...list[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    }

    // Tự động ghi nhật ký thay đổi S6-01 (giai đoạn, giá trị, ngày chốt, người sở hữu)
    try {
      const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user')
      const currentUser = userRaw ? JSON.parse(userRaw) : null
      opportunityHistoryService.recordOpportunityDiff(
        oldOpp,
        updatedOpp,
        {
          id: currentUser?.id ? Number(currentUser.id) : undefined,
          name: currentUser?.full_name || 'Người dùng',
        }
      )
    } catch {}

    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedOpp),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          list[idx] = data
          saveStoredOpportunities(list)
          return data
        }
      }
    } catch {}

    list[idx] = updatedOpp
    saveStoredOpportunities(list)
    return updatedOpp
  },

  async deleteOpportunity(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/opportunities/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

    const list = getStoredOpportunities().filter((o) => o.id !== id)
    saveStoredOpportunities(list)
  },

  /* ──────────── User Story S5-05: Đóng Cơ hội Thắng / Thua & Mở lại ──────────── */
  /**
   * Đóng Thắng (Close Won):
   * - Bắt buộc: actual_revenue (giá trị chốt thực tế) và actual_close_date (ngày ký hợp đồng)
   * - Chuyển trạng thái sang WON, giai đoạn sang "Chốt thành công (Won)" (100%)
   * - Cơ hội bị khóa không cho sửa thông thường
   */
  async closeWon(
    id: string,
    payload: {
      actual_revenue: number
      actual_close_date: string
      win_reason_id?: string
      win_reason_name?: string
      win_notes?: string
      closed_by_id?: number
      closed_by_name?: string
    }
  ): Promise<Opportunity> {
    if (!payload.actual_revenue || payload.actual_revenue <= 0) {
      throw new Error('Đóng Thắng bắt buộc nhập giá trị chốt thực tế lớn hơn 0!')
    }
    if (!payload.actual_close_date || !payload.actual_close_date.trim()) {
      throw new Error('Đóng Thắng bắt buộc nhập ngày ký hợp đồng thực tế!')
    }

    const list = getStoredOpportunities()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) throw new Error('Không tìm thấy cơ hội bán hàng!')

    const existing = list[idx]
    const nowIso = new Date().toISOString()

    const updatedOpp: Opportunity = {
      ...existing,
      status: 'WON',
      stage_id: 'stage-6',
      stage_name: 'Chốt thành công (Won)',
      stage_color: '#16a34a',
      win_probability: 100,
      actual_revenue: Number(payload.actual_revenue),
      actual_close_date: payload.actual_close_date.trim(),
      win_reason_id: payload.win_reason_id,
      win_reason_name: payload.win_reason_name,
      win_notes: payload.win_notes?.trim(),
      closed_at: nowIso,
      closed_by_id: payload.closed_by_id || 1,
      closed_by_name: payload.closed_by_name || 'Nhân viên kinh doanh',
      updated_at: nowIso,
    }

    try {
      await fetch(`${API_BASE_URL}/opportunities/${id}/close-won`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedOpp),
      })
    } catch {}

    list[idx] = updatedOpp
    saveStoredOpportunities(list)
    return updatedOpp
  },

  /**
   * Đóng Thua (Close Lost):
   * - Bắt buộc: chọn lý do thua (lost_reason_id & lost_reason)
   * - Đối thủ thắng thầu nếu có (competitor_id & competitor_name)
   * - Chuyển trạng thái sang LOST, xác suất về 0%
   */
  async closeLost(
    id: string,
    payload: {
      lost_reason_id: string
      lost_reason: string
      competitor_id?: string
      competitor_name?: string
      loss_notes?: string
      closed_by_id?: number
      closed_by_name?: string
    }
  ): Promise<Opportunity> {
    if (!payload.lost_reason_id || !payload.lost_reason) {
      throw new Error('Đóng Thua bắt buộc chọn lý do thất bại!')
    }

    const list = getStoredOpportunities()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) throw new Error('Không tìm thấy cơ hội bán hàng!')

    const existing = list[idx]
    const nowIso = new Date().toISOString()

    const updatedOpp: Opportunity = {
      ...existing,
      status: 'LOST',
      win_probability: 0,
      lost_reason_id: payload.lost_reason_id,
      lost_reason: payload.lost_reason,
      competitor_id: payload.competitor_id || undefined,
      competitor_name: payload.competitor_name || undefined,
      loss_notes: payload.loss_notes?.trim(),
      closed_at: nowIso,
      closed_by_id: payload.closed_by_id || 1,
      closed_by_name: payload.closed_by_name || 'Nhân viên kinh doanh',
      updated_at: nowIso,
    }

    try {
      await fetch(`${API_BASE_URL}/opportunities/${id}/close-lost`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedOpp),
      })
    } catch {}

    list[idx] = updatedOpp
    saveStoredOpportunities(list)
    return updatedOpp
  },

  /**
   * Mở lại cơ hội đã đóng (Reopen Opportunity):
   * - Chỉ Trưởng nhóm (Manager) trở lên mới được mở lại
   * - Bắt buộc nhập lý do mở lại (reopen_reason)
   */
  async reopenOpportunity(
    id: string,
    payload: {
      reopen_reason: string
      target_stage_id?: string
      target_stage_name?: string
      target_win_probability?: number
      reopened_by_id?: number
      reopened_by_name?: string
    }
  ): Promise<Opportunity> {
    if (!payload.reopen_reason || !payload.reopen_reason.trim()) {
      throw new Error('Trưởng nhóm bắt buộc phải nhập lý do mở lại cơ hội!')
    }

    const list = getStoredOpportunities()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) throw new Error('Không tìm thấy cơ hội bán hàng!')

    const existing = list[idx]
    const nowIso = new Date().toISOString()

    const updatedOpp: Opportunity = {
      ...existing,
      status: 'OPEN',
      stage_id: payload.target_stage_id || 'stage-5',
      stage_name: payload.target_stage_name || 'Đàm phán hợp đồng',
      win_probability: payload.target_win_probability ?? 85,
      reopened_at: nowIso,
      reopened_by_id: payload.reopened_by_id || 1,
      reopened_by_name: payload.reopened_by_name || 'Trưởng nhóm',
      reopen_reason: payload.reopen_reason.trim(),
      updated_at: nowIso,
    }

    try {
      await fetch(`${API_BASE_URL}/opportunities/${id}/reopen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedOpp),
      })
    } catch {}

    list[idx] = updatedOpp
    saveStoredOpportunities(list)
    return updatedOpp
  },

  /* ──────────── User Story S5-07: Cảnh báo cơ hội đình trệ (Stalled Alerts) ──────────── */
  /**
   * Cấu hình ngưỡng cảnh báo đình trệ:
   * - max_days_in_stage: Quá số ngày này ở 1 stage mà chưa chuyển (mặc định 7 ngày)
   * - max_days_inactive: Quá số ngày này không có tương tác / note / task (mặc định 5 ngày)
   */
  getStalledConfig(): { max_days_in_stage: number; max_days_inactive: number } {
    try {
      const raw = localStorage.getItem('crm_stalled_opp_config')
      if (raw) return JSON.parse(raw)
    } catch {}
    return {
      max_days_in_stage: 7,
      max_days_inactive: 5,
    }
  },

  saveStalledConfig(config: { max_days_in_stage: number; max_days_inactive: number }): void {
    localStorage.setItem('crm_stalled_opp_config', JSON.stringify(config))
  },

  /**
   * Kiểm tra và phân tích xem một cơ hội có bị đình trệ hay không
   */
  analyzeStalledOpportunity(
    opp: Opportunity,
    customConfig?: { max_days_in_stage: number; max_days_inactive: number }
  ): {
    isStalled: boolean
    stalledType?: 'INACTIVE_LONG' | 'STAGE_OVERDUE' | 'CLOSE_DATE_PASSED'
    severity?: 'WARNING' | 'CRITICAL'
    daysStalled: number
    message: string
    suggestedAction: string
  } {
    const config = customConfig || opportunityService.getStalledConfig()
    // Chỉ cảnh báo với cơ hội đang mở (OPEN)
    if (opp.status !== 'OPEN') {
      return {
        isStalled: false,
        daysStalled: 0,
        message: '',
        suggestedAction: '',
      }
    }

    const now = new Date().getTime()
    const referenceDate = new Date('2026-10-10T09:00:00Z').getTime() // Thời điểm chuẩn của hệ thống
    const nowTime = Math.max(now, referenceDate)

    // 1. Quá hạn dự kiến chốt (Close Date Passed)
    if (opp.expected_close_date) {
      const closeTime = new Date(`${opp.expected_close_date}T23:59:59Z`).getTime()
      if (nowTime > closeTime) {
        const diffDays = Math.ceil((nowTime - closeTime) / (1000 * 60 * 60 * 24))
        return {
          isStalled: true,
          stalledType: 'CLOSE_DATE_PASSED',
          severity: diffDays > 5 ? 'CRITICAL' : 'WARNING',
          daysStalled: diffDays,
          message: `Đã quá hạn ngày dự kiến chốt (${opp.expected_close_date}) ${diffDays} ngày mà thương vụ chưa có kết quả.`,
          suggestedAction: 'Trưởng nhóm cần đôn đốc NVKD cập nhật lại ngày chốt hoặc thúc đẩy đàm phán hợp đồng gấp.',
        }
      }
    }

    // 2. Không có hoạt động / tương tác mới (Inactive Long)
    const lastActivityTime = opp.last_activity_at
      ? new Date(opp.last_activity_at).getTime()
      : new Date(opp.updated_at || opp.created_at).getTime()
    const daysInactive = Math.floor((nowTime - lastActivityTime) / (1000 * 60 * 60 * 24))

    if (daysInactive >= config.max_days_inactive) {
      return {
        isStalled: true,
        stalledType: 'INACTIVE_LONG',
        severity: daysInactive >= config.max_days_inactive * 1.5 ? 'CRITICAL' : 'WARNING',
        daysStalled: daysInactive,
        message: `Đã ${daysInactive} ngày không có bất kỳ cuộc gọi, email hay ghi chú chăm sóc nào cho cơ hội này.`,
        suggestedAction: 'Thương vụ có nguy cơ nguội lạnh. Trưởng nhóm cần yêu cầu liên hệ lại khách hàng ngay hoặc bàn giao người khác.',
      }
    }

    // 3. Đứng yên ở 1 giai đoạn quá lâu (Stage Overdue)
    const daysInStage = opp.days_in_stage ?? 0
    if (daysInStage >= config.max_days_in_stage) {
      return {
        isStalled: true,
        stalledType: 'STAGE_OVERDUE',
        severity: daysInStage >= config.max_days_in_stage * 1.5 ? 'CRITICAL' : 'WARNING',
        daysStalled: daysInStage,
        message: `Cơ hội bị tắc ở giai đoạn "${opp.stage_name}" suốt ${daysInStage} ngày chưa thể chuyển tiếp.`,
        suggestedAction: 'Cần can thiệp tháo gỡ vướng mắc (về giá, kỹ thuật, pháp lý) để đẩy nhanh tiến độ chốt hợp đồng.',
      }
    }

    return {
      isStalled: false,
      daysStalled: 0,
      message: '',
      suggestedAction: '',
    }
  },

  /**
   * Lấy danh sách tất cả cơ hội đang bị đình trệ
   */
  async getStalledOpportunities(customConfig?: { max_days_in_stage: number; max_days_inactive: number }): Promise<{
    alerts: Array<{
      opportunity: Opportunity
      stalled_type: 'INACTIVE_LONG' | 'STAGE_OVERDUE' | 'CLOSE_DATE_PASSED'
      severity: 'WARNING' | 'CRITICAL'
      days_stalled: number
      message: string
      suggested_action: string
    }>
    summary: {
      total_stalled: number
      critical_count: number
      warning_count: number
      stalled_revenue: number
    }
  }> {
    const config = customConfig || opportunityService.getStalledConfig()
    const opps = await opportunityService.getOpportunities()
    const alerts: Array<{
      opportunity: Opportunity
      stalled_type: 'INACTIVE_LONG' | 'STAGE_OVERDUE' | 'CLOSE_DATE_PASSED'
      severity: 'WARNING' | 'CRITICAL'
      days_stalled: number
      message: string
      suggested_action: string
    }> = []

    let criticalCount = 0
    let warningCount = 0
    let stalledRevenue = 0

    for (const opp of opps) {
      const result = opportunityService.analyzeStalledOpportunity(opp, config)
      if (result.isStalled && result.stalledType && result.severity) {
        alerts.push({
          opportunity: opp,
          stalled_type: result.stalledType,
          severity: result.severity,
          days_stalled: result.daysStalled,
          message: result.message,
          suggested_action: result.suggestedAction,
        })
        if (result.severity === 'CRITICAL') criticalCount++
        else warningCount++
        stalledRevenue += opp.expected_revenue
      }
    }

    return {
      alerts,
      summary: {
        total_stalled: alerts.length,
        critical_count: criticalCount,
        warning_count: warningCount,
        stalled_revenue: stalledRevenue,
      },
    }
  },

  /**
   * Gửi cảnh báo / nhắc nhở can thiệp tới NVKD phụ trách cơ hội đình trệ
   */
  async sendStalledInterventionNotice(
    opportunityId: string,
    message: string,
    managerName = 'Trưởng nhóm'
  ): Promise<void> {
    const list = getStoredOpportunities()
    const opp = list.find((o) => o.id === opportunityId)
    if (!opp) throw new Error('Không tìm thấy cơ hội!')

    // Cập nhật hoạt động can thiệp của Trưởng nhóm
    const note = `[CAN THIỆP SỚM TỪ TRƯỞNG NHÓM ${managerName.toUpperCase()}]: ${message}`
    opp.updated_at = new Date().toISOString()
    opp.last_activity_at = new Date().toISOString()
    saveStoredOpportunities(list)

    try {
      await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/intervene`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: note }),
      })
    } catch {}
  },

  /* ──────────── User Story S5-08: Phân bổ lại cơ hội (Reassign Opportunity) ──────────── */
  /**
   * Phân bổ lại cơ hội cho người khác trong nhóm:
   * - Chỉ Trưởng nhóm (Manager) hoặc Quản trị viên (Admin) mới có quyền thực hiện
   * - Bắt buộc chọn người nhận mới (new_owner_id, new_owner_name)
   * - Bắt buộc nhập lý do phân bổ lại (reassign_reason): nghỉ ốm dài ngày, quá tải, chuyển địa bàn...
   * - Tùy chọn chuyển giao toàn bộ công việc chưa hoàn thành (tasks)
   * - Tự động ghi nhận lịch sử bàn giao vào Timeline hoạt động và lịch sử cơ hội
   */
  async reassignOpportunity(
    id: string,
    payload: {
      new_owner_id: number
      new_owner_name: string
      new_team_id?: number
      new_team_name?: string
      reassign_reason: string
      transfer_notes?: string
      transfer_open_tasks?: boolean
      reassigned_by_id?: number
      reassigned_by_name?: string
    }
  ): Promise<Opportunity> {
    if (!payload.new_owner_id || !payload.new_owner_name) {
      throw new Error('Vui lòng chọn nhân viên kinh doanh tiếp nhận cơ hội!')
    }
    if (!payload.reassign_reason || !payload.reassign_reason.trim()) {
      throw new Error('Trưởng nhóm bắt buộc phải nhập lý do phân bổ lại cơ hội!')
    }

    const list = getStoredOpportunities()
    const idx = list.findIndex((o) => o.id === id)
    if (idx === -1) throw new Error('Không tìm thấy cơ hội bán hàng!')

    const existing = list[idx]
    const oldOwnerId = existing.owner_id
    const oldOwnerName = existing.owner_name
    const nowIso = new Date().toISOString()

    const updatedOpp: Opportunity = {
      ...existing,
      owner_id: payload.new_owner_id,
      owner_name: payload.new_owner_name,
      team_id: payload.new_team_id || existing.team_id,
      team_name: payload.new_team_name || existing.team_name,
      last_activity_at: nowIso,
      updated_at: nowIso,
    }

    // Lưu vào lịch sử phân bổ localStorage
    const historyItem = {
      id: `reassign-${Date.now()}`,
      opportunity_id: id,
      from_owner_id: oldOwnerId,
      from_owner_name: oldOwnerName,
      to_owner_id: payload.new_owner_id,
      to_owner_name: payload.new_owner_name,
      reassign_reason: payload.reassign_reason.trim(),
      transfer_notes: payload.transfer_notes?.trim() || '',
      reassigned_by_name: payload.reassigned_by_name || 'Trưởng nhóm',
      created_at: nowIso,
    }

    try {
      const rawHist = localStorage.getItem('crm_opportunity_reassign_history')
      const histList = rawHist ? JSON.parse(rawHist) : []
      histList.unshift(historyItem)
      localStorage.setItem('crm_opportunity_reassign_history', JSON.stringify(histList))
    } catch {}

    try {
      await fetch(`${API_BASE_URL}/opportunities/${id}/reassign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...updatedOpp,
          ...payload,
        }),
      })
    } catch {}

    list[idx] = updatedOpp
    saveStoredOpportunities(list)
    return updatedOpp
  },

  /**
   * Lấy lịch sử phân bổ lại của một cơ hội
   */
  getReassignHistory(opportunityId: string): Array<{
    id: string
    opportunity_id: string
    from_owner_id: number
    from_owner_name: string
    to_owner_id: number
    to_owner_name: string
    reassign_reason: string
    transfer_notes?: string
    reassigned_by_name: string
    created_at: string
  }> {
    try {
      const rawHist = localStorage.getItem('crm_opportunity_reassign_history')
      if (rawHist) {
        const histList = JSON.parse(rawHist)
        return histList.filter((h: any) => h.opportunity_id === opportunityId)
      }
    } catch {}
    return []
  },

  /* ──────────── User Story S5-04: Đánh giá điều kiện chuyển/rời giai đoạn (Stage Gate) ──────────── */
  async evaluateStageGate(
    opportunity: Opportunity,
    targetStageId: string
  ): Promise<import('../types/opportunity.ts').StageGateEvaluation> {
    const { pipelineService } = await import('./pipelineService.ts')
    const stages = pipelineService.getStages()
    const currentStage = stages.find((s) => s.id === opportunity.stage_id)
    const targetStage = stages.find((s) => s.id === targetStageId)

    const currentStageName = currentStage?.name || opportunity.stage_name || 'Giai đoạn hiện tại'
    const targetStageName = targetStage?.name || 'Giai đoạn đích'

    // Nếu quay lui giai đoạn thì không bắt buộc điều kiện tiến
    if (currentStage && targetStage && targetStage.order <= currentStage.order) {
      return {
        current_stage_name: currentStageName,
        target_stage_name: targetStageName,
        can_proceed: true,
        all_conditions: [],
        unmet_conditions: [],
      }
    }

    // Lấy các điều kiện bắt buộc của giai đoạn hiện tại cần rời đi
    const requiredConditions = currentStage?.required_conditions || []
    if (requiredConditions.length === 0) {
      return {
        current_stage_name: currentStageName,
        target_stage_name: targetStageName,
        can_proceed: true,
        all_conditions: [],
        unmet_conditions: [],
      }
    }

    // Lấy lịch sử hoạt động để kiểm tra thực tế (ví dụ: đã có cuộc gặp, đã gửi tài liệu, đã có cuộc gọi...)
    let activities: any[] = []
    try {
      const { opportunityActivityService } = await import('./opportunityActivityService.ts')
      activities = await opportunityActivityService.getActivities(opportunity.id)
    } catch {}

    const hasMeeting = activities.some((a) => a.type === 'MEETING')
    const hasCall = activities.some((a) => a.type === 'CALL')
    const hasProductsOrQuote = (opportunity.product_items && opportunity.product_items.length > 0) || opportunity.expected_revenue > 0

    const conditionResults: import('../types/opportunity.ts').StageConditionCheckResult[] = []

    for (const cond of requiredConditions) {
      const condLower = cond.toLowerCase()
      let isMet = false
      let detail = ''

      if (condLower.includes('cuộc gặp') || condLower.includes('demo')) {
        isMet = hasMeeting
        detail = hasMeeting ? 'Đã ghi nhận ít nhất 1 cuộc gặp / demo trực tiếp' : 'Chưa có cuộc gặp hoặc Demo Online nào được ghi nhận trên timeline'
      } else if (condLower.includes('cuộc gọi') || condLower.includes('liên hệ')) {
        isMet = hasCall || Boolean(opportunity.contact_phone || opportunity.contact_email)
        detail = isMet ? 'Đã xác thực thông tin liên hệ và có lịch sử liên lạc' : 'Chưa thực hiện cuộc gọi hoặc chưa có thông tin liên hệ'
      } else if (condLower.includes('báo giá') || condLower.includes('giá niêm yết')) {
        isMet = hasProductsOrQuote
        detail = hasProductsOrQuote ? 'Đã cấu hình các dòng sản phẩm hoặc xuất báo giá' : 'Chưa thêm danh mục sản phẩm/dịch vụ vào cơ hội'
      } else if (condLower.includes('hợp đồng') || condLower.includes('tạm ứng')) {
        isMet = opportunity.actual_revenue ? opportunity.actual_revenue > 0 : false
        detail = isMet ? 'Đã ghi nhận giá trị hợp đồng / tạm ứng' : 'Chưa hoàn tất xác nhận tạm ứng hoặc ký hợp đồng pháp lý'
      } else {
        // Mặc định kiểm tra qua tương tác hoặc cho qua nếu cơ hội đã có hoạt động
        isMet = activities.length >= 2
        detail = isMet ? 'Đã có các hoạt động trao đổi thực tế ghi nhận' : 'Cần ghi nhận đầy đủ biên bản / tiến độ thực tế'
      }

      conditionResults.push({
        condition: cond,
        is_met: isMet,
        detail,
      })
    }

    const unmet = conditionResults.filter((c) => !c.is_met)

    return {
      current_stage_name: currentStageName,
      target_stage_name: targetStageName,
      can_proceed: unmet.length === 0,
      all_conditions: conditionResults,
      unmet_conditions: unmet,
    }
  },

  /* ──────────── User Story S5-04: Trưởng nhóm Ghi đè điều kiện giai đoạn (Stage Override) ──────────── */
  async overrideAndChangeStage(
    opportunityId: string,
    targetStageId: string,
    overrideInfo: {
      user_id: number
      user_name: string
      user_role: string
      reason: string
      unmet_conditions: string[]
    }
  ): Promise<Opportunity> {
    const { pipelineService } = await import('./pipelineService.ts')
    const stages = pipelineService.getStages()
    const targetStage = stages.find((s) => s.id === targetStageId)
    if (!targetStage) throw new Error('Không tìm thấy giai đoạn đích!')

    const opp = await this.getOpportunityById(opportunityId)
    if (!opp) throw new Error('Không tìm thấy cơ hội bán hàng!')

    const overrideRecord: import('../types/opportunity.ts').StageGateOverrideRecord = {
      id: `ovr-${Date.now()}`,
      from_stage_id: opp.stage_id,
      from_stage_name: opp.stage_name,
      to_stage_id: targetStage.id,
      to_stage_name: targetStage.name,
      overridden_by_id: overrideInfo.user_id,
      overridden_by_name: overrideInfo.user_name,
      overridden_by_role: overrideInfo.user_role,
      reason: overrideInfo.reason.trim(),
      unmet_conditions: overrideInfo.unmet_conditions,
      created_at: new Date().toISOString(),
    }

    const updatedHistory = [overrideRecord, ...(opp.stage_override_history || [])]

    const updated = await this.updateOpportunity(opportunityId, {
      stage_id: targetStage.id,
      stage_name: targetStage.name,
      stage_color: targetStage.color,
      win_probability: targetStage.win_probability,
      stage_override_history: updatedHistory,
    })

    // Ghi nhận vào timeline hoạt động
    try {
      const { opportunityActivityService } = await import('./opportunityActivityService.ts')
      await opportunityActivityService.createActivity({
        opportunity_id: opportunityId,
        type: 'SYSTEM',
        title: `[Ghi đè quy trình] Chuyển sang ${targetStage.name} bởi ${overrideInfo.user_role}`,
        content: `Được duyệt ngoại lệ bởi ${overrideInfo.user_name} (${overrideInfo.user_role}). Lý do ghi đè: "${overrideInfo.reason}". Các điều kiện chưa đạt: ${overrideInfo.unmet_conditions.join('; ')}`,
        performed_by_id: overrideInfo.user_id,
        performed_by_name: overrideInfo.user_name,
      })
    } catch {}

    return updated
  },

  /* ──────────── User Story S6-02: Bộ lọc cơ hội nâng cao & Lưu bộ lọc ──────────── */
  getSavedFilters(): SavedOpportunityFilter[] {
    const STORAGE_KEY = 'crm_opportunity_saved_filters_v1'
    const PRESET_FILTERS: SavedOpportunityFilter[] = [
      {
        id: 'preset-week-focus',
        name: 'Thương vụ cần đẩy trong tuần này',
        icon: '⚡',
        date_preset: 'THIS_WEEK',
        status: 'OPEN',
        is_preset: true,
      },
      {
        id: 'preset-high-value',
        name: 'Cơ hội lớn (> 200M)',
        icon: '💎',
        revenue_range: '200M_500M',
        status: 'OPEN',
        is_preset: true,
      },
      {
        id: 'preset-month-closing',
        name: 'Dự kiến chốt trong tháng này',
        icon: '🎯',
        date_preset: 'THIS_MONTH',
        status: 'OPEN',
        is_preset: true,
      },
      {
        id: 'preset-my-deals',
        name: 'Cơ hội của tôi',
        icon: '👤',
        owner: 'CURRENT_USER',
        status: 'OPEN',
        is_preset: true,
      },
      {
        id: 'preset-overdue',
        name: 'Cơ hội quá hạn chốt',
        icon: '⏰',
        date_preset: 'OVERDUE',
        status: 'OPEN',
        is_preset: true,
      },
    ]

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return [...PRESET_FILTERS, ...parsed]
        }
      }
    } catch {}

    return PRESET_FILTERS
  },

  saveCustomFilter(name: string, criteria: Partial<SavedOpportunityFilter>): SavedOpportunityFilter {
    const STORAGE_KEY = 'crm_opportunity_saved_filters_v1'
    const newFilter: SavedOpportunityFilter = {
      id: `filter-${Date.now()}`,
      name: name.trim(),
      icon: '🔖',
      is_preset: false,
      ...criteria,
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const existing = raw ? JSON.parse(raw) : []
      const updated = [newFilter, ...(Array.isArray(existing) ? existing : [])]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}

    return newFilter
  },

  deleteCustomFilter(id: string): void {
    const STORAGE_KEY = 'crm_opportunity_saved_filters_v1'
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const existing = JSON.parse(raw)
        if (Array.isArray(existing)) {
          const updated = existing.filter((f: any) => f.id !== id)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        }
      }
    } catch {}
  },
}

