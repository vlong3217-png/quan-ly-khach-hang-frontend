import { useState, useMemo } from 'react'
import type { MarketingRoiFilter } from '../../types/marketingRoiReport.ts'
import { marketingRoiService } from '../../services/marketingRoiService.ts'
import './MarketingRoiReportPage.css'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Card from '../../components/ui/Card.tsx'

export default function MarketingRoiReportPage() {
  const [filter, setFilter] = useState<MarketingRoiFilter>({
    period_preset: 'THIS_MONTH',
    search_keyword: '',
  })
  const [activeTab, setActiveTab] = useState<'sources' | 'campaigns'>('sources')
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  const sources = useMemo(() => {
    return marketingRoiService.getSources(filter)
  }, [filter])

  const campaigns = useMemo(() => {
    return marketingRoiService.getCampaigns(filter)
  }, [filter])

  const summary = useMemo(() => {
    return marketingRoiService.calculateSummary(sources, campaigns)
  }, [sources, campaigns])

  const handleExport = () => {
    marketingRoiService.exportToExcel('Tháng 10/2026', filter)
    setExportNotice('Đã xuất báo cáo hiệu quả nguồn Lead & chiến dịch thành công (file Excel)!')
    setTimeout(() => setExportNotice(null), 4000)
  }

  return (
    <div className="marketing-roi-page" id="marketing-roi-report-page">
      {/* ── 1. HEADER ── */}
      <PageHeader
        title="Báo Cáo Nguồn Lead & Hiệu Quả Chiến Dịch (S8-09)"
        className="marketing-roi-header"
        actions={
          <button
            type="button"
            className="btn-export-excel"
            id="btn-export-marketing-roi-excel"
            onClick={handleExport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Xuất Excel Báo Cáo
          </button>
        }
      />

      {exportNotice && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          ✓ {exportNotice}
        </div>
      )}

      {/* ── 2. FILTER BAR ── */}
      <div className="marketing-roi-filter-bar">
        <div className="filter-item">
          <label>Khoảng thời gian</label>
          <select
            value={filter.period_preset}
            onChange={(e) =>
              setFilter({
                ...filter,
                period_preset: e.target.value as MarketingRoiFilter['period_preset'],
              })
            }
          >
            <option value="THIS_MONTH">Tháng này (Tháng 10/2026)</option>
            <option value="LAST_MONTH">Tháng trước (Tháng 09/2026)</option>
            <option value="THIS_QUARTER">Quý này (Quý 4/2026)</option>
            <option value="YEAR_2026">Cả năm 2026</option>
          </select>
        </div>

        <div className="filter-item" style={{ flexGrow: 1 }}>
          <label>Tìm kiếm nguồn / chiến dịch</label>
          <input
            type="text"
            placeholder="Tìm theo tên nguồn lead, tên chiến dịch hoặc kênh tiếp thị..."
            value={filter.search_keyword || ''}
            onChange={(e) => setFilter({ ...filter, search_keyword: e.target.value })}
          />
        </div>
      </div>

      {/* ── 3. KPI SUMMARY CARDS ── */}
      <div className="marketing-roi-summary-grid">
        <div className="roi-stat-card">
          <div className="roi-icon-box roi-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="roi-stat-content">
            <span className="roi-stat-label">Tổng Lead Thu Thập</span>
            <span className="roi-stat-value">{summary.total_leads.toLocaleString('vi-VN')}</span>
            <span className="roi-stat-sub">Từ tất cả các kênh</span>
          </div>
        </div>

        <div className="roi-stat-card">
          <div className="roi-icon-box roi-emerald">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="roi-stat-content">
            <span className="roi-stat-label">Tỷ Lệ Tiếp Nhận Lead</span>
            <span className="roi-stat-value">{summary.avg_received_rate}%</span>
            <span className="roi-stat-sub">{summary.total_received_leads}/{summary.total_leads} lead được nhận</span>
          </div>
        </div>

        <div className="roi-stat-card">
          <div className="roi-icon-box roi-purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="roi-stat-content">
            <span className="roi-stat-label">Chuyển Đổi Thành Cơ Hội</span>
            <span className="roi-stat-value">{summary.avg_conversion_rate}%</span>
            <span className="roi-stat-sub">{summary.total_opportunities} cơ hội tạo ra</span>
          </div>
        </div>

        <div className="roi-stat-card">
          <div className="roi-icon-box roi-amber">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div className="roi-stat-content">
            <span className="roi-stat-label">Doanh Thu Đã Chốt</span>
            <span className="roi-stat-value">{(summary.total_won_revenue / 1000000000).toFixed(2)} tỷ ₫</span>
            <span className="roi-stat-sub">Hợp đồng Won</span>
          </div>
        </div>

        <div className="roi-stat-card">
          <div className="roi-icon-box roi-rose">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="roi-stat-content">
            <span className="roi-stat-label">ROI Tiếp Thị TB</span>
            <span className="roi-stat-value">{summary.overall_roi}%</span>
            <span className="roi-stat-sub">Lợi nhuận trên chi phí</span>
          </div>
        </div>
      </div>

      {/* ── 4. TABS ── */}
      <div className="marketing-roi-tabs">
        <button
          type="button"
          className={`roi-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          Hiệu Quả Theo Nguồn Lead ({sources.length})
        </button>
        <button
          type="button"
          className={`roi-tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Hiệu Quả Theo Chiến Dịch ROI ({campaigns.length})
        </button>
      </div>

      {/* ── TAB 1: LEAD SOURCES ── */}
      {activeTab === 'sources' && (
        <Card className="roi-table-card">
          <table className="roi-table">
            <thead>
              <tr>
                <th>Nguồn Lead</th>
                <th>Số lượng Lead</th>
                <th>Lead tiếp nhận</th>
                <th>Tỷ lệ tiếp nhận</th>
                <th>Cơ hội tạo ra</th>
                <th>Tỷ lệ chuyển đổi</th>
                <th>Tổng giá trị cơ hội</th>
                <th>Doanh thu đã chốt</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source_id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{s.source_name}</strong>
                  </td>
                  <td><strong>{s.total_leads}</strong></td>
                  <td>{s.received_leads}</td>
                  <td>
                    <div className="rate-bar-container">
                      <div className="rate-bar-bg">
                        <div className="rate-bar-fill fill-blue" style={{ width: `${Math.min(s.received_rate, 100)}%` }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{s.received_rate}%</span>
                    </div>
                  </td>
                  <td><strong>{s.converted_opportunities}</strong></td>
                  <td>
                    <div className="rate-bar-container">
                      <div className="rate-bar-bg">
                        <div className="rate-bar-fill fill-emerald" style={{ width: `${Math.min(s.conversion_rate, 100)}%` }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{s.conversion_rate}%</span>
                    </div>
                  </td>
                  <td>{(s.total_pipeline_value / 1000000).toLocaleString('vi-VN')} tr ₫</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#059669' }}>
                      {(s.won_revenue / 1000000).toLocaleString('vi-VN')} tr ₫
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── TAB 2: CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <Card className="roi-table-card">
          <table className="roi-table">
            <thead>
              <tr>
                <th>Chiến dịch Marketing</th>
                <th>Kênh tiếp thị</th>
                <th>Chi phí thực tế</th>
                <th>Lead thu về</th>
                <th>Tiếp nhận (%)</th>
                <th>Chuyển đổi (%)</th>
                <th>Doanh thu đã chốt</th>
                <th>Hiệu quả ROI</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.campaign_id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{c.campaign_name}</strong>
                  </td>
                  <td>
                    <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#475569' }}>
                      {c.channel}
                    </span>
                  </td>
                  <td>{c.actual_cost.toLocaleString('vi-VN')} ₫</td>
                  <td><strong>{c.total_leads}</strong></td>
                  <td>{c.received_rate}%</td>
                  <td><strong>{c.conversion_rate}%</strong></td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#059669' }}>
                      {c.won_revenue.toLocaleString('vi-VN')} ₫
                    </span>
                  </td>
                  <td>
                    <span className="badge-roi-high">
                      +{c.roi_percentage}% ROI
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
