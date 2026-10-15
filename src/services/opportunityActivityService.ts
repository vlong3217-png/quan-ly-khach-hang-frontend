import { API_BASE_URL } from './authService.ts'
import type { PaginationParams } from '../types/pagination.ts'
import { normalizePaginatedResponse } from '../types/pagination.ts'
import type {
  OpportunityActivity,
  CreateOpportunityActivityPayload,
} from '../types/opportunity.ts'

const STORAGE_KEY = 'crm_opportunity_activities_v1'

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

// Dữ liệu ban đầu rỗng cho lịch sử hoạt động cơ hội
const INITIAL_ACTIVITIES: OpportunityActivity[] = []

function getStoredActivities(): OpportunityActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Dọn dẹp nếu còn tàn dư mock data opp-act-
      if (Array.isArray(parsed) && parsed.some((a: any) => typeof a.id === 'string' && a.id.startsWith('opp-act-'))) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
        return []
      }
      return parsed
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES))
  return INITIAL_ACTIVITIES
}

function saveStoredActivities(activities: OpportunityActivity[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
}

export const opportunityActivityService = {
  /**
   * Lấy danh sách lịch sử hoạt động của một cơ hội (Hỗ trợ phân trang Backend)
   */
  async getActivities(opportunityId: string, params?: PaginationParams): Promise<OpportunityActivity[]> {
    // 1. Thử gọi API Backend nếu có hỗ trợ
    try {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.limit) query.set('limit', String(params.limit))

      const url = `${API_BASE_URL}/opportunities/${opportunityId}/activities${query.toString() ? '?' + query.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const paginated = normalizePaginatedResponse<OpportunityActivity>(data, params?.page || 1, params?.limit || 10)
        // Lưu vào local cache và trả về
        const all = getStoredActivities().filter((a) => a.opportunity_id !== opportunityId)
        saveStoredActivities([...paginated.items, ...all])
        return paginated.items.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
    } catch {
      // Backend offline hoặc chưa có route -> Dùng LocalStorage fallback
    }

    // 2. LocalStorage Fallback
    const list = getStoredActivities()
    const filtered = list.filter((act) => act.opportunity_id === opportunityId)
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  /**
   * Lấy tất cả hoạt động trên toàn hệ thống (phục vụ Lịch làm việc S6-07 & Customer 360 S6-08)
   */
  async getAllActivities(): Promise<OpportunityActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/opportunity-activities`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const items = Array.isArray(data) ? data : data.items || []
        if (items.length > 0) {
          saveStoredActivities(items)
          return items
        }
      }
    } catch {}
    return getStoredActivities().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  /**
   * Ghi nhận một hoạt động mới cho cơ hội (User Story S5-03)
   */
  async createActivity(
    payload: CreateOpportunityActivityPayload
  ): Promise<OpportunityActivity> {
    const newActivity: OpportunityActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opportunity_id: payload.opportunity_id,
      opportunity_title: payload.opportunity_title,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      contact_id: payload.contact_id,
      contact_name: payload.contact_name,
      occurred_at: payload.occurred_at || new Date().toISOString(),
      type: payload.type,
      title: payload.title.trim(),
      content: payload.content.trim(),
      performed_by_id: payload.performed_by_id,
      performed_by_name: payload.performed_by_name || 'Người dùng',
      outcome: payload.outcome?.trim(),
      duration_minutes: payload.duration_minutes,
      next_action: payload.next_action?.trim(),
      next_action_due: payload.next_action_due,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 1. Gửi lên Backend nếu có
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${payload.opportunity_id}/activities`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newActivity),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const list = getStoredActivities()
          saveStoredActivities([data, ...list])
          return data
        }
      }
    } catch {
      // Backend offline hoặc lỗi -> fallback lưu local
    }

    // 2. Lưu vào LocalStorage
    const list = getStoredActivities()
    const updated = [newActivity, ...list]
    saveStoredActivities(updated)
    return newActivity
  },

  /**
   * Xóa một hoạt động đã ghi nhận
   */
  async deleteActivity(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/opportunity-activities/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

    const list = getStoredActivities().filter((act) => act.id !== id)
    saveStoredActivities(list)
  },

  /**
   * Thống kê nhanh các hoạt động theo loại
   */
  async getActivityStats(opportunityId: string) {
    const activities = await this.getActivities(opportunityId)
    const calls = activities.filter((a) => a.type === 'CALL').length
    const emails = activities.filter((a) => a.type === 'EMAIL').length
    const meetings = activities.filter((a) => a.type === 'MEETING').length
    const notes = activities.filter((a) => a.type === 'NOTE').length
    const lastActivity = activities.length > 0 ? activities[0].created_at : null

    return {
      total: activities.length,
      calls,
      emails,
      meetings,
      notes,
      lastActivityDate: lastActivity,
    }
  },
}
