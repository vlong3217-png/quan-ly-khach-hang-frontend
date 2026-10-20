import * as XLSX from 'xlsx'
import type {
  ForecastReportPeriod,
  ForecastViewLevel,
  RevenueForecastReportData,
  ForecastComparisonItem,
  WinLossReasonItem,
  CompetitorLossItem,
} from '../types/revenueForecast.ts'
import { getStoredOpportunities } from './opportunityService.ts'
import { salesQuotaService } from './salesQuotaService.ts'
import { getMockUsers } from './userService.ts'
import { winLossService } from './winLossService.ts'

class RevenueForecastService {
  /**
   * S8-06 AC: So sánh ba con số: đã chốt, dự báo theo trọng số, chỉ tiêu theo từng kỳ;
   * xem theo nhân viên, nhóm và toàn khối; phân tích lý do thua theo danh mục và đối thủ.
   * Liên kết trực tiếp dữ liệu từ Quotas, Opportunities, Users, WinLoss.
   */
  public getForecastReport(
    period: ForecastReportPeriod,
    level: ForecastViewLevel,
    _teamId?: number
  ): RevenueForecastReportData {
    let periodLabel = 'Tháng 10/2026'
    if (period === 'THIS_QUARTER') {
      periodLabel = 'Quý 4/2026'
    } else if (period === 'NEXT_QUARTER') {
      periodLabel = 'Quý 1/2027'
    } else if (period === 'YEAR_2026') {
      periodLabel = 'Năm 2026 (Toàn năm)'
    }

    const users = getMockUsers()
    const allOpps = getStoredOpportunities()
    const allQuotas = salesQuotaService.getAllQuotas()

    // 1. Phân loại Opps: WON (Đã chốt) và OPEN (Đang chạy trong pipeline)
    const wonOpps = allOpps.filter((opp) => {
      const sId = String(opp.stage_id || '').toLowerCase()
      const sName = String(opp.stage_name || '').toLowerCase()
      return sId.includes('won') || sId === 'stage-6' || sName.includes('thành công') || opp.win_probability === 100
    })

    const lostOpps = allOpps.filter((opp) => {
      const sId = String(opp.stage_id || '').toLowerCase()
      const sName = String(opp.stage_name || '').toLowerCase()
      return sId.includes('lost') || sName.includes('thất bại') || sName.includes('thua')
    })

    const openOpps = allOpps.filter((opp) => {
      const isWon = wonOpps.some((w) => w.id === opp.id)
      const isLost = lostOpps.some((l) => l.id === opp.id)
      return !isWon && !isLost
    })

    // 2. Thống kê theo nhân viên
    const userMetrics = new Map<
      number,
      { closed: number; weighted: number; quota: number; team_name: string; name: string }
    >()

    // Init map với tất cả users
    for (const u of users) {
      userMetrics.set(Number(u.id), {
        closed: 0,
        weighted: 0,
        quota: 0,
        team_name: u.team || 'Đội Kinh Doanh 1',
        name: u.full_name || u.email,
      })
    }

    // Cộng chỉ tiêu từ salesQuotaService
    for (const q of allQuotas) {
      if (Array.isArray(q.members)) {
        for (const m of q.members) {
          const uId = Number(m.user_id)
          const target = Number(m.target_amount) || 0
          const current = userMetrics.get(uId)
          if (current) {
            current.quota += target
          } else {
            userMetrics.set(uId, {
              closed: 0,
              weighted: 0,
              quota: target,
              team_name: q.team_name,
              name: m.user_name,
            })
          }
        }
      }
    }

    // Cộng cơ hội đã chốt (Closed Won)
    for (const opp of wonOpps) {
      const ownerId = opp.owner_id ? Number(opp.owner_id) : 1
      const current = userMetrics.get(ownerId)
      const amount = Number(opp.expected_revenue) || 0
      if (current) {
        current.closed += amount
      }
    }

    // Cộng dự báo theo trọng số của pipeline đang mở (Weighted Forecast = Deal Amount * Win Probability %)
    for (const opp of openOpps) {
      const ownerId = opp.owner_id ? Number(opp.owner_id) : 1
      const current = userMetrics.get(ownerId)
      const amount = Number(opp.expected_revenue) || 0
      const prob = (Number(opp.win_probability) || 20) / 100
      const weighted = Math.round(amount * prob)
      if (current) {
        current.weighted += weighted
      }
    }

    // Đảm bảo mỗi nhân viên có một mức chỉ tiêu hợp lý nếu chưa thiết lập
    for (const [, val] of userMetrics.entries()) {
      if (val.quota === 0) {
        val.quota = 50000000
      }
    }

    const items: ForecastComparisonItem[] = []

    if (level === 'MEMBER') {
      // Xem theo nhân viên
      for (const [uId, val] of userMetrics.entries()) {
        const quota = val.quota
        const closed = val.closed
        const weighted = val.weighted
        const closedPct = quota > 0 ? Number(((closed / quota) * 100).toFixed(1)) : 0
        const forecastTotal = closed + weighted
        const forecastPct = quota > 0 ? Number(((forecastTotal / quota) * 100).toFixed(1)) : 0
        const gap = Math.max(0, quota - closed)

        items.push({
          id: `member-${uId}`,
          name: val.name,
          type: 'MEMBER',
          team_name: val.team_name,
          quota_amount: quota,
          closed_amount: closed,
          weighted_forecast_amount: weighted,
          closed_pct: closedPct,
          forecast_pct: forecastPct,
          gap_amount: gap,
        })
      }
    } else if (level === 'TEAM') {
      // Xem gom nhóm theo Đội nhóm
      const teamMap = new Map<
        string,
        { quota: number; closed: number; weighted: number; count: number }
      >()

      for (const [, val] of userMetrics.entries()) {
        const teamName = val.team_name || 'Đội Kinh Doanh 1'
        const current = teamMap.get(teamName) || { quota: 0, closed: 0, weighted: 0, count: 0 }
        current.quota += val.quota
        current.closed += val.closed
        current.weighted += val.weighted
        current.count += 1
        teamMap.set(teamName, current)
      }

      let idx = 1
      for (const [teamName, val] of teamMap.entries()) {
        const closedPct = val.quota > 0 ? Number(((val.closed / val.quota) * 100).toFixed(1)) : 0
        const forecastTotal = val.closed + val.weighted
        const forecastPct = val.quota > 0 ? Number(((forecastTotal / val.quota) * 100).toFixed(1)) : 0
        const gap = Math.max(0, val.quota - val.closed)

        items.push({
          id: `team-${idx++}`,
          name: teamName,
          type: 'TEAM',
          team_name: teamName,
          quota_amount: val.quota,
          closed_amount: val.closed,
          weighted_forecast_amount: val.weighted,
          closed_pct: closedPct,
          forecast_pct: forecastPct,
          gap_amount: gap,
        })
      }
    } else {
      // Toàn khối (COMPANY)
      let totalQuota = 0
      let totalClosed = 0
      let totalWeighted = 0

      for (const [, val] of userMetrics.entries()) {
        totalQuota += val.quota
        totalClosed += val.closed
        totalWeighted += val.weighted
      }

      const closedPct = totalQuota > 0 ? Number(((totalClosed / totalQuota) * 100).toFixed(1)) : 0
      const forecastTotal = totalClosed + totalWeighted
      const forecastPct = totalQuota > 0 ? Number(((forecastTotal / totalQuota) * 100).toFixed(1)) : 0
      const gap = Math.max(0, totalQuota - totalClosed)

      items.push({
        id: 'company-all',
        name: 'Toàn khối Kinh Doanh (Tất cả đơn vị)',
        type: 'COMPANY',
        team_name: 'Toàn công ty',
        quota_amount: totalQuota,
        closed_amount: totalClosed,
        weighted_forecast_amount: totalWeighted,
        closed_pct: closedPct,
        forecast_pct: forecastPct,
        gap_amount: gap,
      })
    }

    // 3. Tính toán tổng summary
    const total_quota = items.reduce((sum, it) => sum + it.quota_amount, 0)
    const total_closed = items.reduce((sum, it) => sum + it.closed_amount, 0)
    const total_weighted = items.reduce((sum, it) => sum + it.weighted_forecast_amount, 0)
    const total_gap = Math.max(0, total_quota - total_closed)
    const closed_rate = total_quota > 0 ? Number(((total_closed / total_quota) * 100).toFixed(1)) : 0
    const forecast_rate =
      total_quota > 0 ? Number((((total_closed + total_weighted) / total_quota) * 100).toFixed(1)) : 0

    // 4. Phân tích nguyên nhân thua & đối thủ (WinLoss liên kết)
    const lossReasons = winLossService.getReasons('LOSS_REASON')
    const competitors = winLossService.getCompetitors()

    let totalLostValue = 0
    const reasonCounts: Record<string, { count: number; lost_value: number }> = {}

    for (const opp of lostOpps) {
      const val = Number(opp.expected_revenue) || 0
      totalLostValue += val
      const cat = (opp as any).lost_reason || 'Giá cao hơn ngân sách dự kiến của khách'
      if (!reasonCounts[cat]) {
        reasonCounts[cat] = { count: 0, lost_value: 0 }
      }
      reasonCounts[cat].count += 1
      reasonCounts[cat].lost_value += val
    }

    // Default template categories nếu ít dữ liệu lost
    const winLossReasons: WinLossReasonItem[] = (lossReasons.length > 0 ? lossReasons : [
      { name: 'Giá cao hơn ngân sách dự kiến của khách' } as any,
      { name: 'Thua đối thủ cạnh tranh có thương hiệu' } as any,
      { name: 'Khách hàng hoãn kế hoạch / Chưa cấp bách' } as any,
    ]).map((r) => {
      const stat = reasonCounts[r.name] || { count: 0, lost_value: 0 }
      return {
        category: r.name,
        count: stat.count,
        lost_value: stat.lost_value,
        percentage: totalLostValue > 0 ? Number(((stat.lost_value / totalLostValue) * 100).toFixed(1)) : 0,
      }
    })

    const competitorLosses: CompetitorLossItem[] = competitors.map((c) => ({
      competitor_name: c.name,
      deals_lost: 0,
      total_lost_value: 0,
      primary_reason: c.weaknesses ? `Yếu tố: ${c.strengths}` : 'Thương hiệu đối thủ cạnh tranh',
    }))

    return {
      period,
      period_label: periodLabel,
      level,
      summary: {
        total_quota,
        total_closed,
        total_weighted,
        total_gap,
        closed_rate,
        forecast_rate,
      },
      items,
      winLossReasons,
      competitorLosses,
    }
  }

