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
import { userService } from '../../services/userService.ts'
import type { User } from '../../types/auth.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityTaskManager.css'

interface OpportunityTaskManagerProps {
  opportunityId?: string
  opportunityTitle?: string
  customerId?: string
  customerName?: string
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
  customerId,
  customerName,
  onTasksChanged,
}: OpportunityTaskManagerProps) {
  const { user } = useAuth()

  // State
  const [tasks, setTasks] = useState<OpportunityTask[]>([])
  const [teamUsers, setTeamUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<OpportunityTask | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Postpone Modal State (S6-06)
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState<boolean>(false)
  const [postponingTask, setPostponingTask] = useState<OpportunityTask | null>(null)
  const [postponeDueDate, setPostponeDueDate] = useState<string>('')
  const [postponeReason, setPostponeReason] = useState<string>('')
  const [postponeError, setPostponeError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<{
    title: string
    description: string
    assigned_to_id?: number
    assigned_to_name: string
    customer_name: string
    due_date: string
    due_time: string
    priority: OpportunityTaskPriority
    status: OpportunityTaskStatus
    reminder_type: OpportunityReminderType
  }>({
    title: '',
    description: '',
    assigned_to_id: user?.id ? Number(user.id) : undefined,
    assigned_to_name: user?.full_name || 'Người dùng',
    customer_name: customerName || '',
    due_date: '',
    due_time: '17:00',
    priority: 'MEDIUM',
    status: 'TODO',
    reminder_type: '1_DAY_BEFORE',
  })

  // Load team users for assignment (Trưởng nhóm giao việc)
  useEffect(() => {
    userService
      .getUsers()
      .then((res) => {
        if (res && res.users) {
          setTeamUsers(res.users)
        }
      })
      .catch(() => {})
  }, [])

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await opportunityTaskService.getTasks(opportunityId)
      // Filter by customer if opportunityId is not specified
      const filtered = customerId && !opportunityId
        ? data.filter((t) => t.customer_id === customerId)
        : data
      setTasks(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách công việc.')
    } finally {
      setLoading(false)
    }
  }, [opportunityId, customerId])

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
      assigned_to_id: user?.id ? Number(user.id) : undefined,
      assigned_to_name: user?.full_name || 'Người dùng',
      customer_name: customerName || '',
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
      assigned_to_id: task.assigned_to_id,
      assigned_to_name: task.assigned_to_name,
      customer_name: task.customer_name || customerName || '',
      due_date: task.due_date,
      due_time: task.due_time || '17:00',
      priority: task.priority,
      status: task.status,
      reminder_type: task.reminder_type,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open Postpone Modal (S6-06: Hoãn kèm lý do)
  const handleOpenPostpone = (task: OpportunityTask) => {
    setPostponingTask(task)
    const curDue = task.due_date ? new Date(task.due_date) : new Date()
    const newDate = new Date(curDue.getTime() + 3 * 24 * 60 * 60 * 1000)
    setPostponeDueDate(newDate.toISOString().split('T')[0])
    setPostponeReason(task.postponed_reason || '')
    setPostponeError(null)
    setIsPostponeModalOpen(true)
  }

  // Submit Postpone
  const handlePostponeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postponingTask) return
    if (!postponeDueDate) {
      setPostponeError('Vui lòng chọn thời hạn mới sau khi hoãn.')
      return
    }
    if (!postponeReason.trim()) {
      setPostponeError('Vui lòng nhập lý do hoãn công việc này (AC: Hoãn kèm lý do).')
      return
    }

    try {
      await opportunityTaskService.postponeTask(
        postponingTask.id,
        postponeDueDate,
        postponeReason.trim()
      )
      setIsPostponeModalOpen(false)
      await loadTasks()
      if (onTasksChanged) onTasksChanged()
    } catch (err) {
      setPostponeError(err instanceof Error ? err.message : 'Không thể hoãn công việc.')
    }
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
          assigned_to_id: formData.assigned_to_id,
          assigned_to_name: formData.assigned_to_name.trim(),
          customer_name: formData.customer_name.trim() || undefined,
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
          opportunity_title: opportunityTitle,
          customer_id: customerId,
          customer_name: formData.customer_name.trim() || customerName,
          title: formData.title.trim(),
          description: formData.description.trim(),
          assigned_to_id: formData.assigned_to_id,
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
    return !task.is_completed && task.status !== 'POSTPONED' && task.due_date < todayStr
  }

  // Lọc công việc
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'TODO' && (task.is_completed || task.status === 'COMPLETED' || task.status === 'POSTPONED')) return false
    if (statusFilter === 'IN_PROGRESS' && (task.is_completed || task.status !== 'IN_PROGRESS')) return false
    if (statusFilter === 'COMPLETED' && !task.is_completed) return false
    if (statusFilter === 'POSTPONED' && task.status !== 'POSTPONED') return false
    if (statusFilter === 'OVERDUE' && !isOverdue(task)) return false

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim()
      const matchTitle = task.title.toLowerCase().includes(q)
      const matchDesc = task.description ? task.description.toLowerCase().includes(q) : false
      const matchAssignee = task.assigned_to_name.toLowerCase().includes(q)
      const matchCustomer = task.customer_name ? task.customer_name.toLowerCase().includes(q) : false
      if (!matchTitle && !matchDesc && !matchAssignee && !matchCustomer) return false
    }

    return true
  })

  // Thống kê nhanh
  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.is_completed).length
  const postponedCount = tasks.filter((t) => t.status === 'POSTPONED').length
  const overdueCount = tasks.filter((t) => isOverdue(t)).length
  const pendingCount = totalCount - completedCount - postponedCount

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
            <span className="kpi-txt">Quá hạn chót</span>
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
          <button
            type="button"
            className={`task-pill ${statusFilter === 'POSTPONED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('POSTPONED')}
          >
            Đã hoãn ({postponedCount})
          </button>
          {overdueCount > 0 && (
            <button
              type="button"
              className={`task-pill pill-overdue ${statusFilter === 'OVERDUE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('OVERDUE')}
            >
              Quá hạn ({overdueCount})
            </button>
          )}
        </div>

        <div className="task-search-box">
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, người phụ trách, khách hàng..."
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
          <div className="error-icon">!</div>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={loadTasks}>
            Thử lại
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="task-state-box empty-state" id="task-empty-state">
          
          <h4>Chưa có công việc nào</h4>
          <p>
            {searchKeyword || statusFilter !== 'ALL'
              ? 'Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.'
              : 'Hãy tạo công việc cần làm, phân công người phụ trách và đặt hạn chót để không bỏ lỡ tiến độ.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            + Thêm công việc đầu tiên
          </button>
        </div>
      ) : (
        <div className="task-list-stream" id="task-list-stream">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task)
            const isPostponed = task.status === 'POSTPONED'
            return (
              <div
                key={task.id}
                className={`task-card-item ${task.is_completed ? 'completed' : ''} ${
                  overdue ? 'overdue' : ''
                } ${isPostponed ? 'postponed' : ''}`}
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

                      {isPostponed && (
                        <span className="postponed-badge" style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Đã hoãn
                        </span>
                      )}

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

                  {/* S6-06: Gắn với Khách hàng hoặc Cơ hội */}
                  {(task.customer_name || task.opportunity_title) && (
                    <div style={{ fontSize: '0.8rem', color: '#6366f1', margin: '2px 0 6px 0', display: 'flex', gap: '8px' }}>
                      {task.customer_name && <span>Khách: <strong>{task.customer_name}</strong></span>}
                      {task.opportunity_title && <span>Deal: <strong>{task.opportunity_title}</strong></span>}
                    </div>
                  )}

                  {task.description && (
                    <p className="task-desc-text">{task.description}</p>
                  )}

                  {/* Lý do hoãn (S6-06) */}
                  {isPostponed && task.postponed_reason && (
                    <div style={{ background: '#fffbeb', borderLeft: '3px solid #f59e0b', padding: '6px 10px', fontSize: '0.8rem', color: '#92400e', margin: '4px 0 8px 0', borderRadius: '0 4px 4px 0' }}>
                      <strong>Lý do hoãn:</strong> {task.postponed_reason}
                      {task.postponed_at && <span style={{ marginLeft: '8px', opacity: 0.8 }}>({task.postponed_at.slice(0, 10)})</span>}
                    </div>
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
                          : task.status === 'POSTPONED'
                          ? 'Đã hoãn'
                          : task.status === 'IN_PROGRESS'
                          ? 'Đang làm'
                          : 'Cần làm'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thao tác Sửa / Hoãn / Xóa */}
                <div className="task-actions-col">
                  {!task.is_completed && (
                    <button
                      type="button"
                      className="task-action-btn postpone"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => handleOpenPostpone(task)}
                      title="Hoãn công việc kèm lý do (S6-06)"
                    >
                      Hoãn
                    </button>
                  )}
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

      {/* ── MODAL TẠO / SỬA CÔNG VIỆC ── */}
      {isModalOpen && (
        <div className="opp-task-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="opp-task-modal-card"
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
                    <span>{formError}</span>
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

                {/* S6-06: Gắn với Khách hàng */}
                <div className="form-group">
                  <label htmlFor="task-customer-input">Gắn với Khách hàng liên quan</label>
                  <input
                    id="task-customer-input"
                    type="text"
                    className="form-control"
                    placeholder="Tên khách hàng hoặc doanh nghiệp..."
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                {/* S6-06: Người phụ trách (Trưởng nhóm giao việc cho thành viên) & Mức độ ưu tiên */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="task-assignee-select">Người thực hiện (Trưởng nhóm giao việc) *</label>
                    {teamUsers.length > 0 ? (
                      <select
                        id="task-assignee-select"
                        className="form-control"
                        value={formData.assigned_to_id || ''}
                        onChange={(e) => {
                          const uid = Number(e.target.value)
                          const u = teamUsers.find((x) => x.id === uid)
                          setFormData({
                            ...formData,
                            assigned_to_id: uid,
                            assigned_to_name: u ? (u.full_name || u.email) : formData.assigned_to_name,
                          })
                        }}
                      >
                        <option value="">-- Chọn thành viên phụ trách --</option>
                        {teamUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name || u.email} ({u.role || 'Thành viên'})
                          </option>
                        ))}
                      </select>
                    ) : (
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
                    )}
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
                      <option value="POSTPONED">Đã hoãn (Postponed)</option>
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

      {/* ── MODAL HOÃN CÔNG VIỆC KÈM LÝ DO (S6-06) ── */}
      {isPostponeModalOpen && postponingTask && (
        <div className="opp-task-modal-overlay" onClick={() => setIsPostponeModalOpen(false)}>
          <div
            className="opp-task-modal-card"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Hoãn công việc (S6-06)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsPostponeModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostponeSubmit} id="postpone-task-form">
              <div className="modal-body">
                {postponeError && (
                  <div className="modal-alert-error" role="alert">
                    <span>{postponeError}</span>
                  </div>
                )}

                <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                  Đang hoãn công việc: <strong>{postponingTask.title}</strong>
                </div>

                <div className="form-group">
                  <label htmlFor="postpone-due-date-input">Hạn chót mới sau khi hoãn *</label>
                  <input
                    id="postpone-due-date-input"
                    type="date"
                    required
                    className="form-control"
                    value={postponeDueDate}
                    onChange={(e) => setPostponeDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postpone-reason-textarea">Lý do hoãn công việc (Bắt buộc) *</label>
                  <textarea
                    id="postpone-reason-textarea"
                    required
                    rows={3}
                    className="form-control"
                    placeholder="VD: Khách hàng đi công tác nước ngoài, hẹn lại vào thứ Năm tuần tới..."
                    value={postponeReason}
                    onChange={(e) => setPostponeReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPostponeModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  id="confirm-postpone-btn"
                  style={{ background: '#f59e0b', color: '#fff', border: 'none' }}
                >
                  Xác nhận hoãn công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
