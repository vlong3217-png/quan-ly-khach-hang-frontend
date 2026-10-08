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
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001',
    code: 'CAMP-001',
    name: 'Chiến dịch Q4 Chuyển đổi số Doanh nghiệp 2026',
    channel: 'FACEBOOK',
    budget: 50000000,
    actual_cost: 32500000,
    start_date: '2026-09-01',
    end_date: '2026-11-30',
    status: 'ACTIVE',
    target_leads: 80,
    actual_leads: 42,
    converted_leads: 8,
    revenue_generated: 180000000,
    description: 'Chạy quảng cáo Facebook Lead Form nhắm đến các chủ doanh nghiệp vừa và nhỏ ngành IT, Bán lẻ.',
    created_at: '2026-08-25T08:00:00Z',
    updated_at: '2026-10-05T10:00:00Z',
  },
  {
    id: 'camp-002',
    code: 'CAMP-002',
    name: 'Quảng cáo Google Search Khách hàng Doanh nghiệp B2B',
    channel: 'GOOGLE',
    budget: 40000000,
    actual_cost: 28000000,
    start_date: '2026-09-15',
    end_date: '2026-10-31',
    status: 'ACTIVE',
    target_leads: 50,
    actual_leads: 28,
    converted_leads: 6,
    revenue_generated: 135000000,
    description: 'Đấu thầu từ khóa liên quan đến "phần mềm CRM", "quản lý khách hàng doanh nghiệp", "CRM B2B".',
    created_at: '2026-09-10T09:00:00Z',
    updated_at: '2026-10-06T14:30:00Z',
  },
  {
    id: 'camp-003',
    code: 'CAMP-003',
    name: 'Hội thảo Triển lãm Công nghệ Chuyển đổi số VietBuild',
    channel: 'EVENT',
    budget: 35000000,
    actual_cost: 34800000,
    start_date: '2026-08-10',
    end_date: '2026-08-15',
    status: 'COMPLETED',
    target_leads: 60,
    actual_leads: 45,
    converted_leads: 11,
    revenue_generated: 260000000,
    description: 'Gian hàng giới thiệu phần mềm và thu thập danh thiếp, quét mã QR đăng ký dùng thử tại hội chợ.',
    created_at: '2026-07-20T10:00:00Z',
    updated_at: '2026-08-20T16:00:00Z',
  },
  {
    id: 'camp-004',
    code: 'CAMP-004',
    name: 'Email Marketing Nurturing Khách hàng cũ & Dùng thử',
    channel: 'EMAIL',
    budget: 12000000,
    actual_cost: 7500000,
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    status: 'COMPLETED',
    target_leads: 30,
    actual_leads: 22,
    converted_leads: 5,
    revenue_generated: 95000000,
    description: 'Chuỗi email tự động 5 bước cung cấp cẩm nang và case study khách hàng thành công.',
    created_at: '2026-06-25T11:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
  },
]

function getStoredCampaigns(): Campaign[] {
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
   * Lấy danh sách toàn bộ Chiến dịch
   */
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          saveStoredCampaigns(data)
          return data
        }
      }
    } catch {}
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
        if (data && data.id) return data
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

    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      code: newCode,
      name: payload.name.trim(),
      channel: payload.channel,
      budget: Number(payload.budget) || 0,
      actual_cost: Number(payload.actual_cost) || 0,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status || 'PLANNING',
      target_leads: Number(payload.target_leads) || 0,
      actual_leads: 0,
      converted_leads: 0,
      revenue_generated: 0,
      description: payload.description?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCampaign),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const updated = [data, ...campaigns]
          saveStoredCampaigns(updated)
          return data
        }
      }
    } catch {}

    const updated = [newCampaign, ...campaigns]
    saveStoredCampaigns(updated)
    return newCampaign
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
          campaigns[index] = data
          saveStoredCampaigns(campaigns)
          return data
        }
      }
    } catch {}

    campaigns[index] = updatedCampaign
    saveStoredCampaigns(campaigns)
    return updatedCampaign
  },

  /**
   * Xóa chiến dịch
   */
  async deleteCampaign(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

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
