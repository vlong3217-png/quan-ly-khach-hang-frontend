export interface FunnelStageMetrics {
  stage_id: string
  stage_name: string
  count: number
  value: number // VND
  conversion_rate_to_next: number // %
  drop_off_count: number
  drop_off_rate: number // %
  avg_days_in_stage: number // Thời gian trung bình nằm ở giai đoạn (ngày)
  is_highest_drop_off?: boolean // Chỉ ra giai đoạn rơi rụng nhiều nhất (S8-05 AC)
  is_longest_bottleneck?: boolean // Chỉ ra giai đoạn tắc lâu nhất (S8-05 AC)
}

export type FunnelDateRange = 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'YEAR_TO_DATE'

export interface FunnelFilterParams {
  team_id?: number | 'ALL'
  user_id?: number | 'ALL'
  product_id?: string | 'ALL'
  date_range: FunnelDateRange
}

export interface FunnelInsights {
  highest_drop_off_stage: {
    stage_name: string
    drop_off_rate: number
    lost_value: number
    explanation: string
  }
  longest_bottleneck_stage: {
    stage_name: string
    avg_days: number
    explanation: string
  }
  overall_conversion_rate: number
  total_deals: number
  total_value: number
}
