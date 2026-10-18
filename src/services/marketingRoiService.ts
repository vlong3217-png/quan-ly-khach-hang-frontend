import * as XLSX from 'xlsx'
import type {
  LeadSourceMetrics,
  CampaignRoiMetrics,
  MarketingRoiSummary,
  MarketingRoiFilter,
} from '../types/marketingRoiReport.ts'

const STORAGE_KEY_SOURCES = 'crm_lead_source_metrics_v2'
const STORAGE_KEY_CAMPAIGNS = 'crm_campaign_roi_metrics_v2'

const INITIAL_SOURCES: LeadSourceMetrics[] = []

const INITIAL_CAMPAIGNS: CampaignRoiMetrics[] = []

export const marketingRoiService = {
  getSources(filter?: MarketingRoiFilter): LeadSourceMetrics[] {
    try {
      localStorage.removeItem('crm_lead_source_metrics_v1')
    } catch {
      // ignore
    }
    const raw = localStorage.getItem(STORAGE_KEY_SOURCES)
    let list: LeadSourceMetrics[] = raw ? JSON.parse(raw) : INITIAL_SOURCES
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(INITIAL_SOURCES))
    }

    if (filter?.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      list = list.filter((s) => s.source_name.toLowerCase().includes(q))
    }

    return list
  },

  getCampaigns(filter?: MarketingRoiFilter): CampaignRoiMetrics[] {
    try {
      localStorage.removeItem('crm_campaign_roi_metrics_v1')
    } catch {
      // ignore
    }
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS)
    let list: CampaignRoiMetrics[] = raw ? JSON.parse(raw) : INITIAL_CAMPAIGNS
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS))
    }

    if (filter?.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.campaign_name.toLowerCase().includes(q) ||
          c.channel.toLowerCase().includes(q)
      )
    }

    return list
  },

  calculateSummary(sources: LeadSourceMetrics[], campaigns: CampaignRoiMetrics[]): MarketingRoiSummary {
    const total_leads = sources.reduce((sum, s) => sum + s.total_leads, 0)
    const total_received_leads = sources.reduce((sum, s) => sum + s.received_leads, 0)
    const total_opportunities = sources.reduce((sum, s) => sum + s.converted_opportunities, 0)
    const total_won_revenue = sources.reduce((sum, s) => sum + s.won_revenue, 0)

    const avg_received_rate =
      total_leads > 0 ? Number(((total_received_leads / total_leads) * 100).toFixed(1)) : 0
    const avg_conversion_rate =
      total_leads > 0 ? Number(((total_opportunities / total_leads) * 100).toFixed(1)) : 0

    const total_cost = campaigns.reduce((sum, c) => sum + c.actual_cost, 0)
    const overall_roi =
      total_cost > 0
        ? Number((((total_won_revenue - total_cost) / total_cost) * 100).toFixed(1))
        : 0

    return {
      total_leads,
      total_received_leads,
      avg_received_rate,
      total_opportunities,
      avg_conversion_rate,
      total_won_revenue,
      total_cost,
      overall_roi,
    }
  },

  exportToExcel(periodLabel: string, filter?: MarketingRoiFilter): void {
    const sources = this.getSources(filter)
    const campaigns = this.getCampaigns(filter)

    // Sheet 1: Hiệu quả theo Nguồn Lead
    const sheet1Data = sources.map((s, idx) => ({
      STT: idx + 1,
      'Nguồn Lead': s.source_name,
      'Số lượng Lead': s.total_leads,
      'Lead được nhận': s.received_leads,
      'Tỷ lệ được nhận (%)': `${s.received_rate}%`,
      'Cơ hội tạo ra': s.converted_opportunities,
      'Tỷ lệ chuyển đổi thành cơ hội (%)': `${s.conversion_rate}%`,
      'Tổng giá trị cơ hội (₫)': s.total_pipeline_value,
      'Doanh thu đã chốt (₫)': s.won_revenue,
      'Giá trị trung bình/deal (₫)': s.avg_deal_size,
    }))

    // Sheet 2: Hiệu quả theo Chiến dịch Marketing
    const sheet2Data = campaigns.map((c, idx) => ({
      STT: idx + 1,
      'Tên chiến dịch': c.campaign_name,
      'Kênh tiếp thị': c.channel,
      'Ngân sách (₫)': c.budget,
      'Chi phí thực tế (₫)': c.actual_cost,
      'Tổng số lead': c.total_leads,
      'Lead được tiếp nhận': c.received_leads,
      'Tỷ lệ tiếp nhận (%)': `${c.received_rate}%`,
      'Cơ hội bán hàng': c.converted_opportunities,
      'Tỷ lệ chuyển đổi cơ hội (%)': `${c.conversion_rate}%`,
      'Doanh thu đã chốt (₫)': c.won_revenue,
      'Tỷ suất lợi nhuận ROI (%)': `${c.roi_percentage}%`,
    }))

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data)
    const ws2 = XLSX.utils.json_to_sheet(sheet2Data)

    XLSX.utils.book_append_sheet(wb, ws1, 'Hiệu Quả Nguồn Lead')
    XLSX.utils.book_append_sheet(wb, ws2, 'Hiệu Quả Chiến Dịch ROI')

    const filename = `Bao_Cao_Nguon_Lead_Va_Chien_Dich_${periodLabel.replace(/\s+/g, '_')}.xlsx`
    XLSX.writeFile(wb, filename)
  },
}
