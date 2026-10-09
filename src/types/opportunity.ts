/**
 * Kiểu dữ liệu Quản lý Cơ hội bán hàng (Opportunity) - User Story S5-01 & S5-02
 *
 * AC Tiêu chí chấp nhận:
 * • Thông tin cơ hội: Tên cơ hội, Khách hàng, Người liên hệ, Giai đoạn, Giá trị dự kiến, Ngày dự kiến chốt, Nguồn
 * • Validation: Bắt buộc các trường chính, Không cho chọn ngày chốt trong quá khứ
 * • Điều hành cơ hội trên Pipeline Kanban và danh sách bảng
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
  expected_close_date: string // Ngày dự kiến chốt (YYYY-MM-DD, không được trong quá khứ)
  source: string // Nguồn cơ hội (Website, Facebook, Khách cũ giới thiệu, ...)
  status: OpportunityStatus // OPEN | WON | LOST | ABANDONED
  lost_reason?: string // Lý do thua nếu status === 'LOST' (S2-10)
  competitor_id?: string // Đối thủ cạnh tranh nếu có
  owner_id: number // ID nhân viên phụ trách
  owner_name: string // Tên nhân viên phụ trách
  team_id?: number // ID phòng ban / đội nhóm
  team_name?: string // Tên đội nhóm
  description?: string // Mô tả nhu cầu & bối cảnh
  created_at: string
  updated_at: string
}

export interface CreateOpportunityPayload {
  title: string
  customer_id: string
  customer_name?: string
  contact_id?: string
  contact_name?: string
  stage_id: string
  expected_revenue: number
  expected_close_date: string // YYYY-MM-DD
  source: string
  description?: string
  owner_id?: number
  owner_name?: string
  team_id?: number
  team_name?: string
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

export interface OpportunitySummary {
  total_count: number
  total_expected_revenue: number // Tổng giá trị pipeline (VNĐ)
  forecast_revenue: number // Doanh số dự báo có trọng số (Weighted Forecast = Sum(Rev * WinProb / 100))
  won_count: number
  won_revenue: number
  lost_count: number
  open_count: number
  avg_win_rate: number // Tỷ lệ thắng trung bình (%)
}
