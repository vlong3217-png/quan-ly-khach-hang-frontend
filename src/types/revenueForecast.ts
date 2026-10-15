export type ForecastViewLevel = 'COMPANY' | 'TEAM' | 'MEMBER'

export type ForecastReportPeriod =
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'NEXT_QUARTER'
  | 'YEAR_2026'

export interface ForecastComparisonItem {
  id: string
  name: string // Tên nhân viên / nhóm / toàn khối
  type: ForecastViewLevel
  team_name?: string
  quota_amount: number // (1) Chỉ tiêu
  closed_amount: number // (2) Đã chốt thực tế (Closed Won)
  weighted_forecast_amount: number // (3) Dự báo theo trọng số pipeline
  closed_pct: number // % hoàn thành chỉ tiêu
  forecast_pct: number // % dự báo so với chỉ tiêu
  gap_amount: number // Chênh lệch (Chỉ tiêu - Đã chốt)
}

export interface WinLossReasonItem {
  category: string
  count: number
  lost_value: number
  percentage: number
}

export interface CompetitorLossItem {
  competitor_name: string
  deals_lost: number
  total_lost_value: number
  primary_reason: string
}

export interface RevenueForecastReportData {
  period: ForecastReportPeriod
  period_label: string
  level: ForecastViewLevel
  summary: {
    total_quota: number
    total_closed: number
    total_weighted: number
    total_gap: number
    closed_rate: number
    forecast_rate: number
  }
  items: ForecastComparisonItem[]
  winLossReasons: WinLossReasonItem[]
  competitorLosses: CompetitorLossItem[]
}
