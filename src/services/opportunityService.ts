import type {
  Opportunity,
  CreateOpportunityPayload,
  OpportunityFilterParams,
} from '../types/opportunity.ts'
import { API_BASE_URL } from './authService.ts'

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

const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-001',
    code: 'OPP-001',
    title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    contact_name: 'Nguyễn Văn An',
    contact_phone: '024 3768 9999',
    contact_email: 'contact@alphatech.vn',
    stage_id: 'stage-3',
    stage_name: 'Đề xuất giải pháp & Demo',
    stage_order: 3,
    stage_color: '#2563eb',
    win_probability: 50,
    expected_revenue: 120000000,
    expected_close_date: '2026-11-15',
    source: 'Website',
    status: 'OPEN',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Khách hàng có nhu cầu mở rộng gói cho 50 users kinh doanh và CSKH.',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-05T14:30:00Z',
  },
  {
    id: 'opp-002',
    code: 'OPP-002',
    title: 'Gói Chuyển đổi số Quản trị Xây dựng - Hòa Bình Group',
    customer_id: 'cust-002',
    customer_name: 'Tập đoàn Xây dựng & Bất động sản Hòa Bình',
    contact_name: 'Trần Thị Bình',
    contact_phone: '028 3822 4567',
    contact_email: 'info@hoabinhgroup.vn',
    stage_id: 'stage-4',
    stage_name: 'Gửi báo giá chính thức',
    stage_order: 4,
    stage_color: '#7c3aed',
    win_probability: 70,
    expected_revenue: 350000000,
    expected_close_date: '2026-11-30',
    source: 'Hội thảo / Triển lãm',
    status: 'OPEN',
    owner_id: 2,
    owner_name: 'Trần Thị Bình',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Đã gửi dự thảo báo giá và bảng tính ROI chi tiết.',
    created_at: '2026-10-02T10:15:00Z',
    updated_at: '2026-10-07T16:00:00Z',
  },
]

function getStoredOpportunities(): Opportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPPORTUNITIES)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(INITIAL_OPPORTUNITIES))
  return INITIAL_OPPORTUNITIES
}

function saveStoredOpportunities(opps: Opportunity[]): void {
  localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(opps))
}

export const opportunityService = {
  async getOpportunities(params?: OpportunityFilterParams): Promise<Opportunity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          saveStoredOpportunities(data)
          return data
        }
      }
    } catch {}

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

    try {
      const response = await fetch(`${API_BASE_URL}/opportunities`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newOpp),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const updated = [data, ...list]
          saveStoredOpportunities(updated)
          return data
        }
      }
    } catch {}

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

    const updatedOpp: Opportunity = {
      ...list[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    }

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
}

