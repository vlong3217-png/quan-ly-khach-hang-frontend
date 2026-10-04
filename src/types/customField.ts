/**
 * Types cho User Story S2-08: Khai báo trường tuỳ chỉnh cho khách hàng và cơ hội
 * - Thêm trường kiểu văn bản, số, ngày, danh sách chọn
 * - Đặt được trường là bắt buộc hay không
 * - Trường tuỳ chỉnh xuất hiện trong biểu mẫu, bộ lọc và bản xuất Excel
 */

export type CustomFieldTarget = 'CUSTOMER' | 'OPPORTUNITY'
export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'

export interface CustomFieldDefinition {
  id: string
  target: CustomFieldTarget // CUSTOMER | OPPORTUNITY
  key: string // Mã định danh cột (VD: tax_code, zalo_number)
  label: string // Tên hiển thị (VD: Mã số thuế, Số Zalo cá nhân)
  type: CustomFieldType // TEXT | NUMBER | DATE | SELECT
  is_required: boolean // Bắt buộc hay không
  options?: string[] // Danh sách giá trị nếu type = SELECT
  default_value?: string | number
  show_in_filter: boolean // Hiển thị trong bộ lọc
  show_in_export: boolean // Xuất ra file Excel
  created_at: string
}
