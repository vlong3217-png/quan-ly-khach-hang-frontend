export interface LeadSourceMetrics {
  source_id: string
  source_name: string
  total_leads: number
  received_leads: number
  received_rate: number // Tỷ lệ được nhận/tiếp nhận (%)
  converted_opportunities: number
  conversion_rate: number // Tỷ lệ chuyển đổi thành cơ hội (%)
  total_pipeline_value: number
  won_revenue: number
  avg_deal_size: number
}

export interface CampaignRoiMetrics {
  campaign_id: string
  campaign_name: string
  channel: string
  budget: number
  actual_cost: number
  total_leads: number
  received_leads: number
  received_rate: number // %
  converted_opportunities: number
  conversion_rate: number // %
  won_revenue: number
  roi_percentage: number // % ((won_revenue - actual_cost) / actual_cost) * 100
}

export interface MarketingRoiSummary {
  total_leads: number
  total_received_leads: number
  avg_received_rate: number
  total_opportunities: number
  avg_conversion_rate: number
  total_won_revenue: number
  total_cost: number
  overall_roi: number
}

export interface MarketingRoiFilter {
  period_preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'YEAR_2026' | 'CUSTOM'
  start_date?: string
  end_date?: string
  search_keyword?: string
}
