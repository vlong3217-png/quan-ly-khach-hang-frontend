import { API_BASE_URL } from './authService.ts'
import type {
  LeadInteraction,
  CreateLeadInteractionPayload,
} from '../types/lead.ts'

const STORAGE_KEY = 'crm_lead_interactions_v1'

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

// Mock dữ liệu tương tác ban đầu nếu chưa có trong LocalStorage
const INITIAL_INTERACTIONS: LeadInteraction[] = [
  {
    id: 'act-1',
    lead_id: 'lead-1',
    type: 'SYSTEM',
    title: 'Tiếp nhận Lead từ Biểu mẫu Website',
    content: 'Lead gửi thông tin từ form "Đăng ký tư vấn giải pháp CRM Doanh nghiệp"',
    performed_by_name: 'Hệ thống tự động',
    performed_at: '2026-10-01T08:30:00Z',
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: 'act-2',
    lead_id: 'lead-1',
    type: 'CALL',
    title: 'Cuộc gọi xác nhận nhu cầu ban đầu',
    content: 'Đã trao đổi với anh Tuấn. Khách hàng đang có 60 nhân viên kinh doanh, muốn triển khai trong tháng 11. Đánh giá nhu cầu rất cấp thiết.',
    outcome: 'Thành công - Quan tâm cao',
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    performed_at: '2026-10-01T10:15:00Z',
    next_action: 'Gửi hồ sơ năng lực và bảng giá giải pháp',
    next_action_due: '2026-10-02T12:00:00Z',
    created_at: '2026-10-01T10:20:00Z',
  },
  {
    id: 'act-3',
    lead_id: 'lead-1',
    type: 'EMAIL',
    title: 'Gửi bảng giới thiệu tính năng & báo giá gói Enterprise',
    content: 'Đã gửi file PDF tài liệu giải pháp qua email tuan.nguyen@alphacorp.vn. Khách đã mở đọc lúc 14:20.',
    outcome: 'Đã gửi thành công',
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    performed_at: '2026-10-02T11:00:00Z',
    created_at: '2026-10-02T11:00:00Z',
  },
  {
    id: 'act-4',
    lead_id: 'lead-1',
    type: 'MEETING',
    title: 'Họp Demo trực tuyến qua Google Meet',
    content: 'Buổi demo có sự tham gia của Giám đốc điều hành và Trưởng phòng IT. Khách đánh giá cao tính năng chấm điểm lead và pipeline quản lý cơ hội.',
    outcome: 'Cuộc họp thành công',
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    performed_at: '2026-10-04T15:00:00Z',
    next_action: 'Gửi hợp đồng dự thảo và chuẩn bị quy trình chuyển đổi khách hàng',
    next_action_due: '2026-10-07T17:00:00Z',
    created_at: '2026-10-04T16:00:00Z',
  },
  {
    id: 'act-5',
    lead_id: 'lead-2',
    type: 'SYSTEM',
    title: 'Nhập thông tin từ file Excel chiến dịch Q4',
    content: 'Lead được nhập hàng loạt từ danh sách khách tham dự Triển lãm VietBuild.',
    performed_by_name: 'Trần Thị Bình',
    performed_at: '2026-10-03T09:00:00Z',
    created_at: '2026-10-03T09:00:00Z',
  },
  {
    id: 'act-6',
    lead_id: 'lead-2',
    type: 'CALL',
    title: 'Gọi điện thoại giới thiệu chương trình ưu đãi',
    content: 'Chị Mai bận họp lúc sáng, hẹn gọi lại vào cuối buổi chiều.',
    outcome: 'Khách hẹn gọi lại',
    performed_by_id: 2,
    performed_by_name: 'Trần Thị Bình',
    performed_at: '2026-10-03T10:30:00Z',
    next_action: 'Gọi lại xác nhận sau 16h30',
    next_action_due: '2026-10-03T16:30:00Z',
    created_at: '2026-10-03T10:35:00Z',
  },
  {
    id: 'act-7',
    lead_id: 'lead-3',
    type: 'NOTE',
    title: 'Ghi chú khảo sát thực tế',
    content: 'Khách hàng có chuỗi 4 cửa hàng bán lẻ, ngân sách ban đầu khoảng 30-50 triệu.',
    performed_by_id: 1,
    performed_by_name: 'Nguyễn Văn An',
    performed_at: '2026-10-05T14:00:00Z',
    created_at: '2026-10-05T14:00:00Z',
  },
]

function getStoredInteractions(): LeadInteraction[] {
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
   * Lấy danh sách lịch sử tương tác của 1 Lead cụ thể
   */
  async getInteractionsByLead(leadId: string): Promise<LeadInteraction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${leadId}/interactions`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data
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
  async getAllRecentInteractions(limit = 50): Promise<LeadInteraction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/interactions/recent`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data.slice(0, limit)
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
      CONTACTED: 'Đã liên hệ',
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
