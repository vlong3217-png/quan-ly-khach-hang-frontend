import { useState, useMemo } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import './SalesForecastView.css'

interface SalesForecastViewProps {
  opportunities: Opportunity[]
  onOpenOpportunityDetail?: (opp: Opportunity) => void
}

type PeriodFilter = 'THIS_MONTH' | 'NEXT_MONTH' | 'THIS_QUARTER' | 'ALL'
type GroupByFilter = 'OWNER' | 'TEAM'

// Chỉ tiêu kế hoạch mặc định theo nhân viên và đội nhóm (có thể tùy chỉnh)
const DEFAULT_OWNER_TARGETS: Record<string, number> = {
  'Lưu Quang Trường': 160000000,
  'Nguyễn Văn An': 150000000,
  'Trần Thị Mai': 120000000,
  'Lê Hoàng Long': 100000000,
  'Phạm Minh Tuấn': 80000000,
  'Hoàng Thu Trang': 90000000,
  'Vũ Đức Thịnh': 70000000,
}

const DEFAULT_TEAM_TARGETS: Record<string, number> = {
  'Đội Kinh Doanh 1': 300000000,
  'Đội Kinh Doanh 2': 250000000,
  'Đội Dự Án Doanh Nghiệp': 200000000,
}

export default function SalesForecastView({
  opportunities,
  onOpenOpportunityDetail,
}: SalesForecastViewProps) {
  const [period, setPeriod] = useState<PeriodFilter>('THIS_MONTH')
  const [groupBy, setGroupBy] = useState<GroupByFilter>('OWNER')
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>('ALL')

  // Xác định khoảng thời gian hiện tại
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1 // 1-4

  // Lọc cơ hội theo kỳ dự kiến chốt (hoặc ngày đóng thực tế nếu đã WON)
  const isDateInPeriod = (dateStr?: string, targetPeriod: PeriodFilter = period): boolean => {
    if (!dateStr) return targetPeriod === 'ALL'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return targetPeriod === 'ALL'

    const y = d.getFullYear()
    const m = d.getMonth()
    const q = Math.floor(m / 3) + 1

    switch (targetPeriod) {
      case 'THIS_MONTH':
        return y === currentYear && m === currentMonth
      case 'NEXT_MONTH': {
        const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
        return y === nextMonthYear && m === nextMonth
      }
      case 'THIS_QUARTER':
        return y === currentYear && q === currentQuarter
      case 'ALL':
      default:
        return true
    }
  }

  // Danh sách cơ hội thuộc kỳ đã chọn
  // Với cơ hội đã WON: ưu tiên actual_close_date nếu có, fallback expected_close_date
  // Với cơ hội đang mở/khác: xét expected_close_date
  const filteredOpps = useMemo(() => {
    return opportunities.filter((opp) => {
      const relevantDate = opp.status === 'WON' && opp.actual_close_date
        ? opp.actual_close_date
        : opp.expected_close_date

      return isDateInPeriod(relevantDate, period)
    })
  }, [opportunities, period])

  // Tính toán số liệu tổng thể theo kỳ
  const summaryStats = useMemo(() => {
    let totalPipelineRevenue = 0
    let totalForecastRevenue = 0 // Dự báo = SUM(expected_revenue * win_probability / 100)
    let totalActualClosedRevenue = 0 // Đã chốt thực tế (từ các deals WON)
    let openDealsCount = 0
    let wonDealsCount = 0
    let lostDealsCount = 0

    filteredOpps.forEach((opp) => {
      if (opp.status === 'WON') {
        wonDealsCount++
        const wonActual = opp.actual_revenue || opp.expected_revenue
        totalActualClosedRevenue += wonActual
        // Deal won có xác suất 100% -> cũng tính vào forecast hoặc actual
        totalForecastRevenue += wonActual
        totalPipelineRevenue += wonActual
      } else if (opp.status === 'LOST') {
        lostDealsCount++
      } else {
        // OPEN deals
        openDealsCount++
        totalPipelineRevenue += opp.expected_revenue
        const weighted = (opp.expected_revenue * (opp.win_probability || 0)) / 100
        totalForecastRevenue += weighted
      }
    })

    // Tổng chỉ tiêu trong kỳ
    let totalTargetQuota = 0
    if (groupBy === 'OWNER') {
      const uniqueOwners = Array.from(new Set(opportunities.map((o) => o.owner_name)))
      totalTargetQuota = uniqueOwners.reduce((sum, name) => {
        return sum + (DEFAULT_OWNER_TARGETS[name] || 100000000)
      }, 0)
    } else {
      const uniqueTeams = Array.from(new Set(opportunities.map((o) => o.team_name || 'Đội Kinh Doanh 1')))
      totalTargetQuota = uniqueTeams.reduce((sum, name) => {
        return sum + (DEFAULT_TEAM_TARGETS[name] || 250000000)
      }, 0)
    }

    // Điều chỉnh chỉ tiêu theo quý (x3) nếu chọn Quý
    if (period === 'THIS_QUARTER') {
      totalTargetQuota *= 3
    }

    const forecastVsTargetPercent = totalTargetQuota > 0
      ? Math.round((totalForecastRevenue / totalTargetQuota) * 100)
      : 0
    const actualVsTargetPercent = totalTargetQuota > 0
      ? Math.round((totalActualClosedRevenue / totalTargetQuota) * 100)
      : 0

    return {
      totalPipelineRevenue,
      totalForecastRevenue,
      totalActualClosedRevenue,
      totalTargetQuota,
      forecastVsTargetPercent,
      actualVsTargetPercent,
      openDealsCount,
      wonDealsCount,
      lostDealsCount,
      totalCount: filteredOpps.length,
    }
  }, [filteredOpps, opportunities, groupBy, period])

  // Nhóm theo Nhân viên hoặc Đội kinh doanh
  const groupedData = useMemo(() => {
    const groups: Record<
      string,
      {
        key: string
        name: string
        teamName?: string
        targetQuota: number
        openCount: number
        wonCount: number
        totalRevenue: number
        forecastRevenue: number
        actualClosedRevenue: number
        deals: Opportunity[]
      }
    > = {}

    filteredOpps.forEach((opp) => {
      const groupKey = groupBy === 'OWNER' ? opp.owner_name : (opp.team_name || 'Đội Kinh Doanh 1')
      if (!groups[groupKey]) {
        let baseQuota = 0
        if (groupBy === 'OWNER') {
          baseQuota = DEFAULT_OWNER_TARGETS[groupKey] || 100000000
        } else {
          baseQuota = DEFAULT_TEAM_TARGETS[groupKey] || 250000000
        }
        if (period === 'THIS_QUARTER') baseQuota *= 3

        groups[groupKey] = {
          key: groupKey,
          name: groupKey,
          teamName: opp.team_name || 'Đội Kinh Doanh 1',
          targetQuota: baseQuota,
          openCount: 0,
          wonCount: 0,
          totalRevenue: 0,
          forecastRevenue: 0,
          actualClosedRevenue: 0,
          deals: [],
        }
      }

      const grp = groups[groupKey]
      grp.deals.push(opp)

      if (opp.status === 'WON') {
        grp.wonCount++
        const wonVal = opp.actual_revenue || opp.expected_revenue
        grp.actualClosedRevenue += wonVal
        grp.forecastRevenue += wonVal
        grp.totalRevenue += wonVal
      } else if (opp.status === 'OPEN') {
        grp.openCount++
        grp.totalRevenue += opp.expected_revenue
        const weighted = (opp.expected_revenue * (opp.win_probability || 0)) / 100
        grp.forecastRevenue += weighted
      }
    })

    return Object.values(groups).sort((a, b) => b.forecastRevenue - a.forecastRevenue)
  }, [filteredOpps, groupBy, period])

  // Lọc danh sách deal chi tiết theo group được chọn
  const displayDeals = useMemo(() => {
    if (selectedGroupKey === 'ALL') return filteredOpps
    if (groupBy === 'OWNER') {
      return filteredOpps.filter((o) => o.owner_name === selectedGroupKey)
    }
    return filteredOpps.filter((o) => (o.team_name || 'Đội Kinh Doanh 1') === selectedGroupKey)
  }, [filteredOpps, selectedGroupKey, groupBy])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'THIS_MONTH':
        return `Tháng ${currentMonth + 1}/${currentYear}`
      case 'NEXT_MONTH': {
        const nextMonth = currentMonth === 11 ? 1 : currentMonth + 2
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
        return `Tháng ${nextMonth}/${nextYear}`
      }
      case 'THIS_QUARTER':
        return `Quý ${currentQuarter}/${currentYear}`
      case 'ALL':
      default:
        return 'Tất cả các kỳ'
    }
  }

  return (
    <div className="sales-forecast-container">
      {/* ── Header & Bộ lọc Kỳ / Nhóm ── */}
      <div className="forecast-header-section">
        <div className="forecast-header-title">
          <div className="forecast-badge-pill">S5-06: Báo cáo & Phân tích</div>
          <h2>Dự Báo Doanh Số Bán Hàng Theo Trọng Số Xác Suất</h2>
          <p className="forecast-subtitle">
            Dự báo = Tổng (Giá trị cơ hội × Xác suất thắng từng giai đoạn). Tự động so sánh với chỉ tiêu giao và số tiền đã ký chốt thực tế.
          </p>
        </div>

        <div className="forecast-controls">
          {/* Lọc Kỳ dự kiến chốt */}
          <div className="control-group">
            <span className="control-label">Kỳ dự kiến chốt:</span>
            <div className="period-button-group">
              <button
                type="button"
                className={`period-btn ${period === 'THIS_MONTH' ? 'active' : ''}`}
                onClick={() => { setPeriod('THIS_MONTH'); setSelectedGroupKey('ALL') }}
              >
                Tháng này
              </button>
              <button
                type="button"
                className={`period-btn ${period === 'NEXT_MONTH' ? 'active' : ''}`}
                onClick={() => { setPeriod('NEXT_MONTH'); setSelectedGroupKey('ALL') }}
              >
                Tháng sau
              </button>
              <button
                type="button"
                className={`period-btn ${period === 'THIS_QUARTER' ? 'active' : ''}`}
                onClick={() => { setPeriod('THIS_QUARTER'); setSelectedGroupKey('ALL') }}
              >
                Quý này
              </button>
              <button
                type="button"
                className={`period-btn ${period === 'ALL' ? 'active' : ''}`}
                onClick={() => { setPeriod('ALL'); setSelectedGroupKey('ALL') }}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Phân nhóm xem: Nhân viên vs Nhóm kinh doanh */}
          <div className="control-group">
            <span className="control-label">Phân nhóm theo:</span>
            <div className="groupby-button-group">
              <button
                type="button"
                className={`groupby-btn ${groupBy === 'OWNER' ? 'active' : ''}`}
                onClick={() => { setGroupBy('OWNER'); setSelectedGroupKey('ALL') }}
              >
                👤 Từng nhân viên
              </button>
              <button
                type="button"
                className={`groupby-btn ${groupBy === 'TEAM' ? 'active' : ''}`}
                onClick={() => { setGroupBy('TEAM'); setSelectedGroupKey('ALL') }}
              >
                🏢 Đội kinh doanh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI So sánh Dự báo vs Thực tế vs Chỉ tiêu ── */}
      <div className="forecast-kpi-banner">
        <div className="kpi-banner-item highlight-forecast">
          <div className="kpi-banner-header">
            <span className="kpi-title">DOANH SỐ DỰ BÁO (WEIGHTED)</span>
            <span className="kpi-badge-prob">Σ (Giá trị × % Thắng)</span>
          </div>
          <div className="kpi-amount text-primary">{formatCurrency(summaryStats.totalForecastRevenue)}</div>
          <div className="kpi-progress-bar-container">
            <div
              className="kpi-progress-fill forecast-fill"
              style={{ width: `${Math.min(summaryStats.forecastVsTargetPercent, 100)}%` }}
            />
          </div>
          <div className="kpi-meta-desc">
            Đạt <strong>{summaryStats.forecastVsTargetPercent}%</strong> chỉ tiêu kế hoạch ({getPeriodLabel()})
          </div>
        </div>

        <div className="kpi-banner-item highlight-actual">
          <div className="kpi-banner-header">
            <span className="kpi-title">ĐÃ CHỐT THỰC TẾ (ACTUAL WON)</span>
            <span className="kpi-badge-won">Hợp đồng đã ký</span>
          </div>
          <div className="kpi-amount text-success">{formatCurrency(summaryStats.totalActualClosedRevenue)}</div>
          <div className="kpi-progress-bar-container">
            <div
              className="kpi-progress-fill actual-fill"
              style={{ width: `${Math.min(summaryStats.actualVsTargetPercent, 100)}%` }}
            />
          </div>
          <div className="kpi-meta-desc">
            Đã hoàn thành <strong>{summaryStats.actualVsTargetPercent}%</strong> chỉ tiêu giao ({summaryStats.wonDealsCount} deal thắng)
          </div>
        </div>

        <div className="kpi-banner-item highlight-target">
          <div className="kpi-banner-header">
            <span className="kpi-title">CHỈ TIÊU KẾ HOẠCH (TARGET QUOTA)</span>
            <span className="kpi-badge-quota">Mục tiêu kỳ</span>
          </div>
          <div className="kpi-amount text-slate">{formatCurrency(summaryStats.totalTargetQuota)}</div>
          <div className="kpi-meta-sub">
            Chênh lệch dự báo: {summaryStats.totalForecastRevenue >= summaryStats.totalTargetQuota ? (
              <span className="text-success font-bold">+ {formatCurrency(summaryStats.totalForecastRevenue - summaryStats.totalTargetQuota)} (Vượt)</span>
            ) : (
              <span className="text-danger font-bold">- {formatCurrency(summaryStats.totalTargetQuota - summaryStats.totalForecastRevenue)} (Thiếu)</span>
            )}
          </div>
          <div className="kpi-meta-desc">
            Tổng giá trị cơ hội đang mở: {formatCurrency(summaryStats.totalPipelineRevenue)} ({summaryStats.openDealsCount} cơ hội)
          </div>
        </div>
      </div>

      {/* ── Bảng So sánh & Chi tiết theo từng Nhân viên / Đội nhóm ── */}
      <div className="forecast-table-card">
        <div className="table-card-header">
          <div className="header-left">
            <h3>Bảng Chi Tiết Dự Báo Theo {groupBy === 'OWNER' ? 'Nhân Viên Kinh Doanh' : 'Đội Kinh Doanh'} ({getPeriodLabel()})</h3>
            <span className="header-count">{groupedData.length} đối tượng</span>
          </div>
          {selectedGroupKey !== 'ALL' && (
            <button
              type="button"
              className="btn-clear-group-filter"
              onClick={() => setSelectedGroupKey('ALL')}
            >
              ✕ Bỏ lọc "{selectedGroupKey}" (Xem tất cả)
            </button>
          )}
        </div>

        {groupedData.length === 0 ? (
          <div className="forecast-empty-table">
            <p>Không có dữ liệu cơ hội bán hàng nào trong kỳ {getPeriodLabel()}.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="forecast-summary-table">
              <thead>
                <tr>
                  <th>{groupBy === 'OWNER' ? 'Nhân viên kinh doanh' : 'Đội nhóm'}</th>
                  {groupBy === 'OWNER' && <th>Đội nhóm</th>}
                  <th style={{ textAlign: 'center' }}>Số deal mở / Thắng</th>
                  <th style={{ textAlign: 'right' }}>Tổng Pipeline</th>
                  <th style={{ textAlign: 'right' }}>Doanh số dự báo (Weighted)</th>
                  <th style={{ textAlign: 'right' }}>Đã chốt thực tế</th>
                  <th style={{ textAlign: 'right' }}>Chỉ tiêu giao</th>
                  <th style={{ textAlign: 'center', width: '180px' }}>Tiến độ vs Chỉ tiêu</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((item) => {
                  const forecastPercent = item.targetQuota > 0 ? Math.round((item.forecastRevenue / item.targetQuota) * 100) : 0
                  const actualPercent = item.targetQuota > 0 ? Math.round((item.actualClosedRevenue / item.targetQuota) * 100) : 0
                  const isSelected = selectedGroupKey === item.key

                  return (
                    <tr
                      key={item.key}
                      className={`forecast-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => setSelectedGroupKey(isSelected ? 'ALL' : item.key)}
                    >
                      <td className="font-bold">
                        <div className="entity-name-cell">
                          <span>{item.name}</span>
                          {isSelected && <span className="selected-tag">Đang chọn</span>}
                        </div>
                      </td>
                      {groupBy === 'OWNER' && (
                        <td>
                          <span className="team-badge">{item.teamName}</span>
                        </td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge-deal-count open-count">{item.openCount} đang mở</span>
                        {item.wonCount > 0 && (
                          <span className="badge-deal-count won-count"> / {item.wonCount} thắng</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-primary font-bold">
                          {formatCurrency(item.forecastRevenue)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-success font-bold">
                          {formatCurrency(item.actualClosedRevenue)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="text-slate">{formatCurrency(item.targetQuota)}</span>
                      </td>
                      <td>
                        <div className="quota-progress-cell">
                          <div className="progress-bar-track">
                            <div
                              className="progress-bar-forecast"
                              style={{ width: `${Math.min(forecastPercent, 100)}%` }}
                              title={`Dự báo: ${forecastPercent}% chỉ tiêu`}
                            />
                            <div
                              className="progress-bar-actual"
                              style={{ width: `${Math.min(actualPercent, 100)}%` }}
                              title={`Đã chốt: ${actualPercent}% chỉ tiêu`}
                            />
                          </div>
                          <div className="progress-labels">
                            <span className="lbl-forecast">Dự báo: {forecastPercent}%</span>
                            <span className="lbl-actual">Chốt: {actualPercent}%</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-filter-deals"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGroupKey(isSelected ? 'ALL' : item.key)
                          }}
                        >
                          {isSelected ? 'Bỏ chọn' : 'Xem deals'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Danh sách cơ hội chi tiết đóng góp vào Dự báo ── */}
      <div className="forecast-deals-detail-card">
        <div className="table-card-header">
          <div className="header-left">
            <h4>
              Danh sách Cơ hội đóng góp vào Dự báo {selectedGroupKey !== 'ALL' ? `(Của: ${selectedGroupKey})` : `(${getPeriodLabel()})`}
            </h4>
            <span className="header-count">{displayDeals.length} cơ hội</span>
          </div>
          <span className="formula-hint-badge">
            Công thức: Trọng số = Giá trị cơ hội × (Xác suất % / 100)
          </span>
        </div>

        {displayDeals.length === 0 ? (
          <div className="forecast-empty-table">
            <p>Không có cơ hội nào thỏa mãn tiêu chí lọc.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="forecast-deals-table">
              <thead>
                <tr>
                  <th>Mã cơ hội</th>
                  <th>Tên cơ hội / Khách hàng</th>
                  <th>Giai đoạn Pipeline</th>
                  <th style={{ textAlign: 'center' }}>Xác suất thắng</th>
                  <th style={{ textAlign: 'right' }}>Giá trị cơ hội</th>
                  <th style={{ textAlign: 'right' }}>Doanh số dự báo (Weighted)</th>
                  <th>Ngày dự kiến / Chốt</th>
                  <th>Người phụ trách</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {displayDeals.map((opp) => {
                  const weightedVal = opp.status === 'WON'
                    ? (opp.actual_revenue || opp.expected_revenue)
                    : (opp.expected_revenue * (opp.win_probability || 0)) / 100

                  return (
                    <tr key={opp.id} className="deal-item-row">
                      <td className="font-mono">{opp.code}</td>
                      <td>
                        <div className="deal-title-block">
                          <strong className="deal-name">{opp.title}</strong>
                          <span className="deal-customer">🏢 {opp.customer_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="stage-pill" style={{ borderColor: opp.stage_color || '#2563eb' }}>
                          {opp.stage_name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="deal-prob-badge">{opp.win_probability}%</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="deal-expected-revenue">
                          {formatCurrency(opp.expected_revenue)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="deal-weighted-val text-primary">
                          {formatCurrency(weightedVal)}
                        </strong>
                      </td>
                      <td>
                        <span className="deal-date">
                          {opp.status === 'WON' && opp.actual_close_date
                            ? `✓ Ký: ${opp.actual_close_date}`
                            : (opp.expected_close_date || '—')}
                        </span>
                      </td>
                      <td>
                        <span className="deal-owner-tag">{opp.owner_name}</span>
                      </td>
                      <td>
                        <span className={`status-pill pill-${opp.status.toLowerCase()}`}>
                          {opp.status === 'WON' ? 'Thắng' : opp.status === 'LOST' ? 'Thua' : 'Đang mở'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {onOpenOpportunityDetail && (
                          <button
                            type="button"
                            className="btn-view-deal"
                            onClick={() => onOpenOpportunityDetail(opp)}
                            title="Xem chi tiết cơ hội"
                          >
                            Xem
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
