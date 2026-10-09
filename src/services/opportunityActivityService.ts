import { API_BASE_URL } from './authService.ts'
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

// Dữ liệu mẫu ban đầu cho lịch sử hoạt động cơ hội
const INITIAL_ACTIVITIES: OpportunityActivity[] = [
  {
    id: 'opp-act-1',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    type: 'SYSTEM',
    title: 'Khởi tạo Cơ hội bán hàng từ Lead chuyển đổi',
    content: 'Cơ hội được tạo tự động sau khi chuyển đổi Lead "Nguyễn Văn An" thành công.',
    performed_by_name: 'Hệ thống tự động',
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'opp-act-2',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    type: 'CALL',
    title: 'Cuộc gọi thẩm định yêu cầu mở rộng 50 users',
    content: 'Trao đổi qua điện thoại với anh An về cấu trúc phòng ban và nhu cầu tích hợp Zalo ZNS / SMS Brandname. Khách phản hồi rất tích cực.',
    outcome: 'Thành công - Đã gửi form khảo sát',
    duration_minutes: 25,
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    next_action: 'Gửi tài liệu giải pháp kỹ thuật và đặt lịch demo',
    next_action_due: '2026-10-03T10:00:00Z',
    created_at: '2026-10-02T10:30:00Z',
  },
  {
    id: 'opp-act-3',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    type: 'STAGE_CHANGE',
    title: 'Chuyển giai đoạn: Tiếp cận → Xác định nhu cầu (BANT)',
    content: 'Xác nhận ngân sách dự kiến 120-150 triệu VNĐ. Thời gian triển khai mục tiêu trong tháng 11/2026.',
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    created_at: '2026-10-03T11:00:00Z',
  },
  {
    id: 'opp-act-4',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    type: 'MEETING',
    title: 'Họp Demo trực tiếp giải pháp tại văn phòng AlphaTech',
    content: 'Trình diễn tính năng quản lý pipeline bán hàng, phân quyền dữ liệu đội nhóm và báo cáo doanh thu dự báo. Giám đốc điều hành AlphaTech đánh giá cao giao diện trực quan.',
    outcome: 'Rất hài lòng - Khách yêu cầu gửi báo giá chính thức kèm phương án thanh toán 3 đợt',
    duration_minutes: 90,
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    next_action: 'Soạn thảo báo giá chính thức và dự thảo hợp đồng',
    next_action_due: '2026-10-06T17:00:00Z',
    created_at: '2026-10-05T14:30:00Z',
  },
  {
    id: 'opp-act-5',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    type: 'EMAIL',
    title: 'Gửi bảng chào giá chính thức gói CRM Enterprise 50 Users',
    content: 'Đã gửi file PDF Báo giá BG-2026-089 tổng trị giá 120,000,000 VNĐ kèm bảng phân tích hiệu quả ROI.',
    outcome: 'Đã gửi qua email - Khách đã mở xem',
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    next_action: 'Follow up qua điện thoại sau 2 ngày',
    next_action_due: '2026-10-08T09:00:00Z',
    created_at: '2026-10-06T09:15:00Z',
  },
  {
    id: 'opp-act-6',
    opportunity_id: 'opp-002',
    opportunity_title: 'Gói Chuyển đổi số Quản trị Xây dựng - Hòa Bình Group',
    type: 'SYSTEM',
    title: 'Khởi tạo Cơ hội bán hàng từ sự kiện Triển lãm VietBuild',
    content: 'Cơ hội tiếp nhận từ gian hàng triển lãm VietBuild Q3.',
    performed_by_name: 'Trần Thị Bình',
    created_at: '2026-10-02T10:15:00Z',
  },
  {
    id: 'opp-act-7',
    opportunity_id: 'opp-002',
    opportunity_title: 'Gói Chuyển đổi số Quản trị Xây dựng - Hòa Bình Group',
    type: 'MEETING',
    title: 'Họp trao đổi yêu cầu với Ban Giám đốc Hòa Bình Group',
    content: 'Khách hàng quan tâm mô hình CRM tích hợp phân hệ quản lý tiến độ và nhà thầu phụ. Giá trị dự kiến 350,000,000 VNĐ.',
    outcome: 'Thành công - Chốt gửi dự thảo hợp đồng',
    duration_minutes: 60,
    performed_by_id: 2,
    performed_by_name: 'Trần Thị Bình',
    created_at: '2026-10-07T16:00:00Z',
  },
]

function getStoredActivities(): OpportunityActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES))
  return INITIAL_ACTIVITIES
}

function saveStoredActivities(activities: OpportunityActivity[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
}

export const opportunityActivityService = {
  /**
   * Lấy danh sách lịch sử hoạt động của một cơ hội (Sắp xếp mới nhất lên đầu)
   */
  async getActivities(opportunityId: string): Promise<OpportunityActivity[]> {
    // 1. Thử gọi API Backend nếu có hỗ trợ
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/activities`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          // Lưu vào local cache và trả về
          const all = getStoredActivities().filter((a) => a.opportunity_id !== opportunityId)
          saveStoredActivities([...data, ...all])
          return data.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
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
   * Ghi nhận một hoạt động mới cho cơ hội (User Story S5-03)
   */
  async createActivity(
    payload: CreateOpportunityActivityPayload
  ): Promise<OpportunityActivity> {
    const newActivity: OpportunityActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opportunity_id: payload.opportunity_id,
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
