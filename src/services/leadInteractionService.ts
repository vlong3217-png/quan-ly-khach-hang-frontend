import { API_BASE_URL } from './authService.ts'
import type { PaginationParams } from '../types/pagination.ts'
import { normalizePaginatedResponse } from '../types/pagination.ts'
import type {
  LeadInteraction,
  CreateLeadInteractionPayload,
} from '../types/lead.ts'

const STORAGE_KEY = 'crm_lead_interactions_v2'

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
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// Dữ liệu tương tác ban đầu trống
const INITIAL_INTERACTIONS: LeadInteraction[] = []

export function getStoredInteractions(): LeadInteraction[] {
  try {
    localStorage.removeItem('crm_lead_interactions_v1')
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INTERACTIONS))
      return INITIAL_INTERACTIONS
    }
    return JSON.parse(raw) as LeadInteraction[]
  } catch {
    return INITIAL_INTERACTIONS
  }
}

function saveStoredInteractions(list: LeadInteraction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Lỗi khi lưu tương tác Lead vào localStorage:', err)
  }
}

export const leadInteractionService = {
  /**
   * Lấy danh sách lịch sử tương tác của 1 Lead cụ thể (Hỗ trợ phân trang Backend)
   */
  async getInteractionsByLead(leadId: string, params?: PaginationParams): Promise<LeadInteraction[]> {
    try {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.limit) query.set('limit', String(params.limit))

      const url = `${API_BASE_URL}/leads/${leadId}/interactions${query.toString() ? '?' + query.toString() : ''}`
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        const paginated = normalizePaginatedResponse<LeadInteraction>(json, params?.page || 1, params?.limit || 10)
        if (paginated.items.length > 0 || json.items || Array.isArray(json.data) || Array.isArray(json)) {
          return paginated.items
        }
      }
    } catch {
      // Dùng fallback LocalStorage
    }

    const all = getStoredInteractions()
    return all
      .filter((item) => item.lead_id === leadId)
      .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
  },

  /**
   * Lấy toàn bộ tương tác gần nhất trong hệ thống (để hiển thị tab Timeline tổng)
   */
  async getAllRecentInteractions(limit = 50, page = 1): Promise<LeadInteraction[]> {
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`${API_BASE_URL}/leads/interactions/recent?${query.toString()}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        const paginated = normalizePaginatedResponse<LeadInteraction>(json, page, limit)
        if (paginated.items.length > 0 || json.items || Array.isArray(json.data) || Array.isArray(json)) {
          return paginated.items.slice(0, limit)
        }
      }
    } catch {
      // Fallback
    }

    const all = getStoredInteractions()
    return all
      .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
      .slice(0, limit)
  },

  /**
   * Tạo một tương tác mới cho Lead (Cuộc gọi, Email, Cuộc họp, Ghi chú)
   */
  async createInteraction(payload: CreateLeadInteractionPayload): Promise<LeadInteraction> {
    const nowIso = new Date().toISOString()
    const newEntry: LeadInteraction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lead_id: payload.lead_id,
      type: payload.type,
      title: payload.title.trim(),
      content: payload.content?.trim() || '',
      outcome: payload.outcome?.trim(),
      performed_by_id: payload.performed_by_id || 1,
      performed_by_name: payload.performed_by_name || 'Nguyễn Văn An',
      performed_at: payload.performed_at || nowIso,
      next_action: payload.next_action?.trim(),
      next_action_due: payload.next_action_due,
      created_at: nowIso,
    }

    try {
      const res = await fetch(`${API_BASE_URL}/leads/${payload.lead_id}/interactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          const saved = json.data
          const all = getStoredInteractions()
          saveStoredInteractions([saved, ...all])
          return saved
        }
      }
    } catch {
      // Tiếp tục lưu fallback
    }

    const all = getStoredInteractions()
    saveStoredInteractions([newEntry, ...all])
    return newEntry
  },

  /**
   * Ghi nhận hệ thống khi chuyển trạng thái Lead
   */
  async recordStatusChange(
    leadId: string,
    oldStatus: string,
    newStatus: string,
    performedByName = 'Nhân viên phụ trách'
  ): Promise<LeadInteraction> {
    const STATUS_MAP: Record<string, string> = {
      NEW: 'Mới tiếp nhận',
      CONTACTED: 'Đang chăm sóc*',
      QUALIFIED: 'Đủ điều kiện BANT',
      UNQUALIFIED: 'Không tiềm năng',
      CONVERTED: 'Đã chuyển đổi',
      JUNK: 'Rác / Sai số',
    }

    return this.createInteraction({
      lead_id: leadId,
      type: 'STATUS_CHANGE',
      title: `Thay đổi trạng thái: ${STATUS_MAP[oldStatus] || oldStatus} → ${STATUS_MAP[newStatus] || newStatus}`,
      content: `Trạng thái của lead đã được cập nhật thành "${STATUS_MAP[newStatus] || newStatus}"`,
      performed_by_name: performedByName,
      outcome: 'Cập nhật trạng thái',
    })
  },

  /**
   * Ghi nhận hệ thống khi điều chỉnh điểm số Lead
   */
  async recordScoreChange(
    leadId: string,
    oldScore: number,
    newScore: number,
    notes: string,
    performedByName = 'Quản lý'
  ): Promise<LeadInteraction> {
    const diff = newScore - oldScore
    const diffText = diff >= 0 ? `+${diff}đ` : `${diff}đ`
    return this.createInteraction({
      lead_id: leadId,
      type: 'SCORE_UPDATE',
      title: `Điều chỉnh điểm số thủ công: ${oldScore}đ → ${newScore}đ (${diffText})`,
      content: notes ? `Lý do: ${notes}` : 'Được điều chỉnh bởi Quản lý',
      performed_by_name: performedByName,
      outcome: 'Ghi đè điểm thủ công',
    })
  },

  /**
   * S4-07: Ghi nhận sự kiện Nhân viên kinh doanh nhận Lead
   */
  async recordLeadAccepted(
    leadId: string,
    salesName: string
  ): Promise<LeadInteraction> {
    return this.createInteraction({
      lead_id: leadId,
      type: 'SLA_ASSIGNMENT',
      title: `Nhận chăm sóc Lead (SLA): ${salesName}`,
      content: `Nhân viên ${salesName} đã chấp nhận phân bổ và cam kết xử lý lead theo SLA phản hồi.`,
      performed_by_name: salesName,
      outcome: 'Đã nhận Lead - Đang chăm sóc',
      next_action: 'Liên hệ tư vấn khách hàng lần 1',
    })
  },

  /**
   * S4-07: Ghi nhận sự kiện Nhân viên từ chối Lead
   */
  async recordLeadRejected(
    leadId: string,
    salesName: string,
    reason: string
  ): Promise<LeadInteraction> {
    return this.createInteraction({
      lead_id: leadId,
      type: 'SLA_ASSIGNMENT',
      title: `Từ chối nhận Lead: ${salesName}`,
      content: `Lý do từ chối: "${reason}". Lead đã được chuyển về hàng chờ phân bổ lại cho nhân viên khác.`,
      performed_by_name: salesName,
      outcome: 'Từ chối - Quay lại hàng chờ',
    })
  },

  /**
   * S4-07: Ghi nhận cảnh báo Quá hạn SLA gửi Trưởng nhóm
   */
  async recordSlaOverdueAlert(
    leadId: string,
    leadName: string,
    salesName: string
  ): Promise<LeadInteraction> {
    return this.createInteraction({
      lead_id: leadId,
      type: 'SLA_ALERT',
      title: `Cảnh báo SLA quá hạn: ${leadName}`,
      content: `Lead được phân cho ${salesName} đã vượt quá thời hạn cam kết phản hồi (SLA). Cần trưởng nhóm can thiệp tái phân bổ.`,
      performed_by_name: 'Hệ thống giám sát SLA',
      outcome: 'Cảnh báo Trưởng nhóm',
    })
  },


  /**
   * Xóa một tương tác
   */
  async deleteInteraction(interactionId: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/leads/interactions/${interactionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {
      // Local fallback
    }

    const all = getStoredInteractions()
    const updated = all.filter((item) => item.id !== interactionId)
    saveStoredInteractions(updated)
    return true
  },
}
