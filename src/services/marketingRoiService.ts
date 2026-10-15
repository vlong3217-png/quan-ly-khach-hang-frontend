import * as XLSX from 'xlsx'
import type {
  LeadSourceMetrics,
  CampaignRoiMetrics,
  MarketingRoiSummary,
  MarketingRoiFilter,
} from '../types/marketingRoiReport.ts'

const STORAGE_KEY_SOURCES = 'crm_lead_source_metrics_v1'
const STORAGE_KEY_CAMPAIGNS = 'crm_campaign_roi_metrics_v1'

const INITIAL_SOURCES: LeadSourceMetrics[] = [
  {
    source_id: 'src-web',
    source_name: 'Website & Form Đăng Ký',
    total_leads: 184,
    received_leads: 172,
    received_rate: 93.5,
    converted_opportunities: 58,
    conversion_rate: 31.5,
    total_pipeline_value: 2320000000,
    won_revenue: 1450000000,
    avg_deal_size: 25000000,
  },
  {
    source_id: 'src-google',
    source_name: 'Google Search Ads',
    total_leads: 240,
    received_leads: 216,
    received_rate: 90.0,
    converted_opportunities: 62,
    conversion_rate: 25.8,
    total_pipeline_value: 2950000000,
    won_revenue: 1680000000,
    avg_deal_size: 27000000,
  },
  {
    source_id: 'src-fb',
    source_name: 'Facebook & Social Ads',
    total_leads: 195,
    received_leads: 165,
    received_rate: 84.6,
    converted_opportunities: 39,
    conversion_rate: 20.0,
    total_pipeline_value: 1420000000,
    won_revenue: 690000000,
    avg_deal_size: 17600000,
  },
  {
    source_id: 'src-webinar',
    source_name: 'Webinar & Hội Thảo Online',
    total_leads: 110,
    received_leads: 105,
    received_rate: 95.5,
    converted_opportunities: 44,
    conversion_rate: 40.0,
    total_pipeline_value: 2100000000,
    won_revenue: 1320000000,
    avg_deal_size: 30000000,
  },
  {
    source_id: 'src-referral',
    source_name: 'Khách Hàng Giới Thiệu (Referral)',
    total_leads: 65,
    received_leads: 65,
    received_rate: 100.0,
    converted_opportunities: 38,
    conversion_rate: 58.5,
    total_pipeline_value: 2450000000,
    won_revenue: 1850000000,
    avg_deal_size: 48600000,
  },
  {
    source_id: 'src-expo',
    source_name: 'Triển Lãm & Sự Kiện Trực Tiếp',
    total_leads: 85,
    received_leads: 78,
    received_rate: 91.8,
    converted_opportunities: 26,
    conversion_rate: 30.6,
    total_pipeline_value: 1200000000,
    won_revenue: 620000000,
    avg_deal_size: 23800000,
  },
]

const INITIAL_CAMPAIGNS: CampaignRoiMetrics[] = [
  {
    campaign_id: 'cmp-01',
    campaign_name: 'Chiến dịch Thu 2026 - Giải Pháp CRM Đa Kênh',
    channel: 'Google + Website + Email',
    budget: 150000000,
    actual_cost: 142000000,
    total_leads: 165,
    received_leads: 155,
    received_rate: 93.9,
    converted_opportunities: 52,
    conversion_rate: 31.5,
    won_revenue: 1850000000,
    roi_percentage: 1202.8, // ((1850 - 142) / 142) * 100
  },
  {
    campaign_id: 'cmp-02',
    campaign_name: 'Webinar Chuyển Đổi Số Bán Hàng Q4',
    channel: 'Zoom + Facebook Live',
    budget: 50000000,
    actual_cost: 45000000,
    total_leads: 110,
    received_leads: 105,
    received_rate: 95.5,
    converted_opportunities: 44,
    conversion_rate: 40.0,
    won_revenue: 1320000000,
    roi_percentage: 2833.3,
  },
  {
    campaign_id: 'cmp-03',
    campaign_name: 'Facebook Lead Gen B2B Doanh Nghiệp Vừa & Nhỏ',
    channel: 'Facebook Ads',
    budget: 80000000,
    actual_cost: 78000000,
    total_leads: 145,
    received_leads: 122,
    received_rate: 84.1,
    converted_opportunities: 28,
    conversion_rate: 19.3,
    won_revenue: 480000000,
    roi_percentage: 515.4,
  },
  {
    campaign_id: 'cmp-04',
    campaign_name: 'Google Ads Search từ khoá phần mềm quản lý',
    channel: 'Google Search',
    budget: 120000000,
    actual_cost: 115000000,
    total_leads: 190,
    received_leads: 175,
    received_rate: 92.1,
    converted_opportunities: 48,
    conversion_rate: 25.3,
    won_revenue: 1420000000,
    roi_percentage: 1134.8,
  },
]

export const marketingRoiService = {
  getSources(filter?: MarketingRoiFilter): LeadSourceMetrics[] {
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
