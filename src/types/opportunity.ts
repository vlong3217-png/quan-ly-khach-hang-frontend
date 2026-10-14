/**
 * Kiểu dữ liệu Quản lý Cơ hội bán hàng (Opportunity)
 */

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST' | 'ABANDONED'

export interface Opportunity {
  id: string
  code: string // Mã cơ hội (VD: OPP-001)
  title: string // Tên cơ hội (VD: Triển khai CRM Doanh nghiệp AlphaTech)
  customer_id: string // ID công ty khách hàng
  customer_name: string // Tên công ty khách hàng
  contact_id?: string // ID người liên hệ
  contact_name?: string // Tên người liên hệ
  contact_phone?: string
  contact_email?: string
  stage_id: string // ID giai đoạn pipeline (VD: stage-1)
  stage_name: string // Tên giai đoạn (VD: Tiếp cận & Đánh giá)
  stage_order?: number
  stage_color?: string
  win_probability: number // Xác suất thắng (0 - 100%)
  expected_revenue: number // Giá trị dự kiến (VNĐ)
  expected_close_date: string // Ngày dự kiến chốt (YYYY-MM-DD)
  source: string // Nguồn cơ hội
  status: OpportunityStatus
  // ── S5-05: Đóng Thắng / Thua & Mở lại cơ hội ──
  actual_revenue?: number // Giá trị chốt thực tế (khi đóng thắng)
  actual_close_date?: string // Ngày ký hợp đồng / ngày chốt thực tế (YYYY-MM-DD)
  win_reason_id?: string // Lý do thắng
  win_reason_name?: string
  win_notes?: string
  lost_reason_id?: string // Lý do thua
  lost_reason?: string // Tên/nội dung lý do thua
  competitor_id?: string // Đối thủ thắng thầu nếu có
  competitor_name?: string
  loss_notes?: string
  closed_at?: string // Thời điểm đóng cơ hội
  closed_by_id?: number
  closed_by_name?: string
  reopened_at?: string // Thời điểm mở lại
  reopened_by_id?: number
  reopened_by_name?: string
  reopen_reason?: string // Lý do mở lại bắt buộc
  owner_id: number
  owner_name: string
  team_id?: number
  team_name?: string
  description?: string
  lead_id?: string // ID Lead nguồn nếu được chuyển đổi từ Lead
  // ── S5-07: Cảnh báo cơ hội đình trệ (Stalled Opportunity Alert) ──
  last_activity_at?: string // Thời điểm hoạt động / tương tác gần nhất
  days_in_stage?: number // Số ngày nằm ở giai đoạn hiện tại mà chưa chuyển tiếp
  is_stalled?: boolean // Đang bị đình trệ
  stalled_reason?: string // Lý do đình trệ (quá hạn giai đoạn, không có hoạt động, quá hạn chốt)
  created_at: string
  updated_at: string
}

export interface StalledOpportunityConfig {
  max_days_in_stage: number // Ngưỡng số ngày tối đa ở 1 giai đoạn trước khi báo động (mặc định 7 ngày)
  max_days_inactive: number // Ngưỡng số ngày tối đa không có tương tác / hoạt động (mặc định 5 ngày)
}

export interface StalledOpportunityAlert {
  opportunity: Opportunity
  stalled_type: 'INACTIVE_LONG' | 'STAGE_OVERDUE' | 'CLOSE_DATE_PASSED'
  severity: 'WARNING' | 'CRITICAL'
  days_stalled: number
  message: string
  suggested_action: string
}

/**
 * ── S5-08: Phân bổ lại cơ hội (Reassign Opportunity) ──
 */
export interface ReassignOpportunityPayload {
  new_owner_id: number
  new_owner_name: string
  new_team_id?: number
  new_team_name?: string
  reassign_reason: string // Bắt buộc lý do (nghỉ ốm dài ngày, quá tải, chuyển địa bàn, theo yêu cầu khách hàng)
  transfer_notes?: string // Ghi chú bàn giao công việc / đầu mối
  transfer_open_tasks?: boolean // Chuyển giao toàn bộ công việc chưa hoàn thành sang nhân viên mới
  reassigned_by_id?: number
  reassigned_by_name?: string
}

export interface OpportunityReassignHistory {
  id: string
  opportunity_id: string
  from_owner_id: number
  from_owner_name: string
  to_owner_id: number
  to_owner_name: string
  reassign_reason: string
  transfer_notes?: string
  transferred_tasks_count?: number
  reassigned_by_name: string
  created_at: string
}

