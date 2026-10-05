/**
 * Types cho User Story S2-05: Quản lý danh mục sản phẩm, dịch vụ và bảng giá niêm yết
 */

export type ProductType = 'ONE_TIME' | 'SUBSCRIPTION'
export type ProductStatus = 'ACTIVE' | 'DISCONTINUED'

export interface Product {
  id: string
  code: string
  name: string
  type: ProductType // ONE_TIME: Sản phẩm một lần | SUBSCRIPTION: Dịch vụ thuê bao
  unit: string // Đơn vị tính: Chiếc, Gói, Tháng, Năm, Bản quyền...
  list_price: number // Giá niêm yết
  floor_price: number // Giá sàn (ngưỡng chiết khấu tối đa)
  cost_price?: number // Giá vốn (Chỉ Giám đốc kinh doanh / ADMIN xem và sửa)
  status: ProductStatus // ACTIVE: Đang kinh doanh | DISCONTINUED: Ngừng kinh doanh
  has_quotes?: boolean // Sản phẩm đã xuất hiện trong báo giá thì không xoá được, chỉ ngừng kinh doanh
  description?: string
  created_at: string
  updated_at: string
}

export interface ProductFilterParams {
  search?: string
  type?: ProductType | ''
  status?: ProductStatus | ''
}
