import { useState, useEffect, useMemo } from 'react'
import { opportunityTaskService } from '../../services/opportunityTaskService.ts'
import { userService } from '../../services/userService.ts'
import type { User } from '../../types/auth.ts'
import type { OpportunityTask } from '../../types/opportunity.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './TaskSlaAlerts.css'

interface TaskSlaAlertsProps {
  onNavigateToCalendar?: () => void
  onNavigateToOpportunities?: () => void
}

/* ─────────── Inline SVG Icons ─────────── */
const IconAlertTriangle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export default function TaskSlaAlerts({
  onNavigateToCalendar,
  onNavigateToOpportunities,
}: TaskSlaAlertsProps) {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Data state
  const [tasks, setTasks] = useState<OpportunityTask[]>([])
  const [teamUsers, setTeamUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Configurable reminder threshold (S6-09 AC: Nhắc trong ứng dụng trước hạn theo mốc cấu hình được)
  const [reminderThreshold, setReminderThreshold] = useState<string>(() => {
    return localStorage.getItem('crm_task_reminder_threshold') || '1_DAY'
  })
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false)

  // Manager filter for specific team member
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('ALL')

  // Load tasks & users
  const loadData = async () => {
    setLoading(true)
    try {
      const [taskList, usersRes] = await Promise.all([
        opportunityTaskService.getTasks(),
        userService.getUsers().catch(() => ({ users: [] })),
      ])
      setTasks(taskList)
      if (usersRes && usersRes.users) {
        setTeamUsers(usersRes.users)
      }
    } catch (err) {
      console.error('Error loading task SLA data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveThreshold = (val: string) => {
    setReminderThreshold(val)
    localStorage.setItem('crm_task_reminder_threshold', val)
    setIsConfigOpen(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const todayMs = new Date().getTime()

  // Calculate reminder window in milliseconds
  const reminderWindowMs = useMemo(() => {
    switch (reminderThreshold) {
      case '15_MIN':
        return 15 * 60 * 1000
      case '1_HOUR':
        return 60 * 60 * 1000
      case '1_DAY':
        return 24 * 60 * 60 * 1000
      case '3_DAYS':
        return 3 * 24 * 60 * 60 * 1000
      case '7_DAYS':
        return 7 * 24 * 60 * 60 * 1000
      default:
        return 24 * 60 * 60 * 1000
    }
  }, [reminderThreshold])

  // Helper check if task is assigned to current user
  const isAssignedToMe = (task: OpportunityTask) => {
    if (!user) return false
    if (task.assigned_to_id && user.id && Number(task.assigned_to_id) === Number(user.id)) return true
    if (task.assigned_to_name && user.full_name) {
      return task.assigned_to_name.toLowerCase().includes(user.full_name.toLowerCase())
    }
    return false
  }

  // 1. Personal Overdue Tasks (S6-09 AC: Việc quá hạn hiển thị nổi bật trên trang chủ cá nhân)
  const myOverdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.is_completed || t.status === 'COMPLETED' || t.status === 'POSTPONED') return false
      if (!isAssignedToMe(t)) return false
      return t.due_date < todayStr
    })
  }, [tasks, user, todayStr])

  // 2. Personal Upcoming Tasks (Due within configured window)
  const myUpcomingTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.is_completed || t.status === 'COMPLETED' || t.status === 'POSTPONED') return false
      if (!isAssignedToMe(t)) return false
      if (t.due_date < todayStr) return false // Already overdue

      const taskDueMs = new Date(`${t.due_date}T${t.due_time || '18:00'}:00`).getTime()
      return taskDueMs >= todayMs && taskDueMs - todayMs <= reminderWindowMs
    })
  }, [tasks, user, todayStr, todayMs, reminderWindowMs])

  // 3. Manager View: Breakdown of Overdue Tasks by Team Member (S6-09 AC: Trưởng nhóm thấy tổng số việc quá hạn của từng thành viên)
  const teamMemberBreakdown = useMemo(() => {
    if (!isManagerOrAdmin) return []

    // Map each team member to their task stats
    return teamUsers.map((member) => {
      const memberTasks = tasks.filter((t) => {
        if (t.assigned_to_id && Number(t.assigned_to_id) === Number(member.id)) return true
        if (t.assigned_to_name && (member.full_name || member.email)) {
          return t.assigned_to_name.toLowerCase().includes((member.full_name || member.email).toLowerCase())
        }
        return false
      })

      const total = memberTasks.length
      const completed = memberTasks.filter((t) => t.is_completed || t.status === 'COMPLETED').length
      const overdue = memberTasks.filter((t) => !t.is_completed && t.status !== 'POSTPONED' && t.due_date < todayStr).length
      const pending = total - completed - overdue

      return {
        member,
        total,
        completed,
        overdue,
        pending,
        overdueTaskList: memberTasks.filter((t) => !t.is_completed && t.status !== 'POSTPONED' && t.due_date < todayStr),
      }
    }).sort((a, b) => b.overdue - a.overdue) // Sort highest overdue first
  }, [tasks, teamUsers, isManagerOrAdmin, todayStr])

  const totalTeamOverdueCount = useMemo(() => {
    return tasks.filter((t) => !t.is_completed && t.status !== 'POSTPONED' && t.due_date < todayStr).length
  }, [tasks, todayStr])

  // Quick action: Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await opportunityTaskService.toggleTaskComplete(taskId)
      await loadData()
    } catch {
      alert('Không thể cập nhật trạng thái công việc.')
    }
  }

  // Label for reminder threshold
  const getThresholdLabel = (val: string) => {
    switch (val) {
      case '15_MIN':
        return 'Trước 15 phút'
      case '1_HOUR':
        return 'Trước 1 giờ'
      case '1_DAY':
        return 'Trước 1 ngày (Mặc định)'
      case '3_DAYS':
        return 'Trước 3 ngày'
      case '7_DAYS':
        return 'Trước 1 tuần'
      default:
        return 'Trước 1 ngày'
    }
  }

  if (loading) {
    return (
      <div className="task-sla-alerts-container" id="task-sla-alerts-loading">
        <div className="sla-skeleton-container">
          <div className="sla-skeleton-card">
            <div className="sla-skeleton-line short"></div>
            <div className="sla-skeleton-line medium"></div>
            <div className="sla-skeleton-line full"></div>
          </div>
          <div className="sla-skeleton-card">
            <div className="sla-skeleton-line short"></div>
            <div className="sla-skeleton-line medium"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="task-sla-alerts-container" id="task-sla-alerts">
      {/* ── 1. PROMINENT OVERDUE TASKS BANNER ON HOME (S6-09) ── */}
      {myOverdueTasks.length > 0 && (
        <div className="home-overdue-alert-card" id="home-overdue-alert-card">
          <div className="overdue-card-header">
            <div className="alert-siren-group">
              <span className="siren-pulse-badge">
                <IconAlertTriangle /> CẢNH BÁO QUÁ HẠN
              </span>
              <h3>Bạn có {myOverdueTasks.length} công việc đã quá hạn chót cần xử lý gấp!</h3>
            </div>
            <div className="header-actions">
              {onNavigateToCalendar && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onNavigateToCalendar}
                  title="Mở Lịch làm việc"
                >
                  <IconClock /> Xem Lịch
                </button>
              )}
              {onNavigateToOpportunities && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onNavigateToOpportunities}
                  title="Mở Cơ hội bán hàng"
                >
                  Xem Cơ hội
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setIsConfigOpen(true)}
                title="Cấu hình mốc nhắc việc"
              >
                <IconSettings /> Mốc nhắc: {getThresholdLabel(reminderThreshold)}
              </button>
            </div>
          </div>

          <div className="overdue-task-items-list">
            {myOverdueTasks.map((t) => (
              <div key={t.id} className="overdue-task-item">
                <div className="overdue-item-left">
                  <span className="overdue-tag">Quá hạn</span>
                  <div className="overdue-info">
                    <h4 className="task-title-txt">{t.title}</h4>
                    <div className="task-meta-txt">
                      <span>Hạn chót: <strong>{t.due_date} {t.due_time || ''}</strong></span>
                      {t.customer_name && <span>Khách: <strong>{t.customer_name}</strong></span>}
                      {t.opportunity_title && <span>Deal: <strong>{t.opportunity_title}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="overdue-item-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-success btn-quick-done"
                    onClick={() => handleCompleteTask(t.id)}
                    title="Đánh dấu đã hoàn thành"
                  >
                    <IconCheck /> Hoàn thành
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. UPCOMING TASKS REMINDER BANNER (S6-09 AC: Nhắc việc sắp đến hạn theo mốc cấu hình) ── */}
      {myUpcomingTasks.length > 0 && (
        <div className="home-upcoming-alert-card" id="home-upcoming-alert-card">
          <div className="upcoming-header">
            <div className="upcoming-title-group">
              <IconBell />
              <h4>Công việc sắp đến hạn ({myUpcomingTasks.length} việc trong {getThresholdLabel(reminderThreshold).toLowerCase()})</h4>
            </div>
            <button
              type="button"
              className="btn btn-link btn-sm"
              onClick={() => setIsConfigOpen(true)}
            >
              Đổi mốc nhắc
            </button>
          </div>

          <div className="upcoming-items-grid">
            {myUpcomingTasks.map((t) => (
              <div key={t.id} className="upcoming-task-chip">
                <div className="chip-content">
                  <strong>{t.title}</strong>
                  <span className="due-info">Hạn: {t.due_date} {t.due_time || ''}</span>
                  {t.customer_name && <span className="cust-info">{t.customer_name}</span>}
                </div>
                <button
                  type="button"
                  className="btn-mark-done"
                  onClick={() => handleCompleteTask(t.id)}
                  title="Xong việc"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. MANAGER OVERVIEW: OVERDUE SLA BREAKDOWN BY MEMBER (S6-09 AC: Trưởng nhóm thấy tổng số việc quá hạn của từng thành viên) ── */}
      {isManagerOrAdmin && (
        <div className="manager-team-sla-card" id="manager-team-sla-card">
          <div className="manager-sla-header">
            <div className="title-left">
              <div>
                <h3>
                  {user?.role === 'ADMIN'
                    ? 'Bảng theo dõi tiến độ nhân viên (Toàn hệ thống)'
                    : 'Theo dõi việc quá hạn thành viên nhóm'}
                </h3>
                <span className="sub-text">
                  {user?.role === 'ADMIN'
                    ? 'Tổng hợp tiến độ xử lý và công việc trễ hạn theo từng nhân viên trong toàn hệ thống'
                    : 'Tổng hợp tiến độ xử lý và công việc trễ hạn theo từng nhân viên kinh doanh'}
                </span>
              </div>
            </div>

            <div className="total-sla-stat">
              <span className="num-overdue-total">{totalTeamOverdueCount}</span>
              <span className="txt-overdue">
                {user?.role === 'ADMIN' ? 'Việc quá hạn toàn hệ thống' : 'Việc quá hạn toàn nhóm'}
              </span>
            </div>
          </div>

          {/* Member Breakdown Table */}
          <div className="member-sla-table-wrapper">
            <table className="table member-sla-table">
              <thead>
                <tr>
                  <th>Thành viên kinh doanh</th>
                  <th>Vai trò</th>
                  <th style={{ textAlign: 'center' }}>Tổng việc</th>
                  <th style={{ textAlign: 'center' }}>Đang làm</th>
                  <th style={{ textAlign: 'center' }}>Đã xong</th>
                  <th style={{ textAlign: 'center', color: '#dc2626' }}>⚠️ Việc quá hạn</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {teamMemberBreakdown.map((row) => (
                  <tr key={row.member.id} className={row.overdue > 0 ? 'row-has-overdue' : ''}>
                    <td>
                      <div className="member-name-cell">
                        <span className="avatar-letter">
                          {(row.member.full_name || row.member.email).charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{row.member.full_name || row.member.email}</strong>
                          <span className="email-hint">{row.member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-tag">{row.member.role}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{row.total}</td>
                    <td style={{ textAlign: 'center' }}>{row.pending}</td>
                    <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{row.completed}</td>
                    <td style={{ textAlign: 'center' }}>
                      {row.overdue > 0 ? (
                        <span className="badge-overdue-count">
                          {row.overdue} việc trễ hạn
                        </span>
                      ) : (
                        <span className="badge-on-time">Đúng hạn</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {row.overdue > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            setSelectedMemberFilter(
                              selectedMemberFilter === String(row.member.id) ? 'ALL' : String(row.member.id)
                            )
                          }
                        >
                          {selectedMemberFilter === String(row.member.id) ? 'Ẩn việc' : 'Xem việc trễ'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded Overdue Details for Selected Member */}
          {selectedMemberFilter !== 'ALL' && (() => {
            const selectedRow = teamMemberBreakdown.find((r) => String(r.member.id) === selectedMemberFilter)
            if (!selectedRow || selectedRow.overdueTaskList.length === 0) return null

            return (
              <div className="manager-member-overdue-detail-box">
                <h5>
                  Danh sách việc quá hạn của <strong>{selectedRow.member.full_name || selectedRow.member.email}</strong> ({selectedRow.overdueTaskList.length} việc):
                </h5>
                <div className="overdue-detail-grid">
                  {selectedRow.overdueTaskList.map((t) => (
                    <div key={t.id} className="detail-overdue-card">
                      <strong>{t.title}</strong>
                      <div className="meta">
                        <span>Hạn: <strong>{t.due_date}</strong></span>
                        {t.customer_name && <span>Khách: {t.customer_name}</span>}
                        {t.opportunity_title && <span>Deal: {t.opportunity_title}</span>}
                      </div>
                      {t.description && <p className="desc">{t.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── MODAL CẤU HÌNH MỐC NHẮC HẠN (S6-09 AC: Mốc cấu hình được) ── */}
      {isConfigOpen && (
        <div className="task-config-modal-overlay" onClick={() => setIsConfigOpen(false)}>
          <div
            className="task-config-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>⚙️ Cấu hình mốc nhắc hạn công việc (S6-09)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsConfigOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                Hệ thống sẽ gửi cảnh báo và hiển thị nổi bật trên Bảng điều khiển đối với các công việc sắp đến hạn trong khoảng thời gian bạn chọn:
              </p>

              <div className="config-radio-options">
                {[
                  { val: '15_MIN', label: 'Trước 15 phút' },
                  { val: '1_HOUR', label: 'Trước 1 giờ' },
                  { val: '1_DAY', label: 'Trước 1 ngày (Mặc định gợi ý)' },
                  { val: '3_DAYS', label: 'Trước 3 ngày' },
                  { val: '7_DAYS', label: 'Trước 1 tuần' },
                ].map((opt) => (
                  <label key={opt.val} className={`config-option-row ${reminderThreshold === opt.val ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="reminderThreshold"
                      checked={reminderThreshold === opt.val}
                      onChange={() => handleSaveThreshold(opt.val)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsConfigOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
