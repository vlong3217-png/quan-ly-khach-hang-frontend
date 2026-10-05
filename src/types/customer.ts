/**
 * Kiểu dữ liệu Quản lý Khách hàng Doanh Nghiệp (User Story S3-01)
 *
 * AC Tiêu chí chấp nhận:
 * • Khai báo tên công ty, mã số thuế, ngành nghề, quy mô, website, địa chỉ, người sở hữu
 * • Mã số thuế nếu có thì phải là duy nhất
 * • Khách hàng có trạng thái: Tiềm năng, Đang giao dịch, Khách hàng, Ngừng hợp tác
 * • Phân quyền dữ liệu sở hữu: Nhân viên chỉ thấy khách hàng mình sở hữu; Trưởng nhóm thấy toàn nhóm; Admin thấy toàn bộ
 */

export type CustomerStatus = 'POTENTIAL' | 'IN_TRANSACTION' | 'ACTIVE_CUSTOMER' | 'STOPPED'

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  POTENTIAL: 'Tiềm năng',
  IN_TRANSACTION: 'Đang giao dịch',
  ACTIVE_CUSTOMER: 'Khách hàng',
  STOPPED: 'Ngừng hợp tác',
}

export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, { bg: string; color: string; border: string }> = {
  POTENTIAL: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  IN_TRANSACTION: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  ACTIVE_CUSTOMER: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  STOPPED: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
}

export interface CustomerEnterprise {
  id: string
  code: string // Mã định danh KH (VD: KH-001)
  name: string // Tên công ty / Doanh nghiệp
  tax_code?: string // Mã số thuế (duy nhất nếu có)
  industry: string // Ngành nghề (lấy từ Sales Categories hoặc custom)
  company_size: string // Quy mô (VD: Dưới 10 nhân sự, 10 - 50 nhân sự, ...)
  website?: string // Website công ty
  address?: string // Địa chỉ văn phòng / trụ sở
  phone?: string // Số điện thoại tổng đài / hotline
  email?: string // Email liên hệ chính

  // Phân quyền dữ liệu sở hữu (Data Scope & Ownership)
  owner_id: number // ID nhân viên kinh doanh phụ trách
  owner_name: string // Tên nhân viên phụ trách
  team_id: number // ID phòng / đội nhóm kinh doanh
  team_name: string // Tên đội nhóm (VD: Đội Kinh Doanh 1)

  // Trạng thái vòng đời khách hàng
  status: CustomerStatus

  // Metadata
  description?: string // Ghi chú bối cảnh công ty
  created_at: string
  updated_at: string
}

export interface CustomerFilterParams {
  search?: string // Tìm kiếm theo tên công ty, mã số thuế, mã KH, số điện thoại
  status?: CustomerStatus | ''
  industry?: string
  company_size?: string
  owner_id?: number | ''
}

/* ──────────── User Story S3-02: Quản lý người liên hệ & vai trò quyết định mua ──────────── */

/**
 * Vai trò trong quyết định mua (Buying Role):
 * - DECISION_MAKER: Người quyết định (Ký duyệt ngân sách / quyết định cuối cùng)
 * - INFLUENCER: Người ảnh hưởng (Đưa ra ý kiến chuyên môn / đề xuất)
 * - END_USER: Người dùng cuối (Trực tiếp sử dụng giải pháp)
 * - BLOCKER: Người cản trở (Có thể phản đối hoặc cản thương vụ)
 */
export type BuyingRole = 'DECISION_MAKER' | 'INFLUENCER' | 'END_USER' | 'BLOCKER'

export const BUYING_ROLE_LABELS: Record<BuyingRole, string> = {
  DECISION_MAKER: 'Người quyết định',
  INFLUENCER: 'Người ảnh hưởng',
  END_USER: 'Người dùng cuối',
  BLOCKER: 'Người cản trở',
}

export const BUYING_ROLE_BADGES: Record<BuyingRole, { bg: string; color: string; border: string }> = {
  DECISION_MAKER: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }, // Vàng sang trọng
  INFLUENCER: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, // Xanh dương
  END_USER: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }, // Xanh lá
  BLOCKER: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }, // Đỏ cảnh báo
}

export interface ContactHistoryEntry {
  from_customer_id: string
  from_customer_name: string
  to_customer_id: string
  to_customer_name: string
  transferred_at: string
  reason?: string
}

export interface CustomerContact {
  id: string
  customer_id: string // ID công ty khách hàng đang gắn
  customer_name: string // Tên công ty khách hàng
  full_name: string // Họ và tên người liên hệ
  title: string // Chức danh (VD: Giám đốc CNTT, Kế toán trưởng)
  email: string
  phone: string
  buying_role: BuyingRole // Vai trò quyết định mua
  is_primary: boolean // Đầu mối chính (Mỗi khách hàng có 1 đầu mối chính)
  notes?: string
  history?: ContactHistoryEntry[] // Lịch sử chuyển công ty nếu có
  created_at: string
  updated_at: string
}

/* ──────────── User Story S3-03: Trang 360 độ khách hàng ──────────── */

export interface CustomerDeal {
  id: string
  customer_id: string
  title: string
  value: number // Giá trị cơ hội (VND)
  stage: 'PROSPECTING' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
  status: 'OPEN' | 'CLOSED_WON' | 'CLOSED_LOST'
  expected_close_date: string
  created_at: string
}

export interface CustomerActivity {
  id: string
  customer_id: string
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'DEMO' | 'NOTE'
  title: string
  description: string
  performed_by_name: string
  performed_at: string
}

export interface CustomerAttachment {
  id: string
  customer_id: string
  file_name: string
  file_size: string
  uploaded_by: string
  uploaded_at: string
  file_type: string
}

/* ──────────── User Story S3-04: Cảnh báo & Gộp khách hàng trùng ──────────── */

export interface DuplicateCustomerGroup {
  id: string
  match_reason: 'TAX_CODE' | 'NAME_SIMILAR' | 'WEBSITE'
  match_field_value: string
  customers: CustomerEnterprise[]
}

/* ──────────── User Story S3-05: Quan hệ công ty mẹ - con ──────────── */

export interface ParentChildRelation {
  parent_id: string
  child_id: string
  parent_name: string
  child_name: string
  established_at: string
}

/* ──────────── User Story S3-08: Yêu cầu hỗ trợ (Ticket) & Cờ rủi ro rời bỏ ──────────── */

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface SupportTicket {
  id: string
  customer_id: string
  customer_name: string
  title: string
  priority: TicketPriority
  status: TicketStatus
  assignee_name: string
  assignee_id: number
  description: string
  created_at: string
  updated_at: string
}

/* ──────────── User Story S3-09: Khách hàng cần chăm sóc định kỳ ──────────── */

export interface PeriodicCareCustomer {
  customer: CustomerEnterprise
  last_interaction_date: string // Ngày tương tác gần nhất
  days_without_interaction: number // Số ngày chưa có tương tác
  contract_value: number // Tổng giá trị hợp đồng
  is_contacted_today?: boolean // Đánh dấu đã liên hệ hôm nay
}
