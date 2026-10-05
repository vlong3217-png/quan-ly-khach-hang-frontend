/**
 * Types cho User Story S2-07: Khai báo các danh mục dùng chung của bán hàng
 * - Ngành nghề khách hàng, quy mô doanh nghiệp, nguồn lead, loại hoạt động
 * - Giá trị đang được tham chiếu thì không xoá được
 * - Sắp xếp được thứ tự hiển thị
 */

export type SalesCategoryType = 'INDUSTRY' | 'COMPANY_SIZE' | 'LEAD_SOURCE' | 'ACTIVITY_TYPE'

export interface SalesCategoryItem {
  id: string
  type: SalesCategoryType
  code: string
  name: string
  sort_order: number // Sắp xếp được thứ tự hiển thị
  is_referenced: boolean // Giá trị đang được tham chiếu thì không xoá được
  reference_count?: number
  description?: string
  color?: string
}
