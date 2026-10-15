import type {
  FunnelStageMetrics,
  FunnelFilterParams,
  FunnelInsights,
} from '../types/pipelineAnalytics.ts'

class PipelineAnalyticsService {
  /**
   * Tính toán chỉ số phễu và tỷ lệ chuyển đổi từng giai đoạn theo bộ lọc
   */
  public getFunnelAnalytics(filters: FunnelFilterParams): {
    stages: FunnelStageMetrics[]
    insights: FunnelInsights
  } {
    // Multipliers based on filters to simulate dynamic real-time data
    let countFactor = 1.0
    let valueFactor = 1.0

    if (filters.team_id === 1) {
      countFactor = 0.55
      valueFactor = 0.5
    } else if (filters.team_id === 2) {
      countFactor = 0.45
      valueFactor = 0.65
    }

    if (filters.user_id && filters.user_id !== 'ALL') {
      countFactor *= 0.35
      valueFactor *= 0.35
    }

    if (filters.date_range === 'LAST_MONTH') {
      countFactor *= 0.9
      valueFactor *= 0.88
    } else if (filters.date_range === 'THIS_QUARTER') {
      countFactor *= 2.2
      valueFactor *= 2.4
    } else if (filters.date_range === 'YEAR_TO_DATE') {
      countFactor *= 5.5
      valueFactor *= 6.0
    }

    const baseStages = [
      {
        stage_id: 'stage-1',
        stage_name: '1. Khảo sát nhu cầu',
        baseCount: 45,
        baseValue: 8500000000,
        convRate: 77.8, // 35 / 45
        avgDays: 4.2,
      },
      {
        stage_id: 'stage-2',
        stage_name: '2. Đề xuất giải pháp',
        baseCount: 35,
        baseValue: 7200000000,
        convRate: 74.3, // 26 / 35
        avgDays: 7.8,
      },
      {
        stage_id: 'stage-3',
        stage_name: '3. Báo giá chi tiết',
        baseCount: 26,
        baseValue: 5800000000,
        convRate: 61.5, // 16 / 26 -> Rơi rụng 38.5% (Highest Drop-off!)
        avgDays: 6.5,
      },
      {
        stage_id: 'stage-4',
        stage_name: '4. Đàm phán & Pháp lý',
        baseCount: 16,
        baseValue: 4100000000,
        convRate: 75.0, // 12 / 16
        avgDays: 18.4, // Longest bottleneck (18.4 ngày!)
      },
      {
        stage_id: 'stage-5',
        stage_name: '5. Chốt đơn thành công (Won)',
        baseCount: 12,
        baseValue: 3200000000,
        convRate: 100,
        avgDays: 3.1,
      },
    ]

    const stages: FunnelStageMetrics[] = baseStages.map((s, idx) => {
      const count = Math.max(1, Math.round(s.baseCount * countFactor))
      const value = Math.round((s.baseValue * valueFactor) / 1000000) * 1000000
      const dropOffRate = idx < baseStages.length - 1 ? +(100 - s.convRate).toFixed(1) : 0
      const dropOffCount = idx < baseStages.length - 1 ? Math.max(0, count - Math.round(count * (s.convRate / 100))) : 0

      return {
        stage_id: s.stage_id,
        stage_name: s.stage_name,
        count,
        value,
        conversion_rate_to_next: s.convRate,
        drop_off_count: dropOffCount,
        drop_off_rate: dropOffRate,
        avg_days_in_stage: s.avgDays,
        is_highest_drop_off: s.stage_id === 'stage-3',
        is_longest_bottleneck: s.stage_id === 'stage-4',
      }
    })

    const totalDeals = stages[0].count
    const wonDeals = stages[stages.length - 1].count
    const overallRate = totalDeals > 0 ? +((wonDeals / totalDeals) * 100).toFixed(1) : 0
    const totalValue = stages.reduce((acc, s) => acc + s.value, 0)

    const insights: FunnelInsights = {
      highest_drop_off_stage: {
        stage_name: '3. Báo giá chi tiết ➔ Đàm phán',
        drop_off_rate: 38.5,
        lost_value: Math.round(stages[2].value * 0.385),
        explanation:
          'Giai đoạn Báo giá có tỷ lệ rơi rụng cao nhất (38.5%). Nguyên nhân chính: khách hàng khảo giá và so sánh mức chiết khấu với các đối thủ trên thị trường.',
      },
      longest_bottleneck_stage: {
        stage_name: '4. Đàm phán & Pháp lý',
        avg_days: 18.4,
        explanation:
          'Giai đoạn Đàm phán & Pháp lý có thời gian ngâm lâu nhất (trung bình 18.4 ngày). Điểm nghẽn do quy trình thẩm duyệt hợp đồng và thoả thuận điều khoản thanh toán phức tạp.',
      },
      overall_conversion_rate: overallRate,
      total_deals: totalDeals,
      total_value: totalValue,
    }

    return { stages, insights }
  }
}

export const pipelineAnalyticsService = new PipelineAnalyticsService()
