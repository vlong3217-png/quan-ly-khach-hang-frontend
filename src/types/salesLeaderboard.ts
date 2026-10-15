export interface LeaderboardEntry {
  rank: number
  user_id: number
  user_name: string
  team_id: number
  team_name: string
  role: string
  closed_revenue: number // Doanh số đã chốt
  personal_quota: number // Chỉ tiêu cá nhân
  achievement_rate: number // % đạt chỉ tiêu
  won_deals_count: number
  badge?: 'TOP_1' | 'TOP_2' | 'TOP_3' | 'OVER_100' | 'NORMAL'
}

export interface LeaderboardConfig {
  is_enabled: boolean // Bật/tắt tính năng ở cấp cấu hình
  updated_at: string
  updated_by: string
}
