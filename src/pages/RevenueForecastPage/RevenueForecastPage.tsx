import { useState, useMemo } from 'react'
import type {
  ForecastReportPeriod,
  ForecastViewLevel,
} from '../../types/revenueForecast.ts'
import { revenueForecastService } from '../../services/revenueForecastService.ts'
import StandardPagination from '../../components/StandardPagination/StandardPagination.tsx'
import './RevenueForecastPage.css'

export default function RevenueForecastPage() {
  const [period, setPeriod] = useState<ForecastReportPeriod>('THIS_MONTH')
  const [level, setLevel] = useState<ForecastViewLevel>('COMPANY')
  const [teamId, setTeamId] = useState<number | undefined>(undefined)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const reportData = useMemo(() => {
    return revenueForecastService.getForecastReport(period, level, teamId)
  }, [period, level, teamId])

  const paginatedItems = useMemo(() => {
    return reportData.items.slice((page - 1) * pageSize, page * pageSize)
  }, [reportData.items, page, pageSize])

  const handleExportExcel = () => {
    try {
      revenueForecastService.exportToExcel(reportData)
      showToast('Đã xuất báo cáo dự báo & chỉ tiêu ra tệp Excel thành công!')
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  return (
    <div className="revenue-forecast-page" id="revenue-forecast-page">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="action-notice-toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="forecast-header">
        <div>
          <h1>
            <span>Báo cáo Dự báo doanh số & Tiến độ chỉ tiêu</span>
          </h1>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          id="btn-export-forecast-excel"
          onClick={handleExportExcel}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <span>Xuất báo cáo Excel</span>
        </button>
      </div>

      {/* Controls Bar: Period & View Level */}
      <div className="forecast-controls-bar">
        {/* Period Selector */}
        <div className="control-segment">
          <span className="control-label">Kỳ báo cáo:</span>
          <div className="btn-group-toggle">
            <button
              type="button"
              className={`btn-toggle-option ${period === 'THIS_MONTH' ? 'active' : ''}`}
              onClick={() => setPeriod('THIS_MONTH')}
            >
              Tháng 10/2026
            </button>
            <button
              type="button"
              className={`btn-toggle-option ${period === 'THIS_QUARTER' ? 'active' : ''}`}
              onClick={() => setPeriod('THIS_QUARTER')}
            >
              Quý 4/2026
            </button>
            <button
              type="button"
              className={`btn-toggle-option ${period === 'NEXT_QUARTER' ? 'active' : ''}`}
              onClick={() => setPeriod('NEXT_QUARTER')}
            >
              Quý 1/2027
            </button>
            <button
              type="button"
              className={`btn-toggle-option ${period === 'YEAR_2026' ? 'active' : ''}`}
              onClick={() => setPeriod('YEAR_2026')}
            >
              Toàn năm 2026
            </button>
          </div>
        </div>

        {/* View Level Selector */}
        <div className="control-segment">
          <span className="control-label">Xem theo:</span>
          <div className="btn-group-toggle">
            <button
              type="button"
              className={`btn-toggle-option ${level === 'COMPANY' ? 'active' : ''}`}
              onClick={() => setLevel('COMPANY')}
            >
              Toàn khối (Company)
            </button>
            <button
              type="button"
              className={`btn-toggle-option ${level === 'TEAM' ? 'active' : ''}`}
              onClick={() => setLevel('TEAM')}
            >
              Theo Đội nhóm (Team)
            </button>
            <button
              type="button"
              className={`btn-toggle-option ${level === 'MEMBER' ? 'active' : ''}`}
              onClick={() => setLevel('MEMBER')}
            >
              Theo Nhân viên (Member)
            </button>
          </div>

          {level === 'MEMBER' && (
            <select
              className="filter-select"
              value={teamId || ''}
              onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ height: 34 }}
            >
              <option value="">Tất cả các đội</option>
            </select>
          )}
        </div>
      </div>

      {/* S8-06 AC: So sánh ba con số (Đã chốt, Dự báo theo trọng số, Chỉ tiêu) */}
      <div className="forecast-numbers-grid">
        <div className="forecast-number-card quota" id="card-total-quota">
          <span className="number-label">
            <span>(1) Chỉ tiêu cam kết (Quota)</span>
          </span>
          <span className="number-amount">{reportData.summary.total_quota.toLocaleString('vi-VN')} ₫</span>
          <span className="number-rate-sub">Kế hoạch giao cho kỳ {reportData.period_label}</span>
        </div>

        <div className="forecast-number-card closed" id="card-total-closed">
          <span className="number-label">
            <span>(2) Đã chốt thực tế (Closed Won)</span>
          </span>
          <span className="number-amount" style={{ color: '#15803d' }}>
            {reportData.summary.total_closed.toLocaleString('vi-VN')} ₫
          </span>
          <span className="number-rate-sub">
            Đạt <strong>{reportData.summary.closed_rate}%</strong> mức chỉ tiêu cam kết
          </span>
        </div>

        <div className="forecast-number-card weighted" id="card-total-weighted">
          <span className="number-label">
            <span>(3) Dự báo theo trọng số (Forecast)</span>
          </span>
          <span className="number-amount" style={{ color: '#d97706' }}>
            {reportData.summary.total_weighted.toLocaleString('vi-VN')} ₫
          </span>
          <span className="number-rate-sub">
            Kỳ vọng đạt <strong>{reportData.summary.forecast_rate}%</strong> khi kết thúc kỳ
          </span>
        </div>

        <div className="forecast-number-card gap" id="card-total-gap">
          <span className="number-label">
            <span>Chênh lệch cần bù (Gap to Target)</span>
          </span>
          <span className="number-amount" style={{ color: '#dc2626' }}>
            {reportData.summary.total_gap.toLocaleString('vi-VN')} ₫
          </span>
          <span className="number-rate-sub">Cần tập trung chốt các cơ hội giai đoạn Đàm phán</span>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="forecast-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            Bảng so sánh ba con số theo {level === 'COMPANY' ? 'Toàn khối' : level === 'TEAM' ? 'Đội nhóm' : 'Từng nhân viên'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Đơn vị: VNĐ</span>
        </div>

        <table className="forecast-table">
          <thead>
            <tr>
              <th>Đối tượng phụ trách</th>
              {level === 'MEMBER' && <th style={{ width: 150 }}>Đội nhóm</th>}
              <th style={{ width: 180, textAlign: 'right' }}>Chỉ tiêu (₫)</th>
              <th style={{ width: 180, textAlign: 'right' }}>Đã chốt (₫)</th>
              <th style={{ width: 190, textAlign: 'right' }}>Dự báo trọng số (₫)</th>
              <th style={{ width: 130, textAlign: 'right' }}>% Đã chốt</th>
              <th style={{ width: 130, textAlign: 'right' }}>% Dự báo</th>
              <th style={{ width: 170, textAlign: 'right' }}>Chênh lệch cần bù (₫)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.items.length === 0 ? (
              <tr>
                <td colSpan={level === 'MEMBER' ? 8 : 7} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                  Chưa có dữ liệu dự báo cho kỳ này
                </td>
              </tr>
            ) : (
              paginatedItems.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{row.name}</strong>
                  </td>
                  {level === 'MEMBER' && (
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.team_name}</span>
                    </td>
                  )}
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.quota_amount.toLocaleString('vi-VN')} ₫</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    {row.closed_amount.toLocaleString('vi-VN')} ₫
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                    {row.weighted_forecast_amount.toLocaleString('vi-VN')} ₫
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: row.closed_pct >= 80 ? '#15803d' : '#2563eb' }}>
                    {row.closed_pct}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: row.forecast_pct >= 90 ? '#15803d' : '#b45309' }}>
                    {row.forecast_pct}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: row.gap_amount > 0 ? '#dc2626' : '#15803d' }}>
                    {row.gap_amount > 0 ? `${row.gap_amount.toLocaleString('vi-VN')} ₫` : 'Đạt chỉ tiêu'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <StandardPagination
          page={page}
          pageSize={pageSize}
          total={reportData.items.length}
          label="đối tượng so sánh"
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      </div>

      {/* S8-06 AC: Phân tích lý do thua theo danh mục & theo đối thủ */}
      <div className="winloss-columns">
        {/* Panel 1: Thua theo danh mục */}
        <div className="winloss-panel" id="panel-winloss-category">
          <h3 className="winloss-panel-title">
            <span>Phân tích lý do thua theo danh mục (By Category)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reportData.winLossReasons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                Chưa có dữ liệu phân tích lý do thua
              </div>
            ) : (
              reportData.winLossReasons.map((r, idx) => (
                <div key={idx} className="reason-bar-item">
                  <div className="reason-header-row">
                    <span>{r.category}</span>
                    <span style={{ color: '#dc2626' }}>{r.percentage}% ({r.count} cơ hội)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Giá trị thất thoát: <strong>{r.lost_value.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.percentage}%`, background: '#ef4444', borderRadius: 9999 }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 2: Thua theo đối thủ */}
        <div className="winloss-panel" id="panel-winloss-competitor">
          <h3 className="winloss-panel-title">
            <span>Phân tích thua cuộc theo đối thủ (By Competitor)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reportData.competitorLosses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                Chưa có dữ liệu thất thoát theo đối thủ
              </div>
            ) : (
              reportData.competitorLosses.map((c, idx) => (
                <div key={idx} className="competitor-loss-card">
                  <div className="competitor-name-row">
                    <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{c.competitor_name}</strong>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
                      Thua {c.deals_lost} deals ({c.total_lost_value.toLocaleString('vi-VN')} ₫)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    <strong>Lý do chính:</strong> {c.primary_reason}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
