import * as XLSX from 'xlsx'
import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  CampaignSummaryStats,
} from '../types/campaign.ts'
import type { Lead } from '../types/lead.ts'
import { API_BASE_URL } from './authService.ts'
import { leadService } from './leadService.ts'
import type { PaginationParams } from '../types/pagination.ts'

const STORAGE_KEY_CAMPAIGNS = 'crm_campaigns_master_data'

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

/* ──────────── Dữ liệu Chiến dịch ban đầu ──────────── */
const INITIAL_CAMPAIGNS: Campaign[] = []

export function getStoredCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS))
  return INITIAL_CAMPAIGNS
}

function saveStoredCampaigns(campaigns: Campaign[]): void {
  localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns))
}

export const campaignService = {
  /**
   * Lấy danh sách toàn bộ Chiến dịch (Hỗ trợ phân trang Backend)
   */
  async getCampaigns(params?: PaginationParams): Promise<Campaign[]> {
    try {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.limit) query.set('limit', String(params.limit))

      const url = `${API_BASE_URL}/campaigns${query.toString() ? '?' + query.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        const items = data.campaigns || data.items || data.data || (Array.isArray(data) ? data : [])
        const mapped = items.map((c: any) => ({
          ...c,
          id: String(c.id),
        }))
        if (!params?.page || params.page === 1) {
          saveStoredCampaigns(mapped)
        }
        return mapped
      }
    } catch (err) {
      console.warn('Lỗi tải chiến dịch từ API:', err)
    }
    return getStoredCampaigns()
  },

  /**
   * Lấy chi tiết chiến dịch
   */
  async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          return { ...data, id: String(data.id) }
        }
      }
    } catch {}
    const list = getStoredCampaigns()
    return list.find((c) => c.id === id) || null
  },

  /**
   * Tạo chiến dịch mới (S4-03)
   */
  async createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
    const campaigns = getStoredCampaigns()
    const nextCodeNumber = campaigns.length + 1
    const newCode = `CAMP-${String(nextCodeNumber).padStart(3, '0')}`

    const startDateIso = payload.start_date.includes('T') ? payload.start_date : `${payload.start_date}T00:00:00`
    const endDateIso = payload.end_date ? (payload.end_date.includes('T') ? payload.end_date : `${payload.end_date}T23:59:59`) : null

    const apiPayload = {
      code: newCode,
      name: payload.name.trim(),
      channel: payload.channel,
      budget: Number(payload.budget) || 0,
      actual_cost: Number(payload.actual_cost) || 0,
      start_date: startDateIso,
      end_date: endDateIso,
      status: payload.status || 'ACTIVE',
      target_leads: Number(payload.target_leads) || 0,
      description: payload.description?.trim() || null,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiPayload),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const mapped: Campaign = {
            ...data,
            id: String(data.id),
          }
          const updated = [mapped, ...campaigns]
          saveStoredCampaigns(updated)
          return mapped
        }
      } else {
        const err = await response.json().catch(() => ({}))
        const msg = err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : 'Lỗi tạo chiến dịch'
        throw new Error(msg)
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err
    }

    const fallbackCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      code: newCode,
      name: payload.name.trim(),
      channel: payload.channel,
      budget: Number(payload.budget) || 0,
      actual_cost: Number(payload.actual_cost) || 0,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status || 'ACTIVE',
      target_leads: Number(payload.target_leads) || 0,
      actual_leads: 0,
      converted_leads: 0,
      revenue_generated: 0,
      description: payload.description?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [fallbackCampaign, ...campaigns]
    saveStoredCampaigns(updated)
    return fallbackCampaign
  },

  /**
   * Cập nhật thông tin chiến dịch
   */
  async updateCampaign(id: string, payload: UpdateCampaignPayload): Promise<Campaign> {
    const campaigns = getStoredCampaigns()
    const index = campaigns.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Không tìm thấy chiến dịch cần sửa')

    const existing = campaigns[index]
    const updatedCampaign: Campaign = {
      ...existing,
      ...payload,
      budget: payload.budget !== undefined ? Number(payload.budget) : existing.budget,
      actual_cost: payload.actual_cost !== undefined ? Number(payload.actual_cost) : existing.actual_cost,
      target_leads: payload.target_leads !== undefined ? Number(payload.target_leads) : existing.target_leads,
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCampaign),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const mapped = { ...data, id: String(data.id) }
          campaigns[index] = mapped
          saveStoredCampaigns(campaigns)
          return mapped
        }
      } else {
        const err = await response.json().catch(() => ({}))
        const msg = err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : 'Lỗi cập nhật chiến dịch'
        throw new Error(msg)
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err
    }

    campaigns[index] = updatedCampaign
    saveStoredCampaigns(campaigns)
    return updatedCampaign
  },

  /**
   * Xóa chiến dịch
   */
  async deleteCampaign(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (err.detail) throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err
    }

    const campaigns = getStoredCampaigns().filter((c) => c.id !== id)
    saveStoredCampaigns(campaigns)
  },

  /**
   * Lấy danh sách Lead thuộc một chiến dịch cụ thể (S4-03)
   */
  async getLeadsByCampaign(campaignId: string): Promise<Lead[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/leads`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) return data
      }
    } catch {}

    // Fallback: Lọc từ danh sách Lead chung
    const allLeads = await leadService.getLeads()
    return allLeads.filter((l) => l.campaign_id === campaignId)
  },

  /**
   * Tính toán thống kê hiệu quả chiến dịch tổng thể
   */
  async getCampaignStats(): Promise<CampaignSummaryStats> {
    const list = await this.getCampaigns()
    const total_campaigns = list.length
    const active_campaigns = list.filter((c) => c.status === 'ACTIVE').length
    const total_budget = list.reduce((sum, c) => sum + c.budget, 0)
    const total_actual_cost = list.reduce((sum, c) => sum + c.actual_cost, 0)
    const total_leads = list.reduce((sum, c) => sum + c.actual_leads, 0)
    const total_converted = list.reduce((sum, c) => sum + c.converted_leads, 0)
    const total_revenue = list.reduce((sum, c) => sum + (c.revenue_generated || 0), 0)

    const average_cpl = total_leads > 0 ? Math.round(total_actual_cost / total_leads) : 0
    const conversion_rate = total_leads > 0 ? Number(((total_converted / total_leads) * 100).toFixed(1)) : 0

    return {
      total_campaigns,
      active_campaigns,
      total_budget,
      total_actual_cost,
      total_leads,
      total_converted,
      average_cpl,
      conversion_rate,
      total_revenue,
    }
  },

  /**
   * Xuất danh sách Lead của một chiến dịch ra file Excel
   */
  exportCampaignLeadsToExcel(campaign: Campaign, leads: Lead[]): void {
    const data = leads.map((l, idx) => ({
      'STT': idx + 1,
      'Mã Lead': l.code,
      'Họ và tên': l.full_name,
      'Email': l.email,
      'Số điện thoại': l.phone,
      'Công ty': l.company,
      'Trạng thái': l.status,
      'Chiến dịch': campaign.name,
      'Kênh': campaign.channel,
      'Nhu cầu': l.requirement || '',
      'Ngày tiếp nhận': new Date(l.created_at).toLocaleDateString('vi-VN'),
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads_Chien_Dich')
    XLSX.writeFile(workbook, `Leads_${campaign.code}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  },
}
