import type { Product, ProductFilterParams } from '../types/product.ts'

const STORAGE_KEY = 'crm_products_pricing_data'

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    code: 'SP-CRM-PRO',
    name: 'Phần mềm CRM Doanh Nghiệp Pro (Bản quyền vĩnh viễn)',
    type: 'ONE_TIME',
    unit: 'Gói',
    list_price: 35000000,
    floor_price: 28000000,
    cost_price: 15000000,
    status: 'ACTIVE',
    has_quotes: true,
    description: 'Hệ thống quản lý khách hàng trọn gói cho doanh nghiệp 50-200 user',
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'prod-002',
    code: 'DV-CLOUD-STD',
    name: 'Dịch vụ CRM Cloud Tiêu chuẩn (Thuê bao hàng tháng)',
    type: 'SUBSCRIPTION',
    unit: 'User/Tháng',
    list_price: 250000,
    floor_price: 190000,
    cost_price: 100000,
    status: 'ACTIVE',
    has_quotes: true,
    description: 'Gói thuê bao điện toán đám mây trả định kỳ theo tài khoản',
    created_at: '2025-02-01T09:30:00Z',
    updated_at: '2025-02-01T09:30:00Z',
  },
  {
    id: 'prod-003',
    code: 'DV-SETUP-ONPREM',
    name: 'Dịch vụ Cài đặt & Tích hợp On-Premise',
    type: 'ONE_TIME',
    unit: 'Dự án',
    list_price: 15000000,
    floor_price: 12000000,
    cost_price: 6000000,
    status: 'ACTIVE',
    has_quotes: false,
    description: 'Dịch vụ triển khai máy chủ riêng biệt tại văn phòng khách hàng',
    created_at: '2025-02-15T10:00:00Z',
    updated_at: '2025-02-15T10:00:00Z',
  },
  {
    id: 'prod-004',
    code: 'SP-SMS-BRANDNAME',
    name: 'Gói SMS Brandname Chăm sóc khách hàng (10,000 tin)',
    type: 'ONE_TIME',
    unit: 'Gói',
    list_price: 6000000,
    floor_price: 5200000,
    cost_price: 3500000,
    status: 'ACTIVE',
    has_quotes: true,
    description: 'Tin nhắn thương hiệu định danh gửi tự động từ CRM',
    created_at: '2025-03-01T14:00:00Z',
    updated_at: '2025-03-01T14:00:00Z',
  },
  {
    id: 'prod-005',
    code: 'DV-TRAIN-ADV',
    name: 'Khóa đào tạo Quản trị & Vận hành CRM nâng cao',
    type: 'ONE_TIME',
    unit: 'Buổi',
    list_price: 5000000,
    floor_price: 4000000,
    cost_price: 2000000,
    status: 'DISCONTINUED',
    has_quotes: true,
    description: 'Khóa đào tạo chuyên sâu (đã chuyển giao sang hình thức E-learning)',
    created_at: '2025-01-05T08:00:00Z',
    updated_at: '2025-03-20T16:00:00Z',
  },
  {
    id: 'prod-006',
    code: 'DV-MAINTAIN-YR',
    name: 'Gói Bảo trì & Hỗ trợ kỹ thuật 24/7 (Hàng năm)',
    type: 'SUBSCRIPTION',
    unit: 'Năm',
    list_price: 18000000,
    floor_price: 15000000,
    cost_price: 7000000,
    status: 'ACTIVE',
    has_quotes: false,
    description: 'Cam kết SLA 99.9%, hỗ trợ kỹ thuật trực tiếp không giới hạn',
    created_at: '2025-03-25T11:00:00Z',
    updated_at: '2025-03-25T11:00:00Z',
  },
]

function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS))
  return INITIAL_PRODUCTS
}

function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export const productService = {
  getProducts(params?: ProductFilterParams): Product[] {
    let list = getStoredProducts()
    if (params?.search) {
      const q = params.search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }
    if (params?.type) {
      list = list.filter((p) => p.type === params.type)
    }
    if (params?.status) {
      list = list.filter((p) => p.status === params.status)
    }
    return list
  },

  createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const list = getStoredProducts()
    const newProd: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    list.unshift(newProd)
    saveProducts(list)
    return newProd
  },

  updateProduct(id: string, data: Partial<Product>): Product {
    const list = getStoredProducts()
    const index = list.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Không tìm thấy sản phẩm!')
    list[index] = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    }
    saveProducts(list)
    return list[index]
  },

  deleteProduct(id: string): { success: boolean; message?: string } {
    const list = getStoredProducts()
    const product = list.find((p) => p.id === id)
    if (!product) throw new Error('Không tìm thấy sản phẩm!')
    if (product.has_quotes) {
      throw new Error(
        'Sản phẩm đã xuất hiện trong báo giá của hệ thống! Không thể xóa, chỉ được chuyển sang trạng thái "Ngừng kinh doanh".'
      )
    }
    const filtered = list.filter((p) => p.id !== id)
    saveProducts(filtered)
    return { success: true, message: 'Đã xóa sản phẩm thành công!' }
  },

  toggleDiscontinue(id: string): Product {
    const list = getStoredProducts()
    const index = list.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Không tìm thấy sản phẩm!')
    const nextStatus = list[index].status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE'
    list[index].status = nextStatus
    list[index].updated_at = new Date().toISOString()
    saveProducts(list)
    return list[index]
  },
}
