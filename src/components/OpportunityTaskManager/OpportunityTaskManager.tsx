import { useState, useEffect, useCallback } from 'react'
import type {
  OpportunityTask,
  OpportunityTaskStatus,
  OpportunityTaskPriority,
  OpportunityReminderType,
  CreateOpportunityTaskPayload,
  UpdateOpportunityTaskPayload,
} from '../../types/opportunity.ts'
import { opportunityTaskService } from '../../services/opportunityTaskService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityTaskManager.css'

interface OpportunityTaskManagerProps {
  opportunityId: string
  opportunityTitle?: string
  onTasksChanged?: () => void
}

/* ─────────── Inline SVG Icons ─────────── */
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default function OpportunityTaskManager({
  opportunityId,
  opportunityTitle,
  onTasksChanged,
}: OpportunityTaskManagerProps) {
  const { user } = useAuth()

  // State
  const [tasks, setTasks] = useState<OpportunityTask[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<OpportunityTask | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<{
    title: string
    description: string
    assigned_to_name: string
    due_date: string
    due_time: string
    priority: OpportunityTaskPriority
    status: OpportunityTaskStatus
    reminder_type: OpportunityReminderType
  }>({
    title: '',
    description: '',
    assigned_to_name: '',
    due_date: '',
    due_time: '17:00',
    priority: 'MEDIUM',
    status: 'TODO',
    reminder_type: '1_DAY_BEFORE',
  })

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!opportunityId) return
    setLoading(true)
    setError(null)
    try {
      const data = await opportunityTaskService.getTasks(opportunityId)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách công việc.')
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTask(null)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    setFormData({
      title: '',
      description: '',
      assigned_to_name: user?.full_name || 'Nguyễn Văn An',
      due_date: nextWeek.toISOString().split('T')[0],
      due_time: '17:00',
      priority: 'MEDIUM',
      status: 'TODO',
      reminder_type: '1_DAY_BEFORE',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (task: OpportunityTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      assigned_to_name: task.assigned_to_name,
      due_date: task.due_date,
      due_time: task.due_time || '17:00',
      priority: task.priority,
      status: task.status,
      reminder_type: task.reminder_type,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Toggle complete nhanh
  const handleToggleComplete = async (taskId: string) => {
    try {
      await opportunityTaskService.toggleTaskComplete(taskId)
      await loadTasks()
      if (onTasksChanged) onTasksChanged()
    } catch {
      alert('Không thể cập nhật trạng thái công việc.')
    }
  }

  // Delete task
  const handleDelete = async (taskId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${title}"?`)) return
    try {
      await opportunityTaskService.deleteTask(taskId)
      await loadTasks()
      if (onTasksChanged) onTasksChanged()
    } catch {
      alert('Không thể xóa công việc.')
    }
  }

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề công việc.')
      return
    }
    if (!formData.due_date) {
      setFormError('Vui lòng chọn thời hạn hoàn thành.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingTask) {
        // Cập nhật công việc
        const updatePayload: UpdateOpportunityTaskPayload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          assigned_to_name: formData.assigned_to_name.trim(),
          due_date: formData.due_date,
          due_time: formData.due_time,
          priority: formData.priority,
          status: formData.status,
          reminder_type: formData.reminder_type,
          is_completed: formData.status === 'COMPLETED',
        }
        await opportunityTaskService.updateTask(editingTask.id, updatePayload)
      } else {
        // Tạo mới công việc
        const createPayload: CreateOpportunityTaskPayload = {
          opportunity_id: opportunityId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          assigned_to_name: formData.assigned_to_name.trim() || user?.full_name || 'Người dùng',
          due_date: formData.due_date,
          due_time: formData.due_time,
          priority: formData.priority,
          reminder_type: formData.reminder_type,
        }
        await opportunityTaskService.createTask(createPayload)
      }

      setIsModalOpen(false)
      await loadTasks()
      if (onTasksChanged) onTasksChanged()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi khi lưu công việc.')
    } finally {
      setSubmitting(false)
    }
  }

  // Kiểm tra quá hạn
  const todayStr = new Date().toISOString().split('T')[0]
  const isOverdue = (task: OpportunityTask) => {
    return !task.is_completed && task.due_date < todayStr
  }

  // Lọc công việc
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'TODO' && (task.is_completed || task.status === 'COMPLETED')) return false
    if (statusFilter === 'IN_PROGRESS' && (task.is_completed || task.status !== 'IN_PROGRESS')) return false
    if (statusFilter === 'COMPLETED' && !task.is_completed) return false
    if (statusFilter === 'OVERDUE' && !isOverdue(task)) return false

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim()
      const matchTitle = task.title.toLowerCase().includes(q)
      const matchDesc = task.description ? task.description.toLowerCase().includes(q) : false
      const matchAssignee = task.assigned_to_name.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc && !matchAssignee) return false
    }

    return true
  })

  // Thống kê nhanh
  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.is_completed).length
  const overdueCount = tasks.filter((t) => isOverdue(t)).length
  const pendingCount = totalCount - completedCount

  // Helper nhãn nhắc nhở
  const getReminderLabel = (type: OpportunityReminderType) => {
    switch (type) {
      case 'ON_DUE':
        return 'Đúng giờ hẹn'
      case '15_MIN_BEFORE':
        return 'Trước 15 phút'
      case '1_HOUR_BEFORE':
        return 'Trước 1 giờ'
      case '1_DAY_BEFORE':
        return 'Trước 1 ngày'
      case '3_DAYS_BEFORE':
        return 'Trước 3 ngày'
      case 'NONE':
      default:
        return 'Không nhắc'
    }
  }

  // Helper nhãn ưu tiên
  const getPriorityLabel = (priority: OpportunityTaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'Khẩn cấp'
      case 'HIGH':
        return 'Cao'
      case 'MEDIUM':
        return 'Trung bình'
      case 'LOW':
        return 'Thấp'
      default:
        return priority
    }
  }

  return (
    <div className="opp-task-manager-container" id="opportunity-task-manager">
      {/* ── Header ── */}
      <div className="task-manager-header">
        <div className="header-left">
          <h3 className="task-title">Quản lý Công việc & Lịch nhắc</h3>
          {opportunityTitle && (
            <span className="task-subtitle">Cơ hội: {opportunityTitle}</span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary add-task-btn"
          id="add-task-btn"
          onClick={handleOpenCreate}
        >
          <IconPlus />
          <span>Tạo công việc mới</span>
        </button>
      </div>

      {/* ── KPI Stat Summary ── */}
      <div className="task-kpi-summary">
        <div className="task-kpi-item">
          <span className="kpi-num">{totalCount}</span>
          <span className="kpi-txt">Tổng công việc</span>
        </div>
        <div className="task-kpi-item text-warning">
          <span className="kpi-num">{pendingCount}</span>
          <span className="kpi-txt">Đang cần làm</span>
        </div>
        <div className="task-kpi-item text-success">
          <span className="kpi-num">{completedCount}</span>
          <span className="kpi-txt">Đã hoàn thành</span>
        </div>
        {overdueCount > 0 && (
          <div className="task-kpi-item text-danger">
            <span className="kpi-num">{overdueCount}</span>
            <span className="kpi-txt">⚠️ Quá hạn chót</span>
          </div>
        )}
      </div>

      {/* ── Filter & Search Row ── */}
      <div className="task-filter-row">
        <div className="filter-pills">
          <button
            type="button"
            className={`task-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            className={`task-pill ${statusFilter === 'TODO' ? 'active' : ''}`}
            onClick={() => setStatusFilter('TODO')}
          >
            Cần làm ({pendingCount})
          </button>
          <button
            type="button"
            className={`task-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            Đã xong ({completedCount})
          </button>
          {overdueCount > 0 && (
            <button
              type="button"
              className={`task-pill pill-overdue ${statusFilter === 'OVERDUE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('OVERDUE')}
            >
              ⚠️ Quá hạn ({overdueCount})
            </button>
          )}
        </div>

        <div className="task-search-box">
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, người phụ trách..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="task-search-input"
            id="task-search-input"
          />
          {searchKeyword && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchKeyword('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Tasks View States: Loading / Error / Empty / List ── */}
      {loading ? (
        <div className="task-state-box loading-state">
          <div className="spinner-border" />
          <p>Đang tải danh sách công việc...</p>
        </div>
      ) : error ? (
        <div className="task-state-box error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={loadTasks}>
            Thử lại
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="task-state-box empty-state" id="task-empty-state">
          <div className="empty-illustration">📝</div>
          <h4>Chưa có công việc nào liên quan</h4>
          <p>
            {searchKeyword || statusFilter !== 'ALL'
              ? 'Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.'
              : 'Hãy tạo công việc cần làm, phân công người phụ trách và đặt lịch nhắc nhở để không bỏ lỡ cơ hội chốt deal.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            + Thêm công việc đầu tiên
          </button>
        </div>
      ) : (
        <div className="task-list-stream" id="task-list-stream">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task)
            return (
              <div
                key={task.id}
                className={`task-card-item ${task.is_completed ? 'completed' : ''} ${
                  overdue ? 'overdue' : ''
                }`}
                data-testid={`task-item-${task.id}`}
              >
                {/* Checkbox hoàn thành */}
                <div className="task-checkbox-col">
                  <button
                    type="button"
                    className={`custom-checkbox-btn ${task.is_completed ? 'checked' : ''}`}
                    onClick={() => handleToggleComplete(task.id)}
                    title={
                      task.is_completed
                        ? 'Đánh dấu chưa hoàn thành'
                        : 'Đánh dấu đã hoàn thành'
                    }
                  >
                    {task.is_completed && <IconCheck />}
                  </button>
                </div>

                {/* Nội dung công việc */}
                <div className="task-main-col">
                  <div className="task-header-line">
                    <h4 className="task-title-text">{task.title}</h4>

                    <div className="task-badges-group">
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {getPriorityLabel(task.priority)}
                      </span>

                      {overdue && (
                        <span className="overdue-badge">
                          <IconAlertCircle /> Quá hạn
                        </span>
                      )}

                      {task.reminder_type !== 'NONE' && (
                        <span className="reminder-badge" title="Lịch nhắc nhở">
                          <IconBell /> {getReminderLabel(task.reminder_type)}
                        </span>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <p className="task-desc-text">{task.description}</p>
                  )}

                  {/* Metadata: Người phụ trách & Hạn chót */}
                  <div className="task-meta-line">
                    <div className="meta-item">
                      <span className="meta-label">Phụ trách:</span>
                      <strong className="meta-val">{task.assigned_to_name}</strong>
                    </div>

                    <div className="meta-item">
                      <IconClock />
                      <span className="meta-label">Hạn chót:</span>
                      <strong className={`meta-val ${overdue ? 'text-danger' : ''}`}>
                        {task.due_date} {task.due_time ? `(${task.due_time})` : ''}
                      </strong>
                    </div>

                    <div className="meta-item">
                      <span className="meta-label">Trạng thái:</span>
                      <span className={`status-pill status-${task.status.toLowerCase()}`}>
                        {task.status === 'COMPLETED'
                          ? 'Đã xong'
                          : task.status === 'IN_PROGRESS'
                          ? 'Đang làm'
                          : 'Cần làm'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thao tác Sửa / Xóa */}
                <div className="task-actions-col">
                  <button
                    type="button"
                    className="task-action-btn edit"
                    onClick={() => handleOpenEdit(task)}
                    title="Chỉnh sửa công việc"
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    className="task-action-btn delete"
                    onClick={() => handleDelete(task.id, task.title)}
                    title="Xóa công việc"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL TẠO / SỬA CÔNG VIỆC (S5-04) ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content opp-task-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>{editingTask ? 'Chỉnh sửa công việc' : 'Tạo mới công việc liên quan cơ hội'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} id="opp-task-form">
              <div className="modal-body">
                {formError && (
                  <div className="modal-alert-error" role="alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                {/* Tiêu đề */}
                <div className="form-group">
                  <label htmlFor="task-title-input">Tiêu đề công việc *</label>
                  <input
                    id="task-title-input"
                    type="text"
                    required
                    className="form-control"
                    placeholder="VD: Soạn thảo dự thảo hợp đồng cung cấp phần mềm..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Người phụ trách & Mức độ ưu tiên */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="task-assignee-input">Người phụ trách *</label>
                    <input
                      id="task-assignee-input"
                      type="text"
                      required
                      className="form-control"
                      value={formData.assigned_to_name}
                      onChange={(e) =>
                        setFormData({ ...formData, assigned_to_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority-select">Mức độ ưu tiên *</label>
                    <select
                      id="task-priority-select"
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as OpportunityTaskPriority,
                        })
                      }
                    >
                      <option value="LOW">Thấp (Low)</option>
                      <option value="MEDIUM">Trung bình (Medium)</option>
                      <option value="HIGH">Cao (High)</option>
                      <option value="URGENT">Khẩn cấp (Urgent)</option>
                    </select>
                  </div>
                </div>

                {/* Thời hạn chót & Giờ */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="task-due-date-input">Hạn chót ngày *</label>
                    <input
                      id="task-due-date-input"
                      type="date"
                      required
                      className="form-control"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-due-time-input">Giờ hạn chót</label>
                    <input
                      id="task-due-time-input"
                      type="time"
                      className="form-control"
                      value={formData.due_time}
                      onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Lịch nhắc nhở & Trạng thái */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="task-reminder-select">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IconBell /> Lịch nhắc nhở (Reminder)
                      </span>
                    </label>
                    <select
                      id="task-reminder-select"
                      className="form-control"
                      value={formData.reminder_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reminder_type: e.target.value as OpportunityReminderType,
                        })
                      }
                    >
                      <option value="NONE">Không nhắc</option>
                      <option value="ON_DUE">Đúng giờ hạn chót</option>
                      <option value="15_MIN_BEFORE">Trước 15 phút</option>
                      <option value="1_HOUR_BEFORE">Trước 1 giờ</option>
                      <option value="1_DAY_BEFORE">Trước 1 ngày</option>
                      <option value="3_DAYS_BEFORE">Trước 3 ngày</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-status-select">Trạng thái công việc</label>
                    <select
                      id="task-status-select"
                      className="form-control"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as OpportunityTaskStatus,
                        })
                      }
                    >
                      <option value="TODO">Cần làm (TODO)</option>
                      <option value="IN_PROGRESS">Đang thực hiện (In Progress)</option>
                      <option value="COMPLETED">Đã hoàn thành (Completed)</option>
                    </select>
                  </div>
                </div>

                {/* Mô tả công việc */}
                <div className="form-group">
                  <label htmlFor="task-desc-textarea">Mô tả chi tiết công việc</label>
                  <textarea
                    id="task-desc-textarea"
                    rows={3}
                    className="form-control"
                    placeholder="Ghi chú các bước thực hiện, tài liệu cần chuẩn bị..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="submit-task-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Đang lưu...'
                    : editingTask
                    ? 'Cập nhật công việc'
                    : 'Tạo công việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
