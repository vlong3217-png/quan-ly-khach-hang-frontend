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
  lost_reason?: string
  competitor_id?: string
  owner_id: number
  owner_name: string
  team_id?: number
  team_name?: string
  description?: string
  lead_id?: string // ID Lead nguồn nếu được chuyển đổi từ Lead
  created_at: string
  updated_at: string
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
