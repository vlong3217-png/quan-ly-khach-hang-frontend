import type { Product, ProductFilterParams, ProductStatus } from '../types/product.ts'
import { API_BASE_URL } from './authService.ts'

const STORAGE_KEY = 'crm_products_pricing_data_v2'

function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

async function parseErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    if (data.message && typeof data.message === 'string') return data.message
  } catch {}
  return defaultMessage
}

function mapBackendToProduct(b: any): Product {
  return {
    id: String(b.id),
    code: b.code || '',
    name: b.name || '',
    type: b.product_type || b.type || 'ONE_TIME',
    unit: b.unit || 'Gói',
    list_price: Number(b.list_price || 0),
    floor_price: Number(b.floor_price || 0),
    cost_price: b.cost_price != null ? Number(b.cost_price) : undefined,
    status: (b.status || 'ACTIVE') as ProductStatus,
    has_quotes: Boolean(b.has_quotes),
    description: b.description || '',
    created_at: b.created_at || new Date().toISOString(),
    updated_at: b.updated_at || b.created_at || new Date().toISOString(),
  }
}

function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: Product[] = JSON.parse(raw)
      return parsed
    }
  } catch {}
  return []
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

  async fetchProducts(params?: ProductFilterParams): Promise<Product[]> {
    try {
      const query = new URLSearchParams()
      query.set('limit', '100')
      if (params?.search) query.set('search', params.search)
      if (params?.type) query.set('product_type', params.type)
      if (params?.status) query.set('status', params.status)

      const response = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        const rawList = Array.isArray(data) ? data : data.products || []
        const mapped = rawList.map(mapBackendToProduct)
        saveProducts(mapped)
        return mapped
      }
    } catch (err) {
      console.warn('Lỗi kết nối tải danh mục sản phẩm từ máy chủ:', err)
    }

    return this.getProducts(params)
  },

  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const backendPayload: Record<string, any> = {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      product_type: data.type,
      unit: data.unit.trim(),
      list_price: Number(data.list_price),
      floor_price: Number(data.floor_price),
      cost_price: data.cost_price != null ? Number(data.cost_price) : undefined,
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload),
    })

    if (!response.ok) {
      const msg = await parseErrorMessage(response, 'Lỗi khi tạo mới sản phẩm trên hệ thống.')
      throw new Error(msg)
    }

    const created = await response.json()
    const mapped = mapBackendToProduct(created)

    const list = getStoredProducts()
    const updated = [mapped, ...list.filter((p) => p.id !== mapped.id)]
    saveProducts(updated)
    return mapped
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const numericId = parseInt(id, 10)
    const backendPayload: Record<string, any> = {}

    if (data.name !== undefined) backendPayload.name = data.name.trim()
    if (data.type !== undefined) backendPayload.product_type = data.type
    if (data.unit !== undefined) backendPayload.unit = data.unit.trim()
    if (data.list_price !== undefined) backendPayload.list_price = Number(data.list_price)
    if (data.floor_price !== undefined) backendPayload.floor_price = Number(data.floor_price)
    if (data.cost_price !== undefined) backendPayload.cost_price = Number(data.cost_price)
    if (data.status !== undefined) backendPayload.status = data.status

    if (!isNaN(numericId) && numericId > 0) {
      const response = await fetch(`${API_BASE_URL}/products/${numericId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendPayload),
      })

      if (!response.ok) {
        const msg = await parseErrorMessage(response, 'Lỗi khi cập nhật sản phẩm trên hệ thống.')
        throw new Error(msg)
      }

      const updated = await response.json()
      const mapped = mapBackendToProduct(updated)

      const list = getStoredProducts()
      const idx = list.findIndex((p) => p.id === id)
      if (idx !== -1) {
        list[idx] = mapped
      } else {
        list.unshift(mapped)
      }
      saveProducts(list)
      return mapped
    }

    // Fallback nếu id là chuỗi local
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

  async deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
    const numericId = parseInt(id, 10)
    if (!isNaN(numericId) && numericId > 0) {
      const response = await fetch(`${API_BASE_URL}/products/${numericId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const msg = await parseErrorMessage(response, 'Lỗi khi xóa sản phẩm trên hệ thống.')
        throw new Error(msg)
      }
    }

    const list = getStoredProducts().filter((p) => p.id !== id)
    saveProducts(list)
    return { success: true, message: 'Đã xóa sản phẩm thành công!' }
  },

  async toggleDiscontinue(id: string): Promise<Product> {
    const list = getStoredProducts()
    const index = list.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Không tìm thấy sản phẩm!')
    const nextStatus: ProductStatus = list[index].status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE'

    return this.updateProduct(id, { status: nextStatus })
  },
}
