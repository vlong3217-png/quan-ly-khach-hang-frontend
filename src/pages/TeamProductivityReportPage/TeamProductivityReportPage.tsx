import { useState, useMemo } from 'react'
import type { ProductivityFilter } from '../../types/teamProductivity.ts'
import { teamProductivityService } from '../../services/teamProductivityService.ts'
import './TeamProductivityReportPage.css'

export default function TeamProductivityReportPage() {
  const [filter, setFilter] = useState<ProductivityFilter>({
    period_code: '2026-10',
    team_id: 'ALL',
    user_id: 'ALL',
    week: 'ALL',
    search_keyword: '',
  })

  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'leads'>('overview')
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  const members = useMemo(() => {
    return teamProductivityService.getMembersProductivity(filter)
  }, [filter])

  const leadSlas = useMemo(() => {
    return teamProductivityService.getLeadSlaDetails(filter)
  }, [filter])

  const summary = useMemo(() => {
    return teamProductivityService.calculateSummary(members)
  }, [members])

  const handleExport = () => {
    teamProductivityService.exportToExcel('Tháng 10/2026', filter)
    setExportNotice('Đã xuất báo cáo năng suất và SLA thành công (file Excel)!')
    setTimeout(() => setExportNotice(null), 4000)
  }

  const getSlaBadgeClass = (rate: number) => {
    if (rate >= 90) return 'badge-sla good'
    if (rate >= 75) return 'badge-sla warning'
    return 'badge-sla danger'
  }

  return (
    <div className="productivity-report-page" id="productivity-report-page">
      {/* ── 1. HEADER ── */}
      <div className="productivity-header">
        <div className="productivity-header-title">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
            Báo Cáo Năng Suất & Hoạt Động Đội Ngũ (S8-07)
          </h2>
          <p>
            Theo dõi số cuộc gọi, cuộc gặp, báo giá gửi đi theo từng thành viên, theo tuần và tỷ lệ phản hồi Lead trong SLA (&lt; 24h)
          </p>
        </div>

        <div className="productivity-header-actions">
          <button
            type="button"
            className="btn-export-excel"
            id="btn-export-productivity-excel"
            onClick={handleExport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Xuất Excel Báo Cáo
          </button>
        </div>
      </div>

      {exportNotice && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          ✓ {exportNotice}
        </div>
      )}

      {/* ── 2. FILTER BAR ── */}
      <div className="productivity-filter-bar">
        <div className="filter-item">
          <label>Kỳ báo cáo</label>
          <select
            value={filter.period_code}
            onChange={(e) => setFilter({ ...filter, period_code: e.target.value })}
          >
            <option value="2026-10">Tháng 10/2026</option>
            <option value="2026-09">Tháng 09/2026</option>
            <option value="2026-Q4">Quý 4/2026</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Đội nhóm</label>
          <select
            value={filter.team_id}
            onChange={(e) => setFilter({ ...filter, team_id: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) })}
          >
            <option value="ALL">Tất cả đội nhóm</option>
            <option value="1">Đội Kinh Doanh 1</option>
            <option value="2">Đội Khách Hàng Doanh Nghiệp (Enterprise)</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Nhân viên</label>
          <select
            value={filter.user_id}
            onChange={(e) => setFilter({ ...filter, user_id: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) })}
          >
            <option value="ALL">Tất cả nhân viên</option>
            <option value="1">Nguyễn Văn A</option>
            <option value="2">Trần Thị B</option>
            <option value="3">Lê Văn C</option>
            <option value="4">Phạm Thị D</option>
            <option value="5">Hoàng Văn E</option>
          </select>
        </div>

        <div className="filter-item" style={{ flexGrow: 1 }}>
          <label>Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo tên thành viên, đội nhóm hoặc khách hàng..."
            value={filter.search_keyword || ''}
            onChange={(e) => setFilter({ ...filter, search_keyword: e.target.value })}
          />
        </div>
      </div>

      {/* ── 3. SUMMARY KPI CARDS ── */}
      <div className="productivity-summary-grid">
        <div className="summary-card">
          <div className="summary-icon-box icon-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Tổng Cuộc Gọi</span>
            <span className="summary-value">{summary.total_calls.toLocaleString('vi-VN')}</span>
            <span className="summary-subtext">Đã kết nối và trao đổi</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon-box icon-purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Tổng Cuộc Gặp</span>
            <span className="summary-value">{summary.total_meetings.toLocaleString('vi-VN')}</span>
            <span className="summary-subtext">Demo & gặp trực tiếp/online</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon-box icon-amber">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Báo Giá Gửi Đi</span>
            <span className="summary-value">{summary.total_quotes_sent.toLocaleString('vi-VN')}</span>
            <span className="summary-subtext">Gửi cho khách hàng</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon-box icon-emerald">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">Tuân Thủ SLA Lead</span>
            <span className="summary-value">{summary.overall_sla_rate}%</span>
            <span className="summary-subtext">{summary.total_leads_in_sla}/{summary.total_leads_assigned} lead &lt; 24h</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon-box icon-cyan">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-label">TG Phản Hồi TB</span>
            <span className="summary-value">{summary.overall_avg_response_hours}h</span>
            <span className="summary-subtext">Kể từ khi lead tạo</span>
          </div>
        </div>
      </div>

      {/* ── 4. TABS ── */}
      <div className="productivity-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Năng Suất & Tuân Thủ SLA
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Phân Tích Hoạt Động Theo Tuần
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          Nhật Ký Phản Hồi Lead ({leadSlas.length})
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="productivity-table-wrapper">
          <table className="productivity-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Phòng ban</th>
                <th>Cuộc gọi</th>
                <th>Cuộc gặp</th>
                <th>Báo giá gửi</th>
                <th>Tổng hoạt động</th>
                <th>Lead nhận</th>
                <th>Phản hồi đúng SLA</th>
                <th>Tỷ lệ tuân thủ SLA</th>
                <th>TG phản hồi TB</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-circle">
                        {m.user_name.split(' ').slice(-1)[0][0]}
                      </div>
                      <div className="user-info-text">
                        <span className="user-info-name">{m.user_name}</span>
                        <span className="user-info-team">{m.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>{m.team_name}</td>
                  <td><strong>{m.total_calls}</strong></td>
                  <td><strong>{m.total_meetings}</strong></td>
                  <td><strong>{m.total_quotes_sent}</strong></td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{m.total_activities}</span>
                  </td>
                  <td>{m.leads_assigned}</td>
                  <td>{m.leads_responded_in_sla}</td>
                  <td>
                    <span className={getSlaBadgeClass(m.sla_compliance_rate)}>
                      {m.sla_compliance_rate}%
                    </span>
                  </td>
                  <td>{m.avg_response_time_hours} giờ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 2: WEEKLY BREAKDOWN ── */}
      {activeTab === 'weekly' && (
        <div className="productivity-table-wrapper">
          <table className="productivity-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Tuần 1 (01-07/10)</th>
                <th>Tuần 2 (08-14/10)</th>
                <th>Tuần 3 (15-21/10)</th>
                <th>Tuần 4 (22-28/10)</th>
                <th>Tổng tháng</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-circle">
                        {m.user_name.split(' ').slice(-1)[0][0]}
                      </div>
                      <div className="user-info-text">
                        <span className="user-info-name">{m.user_name}</span>
                        <span className="user-info-team">{m.team_name}</span>
                      </div>
                    </div>
                  </td>
                  {m.weekly_activities.map((w) => (
                    <td key={w.week_number}>
                      <div className="weekly-pill-group">
                        <span className="weekly-pill" title="Cuộc gọi">📞 {w.calls}</span>
                        <span className="weekly-pill" title="Cuộc gặp">🤝 {w.meetings}</span>
                        <span className="weekly-pill" title="Báo giá">📄 {w.quotes_sent}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                          = {w.total_activities}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td>
                    <strong style={{ color: '#2563eb', fontSize: '1rem' }}>
                      {m.total_activities}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 3: LEAD SLA LOGS ── */}
      {activeTab === 'leads' && (
        <div className="productivity-table-wrapper">
          <table className="productivity-table">
            <thead>
              <tr>
                <th>Khách hàng tiềm năng</th>
                <th>Công ty / Tổ chức</th>
                <th>Phụ trách</th>
                <th>Thời điểm tạo lead</th>
                <th>Phản hồi đầu tiên</th>
                <th>Thời gian xử lý</th>
                <th>Hạn SLA</th>
                <th>Trạng thái SLA</th>
              </tr>
            </thead>
            <tbody>
              {leadSlas.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.lead_name}</strong></td>
                  <td>{lead.company}</td>
                  <td>{lead.assigned_to_name}</td>
                  <td>{new Date(lead.created_at).toLocaleString('vi-VN')}</td>
                  <td>
                    {lead.first_responded_at
                      ? new Date(lead.first_responded_at).toLocaleString('vi-VN')
                      : 'Chưa phản hồi'}
                  </td>
                  <td>
                    {lead.actual_duration_hours !== undefined
                      ? `${lead.actual_duration_hours} giờ`
                      : 'N/A'}
                  </td>
                  <td>&lt; {lead.sla_limit_hours} giờ</td>
                  <td>
                    {lead.is_within_sla ? (
                      <span className="badge-sla good">✓ Trong hạn SLA</span>
                    ) : (
                      <span className="badge-sla danger">⚠ Quá hạn SLA</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
