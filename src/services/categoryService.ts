import type { SalesCategoryItem, SalesCategoryType } from '../types/category.ts'

const STORAGE_KEY = 'crm_sales_categories_data'

const INITIAL_CATEGORIES: SalesCategoryItem[] = [
  // 1. Ngành nghề khách hàng (INDUSTRY)
  { id: 'cat-ind-1', type: 'INDUSTRY', code: 'NN-IT', name: 'Công nghệ thông tin & Viễn thông', sort_order: 1, is_referenced: true, reference_count: 8, color: '#2563eb' },
  { id: 'cat-ind-2', type: 'INDUSTRY', code: 'NN-FIN', name: 'Tài chính - Ngân hàng - Bảo hiểm', sort_order: 2, is_referenced: true, reference_count: 5, color: '#16a34a' },
  { id: 'cat-ind-3', type: 'INDUSTRY', code: 'NN-MFG', name: 'Sản xuất & Chế tạo công nghiệp', sort_order: 3, is_referenced: true, reference_count: 3, color: '#d97706' },
  { id: 'cat-ind-4', type: 'INDUSTRY', code: 'NN-RE', name: 'Bất động sản & Xây dựng', sort_order: 4, is_referenced: false, reference_count: 0, color: '#9333ea' },
  { id: 'cat-ind-5', type: 'INDUSTRY', code: 'NN-FMCG', name: 'Hàng tiêu dùng nhanh & Bán lẻ', sort_order: 5, is_referenced: false, reference_count: 0, color: '#0891b2' },

  // 2. Quy mô doanh nghiệp (COMPANY_SIZE)
  { id: 'cat-size-1', type: 'COMPANY_SIZE', code: 'QM-MICRO', name: 'Dưới 10 nhân sự (Siêu nhỏ)', sort_order: 1, is_referenced: true, reference_count: 4 },
  { id: 'cat-size-2', type: 'COMPANY_SIZE', code: 'QM-SMALL', name: '10 - 50 nhân sự (Doanh nghiệp nhỏ)', sort_order: 2, is_referenced: true, reference_count: 6 },
  { id: 'cat-size-3', type: 'COMPANY_SIZE', code: 'QM-MED', name: '50 - 200 nhân sự (Quy mô vừa)', sort_order: 3, is_referenced: true, reference_count: 3 },
  { id: 'cat-size-4', type: 'COMPANY_SIZE', code: 'QM-ENT', name: 'Trên 200 nhân sự (Tập đoàn lớn)', sort_order: 4, is_referenced: false, reference_count: 0 },

  // 3. Nguồn Lead (LEAD_SOURCE)
  { id: 'cat-src-1', type: 'LEAD_SOURCE', code: 'NG-WEB', name: 'Website & Đăng ký Form', sort_order: 1, is_referenced: true, reference_count: 12 },
  { id: 'cat-src-2', type: 'LEAD_SOURCE', code: 'NG-FB', name: 'Facebook Ads / Fanpage', sort_order: 2, is_referenced: true, reference_count: 7 },
  { id: 'cat-src-3', type: 'LEAD_SOURCE', code: 'NG-REF', name: 'Khách hàng cũ giới thiệu', sort_order: 3, is_referenced: true, reference_count: 5 },
  { id: 'cat-src-4', type: 'LEAD_SOURCE', code: 'NG-WORK', name: 'Hội thảo / Triển lãm ngành', sort_order: 4, is_referenced: false, reference_count: 0 },
  { id: 'cat-src-5', type: 'LEAD_SOURCE', code: 'NG-COLD', name: 'Telesale & Data tự tìm', sort_order: 5, is_referenced: false, reference_count: 0 },

  // 4. Loại hoạt động (ACTIVITY_TYPE)
  { id: 'cat-act-1', type: 'ACTIVITY_TYPE', code: 'HD-CALL', name: 'Cuộc gọi điện thoại tư vấn', sort_order: 1, is_referenced: true, reference_count: 25 },
  { id: 'cat-act-2', type: 'ACTIVITY_TYPE', code: 'HD-MEET', name: 'Gặp gỡ trực tiếp khách hàng', sort_order: 2, is_referenced: true, reference_count: 14 },
  { id: 'cat-act-3', type: 'ACTIVITY_TYPE', code: 'HD-EMAIL', name: 'Gửi Email báo giá & Brochure', sort_order: 3, is_referenced: true, reference_count: 9 },
  { id: 'cat-act-4', type: 'ACTIVITY_TYPE', code: 'HD-DEMO', name: 'Demo thuyết trình giải pháp', sort_order: 4, is_referenced: false, reference_count: 0 },
]

function getStored(): SalesCategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES))
  return INITIAL_CATEGORIES
}

function saveStored(items: SalesCategoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const categoryService = {
  getCategories(type?: SalesCategoryType): SalesCategoryItem[] {
    const list = getStored()
    const filtered = type ? list.filter((c) => c.type === type) : list
    return filtered.sort((a, b) => a.sort_order - b.sort_order)
  },

  addCategory(item: Omit<SalesCategoryItem, 'id' | 'is_referenced' | 'reference_count'>): SalesCategoryItem {
    const list = getStored()
    const newItem: SalesCategoryItem = {
      ...item,
      id: `cat-${Date.now()}`,
      is_referenced: false,
      reference_count: 0,
    }
    list.push(newItem)
    saveStored(list)
    return newItem
  },

  updateCategory(id: string, data: Partial<SalesCategoryItem>): SalesCategoryItem {
    const list = getStored()
    const idx = list.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Không tìm thấy danh mục')
    list[idx] = { ...list[idx], ...data }
    saveStored(list)
    return list[idx]
  },

  deleteCategory(id: string): { success: boolean; message?: string } {
    const list = getStored()
    const item = list.find((c) => c.id === id)
    if (!item) throw new Error('Không tìm thấy danh mục')
    // Tiêu chí chấp nhận S2-07: Giá trị đang được tham chiếu thì không xoá được
    if (item.is_referenced && (item.reference_count || 0) > 0) {
      throw new Error(
        `Danh mục "${item.name}" đang được tham chiếu trong ${item.reference_count} bản ghi dữ liệu khách hàng/hoạt động! Không thể xóa.`
      )
    }
    const filtered = list.filter((c) => c.id !== id)
    saveStored(filtered)
    return { success: true, message: 'Đã xóa danh mục thành công' }
  },

  reorder(type: SalesCategoryType, fromIdx: number, toIdx: number): SalesCategoryItem[] {
    const list = getStored()
    const itemsOfType = list.filter((c) => c.type === type).sort((a, b) => a.sort_order - b.sort_order)
    if (fromIdx < 0 || fromIdx >= itemsOfType.length || toIdx < 0 || toIdx >= itemsOfType.length) return itemsOfType

    const [moved] = itemsOfType.splice(fromIdx, 1)
    itemsOfType.splice(toIdx, 0, moved)

    // Cập nhật lại sort_order
    itemsOfType.forEach((item, index) => {
      item.sort_order = index + 1
      const mainIdx = list.findIndex((m) => m.id === item.id)
      if (mainIdx !== -1) list[mainIdx].sort_order = index + 1
    })

    saveStored(list)
    return itemsOfType
  },
}
