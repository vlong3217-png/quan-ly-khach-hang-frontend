import type { Product, ProductFilterParams } from '../types/product.ts'

const STORAGE_KEY = 'crm_products_pricing_data_v2'

const INITIAL_PRODUCTS: Product[] = []

function getStoredProducts(): Product[] {
  try {
    localStorage.removeItem('crm_products_pricing_data')
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: Product[] = JSON.parse(raw)
      // Tự động chuẩn hóa các mã sản phẩm sang định dạng SP-...
      const updated = parsed.map((p, idx) => {
        if (/^\d+$/.test(p.code)) {
          const num = parseInt(p.code, 10)
          const seq = num >= 1000 ? num - 1000 : num
          return { ...p, code: `SP-${String(seq).padStart(3, '0')}` }
        }
        if (!p.code.startsWith('SP-')) {
          return { ...p, code: `SP-${String(idx + 1).padStart(3, '0')}` }
        }
        return p
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    }
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
