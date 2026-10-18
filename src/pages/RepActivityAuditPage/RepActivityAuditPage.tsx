import { useState, useMemo } from 'react'
import type {
  RepActivityFilter,
  RepActivityType,
} from '../../types/repActivityAudit.ts'
import { repActivityAuditService } from '../../services/repActivityAuditService.ts'
import './RepActivityAuditPage.css'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Card from '../../components/ui/Card.tsx'

export default function RepActivityAuditPage() {
  const [filter, setFilter] = useState<RepActivityFilter>({
    period_preset: 'THIS_MONTH',
    activity_type: 'ALL',
    user_id: 'ALL',
    team_id: 'ALL',
    search_keyword: '',
  })
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  const activities = useMemo(() => {
    return repActivityAuditService.getActivities(filter)
  }, [filter])

  const workloads = useMemo(() => {
    return repActivityAuditService.getRepWorkloadSummaries(filter)
  }, [filter])

  const handleExport = () => {
    repActivityAuditService.exportToExcel(activities, workloads)
    setExportNotice('Đã xuất báo cáo khối lượng & nhật ký hoạt động sales thành công (file Excel)!')
    setTimeout(() => setExportNotice(null), 4000)
  }

  const renderActivityBadge = (type: RepActivityType) => {
    switch (type) {
      case 'CALL':
        return <span className="badge-act act-call">📞 Cuộc gọi</span>
      case 'MEETING':
        return <span className="badge-act act-meeting">🤝 Cuộc gặp</span>
      case 'EMAIL':
        return <span className="badge-act act-email">✉ Gửi Email</span>
      case 'QUOTE':
        return <span className="badge-act act-quote">📄 Báo giá</span>
      case 'STAGE_CHANGE':
        return <span className="badge-act act-stage">🔄 Đổi giai đoạn</span>
      default:
        return <span className="badge-act act-note">📝 Ghi chú</span>
    }
  }

  return (
    <div className="activity-audit-page" id="rep-activity-audit-page">
      {/* ── 1. HEADER ── */}
      <PageHeader
        title="Nhật Ký Hoạt Động & Khối Lượng Công Việc Sales (S8-11)"
        className="audit-header"
        actions={
          <button
            type="button"
            className="btn-export-excel"
            id="btn-export-activity-audit-excel"
            onClick={handleExport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Xuất Excel Nhật Ký
          </button>
        }
      />

      {exportNotice && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          ✓ {exportNotice}
        </div>
      )}

      {/* ── 2. FILTER BAR (AC requirement: Lọc theo khoảng thời gian, loại hoạt động, thành viên) ── */}
      <div className="audit-filter-bar">
        <div className="filter-item">
          <label>Khoảng thời gian</label>
          <select
            value={filter.period_preset}
            onChange={(e) =>
              setFilter({
                ...filter,
                period_preset: e.target.value as RepActivityFilter['period_preset'],
              })
            }
          >
            <option value="THIS_MONTH">Tháng này (Tháng 10/2026)</option>
            <option value="TODAY">Hôm nay</option>
            <option value="LAST_7_DAYS">7 ngày qua</option>
            <option value="LAST_MONTH">Tháng trước (Tháng 09/2026)</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Loại hoạt động</label>
          <select
            value={filter.activity_type}
            onChange={(e) =>
              setFilter({
                ...filter,
                activity_type: e.target.value as RepActivityType | 'ALL',
              })
            }
          >
            <option value="ALL">Tất cả loại hoạt động</option>
            <option value="CALL">Cuộc gọi (Call)</option>
            <option value="MEETING">Cuộc gặp (Meeting)</option>
            <option value="EMAIL">Gửi Email</option>
            <option value="QUOTE">Báo giá (Quote)</option>
            <option value="STAGE_CHANGE">Chuyển giai đoạn (Pipeline)</option>
            <option value="NOTE">Ghi chú (Note)</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Thành viên</label>
          <select
            value={filter.user_id}
            onChange={(e) =>
              setFilter({
                ...filter,
                user_id: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value),
              })
            }
          >
            <option value="ALL">Tất cả thành viên</option>
            <option value="1">Nguyễn Văn A</option>
            <option value="2">Trần Thị B</option>
            <option value="3">Lê Văn C</option>
            <option value="4">Phạm Thị D</option>
            <option value="5">Hoàng Văn E</option>
          </select>
        </div>

        <div className="filter-item" style={{ flexGrow: 1 }}>
          <label>Tìm kiếm nhanh</label>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung hoặc tên khách hàng..."
            value={filter.search_keyword || ''}
            onChange={(e) => setFilter({ ...filter, search_keyword: e.target.value })}
          />
        </div>
      </div>

      {/* ── 3. WORKLOAD SUMMARY (AC requirement: Hiển thị tổng số hoạt động theo từng thành viên) ── */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
          Tổng số hoạt động theo từng thành viên ({workloads.length} nhân sự)
        </h3>
        <div className="workload-grid">
          {workloads.map((w) => (
            <div className="workload-card" key={w.user_id}>
              <div className="workload-header">
                <div className="workload-user-info">
                  <div className="workload-avatar">
                    {w.user_name.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <div className="workload-name">{w.user_name}</div>
                    <div className="workload-sub">{w.role} • {w.team_name}</div>
                  </div>
                </div>
                <div className="workload-total-badge" title="Tổng số hoạt động thực hiện">
                  {w.total_activities}
                </div>
              </div>

              <div className="workload-chips">
                <span className="chip-item">📞 {w.calls_count} gọi</span>
                <span className="chip-item">🤝 {w.meetings_count} gặp</span>
                <span className="chip-item">✉ {w.emails_count} email</span>
                <span className="chip-item">📄 {w.quotes_count} báo giá</span>
                <span className="chip-item">📝 {w.notes_and_others} khác</span>
              </div>

              <div className="workload-distribution-bar">
                <div className="distribution-label">
                  <span>Tỷ trọng đóng góp</span>
                  <span>{w.workload_share_percentage}%</span>
                </div>
                <div className="distribution-progress-bg">
                  <div
                    className="distribution-progress-fill"
                    style={{ width: `${w.workload_share_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. DETAILED ACTIVITY AUDIT TABLE ── */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0f172a' }}>
          Nhật ký hoạt động chi tiết ({activities.length} bản ghi)
        </h3>
        <Card className="activity-table-card">
          <table className="activity-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Thời gian</th>
                <th style={{ width: '180px' }}>Người thực hiện</th>
                <th style={{ width: '150px' }}>Loại hoạt động</th>
                <th style={{ width: '220px' }}>Đối tượng tác động</th>
                <th>Tiêu đề & Nội dung</th>
                <th style={{ width: '120px' }}>Thời lượng</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {new Date(act.timestamp).toLocaleDateString('vi-VN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{act.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.team_name}</div>
                  </td>
                  <td>{renderActivityBadge(act.activity_type)}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                      [{act.target_type}]
                    </span>
                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.8125rem' }}>
                      {act.target_name}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4 }}>
                      {act.content}
                    </div>
                  </td>
                  <td>
                    {act.duration_minutes ? (
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {act.duration_minutes} phút
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
