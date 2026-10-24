import type { WinLossReason, WinLossType, Competitor } from '../types/winLossCompetitor.ts'

const STORAGE_REASONS_KEY = 'crm_win_loss_reasons_data'
const STORAGE_COMPETITORS_KEY = 'crm_competitors_data'

function getStoredReasons(): WinLossReason[] {
  try {
    const raw = localStorage.getItem(STORAGE_REASONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function getStoredCompetitors(): Competitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMPETITORS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export const winLossService = {
  clearAllData(): void {
    localStorage.removeItem(STORAGE_REASONS_KEY)
    localStorage.removeItem(STORAGE_COMPETITORS_KEY)
  },

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
