import type { WinLossReason, WinLossType, Competitor } from '../types/winLossCompetitor.ts'

const STORAGE_REASONS_KEY = 'crm_win_loss_reasons_data'
const STORAGE_COMPETITORS_KEY = 'crm_competitors_data'

const INITIAL_REASONS: WinLossReason[] = [
  // 1. Lý do Thắng (WIN_REASON)
  { id: 'rs-win-1', type: 'WIN_REASON', code: 'WIN-PRICE', name: 'Giá cả cạnh tranh & Chính sách chiết khấu tốt', is_active: true, sort_order: 1 },
  { id: 'rs-win-2', type: 'WIN_REASON', code: 'WIN-FEATURE', name: 'Tính năng phù hợp và đáp ứng đúng bài toán nghiệp vụ', is_active: true, sort_order: 2 },
  { id: 'rs-win-3', type: 'WIN_REASON', code: 'WIN-SUPPORT', name: 'Đội ngũ tư vấn nhiệt tình, chăm sóc hỗ trợ nhanh', is_active: true, sort_order: 3 },
  { id: 'rs-win-4', type: 'WIN_REASON', code: 'WIN-RELATION', name: 'Mối quan hệ tin cậy sẵn có với ban lãnh đạo', is_active: true, sort_order: 4 },

  // 2. Lý do Thua (LOSS_REASON)
  { id: 'rs-loss-1', type: 'LOSS_REASON', code: 'LOSS-PRICE', name: 'Giá cao hơn ngân sách dự kiến của khách', is_active: true, sort_order: 1 },
  { id: 'rs-loss-2', type: 'LOSS_REASON', code: 'LOSS-COMPETITOR', name: 'Thua đối thủ cạnh tranh có thương hiệu mạnh hơn', is_active: true, sort_order: 2 },
  { id: 'rs-loss-3', type: 'LOSS_REASON', code: 'LOSS-TIMING', name: 'Khách hàng hoãn kế hoạch / Chưa có nhu cầu cấp bách', is_active: true, sort_order: 3 },
  { id: 'rs-loss-4', type: 'LOSS_REASON', code: 'LOSS-FEATURE', name: 'Thiếu tính năng chuyên biệt mà khách yêu cầu', is_active: true, sort_order: 4 },
  { id: 'rs-loss-5', type: 'LOSS_REASON', code: 'LOSS-LEADERSHIP', name: 'Khách hàng thay đổi nhân sự / Ban lãnh đạo mới hủy dự án', is_active: true, sort_order: 5 },
]

const INITIAL_COMPETITORS: Competitor[] = [
  {
    id: 'comp-1',
    code: 'CP-SALESFORCE',
    name: 'Salesforce CRM',
    website: 'https://salesforce.com',
    strengths: 'Hệ sinh thái toàn cầu, tính năng tùy biến mạnh mẽ, bảo mật cấp doanh nghiệp lớn',
    weaknesses: 'Chi phí cực cao, khó triển khai cho SME, giao diện phức tạp bằng tiếng Anh',
    price_segment: 'HIGH',
    is_active: true,
  },
  {
    id: 'comp-2',
    code: 'CP-MISA',
    name: 'MISA AMIS CRM',
    website: 'https://amis.misa.vn',
    strengths: 'Tích hợp sâu hóa đơn điện tử & kế toán MISA, thương hiệu nội địa phổ biến',
    weaknesses: 'Tính năng báo cáo nâng cao và automation chưa thực sự linh hoạt',
    price_segment: 'MEDIUM',
    is_active: true,
  },
  {
    id: 'comp-3',
    code: 'CP-GETFLY',
    name: 'GetFly CRM',
    website: 'https://getfly.vn',
    strengths: 'Chi phí hợp lý, tập trung tốt vào SME và marketing automation cơ bản',
    weaknesses: 'Khó mở rộng quy mô cho tập đoàn, khả năng phân quyền đa cấp hạn chế',
    price_segment: 'LOW',
    is_active: true,
  },
]

function getStoredReasons(): WinLossReason[] {
  try {
    const raw = localStorage.getItem(STORAGE_REASONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_REASONS_KEY, JSON.stringify(INITIAL_REASONS))
  return INITIAL_REASONS
}

function getStoredCompetitors(): Competitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMPETITORS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_COMPETITORS_KEY, JSON.stringify(INITIAL_COMPETITORS))
  return INITIAL_COMPETITORS
}

export const winLossService = {
  getReasons(type?: WinLossType): WinLossReason[] {
    const list = getStoredReasons()
    const filtered = type ? list.filter((r) => r.type === type) : list
    return filtered.sort((a, b) => a.sort_order - b.sort_order)
  },

  createReason(data: Omit<WinLossReason, 'id' | 'sort_order'>): WinLossReason {
    const list = getStoredReasons()
    const newReason: WinLossReason = {
      ...data,
      id: `rs-${Date.now()}`,
      sort_order: list.filter((r) => r.type === data.type).length + 1,
    }
    list.push(newReason)
    localStorage.setItem(STORAGE_REASONS_KEY, JSON.stringify(list))
    return newReason
  },

  updateReason(id: string, data: Partial<WinLossReason>): WinLossReason {
    const list = getStoredReasons()
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Không tìm thấy lý do')
    list[idx] = { ...list[idx], ...data }
    localStorage.setItem(STORAGE_REASONS_KEY, JSON.stringify(list))
    return list[idx]
  },

  deleteReason(id: string): void {
    const list = getStoredReasons()
    const filtered = list.filter((r) => r.id !== id)
    localStorage.setItem(STORAGE_REASONS_KEY, JSON.stringify(filtered))
  },

  // Competitor APIs
  getCompetitors(): Competitor[] {
    return getStoredCompetitors()
  },

  createCompetitor(data: Omit<Competitor, 'id'>): Competitor {
    const list = getStoredCompetitors()
    const newComp: Competitor = {
      ...data,
      id: `comp-${Date.now()}`,
    }
    list.push(newComp)
    localStorage.setItem(STORAGE_COMPETITORS_KEY, JSON.stringify(list))
    return newComp
  },

  updateCompetitor(id: string, data: Partial<Competitor>): Competitor {
    const list = getStoredCompetitors()
    const idx = list.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Không tìm thấy đối thủ')
    list[idx] = { ...list[idx], ...data }
    localStorage.setItem(STORAGE_COMPETITORS_KEY, JSON.stringify(list))
    return list[idx]
  },

  deleteCompetitor(id: string): void {
    const list = getStoredCompetitors()
    const filtered = list.filter((c) => c.id !== id)
    localStorage.setItem(STORAGE_COMPETITORS_KEY, JSON.stringify(filtered))
  },
}
