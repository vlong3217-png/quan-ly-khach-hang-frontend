import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './ExecutiveDashboard.css'

export type DashboardRoleView = 'REP' | 'MANAGER' | 'DIRECTOR'

export default function ExecutiveDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Default initial role perspective based on user role
  const getInitialRoleView = (): DashboardRoleView => {
    if (user?.role === 'ADMIN') return 'DIRECTOR'
    if (user?.role === 'MANAGER') return 'MANAGER'
    return 'REP'
  }

  const [roleView, setRoleView] = useState<DashboardRoleView>(getInitialRoleView)

  return (
    <div className="executive-dashboard" id="executive-dashboard">
      {/* Role Switcher Toolbar (Allows reviewing all 3 tiers as requested in S8-04) */}
      <div className="role-preview-toolbar">
        <div className="role-switcher-title">
          <span>Chế độ Dashboard theo vai trò</span>
        </div>

        <div className="role-pills-group">
          <button
            type="button"
            className={`role-pill-btn ${roleView === 'REP' ? 'active' : ''}`}
            onClick={() => setRoleView('REP')}
          >
            Nhân viên kinh doanh
          </button>
          <button
            type="button"
            className={`role-pill-btn ${roleView === 'MANAGER' ? 'active' : ''}`}
            onClick={() => setRoleView('MANAGER')}
          >
            Trưởng nhóm
          </button>
          <button
            type="button"
            className={`role-pill-btn ${roleView === 'DIRECTOR' ? 'active' : ''}`}
            onClick={() => setRoleView('DIRECTOR')}
          >
            Giám đốc kinh doanh
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. GIAO DIỆN DÀNH CHO NHÂN VIÊN KINH DOANH (SALES REP)
          ───────────────────────────────────────────────────────────── */}
      {roleView === 'REP' && (
        <>
          {/* Top KPI Cards for Rep */}
          <div className="kpi-metrics-grid">
            <div className="kpi-card blue">
              <span className="kpi-label">Chỉ tiêu tháng của tôi</span>
              <span className="kpi-value">0 ₫</span>
              <span className="kpi-subtext">
                Đã đạt: <strong>0 ₫ (0%)</strong>
              </span>
            </div>

            <div className="kpi-card green">
              <span className="kpi-label">Cơ hội đang mở</span>
              <span className="kpi-value">0 cơ hội</span>
              <span className="kpi-subtext">
                Tổng giá trị dự kiến: <strong>0 ₫</strong>
              </span>
            </div>

            <div className="kpi-card amber">
              <span className="kpi-label">Việc cần làm hôm nay</span>
              <span className="kpi-value">0 công việc</span>
              <span className="kpi-subtext">Chưa có lịch hẹn hay công việc đến hạn</span>
            </div>

            <div className="kpi-card purple">
              <span className="kpi-label">Lead chưa liên hệ (Cần gọi)</span>
              <span className="kpi-value">0 tiềm năng</span>
              <span className="kpi-subtext" style={{ color: '#10b981', fontWeight: 600 }}>
                Không có lead trễ hạn SLA
              </span>
            </div>
          </div>

          {/* Two-column operational section for Rep */}
          <div className="dashboard-columns-2">
            {/* Panel: Việc hôm nay */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="panel-title">
                  <span>Công việc hôm nay của tôi</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  onClick={() => navigate('/dashboard/calendar')}
                >
                  Xem lịch ➔
                </button>
              </div>

              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có công việc nào cần xử lý hôm nay.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 12, fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => navigate('/dashboard/calendar')}
                >
                  + Lập lịch hẹn mới
                </button>
              </div>
            </div>

            {/* Panel: Lead chưa liên hệ */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="panel-title">
                  <span>Lead mới chưa liên hệ</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  onClick={() => navigate('/dashboard/lead-forms')}
                >
                  Xem tất cả lead ➔
                </button>
              </div>

              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Toàn bộ lead đã được xử lý hoặc chưa có lead mới.</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 12, fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => navigate('/dashboard/lead-forms')}
                >
                  + Thu thập lead từ Form
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. GIAO DIỆN DÀNH CHO TRƯỞNG NHÓM (SALES MANAGER)
          ───────────────────────────────────────────────────────────── */}
      {roleView === 'MANAGER' && (
        <>
          {/* Top KPI for Manager */}
          <div className="kpi-metrics-grid">
            <div className="kpi-card blue">
              <span className="kpi-label">Chỉ tiêu Đội Kinh Doanh</span>
              <span className="kpi-value">0 ₫</span>
              <span className="kpi-subtext">
                Đã đạt: <strong>0 ₫ (0%)</strong>
              </span>
            </div>

            <div className="kpi-card green">
              <span className="kpi-label">Số thành viên đang phụ trách</span>
              <span className="kpi-value">0 nhân viên</span>
              <span className="kpi-subtext">Chưa gắn nhân viên vào nhóm</span>
            </div>

            <div className="kpi-card amber">
              <span className="kpi-label">Cơ hội đình trệ (&gt; 7 ngày)</span>
              <span className="kpi-value" style={{ color: '#10b981' }}>
                0 cơ hội
              </span>
              <span className="kpi-subtext">Không có cơ hội bị đình trệ</span>
            </div>

            <div className="kpi-card purple">
              <span className="kpi-label">Việc quá hạn của nhóm</span>
              <span className="kpi-value" style={{ color: '#10b981' }}>
                0 công việc
              </span>
              <span className="kpi-subtext">Toàn bộ việc hoàn thành đúng hạn</span>
            </div>
          </div>

          {/* Section: Leaderboard & Team Health */}
          <div className="dashboard-columns-2">
            {/* Panel: Xếp hạng thành viên (Leaderboard) */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="panel-title">
                  <span>Xếp hạng thành viên trong nhóm</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  onClick={() => navigate('/dashboard/quotas')}
                >
                  Xem chỉ tiêu ➔
                </button>
              </div>

              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có số liệu phát sinh từ thành viên trong nhóm.</p>
              </div>
            </div>

            {/* Panel: Cơ hội đình trệ & Việc quá hạn */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="panel-title">
                  <span>Cơ hội đình trệ & Công việc quá hạn</span>
                </h3>
              </div>

              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Đội ngũ đang vận hành đúng tiến độ. Không có việc hoặc cơ hội nào quá hạn.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. GIAO DIỆN DÀNH CHO GIÁM ĐỐC KINH DOANH (SALES DIRECTOR)
          ───────────────────────────────────────────────────────────── */}
      {roleView === 'DIRECTOR' && (
        <>
          {/* Top High-level Executive KPI */}
          <div className="kpi-metrics-grid">
            <div className="kpi-card blue">
              <span className="kpi-label">Tổng chỉ tiêu toàn khối</span>
              <span className="kpi-value">0 ₫</span>
              <span className="kpi-subtext">Kỳ đánh giá hiện tại</span>
            </div>

            <div className="kpi-card green">
              <span className="kpi-label">Doanh số đã chốt thực tế</span>
              <span className="kpi-value" style={{ color: '#15803d' }}>
                0 ₫
              </span>
              <span className="kpi-subtext">
                <span className="kpi-badge-inc">0%</span> so với chỉ tiêu kế hoạch
              </span>
            </div>

            <div className="kpi-card amber">
              <span className="kpi-label">Dự báo theo trọng số</span>
              <span className="kpi-value" style={{ color: '#d97706' }}>
                0 ₫
              </span>
              <span className="kpi-subtext">Chưa phát sinh dữ liệu cơ hội</span>
            </div>

            <div className="kpi-card purple">
              <span className="kpi-label">Giá trị toàn bộ Pipeline</span>
              <span className="kpi-value">0 ₫</span>
              <span className="kpi-subtext">Tổng 0 cơ hội đang xúc tiến</span>
            </div>
          </div>

          {/* Section: Pipeline Distribution & Monthly Revenue Trend */}
          <div className="dashboard-columns-2">
            {/* Panel 1: Giá trị Pipeline theo giai đoạn */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="panel-title">
                  <span>Giá trị Pipeline theo giai đoạn</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tổng: 0 ₫</span>
              </div>

              <div className="empty-chart-mock-wrapper">
                {/* Visual illustrated chart frame with axes & ghost bars */}
                <div className="empty-chart-svg-container">
                  <svg viewBox="0 0 420 180" className="empty-chart-svg" preserveAspectRatio="none">
                    {/* Grid horizontal lines */}
                    <line x1="30" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="70" x2="400" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="110" x2="400" y2="110" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="150" x2="400" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />
                    {/* Y-axis line */}
                    <line x1="30" y1="20" x2="30" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />
                    {/* Y labels */}
                    <text x="24" y="34" textAnchor="end" fontSize="10" fill="#94a3b8">100M</text>
                    <text x="24" y="74" textAnchor="end" fontSize="10" fill="#94a3b8">50M</text>
                    <text x="24" y="114" textAnchor="end" fontSize="10" fill="#94a3b8">20M</text>
                    <text x="24" y="154" textAnchor="end" fontSize="10" fill="#94a3b8">0</text>
                    {/* Ghost funnel / stage bars */}
                    <rect x="55" y="65" width="45" height="85" rx="4" fill="#3b82f6" opacity="0.14" />
                    <text x="77" y="166" textAnchor="middle" fontSize="10" fill="#94a3b8">Tiếp cận</text>
                    <rect x="125" y="85" width="45" height="65" rx="4" fill="#6366f1" opacity="0.14" />
                    <text x="147" y="166" textAnchor="middle" fontSize="10" fill="#94a3b8">Đánh giá</text>
                    <rect x="195" y="105" width="45" height="45" rx="4" fill="#8b5cf6" opacity="0.14" />
                    <text x="217" y="166" textAnchor="middle" fontSize="10" fill="#94a3b8">Đề xuất</text>
                    <rect x="265" y="120" width="45" height="30" rx="4" fill="#ec4899" opacity="0.14" />
                    <text x="287" y="166" textAnchor="middle" fontSize="10" fill="#94a3b8">Đàm phán</text>
                    <rect x="335" y="135" width="45" height="15" rx="4" fill="#10b981" opacity="0.14" />
                    <text x="357" y="166" textAnchor="middle" fontSize="10" fill="#94a3b8">Chốt đơn</text>
                  </svg>
                  <div className="empty-chart-overlay">
                    <p className="empty-chart-text">Chưa có cơ hội bán hàng trong chu kỳ Pipeline</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate('/dashboard/opportunities')}
                    >
                      + Thêm cơ hội mới
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Doanh số đã chốt theo tháng (Monthly Trend) */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="panel-title">
                  <span>Doanh số đã chốt theo tháng</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Năm {new Date().getFullYear()}</span>
              </div>

              <div className="empty-chart-mock-wrapper">
                <div className="empty-chart-svg-container">
                  <svg viewBox="0 0 420 180" className="empty-chart-svg" preserveAspectRatio="none">
                    {/* Grid horizontal lines */}
                    <line x1="30" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="70" x2="400" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="110" x2="400" y2="110" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="30" y1="150" x2="400" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />
                    {/* Y-axis */}
                    <line x1="30" y1="20" x2="30" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />
                    {/* Y labels */}
                    <text x="24" y="34" textAnchor="end" fontSize="10" fill="#94a3b8">150M</text>
                    <text x="24" y="74" textAnchor="end" fontSize="10" fill="#94a3b8">100M</text>
                    <text x="24" y="114" textAnchor="end" fontSize="10" fill="#94a3b8">50M</text>
                    <text x="24" y="154" textAnchor="end" fontSize="10" fill="#94a3b8">0</text>
                    {/* Ghost trend line & dots */}
                    <path
                      d="M 50 140 Q 110 135, 170 125 T 290 115 T 390 100"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.25"
                    />
                    {/* Months along bottom */}
                    {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map((m, idx) => (
                      <g key={m}>
                        <rect x={40 + idx * 30} y="138" width="16" height="12" rx="2" fill="#10b981" opacity="0.1" />
                        <text x={48 + idx * 30} y="166" textAnchor="middle" fontSize="9" fill="#94a3b8">{m}</text>
                      </g>
                    ))}
                  </svg>
                  <div className="empty-chart-overlay">
                    <p className="empty-chart-text">Hệ thống sẵn sàng ghi nhận doanh thu khi các hợp đồng được ký duyệt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
