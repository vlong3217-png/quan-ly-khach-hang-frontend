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
    owner_id: 4,
    owner_name: 'Lưu Quang Trường',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Khách hàng có nhu cầu mở rộng gói cho 50 users kinh doanh và CSKH.',
    last_activity_at: '2026-10-09T14:30:00Z',
    days_in_stage: 2,
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-09T14:30:00Z',
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
    last_activity_at: '2026-10-08T16:00:00Z',
    days_in_stage: 4,
    created_at: '2026-10-02T10:15:00Z',
    updated_at: '2026-10-08T16:00:00Z',
  },
  {
    id: 'opp-003',
    code: 'OPP-003',
    title: 'Phần mềm CRM Chuỗi Bán Lẻ Thời Trang - NEM Fashion',
    customer_id: 'cust-003',
    customer_name: 'Công ty Cổ phần Thời Trang NEM',
    contact_name: 'Vũ Hải Đăng',
    contact_phone: '0934 112 233',
    contact_email: 'dang.vu@nemfashion.vn',
    stage_id: 'stage-2',
    stage_name: 'Tìm hiểu nhu cầu',
    stage_order: 2,
    stage_color: '#f59e0b',
    win_probability: 30,
    expected_revenue: 280000000,
    expected_close_date: '2026-10-05',
    source: 'Quảng cáo Facebook',
    status: 'OPEN',
    owner_id: 3,
    owner_name: 'Lê Hoàng Cường',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Khách hàng quan tâm mô-đun tích hợp loyalty và thẻ tích điểm cho chuỗi showroom.',
    last_activity_at: '2026-09-28T10:00:00Z', // 12 ngày không có hoạt động
    days_in_stage: 14, // 14 ngày ở stage-2
    created_at: '2026-09-25T08:00:00Z',
    updated_at: '2026-09-28T10:00:00Z',
  },
  {
    id: 'opp-004',
    code: 'OPP-004',
    title: 'Giải pháp CRM Quản lý Logistics Vận tải - Delta Express',
    customer_id: 'cust-004',
    customer_name: 'Công ty TNHH Tiếp Vận Quốc Tế Delta',
    contact_name: 'Nguyễn Phương Thảo',
    contact_phone: '0908 776 543',
    contact_email: 'thao.nguyen@deltaexpress.vn',
    stage_id: 'stage-5',
    stage_name: 'Đàm phán & Thương lượng hợp đồng',
    stage_order: 5,
    stage_color: '#06b6d4',
    win_probability: 85,
    expected_revenue: 450000000,
    expected_close_date: '2026-10-08',
    source: 'Giới thiệu (Referral)',
    status: 'OPEN',
    owner_id: 4,
    owner_name: 'Lưu Quang Trường',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Hợp đồng lớn đang trong giai đoạn rà soát điều khoản pháp lý, nhưng nhân viên phụ trách đang nghỉ ốm dài ngày.',
    last_activity_at: '2026-09-30T15:30:00Z', // 10 ngày không có tương tác
    days_in_stage: 11,
    created_at: '2026-09-20T09:30:00Z',
    updated_at: '2026-09-30T15:30:00Z',
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
}

