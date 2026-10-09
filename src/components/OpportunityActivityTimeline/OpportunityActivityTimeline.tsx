import { useState, useEffect, useCallback } from 'react'
import type {
  OpportunityActivity,
  OpportunityActivityType,
  CreateOpportunityActivityPayload,
} from '../../types/opportunity.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityActivityTimeline.css'

interface OpportunityActivityTimelineProps {
  opportunityId: string
  opportunityTitle?: string
  onActivityAdded?: () => void
}

/* ─────────── Inline Icons ─────────── */
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
)

const IconRefreshCw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
)

const IconCheckSquare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function OpportunityActivityTimeline({
  opportunityId,
  opportunityTitle,
  onActivityAdded,
}: OpportunityActivityTimelineProps) {
  const { user } = useAuth()

  // State danh sách và filter
  const [activities, setActivities] = useState<OpportunityActivity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // State Modal ghi nhận hoạt động
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    type: OpportunityActivityType
    title: string
    content: string
    outcome: string
    duration_minutes: string
    next_action: string
    next_action_due: string
  }>({
    type: 'CALL',
    title: '',
    content: '',
    outcome: '',
    duration_minutes: '15',
    next_action: '',
    next_action_due: '',
  })

  // Load activities
  const loadActivities = useCallback(async () => {
    if (!opportunityId) return
    setLoading(true)
    setError(null)
    try {
      const data = await opportunityActivityService.getActivities(opportunityId)
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử hoạt động cơ hội.')
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Xử lý mở modal
  const handleOpenModal = (presetType: OpportunityActivityType = 'CALL') => {
    setFormData({
      type: presetType,
      title: '',
      content: '',
      outcome: '',
      duration_minutes: presetType === 'CALL' ? '15' : presetType === 'MEETING' ? '60' : '',
      next_action: '',
      next_action_due: '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Xử lý gửi form ghi nhận hoạt động
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề hoạt động.')
      return
    }
    if (!formData.content.trim()) {
      setFormError('Vui lòng nhập nội dung chi tiết hoạt động.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      const payload: CreateOpportunityActivityPayload = {
        opportunity_id: opportunityId,
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        performed_by_id: user?.id ? Number(user.id) : undefined,
        performed_by_name: user?.full_name || 'Người dùng',
        outcome: formData.outcome.trim() || undefined,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined,
        next_action: formData.next_action.trim() || undefined,
        next_action_due: formData.next_action_due || undefined,
      }

      await opportunityActivityService.createActivity(payload)
      setIsModalOpen(false)
      await loadActivities()
      if (onActivityAdded) onActivityAdded()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi khi ghi nhận hoạt động.')
    } finally {
      setSubmitting(false)
    }
  }

  // Xử lý xóa hoạt động
  const handleDelete = async (activityId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi hoạt động này?')) return
    try {
      await opportunityActivityService.deleteActivity(activityId)
      await loadActivities()
    } catch {
      alert('Không thể xóa hoạt động. Vui lòng thử lại.')
    }
  }

  // Lọc hoạt động
  const filteredActivities = activities.filter((act) => {
    if (filterType !== 'ALL' && act.type !== filterType) {
      return false
    }
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim()
      const matchTitle = act.title.toLowerCase().includes(q)
      const matchContent = act.content.toLowerCase().includes(q)
      const matchPerformer = act.performed_by_name.toLowerCase().includes(q)
      const matchOutcome = act.outcome ? act.outcome.toLowerCase().includes(q) : false
      if (!matchTitle && !matchContent && !matchPerformer && !matchOutcome) {
        return false
      }
    }
    return true
  })

  // Helper format ngày giờ
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Helper render icon theo loại
  const renderActivityIcon = (type: OpportunityActivityType) => {
    switch (type) {
      case 'CALL':
        return <IconPhone />
      case 'EMAIL':
        return <IconMail />
      case 'MEETING':
        return <IconUsers />
      case 'NOTE':
        return <IconFileText />
      case 'STAGE_CHANGE':
        return <IconRefreshCw />
      case 'TASK':
        return <IconCheckSquare />
      case 'SYSTEM':
      default:
        return <IconSettings />
    }
  }

  // Helper nhãn loại hoạt động
  const getActivityTypeLabel = (type: OpportunityActivityType) => {
    switch (type) {
      case 'CALL':
        return 'Cuộc gọi'
      case 'EMAIL':
        return 'Email'
      case 'MEETING':
        return 'Gặp gỡ / Demo'
      case 'NOTE':
        return 'Ghi chú'
      case 'STAGE_CHANGE':
        return 'Đổi giai đoạn'
      case 'TASK':
        return 'Công việc'
      case 'SYSTEM':
        return 'Hệ thống'
      default:
        return type
    }
  }

  return (
    <div className="opp-activity-timeline-container" id="opportunity-activity-timeline">
      {/* ── Header & Action Controls ── */}
      <div className="timeline-action-bar">
        <div className="action-bar-left">
          <h3 className="timeline-title">Lịch sử tương tác & Hoạt động</h3>
          {opportunityTitle && (
            <span className="timeline-subtitle">Cơ hội: {opportunityTitle}</span>
          )}
        </div>

        <div className="action-bar-right">
          <button
            type="button"
            className="btn btn-primary log-activity-btn"
            id="log-activity-btn"
            onClick={() => handleOpenModal('CALL')}
          >
            <IconPlus />
            <span>Ghi nhận hoạt động</span>
          </button>
        </div>
      </div>

      {/* ── Quick Activity Type Shortcuts ── */}
      <div className="quick-activity-shortcuts">
        <span className="shortcuts-label">Ghi nhanh:</span>
        <button
          type="button"
          className="quick-shortcut-pill pill-call"
          onClick={() => handleOpenModal('CALL')}
        >
          <IconPhone /> Gọi điện
        </button>
        <button
          type="button"
          className="quick-shortcut-pill pill-email"
          onClick={() => handleOpenModal('EMAIL')}
        >
          <IconMail /> Gửi Email
        </button>
        <button
          type="button"
          className="quick-shortcut-pill pill-meeting"
          onClick={() => handleOpenModal('MEETING')}
        >
          <IconUsers /> Cuộc họp / Demo
        </button>
        <button
          type="button"
          className="quick-shortcut-pill pill-note"
          onClick={() => handleOpenModal('NOTE')}
        >
          <IconFileText /> Ghi chú
        </button>
      </div>

      {/* ── Filters & Search ── */}
      <div className="timeline-filter-row">
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            Tất cả ({activities.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === 'CALL' ? 'active' : ''}`}
            onClick={() => setFilterType('CALL')}
          >
            📞 Cuộc gọi ({activities.filter((a) => a.type === 'CALL').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === 'EMAIL' ? 'active' : ''}`}
            onClick={() => setFilterType('EMAIL')}
          >
            ✉️ Email ({activities.filter((a) => a.type === 'EMAIL').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === 'MEETING' ? 'active' : ''}`}
            onClick={() => setFilterType('MEETING')}
          >
            🤝 Demo / Gặp mặt ({activities.filter((a) => a.type === 'MEETING').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === 'NOTE' ? 'active' : ''}`}
            onClick={() => setFilterType('NOTE')}
          >
            📝 Ghi chú ({activities.filter((a) => a.type === 'NOTE').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === 'STAGE_CHANGE' ? 'active' : ''}`}
            onClick={() => setFilterType('STAGE_CHANGE')}
          >
            🔄 Giai đoạn ({activities.filter((a) => a.type === 'STAGE_CHANGE').length})
          </button>
        </div>

        <div className="timeline-search-box">
          <input
            type="text"
            placeholder="Tìm theo nội dung, kết quả, người làm..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="timeline-search-input"
            id="timeline-search-input"
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

      {/* ── Content View States: Loading / Error / Empty / List ── */}
      {loading ? (
        <div className="timeline-state-box loading-state">
          <div className="spinner-border" role="status" />
          <p>Đang tải lịch sử hoạt động của cơ hội...</p>
        </div>
      ) : error ? (
        <div className="timeline-state-box error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={loadActivities}>
            Thử lại
          </button>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="timeline-state-box empty-state" id="timeline-empty-state">
          <div className="empty-illustration">📭</div>
          <h4>Chưa có hoạt động nào được ghi nhận</h4>
          <p>
            {searchKeyword || filterType !== 'ALL'
              ? 'Không tìm thấy hoạt động nào phù hợp với bộ lọc hiện tại.'
              : 'Hãy ghi lại cuộc gọi, email, demo hoặc ghi chú để theo dõi toàn bộ tiến trình trao đổi của cơ hội này.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenModal('CALL')}
          >
            + Ghi nhận hoạt động đầu tiên
          </button>
        </div>
      ) : (
        <div className="timeline-stream">
          {filteredActivities.map((activity, idx) => (
            <div
              key={activity.id}
              className={`timeline-card-item type-${activity.type.toLowerCase()}`}
              data-testid={`activity-item-${idx}`}
            >
              {/* Cột mốc Timeline Icon */}
              <div className="timeline-marker">
                <div className={`marker-circle marker-${activity.type.toLowerCase()}`}>
                  {renderActivityIcon(activity.type)}
                </div>
                {idx !== filteredActivities.length - 1 && <div className="marker-line" />}
              </div>

              {/* Nội dung card hoạt động */}
              <div className="timeline-card-content">
                <div className="card-header-row">
                  <div className="card-type-badge-group">
                    <span className={`activity-badge badge-${activity.type.toLowerCase()}`}>
                      {renderActivityIcon(activity.type)}
                      <span>{getActivityTypeLabel(activity.type)}</span>
                    </span>
                    {activity.duration_minutes && (
                      <span className="duration-tag">
                        <IconClock /> {activity.duration_minutes} phút
                      </span>
                    )}
                    {activity.outcome && (
                      <span className="outcome-tag" title="Kết quả tương tác">
                        {activity.outcome}
                      </span>
                    )}
                  </div>

                  <div className="card-meta-right">
                    <span className="card-timestamp" title={activity.created_at}>
                      {formatDateTime(activity.created_at)}
                    </span>
                    {activity.type !== 'SYSTEM' && activity.type !== 'STAGE_CHANGE' && (
                      <button
                        type="button"
                        className="btn-delete-activity"
                        title="Xóa hoạt động này"
                        onClick={() => handleDelete(activity.id)}
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="card-activity-title">{activity.title}</h4>

                <p className="card-activity-body">{activity.content}</p>

                {/* Next Action Box nếu có */}
                {activity.next_action && (
                  <div className="next-action-box">
                    <div className="next-action-label">
                      <strong>Hành động tiếp theo:</strong> {activity.next_action}
                    </div>
                    {activity.next_action_due && (
                      <div className="next-action-due">
                        Hạn chót: <strong>{activity.next_action_due}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer người thực hiện */}
                <div className="card-footer-info">
                  <span className="performer-avatar">
                    {activity.performed_by_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="performer-text">
                    Người thực hiện: <strong>{activity.performed_by_name}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL GHI NHẬN HOẠT ĐỘNG MỚI (User Story S5-03) ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content opp-activity-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-title"
          >
            <div className="modal-header">
              <h3 id="activity-modal-title">Ghi nhận hoạt động tương tác</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} id="log-activity-form">
              <div className="modal-body">
                {formError && (
                  <div className="modal-alert-error" role="alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                {/* Chọn loại hoạt động */}
                <div className="form-group">
                  <label htmlFor="activity-type-select">Loại hoạt động *</label>
                  <select
                    id="activity-type-select"
                    className="form-control"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as OpportunityActivityType,
                        duration_minutes:
                          e.target.value === 'CALL'
                            ? '15'
                            : e.target.value === 'MEETING'
                            ? '60'
                            : '',
                      })
                    }
                  >
                    <option value="CALL">📞 Cuộc gọi điện thoại</option>
                    <option value="EMAIL">✉️ Gửi Email</option>
                    <option value="MEETING">🤝 Cuộc họp / Thuyết trình Demo</option>
                    <option value="NOTE">📝 Ghi chú nội bộ</option>
                    <option value="TASK">✅ Công việc phát sinh</option>
                  </select>
                </div>

                {/* Tiêu đề hoạt động */}
                <div className="form-group">
                  <label htmlFor="activity-title-input">Tiêu đề hoạt động *</label>
                  <input
                    id="activity-title-input"
                    type="text"
                    required
                    className="form-control"
                    placeholder="VD: Cuộc gọi chốt báo giá với Giám đốc IT..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Kết quả & Thời lượng */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="activity-outcome-input">Kết quả đạt được</label>
                    <input
                      id="activity-outcome-input"
                      type="text"
                      className="form-control"
                      placeholder="VD: Thành công, Đồng ý nhận báo giá, Cần suy nghĩ thêm..."
                      value={formData.outcome}
                      onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    />
                  </div>

                  {(formData.type === 'CALL' || formData.type === 'MEETING') && (
                    <div className="form-group">
                      <label htmlFor="activity-duration-input">Thời lượng (phút)</label>
                      <input
                        id="activity-duration-input"
                        type="number"
                        min="1"
                        max="480"
                        className="form-control"
                        placeholder="15"
                        value={formData.duration_minutes}
                        onChange={(e) =>
                          setFormData({ ...formData, duration_minutes: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Chi tiết nội dung */}
                <div className="form-group">
                  <label htmlFor="activity-content-textarea">Nội dung chi tiết trao đổi *</label>
                  <textarea
                    id="activity-content-textarea"
                    required
                    rows={4}
                    className="form-control"
                    placeholder="Ghi nhận nội dung thảo luận, phản hồi của khách hàng, các thắc mắc về tính năng hoặc ngân sách..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                {/* Hành động tiếp theo */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="activity-next-action-input">Hành động kế tiếp (Next step)</label>
                    <input
                      id="activity-next-action-input"
                      type="text"
                      className="form-control"
                      placeholder="VD: Gửi hợp đồng dự thảo, Gọi lại sau 2 ngày..."
                      value={formData.next_action}
                      onChange={(e) =>
                        setFormData({ ...formData, next_action: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="activity-next-due-input">Hạn chót hành động kế tiếp</label>
                    <input
                      id="activity-next-due-input"
                      type="date"
                      className="form-control"
                      value={formData.next_action_due}
                      onChange={(e) =>
                        setFormData({ ...formData, next_action_due: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-note">
                  <span>ℹ️ Hoạt động sẽ được gắn trực tiếp vào dòng thời gian của cơ hội này và hiển thị người thực hiện là <strong>{user?.full_name || 'Bạn'}</strong>.</span>
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
                  id="submit-activity-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Ghi nhận hoạt động'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
