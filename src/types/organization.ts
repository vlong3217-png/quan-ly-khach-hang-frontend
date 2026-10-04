/**
 * Types cho User Story S2-06: Khai báo cơ cấu tổ chức kinh doanh
 * - Nhóm kinh doanh có cấu trúc cây, mỗi nhóm có một trưởng nhóm
 * - Mỗi nhân viên thuộc đúng một nhóm tại một thời điểm
 * - Cây tổ chức này quyết định phạm vi dữ liệu mà Trưởng nhóm nhìn thấy
 * - Khai báo khu vực địa lý và gán khu vực cho nhóm
 */

export interface Region {
  id: string
  code: string
  name: string // Miền Bắc, Miền Trung, Miền Nam, Tây Nguyên...
  description?: string
}

export interface DepartmentNode {
  id: string
  name: string // Khối Kinh Doanh, Phòng Kinh Doanh 1, Nhóm Bán Lẻ A...
  code: string
  parent_id: string | null // null = Khối/Gốc cây
  leader_id: number // ID trưởng nhóm
  leader_name: string // Tên trưởng nhóm
  region_id: string // Gán khu vực địa lý
  region_name: string
  members: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  description?: string
  children?: DepartmentNode[]
}
