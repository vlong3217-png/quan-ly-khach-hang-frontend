import type {
  FunnelStageMetrics,
  FunnelFilterParams,
  FunnelInsights,
} from '../types/pipelineAnalytics.ts'

class PipelineAnalyticsService {
  /**
   * Tính toán chỉ số phễu và tỷ lệ chuyển đổi từng giai đoạn theo bộ lọc
   */
  public getFunnelAnalytics(_filters: FunnelFilterParams): {
    stages: FunnelStageMetrics[]
    insights: FunnelInsights
  } {
    const baseStageNames = [
      { id: 'stage-1', name: '1. Khảo sát nhu cầu' },
      { id: 'stage-2', name: '2. Đề xuất giải pháp' },
      { id: 'stage-3', name: '3. Báo giá chi tiết' },
      { id: 'stage-4', name: '4. Đàm phán & Pháp lý' },
      { id: 'stage-5', name: '5. Chốt đơn thành công (Won)' },
    ]

    const stages: FunnelStageMetrics[] = baseStageNames.map((s) => ({
      stage_id: s.id,
      stage_name: s.name,
      count: 0,
      value: 0,
      conversion_rate_to_next: 0,
      drop_off_count: 0,
      drop_off_rate: 0,
      avg_days_in_stage: 0,
      is_highest_drop_off: false,
      is_longest_bottleneck: false,
    }))

    const insights: FunnelInsights = {
      highest_drop_off_stage: {
        stage_name: 'Chưa có dữ liệu',
        drop_off_rate: 0,
        lost_value: 0,
        explanation: 'Chưa có đủ dữ liệu cơ hội trong phễu để phân tích tỷ lệ rơi rụng.',
      },
      longest_bottleneck_stage: {
        stage_name: 'Chưa có dữ liệu',
        avg_days: 0,
        explanation: 'Chưa có cơ hội nào tồn đọng trong chu kỳ đánh giá.',
      },
      overall_conversion_rate: 0,
      total_deals: 0,
      total_value: 0,
    }

    return { stages, insights }
  }
}

export const pipelineAnalyticsService = new PipelineAnalyticsService()
