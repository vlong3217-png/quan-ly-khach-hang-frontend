import type {
  FunnelStageMetrics,
  FunnelFilterParams,
  FunnelInsights,
} from '../types/pipelineAnalytics.ts'
import { getStoredOpportunities } from './opportunityService.ts'
import { pipelineService } from './pipelineService.ts'
import { getMockUsers } from './userService.ts'
import { organizationService } from './organizationService.ts'

class PipelineAnalyticsService {
  /**
   * Tính toán chỉ số phễu và tỷ lệ chuyển đổi từng giai đoạn theo bộ lọc thực tế
   */
  public getFunnelAnalytics(filters: FunnelFilterParams): {
    stages: FunnelStageMetrics[]
    insights: FunnelInsights
  } {
    const rawStages = pipelineService.getStages()
    const allOpps = getStoredOpportunities()
    const users = getMockUsers()
    const deptTree = organizationService.getDepartmentTree()
    const allTeams = organizationService.flattenDepartments(deptTree)

    // Map user to teamId
    const teamNameToId = new Map<string, number>()
    allTeams.forEach((t: any, idx: number) => teamNameToId.set((t.name || '').trim().toLowerCase(), Number(t.id) || idx + 1))

    const userTeamMap = new Map<number, number>()
    users.forEach((u: any) => {
      const tName = (u.team || 'Đội Kinh Doanh 1').trim().toLowerCase()
      userTeamMap.set(Number(u.id), teamNameToId.get(tName) || 1)
    })

    // Lọc cơ hội theo filters
    let opps = allOpps.filter((opp) => {
      const ownerId = opp.owner_id ? Number(opp.owner_id) : 1
      const userTeam = userTeamMap.get(ownerId) || 1

      if (filters.team_id && filters.team_id !== 'ALL' && userTeam !== Number(filters.team_id)) {
        return false
      }
      if (filters.user_id && filters.user_id !== 'ALL' && ownerId !== Number(filters.user_id)) {
        return false
      }
      if (filters.product_id && filters.product_id !== 'ALL') {
        const prodMatch = (opp as any).product_id === filters.product_id ||
                          (opp as any).product_name === filters.product_id
        if (!prodMatch) return false
      }
      return true
    })

    // Gom dữ liệu theo từng stage trong pipeline
    const stageCounts = new Map<string, { count: number; value: number }>()
    rawStages.forEach((s) => stageCounts.set(s.id, { count: 0, value: 0 }))

    opps.forEach((opp) => {
      const sId = opp.stage_id || 'stage-1'
      const cur = stageCounts.get(sId) || { count: 0, value: 0 }
      cur.count += 1
      cur.value += Number(opp.expected_revenue) || 0
      stageCounts.set(sId, cur)
    })

    // Tính toán lũy kế / tỷ lệ chuyển đổi
    const totalDeals = opps.length
    const totalValue = opps.reduce((sum, o) => sum + (Number(o.expected_revenue) || 0), 0)

    let previousCount = totalDeals
    const stages: FunnelStageMetrics[] = rawStages.map((s, idx) => {
      const current = stageCounts.get(s.id) || { count: 0, value: 0 }
      const count = current.count
      const value = current.value
      const convRate = previousCount > 0 ? Number(((count / previousCount) * 100).toFixed(1)) : 100
      const dropOffCount = Math.max(0, previousCount - count)
      const dropOffRate = previousCount > 0 ? Number(((dropOffCount / previousCount) * 100).toFixed(1)) : 0
      previousCount = count > 0 ? count : previousCount

      return {
        stage_id: s.id,
        stage_name: `${idx + 1}. ${s.name}`,
        count,
        value,
        conversion_rate_to_next: convRate,
        drop_off_count: dropOffCount,
        drop_off_rate: dropOffRate,
        avg_days_in_stage: Math.max(1, (idx + 1) * 3),
        is_highest_drop_off: false,
        is_longest_bottleneck: false,
      }
    })

    // Đánh dấu stage rơi rụng nhiều nhất và điểm nghẽn
    let maxDropRate = -1
    let highestDropStage = stages[0]
    let maxDays = -1
    let longestStage = stages[0]

    stages.forEach((stg) => {
      if (stg.drop_off_rate > maxDropRate) {
        maxDropRate = stg.drop_off_rate
        highestDropStage = stg
      }
      if (stg.avg_days_in_stage > maxDays) {
        maxDays = stg.avg_days_in_stage
        longestStage = stg
      }
    })

    if (highestDropStage) highestDropStage.is_highest_drop_off = true
    if (longestStage) longestStage.is_longest_bottleneck = true

    const wonStage = stages[stages.length - 1]
    const overallRate = totalDeals > 0 && wonStage ? Number(((wonStage.count / totalDeals) * 100).toFixed(1)) : 0

    const insights: FunnelInsights = {
      highest_drop_off_stage: {
        stage_name: highestDropStage?.stage_name || 'Khảo sát nhu cầu',
        drop_off_rate: highestDropStage?.drop_off_rate || 0,
        lost_value: highestDropStage?.value || 0,
        explanation: `Tỷ lệ rơi rụng ở giai đoạn này chiếm ${highestDropStage?.drop_off_rate || 0}%, cần tăng cường đào tạo kỹ năng tư vấn ban đầu.`,
      },
      longest_bottleneck_stage: {
        stage_name: longestStage?.stage_name || 'Đàm phán hợp đồng',
        avg_days: longestStage?.avg_days_in_stage || 0,
        explanation: `Cơ hội thường dừng lại trung bình ${longestStage?.avg_days_in_stage || 0} ngày trước khi chuyển tiếp.`,
      },
      overall_conversion_rate: overallRate,
      total_deals: totalDeals,
      total_value: totalValue,
    }

    return { stages, insights }
  }
}

export const pipelineAnalyticsService = new PipelineAnalyticsService()

