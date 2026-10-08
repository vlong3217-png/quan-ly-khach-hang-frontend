export type CampaignChannel =
  | 'FACEBOOK'
  | 'GOOGLE'
  | 'EMAIL'
  | 'EVENT'
  | 'WEBSITE'
  | 'TIKTOK'
  | 'LINKEDIN'
  | 'OTHER'

export type CampaignStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'

export interface Campaign {
  id: string
  code: string
  name: string
  channel: CampaignChannel
  budget: number
  actual_cost: number
  start_date: string
  end_date: string
  status: CampaignStatus
  target_leads: number
  actual_leads: number
  converted_leads: number
  revenue_generated?: number
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateCampaignPayload {
  name: string
  channel: CampaignChannel
  budget: number
  actual_cost?: number
  start_date: string
  end_date: string
  status?: CampaignStatus
  target_leads?: number
  description?: string
}

export interface UpdateCampaignPayload {
  name?: string
  channel?: CampaignChannel
  budget?: number
  actual_cost?: number
  start_date?: string
  end_date?: string
  status?: CampaignStatus
  target_leads?: number
  description?: string
}

export interface CampaignSummaryStats {
  total_campaigns: number
  active_campaigns: number
  total_budget: number
  total_actual_cost: number
  total_leads: number
  total_converted: number
  average_cpl: number // Cost per Lead
  conversion_rate: number // %
  total_revenue: number
}
