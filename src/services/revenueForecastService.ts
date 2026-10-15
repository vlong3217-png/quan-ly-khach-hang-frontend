import * as XLSX from 'xlsx'
import type {
  ForecastReportPeriod,
  ForecastViewLevel,
  RevenueForecastReportData,
  ForecastComparisonItem,
  WinLossReasonItem,
  CompetitorLossItem,
} from '../types/revenueForecast.ts'

class RevenueForecastService {
  /**
   * S8-06 AC: So sánh ba con số: đã chốt, dự báo theo trọng số, chỉ tiêu theo từng kỳ;
   * xem theo nhân viên, nhóm và toàn khối; phân tích lý do thua theo danh mục và đối thủ.
   */
  public getForecastReport(
    period: ForecastReportPeriod,
    level: ForecastViewLevel,
    teamId?: number
  ): RevenueForecastReportData {
    // Dynamic multiplier based on period
    let factor = 1.0
    let periodLabel = 'Tháng 10/2026'

    if (period === 'THIS_QUARTER') {
      factor = 2.8
      periodLabel = 'Quý 4/2026'
    } else if (period === 'NEXT_QUARTER') {
      factor = 3.0
      periodLabel = 'Quý 1/2027'
    } else if (period === 'YEAR_2026') {
      factor = 11.5
      periodLabel = 'Năm 2026 (Toàn năm)'
    }

    // Base company data
    const companyQuota = Math.round(12000000000 * factor)
    const companyClosed = Math.round(8650000000 * factor)
    const companyWeighted = Math.round(10800000000 * factor)

    let items: ForecastComparisonItem[] = []

    if (level === 'COMPANY') {
      items = [
        {
          id: 'comp-total',
          name: 'Toàn khối Kinh doanh (Enterprise + SME)',
          type: 'COMPANY',
          quota_amount: companyQuota,
          closed_amount: companyClosed,
          weighted_forecast_amount: companyWeighted,
          closed_pct: +((companyClosed / companyQuota) * 100).toFixed(1),
          forecast_pct: +((companyWeighted / companyQuota) * 100).toFixed(1),
          gap_amount: Math.max(0, companyQuota - companyClosed),
        },
      ]
    } else if (level === 'TEAM') {
      const t1Quota = Math.round(companyQuota * 0.55)
      const t1Closed = Math.round(companyClosed * 0.52)
      const t1Weighted = Math.round(companyWeighted * 0.54)

      const t2Quota = companyQuota - t1Quota
      const t2Closed = companyClosed - t1Closed
      const t2Weighted = companyWeighted - t1Weighted

      items = [
        {
          id: 'team-1',
          name: 'Đội Kinh Doanh 1 (SME & Miền Bắc)',
          type: 'TEAM',
          team_name: 'Đội 1',
          quota_amount: t1Quota,
          closed_amount: t1Closed,
          weighted_forecast_amount: t1Weighted,
          closed_pct: +((t1Closed / t1Quota) * 100).toFixed(1),
          forecast_pct: +((t1Weighted / t1Quota) * 100).toFixed(1),
          gap_amount: Math.max(0, t1Quota - t1Closed),
        },
        {
          id: 'team-2',
          name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise & Key Accounts)',
          type: 'TEAM',
          team_name: 'Đội Enterprise',
          quota_amount: t2Quota,
          closed_amount: t2Closed,
          weighted_forecast_amount: t2Weighted,
          closed_pct: +((t2Closed / t2Quota) * 100).toFixed(1),
          forecast_pct: +((t2Weighted / t2Quota) * 100).toFixed(1),
          gap_amount: Math.max(0, t2Quota - t2Closed),
        },
      ]
    } else {
      // MEMBER level
      const membersBase = [
        { id: 'usr-1', name: 'Nguyễn Văn A', team: 'Đội 1', qRatio: 0.22, cRatio: 0.24, wRatio: 0.23 },
        { id: 'usr-2', name: 'Trần Thị B', team: 'Đội 1', qRatio: 0.18, cRatio: 0.19, wRatio: 0.18 },
        { id: 'usr-3', name: 'Lê Văn C', team: 'Đội 1', qRatio: 0.15, cRatio: 0.09, wRatio: 0.13 },
        { id: 'usr-4', name: 'Phạm Hồng Đăng', team: 'Đội Enterprise', qRatio: 0.25, cRatio: 0.28, wRatio: 0.26 },
        { id: 'usr-5', name: 'Vũ Thu Trang', team: 'Đội Enterprise', qRatio: 0.20, cRatio: 0.20, wRatio: 0.20 },
      ]

      let filteredMembers = membersBase
      if (teamId === 1) filteredMembers = membersBase.filter((m) => m.team === 'Đội 1')
      if (teamId === 2) filteredMembers = membersBase.filter((m) => m.team === 'Đội Enterprise')

      items = filteredMembers.map((m) => {
        const q = Math.round(companyQuota * m.qRatio)
        const c = Math.round(companyClosed * m.cRatio)
        const w = Math.round(companyWeighted * m.wRatio)
        return {
          id: m.id,
          name: m.name,
          type: 'MEMBER',
          team_name: m.team,
          quota_amount: q,
          closed_amount: c,
          weighted_forecast_amount: w,
          closed_pct: +((c / q) * 100).toFixed(1),
          forecast_pct: +((w / q) * 100).toFixed(1),
          gap_amount: Math.max(0, q - c),
        }
      })
    }

