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

    const items: ForecastComparisonItem[] = []
    const winLossReasons: WinLossReasonItem[] = []
    const competitorLosses: CompetitorLossItem[] = []

    return {
      period,
      period_label: periodLabel,
      level,
      summary: {
        total_quota: 0,
        total_closed: 0,
        total_weighted: 0,
        total_gap: 0,
        closed_rate: 0,
        forecast_rate: 0,
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