export interface CloseOpportunityWonPayload {
  actual_revenue: number // Bắt buộc
  actual_close_date: string // Bắt buộc ngày ký (YYYY-MM-DD)
  win_reason_id?: string
  win_notes?: string
  closed_by_id?: number
  closed_by_name?: string
}

export interface CloseOpportunityLostPayload {
  lost_reason_id: string // Bắt buộc chọn lý do thua
  lost_reason: string
  competitor_id?: string // Đối thủ thắng thầu nếu có
  competitor_name?: string
  loss_notes?: string
  closed_by_id?: number
  closed_by_name?: string
}

export interface ReopenOpportunityPayload {
  reopen_reason: string // Bắt buộc nhập lý do mở lại
  target_stage_id?: string
  reopened_by_id?: number
  reopened_by_name?: string
}


export interface CreateOpportunityPayload {
  title: string
  customer_id: string
  customer_name?: string
  contact_id?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  stage_id: string
  stage_name?: string
  expected_revenue: number
  expected_close_date: string // YYYY-MM-DD
  win_probability?: number
  source?: string
  description?: string
  owner_id?: number
  owner_name?: string
  team_id?: number
  team_name?: string
  lead_id?: string
}

export interface OpportunityFilterParams {
  search?: string
  stage_id?: string
  source?: string
  owner_id?: number | ''
  team_id?: number | ''
  status?: string
  close_date_from?: string
  close_date_to?: string
}

/**
 * Kiểu dữ liệu cho S5-03: Ghi nhận hoạt động và lịch sử tương tác của cơ hội
 */
export type OpportunityActivityType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'NOTE'
  | 'STAGE_CHANGE'
  | 'TASK'
  | 'SYSTEM'

export interface OpportunityActivity {
  id: string
  opportunity_id: string
  opportunity_title?: string
  type: OpportunityActivityType
  title: string
  content: string
  performed_by_id?: number
  performed_by_name: string
  outcome?: string // Kết quả tương tác (VD: Thành công, Hẹn gặp lại, Báo giá được chấp thuận...)
  duration_minutes?: number // Thời lượng cuộc gọi / họp
  attachment_url?: string
  next_action?: string // Kế hoạch tiếp theo
  next_action_due?: string // Thời hạn kế hoạch tiếp theo (ISO string hoặc YYYY-MM-DD)
  created_at: string
  updated_at?: string
}

export interface CreateOpportunityActivityPayload {
  opportunity_id: string
  type: OpportunityActivityType
  title: string
  content: string
  performed_by_id?: number
  performed_by_name?: string
  outcome?: string
  duration_minutes?: number
  next_action?: string
  next_action_due?: string
}

/**
 * Kiểu dữ liệu cho S5-04: Quản lý công việc và lịch nhắc liên quan đến cơ hội
 */
export type OpportunityTaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type OpportunityTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type OpportunityReminderType =
  | 'NONE'
  | 'ON_DUE'
  | '15_MIN_BEFORE'
  | '1_HOUR_BEFORE'
  | '1_DAY_BEFORE'
  | '3_DAYS_BEFORE'

export interface OpportunityTask {
  id: string
  opportunity_id: string
  opportunity_title?: string
  title: string
  description?: string
  assigned_to_id?: number
  assigned_to_name: string
  due_date: string // YYYY-MM-DD
  due_time?: string // HH:mm
  status: OpportunityTaskStatus
  priority: OpportunityTaskPriority
  reminder_type: OpportunityReminderType
  reminder_at?: string // ISO date hoặc thông báo
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at?: string
}

export interface CreateOpportunityTaskPayload {
  opportunity_id: string
  title: string
  description?: string
  assigned_to_id?: number
  assigned_to_name?: string
  due_date: string
  due_time?: string
  priority?: OpportunityTaskPriority
  reminder_type?: OpportunityReminderType
  reminder_at?: string
}

export interface UpdateOpportunityTaskPayload {
  title?: string
  description?: string
  assigned_to_id?: number
  assigned_to_name?: string
  due_date?: string
  due_time?: string
  status?: OpportunityTaskStatus
  priority?: OpportunityTaskPriority
  reminder_type?: OpportunityReminderType
  reminder_at?: string
  is_completed?: boolean
}