    // Win-Loss by Category (Lý do thua theo danh mục)
    const winLossReasons: WinLossReasonItem[] = [
      {
        category: 'Đơn giá cao hơn ngân sách dự kiến của khách',
        count: 14,
        lost_value: Math.round(2850000000 * factor),
        percentage: 42.4,
      },
      {
        category: 'Thiếu tính năng chuyên sâu ngành (Sản xuất / Logistics)',
        count: 8,
        lost_value: Math.round(1620000000 * factor),
        percentage: 24.2,
      },
      {
        category: 'Khách hàng trì hoãn dự án sang kỳ tài chính sau',
        count: 6,
        lost_value: Math.round(1240000000 * factor),
        percentage: 18.2,
      },
      {
        category: 'Đối thủ có mối quan hệ sẵn với ban lãnh đạo',
        count: 5,
        lost_value: Math.round(1010000000 * factor),
        percentage: 15.2,
      },
    ]

    // Competitor Loss (Lý do thua theo đối thủ)
    const competitorLosses: CompetitorLossItem[] = [
      {
        competitor_name: 'Base CRM (Base.vn)',
        deals_lost: 12,
        total_lost_value: Math.round(2400000000 * factor),
        primary_reason: 'Giá gói cơ bản cạnh tranh hơn và tích hợp sẵn hệ sinh thái văn phòng điện tử',
      },
      {
        competitor_name: 'Amis CRM (MISA)',
        deals_lost: 9,
        total_lost_value: Math.round(1950000000 * factor),
        primary_reason: 'Khách hàng đang dùng sẵn phần mềm kế toán MISA nên ưu tiên đồng bộ',
      },
      {
        competitor_name: 'Salesforce (MNCs)',
        deals_lost: 4,
        total_lost_value: Math.round(1800000000 * factor),
        primary_reason: 'Khách hàng tập đoàn đa quốc gia có chính sách bắt buộc dùng nền tảng toàn cầu',
      },
      {
        competitor_name: 'Fast Business ERP',
        deals_lost: 3,
        total_lost_value: Math.round(570000000 * factor),
        primary_reason: 'Đi kèm trọn gói giải pháp phân hệ sản xuất và tính giá thành chi tiết',
      },
    ]

    const totalQuota = items.reduce((sum, i) => sum + i.quota_amount, 0)
    const totalClosed = items.reduce((sum, i) => sum + i.closed_amount, 0)
    const totalWeighted = items.reduce((sum, i) => sum + i.weighted_forecast_amount, 0)
    const totalGap = Math.max(0, totalQuota - totalClosed)

    return {
      period,
      period_label: periodLabel,
      level,
      summary: {
        total_quota: totalQuota,
        total_closed: totalClosed,
        total_weighted: totalWeighted,
        total_gap: totalGap,
        closed_rate: totalQuota > 0 ? +((totalClosed / totalQuota) * 100).toFixed(1) : 0,
        forecast_rate: totalQuota > 0 ? +((totalWeighted / totalQuota) * 100).toFixed(1) : 0,
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
