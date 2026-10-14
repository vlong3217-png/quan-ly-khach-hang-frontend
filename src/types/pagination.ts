/**
 * Định dạng phân trang chuẩn từ Backend cho toàn bộ API danh sách
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

/**
 * Tham số phân trang gửi lên Backend
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Helper chuẩn hóa response từ Backend:
 * - Hỗ trợ format mới: { items, total, page, limit, total_pages }
 * - Hỗ trợ fallback: mảng thô [ ... ]
 * - Hỗ trợ các format bọc khác: { data: [ ... ], total }, { users: [ ... ], total }, v.v.
 */
export function normalizePaginatedResponse<T>(
  raw: any,
  defaultPage = 1,
  defaultLimit = 10
): PaginatedResponse<T> {
  if (!raw) {
    return {
      items: [],
      total: 0,
      page: defaultPage,
      limit: defaultLimit,
      total_pages: 0,
    }
  }

  // 1. Backend format mới
  if (Array.isArray(raw.items)) {
    const total = typeof raw.total === 'number' ? raw.total : raw.items.length
    const page = typeof raw.page === 'number' ? raw.page : defaultPage
    const limit = typeof raw.limit === 'number' ? raw.limit : (typeof raw.page_size === 'number' ? raw.page_size : defaultLimit)
    const total_pages = typeof raw.total_pages === 'number' ? raw.total_pages : Math.max(1, Math.ceil(total / (limit || 1)))
    return {
      items: raw.items,
      total,
      page,
      limit,
      total_pages,
    }
  }

  // 2. Format mảng trực tiếp [...]
  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
      page: defaultPage,
      limit: defaultLimit,
      total_pages: Math.max(1, Math.ceil(raw.length / (defaultLimit || 1))),
    }
  }

  // 3. Format bọc data / results / users / logs
  const candidateArray = raw.data || raw.results || raw.users || raw.leads || raw.opportunities || []
  if (Array.isArray(candidateArray)) {
    const total = typeof raw.total === 'number' ? raw.total : candidateArray.length
    const page = typeof raw.page === 'number' ? raw.page : defaultPage
    const limit = typeof raw.limit === 'number' ? raw.limit : defaultLimit
    const total_pages = typeof raw.total_pages === 'number'
      ? raw.total_pages
      : (typeof raw.totalPages === 'number' ? raw.totalPages : Math.max(1, Math.ceil(total / (limit || 1))))
    return {
      items: candidateArray,
      total,
      page,
      limit,
      total_pages,
    }
  }

  return {
    items: [],
    total: 0,
    page: defaultPage,
    limit: defaultLimit,
    total_pages: 0,
  }
}
