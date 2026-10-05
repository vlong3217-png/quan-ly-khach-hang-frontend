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