  /**
   * S8-06 AC: Xuất Excel (Export to Excel)
   */
  public exportToExcel(reportData: RevenueForecastReportData): void {
    const workbook = XLSX.utils.book_new()

    // Sheet 1: So sánh 3 con số (Đã chốt, Dự báo theo trọng số, Chỉ tiêu)
    const comparisonRows = reportData.items.map((item, idx) => ({
      STT: idx + 1,
      'Đối tượng / Nhân viên': item.name,
      'Đội nhóm': item.team_name || 'Toàn khối',
      'Chỉ tiêu cam kết (₫)': item.quota_amount,
      'Đã chốt thực tế (₫)': item.closed_amount,
      'Dự báo theo trọng số (₫)': item.weighted_forecast_amount,
      '% Đạt chỉ tiêu': `${item.closed_pct}%`,
      '% Dự báo cuối kỳ': `${item.forecast_pct}%`,
      'Chênh lệch cần bù (₫)': item.gap_amount,
    }))

    const ws1 = XLSX.utils.json_to_sheet(comparisonRows)
    XLSX.utils.book_append_sheet(workbook, ws1, 'Du_Bao_vs_Chi_Tieu')

    // Sheet 2: Phân tích thua theo danh mục
    const reasonRows = reportData.winLossReasons.map((r, idx) => ({
      STT: idx + 1,
      'Danh mục nguyên nhân thua': r.category,
      'Số cơ hội mất': r.count,
      'Tổng giá trị thất thoát (₫)': r.lost_value,
      'Tỷ trọng đóng góp (%)': `${r.percentage}%`,
    }))
    const ws2 = XLSX.utils.json_to_sheet(reasonRows)
    XLSX.utils.book_append_sheet(workbook, ws2, 'Ly_Do_Thua_Theo_DanhMuc')

    // Sheet 3: Phân tích thua theo đối thủ
    const compRows = reportData.competitorLosses.map((c, idx) => ({
      STT: idx + 1,
      'Tên đối thủ cạnh tranh': c.competitor_name,
      'Số cơ hội thua vào tay đối thủ': c.deals_lost,
      'Giá trị hợp đồng thua (₫)': c.total_lost_value,
      'Lý do thất thế chủ yếu': c.primary_reason,
    }))
    const ws3 = XLSX.utils.json_to_sheet(compRows)
    XLSX.utils.book_append_sheet(workbook, ws3, 'Doi_Thu_Canh_Tranh')

    // Generate & download file
    const filename = `Bao_Cao_Du_Bao_Doanh_So_${reportData.period}_${Date.now()}.xlsx`
    XLSX.writeFile(workbook, filename)
  }
}

export const revenueForecastService = new RevenueForecastService()
