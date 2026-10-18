import React, { useState, useEffect, useMemo } from 'react'
import Button from '../../components/ui/Button.tsx'
import { opportunityTaskService } from '../../services/opportunityTaskService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { userService } from '../../services/userService.ts'
import type { User } from '../../types/auth.ts'
import type { OpportunityTask, OpportunityActivity } from '../../types/opportunity.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './CalendarPage.css'

export type CalendarViewMode = 'DAY' | 'WEEK' | 'MONTH'

export interface CalendarEvent {
  id: string
  title: string
  type: 'MEETING' | 'CALL' | 'TASK'
  date: string // YYYY-MM-DD
  time: string // HH:mm
  durationMinutes: number
  assigneeName: string
  assigneeId?: number
  customerName?: string
  opportunityTitle?: string
  status?: string
  description?: string
  isCompleted?: boolean
  raw?: OpportunityTask | OpportunityActivity
}

export default function CalendarPage() {
  const { user } = useAuth()

  // View state
  const [viewMode, setViewMode] = useState<CalendarViewMode>('WEEK')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [teamScope, setTeamScope] = useState<'MY' | 'TEAM'>('TEAM')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL')

  // Data state
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [teamUsers, setTeamUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Selected event details modal
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)

  // Quick Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [createType, setCreateType] = useState<'MEETING' | 'TASK'>('MEETING')
  const [newTitle, setNewTitle] = useState<string>('')
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [newTime, setNewTime] = useState<string>('09:00')
  const [newDuration, setNewDuration] = useState<string>('60')
  const [newAssigneeId, setNewAssigneeId] = useState<string>('')
  const [newCustomerName, setNewCustomerName] = useState<string>('')
  const [newDescription, setNewDescription] = useState<string>('')
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false)

  // Load team users
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

  // Load unified calendar events (Tasks + Activities/Meetings)
  const loadCalendarData = async () => {
    /* background refresh */
    try {
      const [tasks, activities] = await Promise.all([
        opportunityTaskService.getTasks(),
        opportunityActivityService.getAllActivities(),
      ])

      const combined: CalendarEvent[] = []

      // 1. Convert Tasks into Calendar Events
      tasks.forEach((t) => {
        combined.push({
          id: `task-${t.id}`,
          title: t.title,
          type: 'TASK',
          date: t.due_date || new Date().toISOString().split('T')[0],
          time: t.due_time || '17:00',
          durationMinutes: 30,
          assigneeName: t.assigned_to_name,
          assigneeId: t.assigned_to_id,
          customerName: t.customer_name,
          opportunityTitle: t.opportunity_title,
          status: t.status,
          description: t.description,
          isCompleted: t.is_completed,
          raw: t,
        })
      })

      // 2. Convert Activities (Meeting, Call) into Calendar Events
      activities.forEach((a) => {
        const rawDate = a.occurred_at || a.created_at
        const dateObj = new Date(rawDate)
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        const timeStr = !isNaN(dateObj.getTime())
          ? dateObj.toTimeString().slice(0, 5)
          : '09:00'

        combined.push({
          id: `act-${a.id}`,
          title: a.title,
          type: a.type === 'CALL' ? 'CALL' : 'MEETING',
          date: dateStr,
          time: timeStr,
          durationMinutes: a.duration_minutes || (a.type === 'CALL' ? 15 : 60),
          assigneeName: a.performed_by_name,
          assigneeId: a.performed_by_id,
          customerName: a.customer_name,
          opportunityTitle: a.opportunity_title,
          status: a.outcome || 'Đã ghi nhận',
          description: a.content,
          raw: a,
        })
      })

      setEvents(combined)
    } catch (err) {
      console.error('Error loading calendar data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarData()
  }, [])

  // Filter events based on scope and assignee
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Scope: MY vs TEAM
      if (teamScope === 'MY') {
        const myName = user?.full_name?.toLowerCase() || ''
        const myId = user?.id ? Number(user.id) : null
        const isMe =
          (myId && ev.assigneeId === myId) ||
          ev.assigneeName.toLowerCase().includes(myName)
        if (!isMe) return false
      }

      // Assignee Filter
      if (selectedAssignee !== 'ALL') {
        const uid = Number(selectedAssignee)
        if (ev.assigneeId !== uid && ev.assigneeName !== selectedAssignee) {
          return false
        }
      }

      return true
    })
  }, [events, teamScope, selectedAssignee, user])

  // Overlap Detection: Find time conflicts across team members
  const overlaps = useMemo(() => {
    const conflictList: {
      date: string
      time: string
      eventA: CalendarEvent
      eventB: CalendarEvent
    }[] = []

    for (let i = 0; i < filteredEvents.length; i++) {
      for (let j = i + 1; j < filteredEvents.length; j++) {
        const a = filteredEvents[i]
        const b = filteredEvents[j]

        if (a.date === b.date && a.time && b.time) {
          // Check if time is identical or within overlapping range
          if (a.time === b.time) {
            conflictList.push({
              date: a.date,
              time: a.time,
              eventA: a,
              eventB: b,
            })
          }
        }
      }
    }
    return conflictList
  }, [filteredEvents])

  // Navigation helpers
  const handlePrev = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'DAY') d.setDate(d.getDate() - 1)
    else if (viewMode === 'WEEK') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setSelectedDate(d)
  }

  const handleNext = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'DAY') d.setDate(d.getDate() + 1)
    else if (viewMode === 'WEEK') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setSelectedDate(d)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  // Week days calculation (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate)
    const day = curr.getDay()
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(curr.setDate(diff))

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday)
      next.setDate(monday.getDate() + i)
      days.push(next)
    }
    return days
  }, [selectedDate])

  // Format date helper
  const formatDateIso = (d: Date) => d.toISOString().split('T')[0]
  const todayStr = formatDateIso(new Date())

  // Quick Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setCreateSubmitting(true)
    try {
      const assignedUser = teamUsers.find((u) => String(u.id) === newAssigneeId)
      const assigneeName = assignedUser
        ? (assignedUser.full_name || assignedUser.email)
        : user?.full_name || 'Người dùng'
      const assigneeId = assignedUser?.id || (user?.id ? Number(user.id) : undefined)

      if (createType === 'TASK') {
        await opportunityTaskService.createTask({
          title: newTitle.trim(),
          description: newDescription.trim(),
          due_date: newDate,
          due_time: newTime,
          assigned_to_id: assigneeId,
          assigned_to_name: assigneeName,
          customer_name: newCustomerName.trim() || undefined,
          priority: 'MEDIUM',
        })
      } else {
        const occurredIso = new Date(`${newDate}T${newTime}:00`).toISOString()
        await opportunityActivityService.createActivity({
          opportunity_id: 'general',
          type: createType,
          title: newTitle.trim(),
          content: newDescription.trim() || 'Lịch hẹn làm việc được đặt từ Lịch làm việc',
          customer_name: newCustomerName.trim() || undefined,
          performed_by_id: assigneeId,
          performed_by_name: assigneeName,
          duration_minutes: Number(newDuration) || 60,
          occurred_at: occurredIso,
        })
      }

      setIsCreateModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewCustomerName('')
      await loadCalendarData()
    } catch (err) {
      alert('Không thể tạo lịch: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'))
    } finally {
      setCreateSubmitting(false)
    }
  }

  return (
    <div className="calendar-page-container" id="calendar-page">
      {/* ── Header Toolbar ── */}
      <div className="calendar-header-toolbar">
        <div className="toolbar-left">
          <div className="page-title-badge">
            
            <h2>Lịch làm việc & Bố trí gặp mặt</h2>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Quick Create Event */}
          <Button
            type="button"
            variant="primary"
            id="btn-add-calendar-event"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Đặt lịch mới
          </Button>
        </div>
      </div>

      {/* ── Sub-header: Navigation, View Modes, Scope Filter ── */}
      <div className="calendar-controls-bar">
        <div className="nav-group">
          <Button type="button" variant="secondary" onClick={handlePrev} title="Trước">
            &lt;
          </Button>
          <Button type="button" variant="secondary" onClick={handleToday}>
            Hôm nay
          </Button>
          <Button type="button" variant="secondary" onClick={handleNext} title="Sau">
            &gt;
          </Button>

          <span className="current-date-display">
            {viewMode === 'DAY'
              ? `Ngày ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
              : viewMode === 'WEEK'
              ? `Tuần: ${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} - ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1}/${weekDays[6].getFullYear()}`
              : `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
          </span>
        </div>

        {/* View mode switcher */}
        <div className="view-mode-pill-group">
          <button
            type="button"
            className={`view-pill ${viewMode === 'DAY' ? 'active' : ''}`}
            onClick={() => setViewMode('DAY')}
          >
            Ngày
          </button>
          <button
            type="button"
            className={`view-pill ${viewMode === 'WEEK' ? 'active' : ''}`}
            onClick={() => setViewMode('WEEK')}
          >
            Tuần
          </button>
          <button
            type="button"
            className={`view-pill ${viewMode === 'MONTH' ? 'active' : ''}`}
            onClick={() => setViewMode('MONTH')}
          >
            Tháng
          </button>
        </div>

        {/* Scope switcher & Assignee Filter */}
        <div className="scope-filter-group">
          <div className="scope-toggle-buttons">
            <button
              type="button"
              className={`scope-btn ${teamScope === 'MY' ? 'active' : ''}`}
              onClick={() => setTeamScope('MY')}
            >
              Cá nhân tôi
            </button>
            <button
              type="button"
              className={`scope-btn ${teamScope === 'TEAM' ? 'active' : ''}`}
              onClick={() => setTeamScope('TEAM')}
            >
              Toàn nhóm
            </button>
          </div>

          {teamScope === 'TEAM' && teamUsers.length > 0 && (
            <select
              className="form-control form-control-sm assignee-select"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              title="Lọc theo thành viên"
            >
              <option value="ALL">Tất cả thành viên ({teamUsers.length})</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Overlap Conflict Warning Banner (S6-07) ── */}
      {overlaps.length > 0 && (
        <div className="calendar-overlap-alert" role="alert">
          
          <div className="overlap-text">
            <strong>Cảnh báo chồng chéo lịch ({overlaps.length} xung đột):</strong>
            <span>
              {overlaps.slice(0, 2).map((c, idx) => (
                <span key={idx} style={{ marginLeft: '6px' }}>
                  [{c.date} lúc {c.time}]: "{c.eventA.title}" ({c.eventA.assigneeName}) trùng với "{c.eventB.title}" ({c.eventB.assigneeName});
                </span>
              ))}
              {overlaps.length > 2 && <span> và {overlaps.length - 2} sự kiện khác...</span>}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Calendar Body ── */}
      {loading ? (
        <div className="calendar-loading-box">
          <div className="spinner-border" />
          <p>Đang tải dữ liệu cuộc gặp và công việc...</p>
        </div>
      ) : (
        <div className="calendar-viewport">
          {/* VIEW 1: WEEK VIEW */}
          {viewMode === 'WEEK' && (
            <div className="calendar-week-grid">
              {weekDays.map((d, index) => {
                const dateKey = formatDateIso(d)
                const isToday = dateKey === todayStr
                const dayEvents = filteredEvents.filter((ev) => ev.date === dateKey)
                const dayOfWeekNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

                return (
                  <div key={dateKey} className={`week-day-column ${isToday ? 'is-today' : ''}`}>
                    <div className="week-day-header">
                      <span className="day-name">{dayOfWeekNames[index]}</span>
                      <span className="day-date">{d.getDate()}/{d.getMonth() + 1}</span>
                      {dayEvents.length > 0 && (
                        <span className="day-event-count">{dayEvents.length}</span>
                      )}
                    </div>

                    <div className="week-day-events-list">
                      {dayEvents.length === 0 ? (
                        <div className="no-events-placeholder">Trống</div>
                      ) : (
                        dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={`event-card-pill type-${ev.type.toLowerCase()}`}
                            onClick={() => setActiveEvent(ev)}
                            title={`${ev.time} - ${ev.title} (${ev.assigneeName})`}
                          >
                            <div className="event-pill-time">
                              {ev.time}
                              {ev.durationMinutes && <span className="duration">({ev.durationMinutes}p)</span>}
                            </div>
                            <div className="event-pill-title">{ev.title}</div>
                            <div className="event-pill-meta">
                              <span className="assignee">{ev.assigneeName}</span>
                              {ev.customerName && <span className="customer">{ev.customerName}</span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VIEW 2: DAY VIEW */}
          {viewMode === 'DAY' && (
            <div className="calendar-day-view">
              <div className="day-view-header">
                <h3>
                  Lịch trình ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                </h3>
              </div>
              <div className="day-hourly-schedule">
                {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => {
                  const hourStr = `${hour < 10 ? '0' : ''}${hour}:00`
                  const dateKey = formatDateIso(selectedDate)
                  const slotEvents = filteredEvents.filter((ev) => {
                    if (ev.date !== dateKey) return false
                    const evHour = parseInt(ev.time.split(':')[0], 10)
                    return evHour === hour
                  })

                  return (
                    <div key={hour} className="hour-slot-row">
                      <div className="hour-label">{hourStr}</div>
                      <div className="hour-content">
                        {slotEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={`event-card-pill type-${ev.type.toLowerCase()}`}
                            onClick={() => setActiveEvent(ev)}
                          >
                            <span className="time-badge">{ev.time}</span>
                            <strong>{ev.title}</strong>
                            <span className="assignee-badge">Phụ trách: {ev.assigneeName}</span>
                            {ev.customerName && <span>{ev.customerName}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: MONTH VIEW */}
          {viewMode === 'MONTH' && (
            <div className="calendar-month-grid">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((h) => (
                <div key={h} className="month-grid-header-cell">
                  {h}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
                const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
                const dayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - startDay + 1)
                const dateKey = formatDateIso(dayDate)
                const isCurrentMonth = dayDate.getMonth() === selectedDate.getMonth()
                const isToday = dateKey === todayStr
                const dayEvents = filteredEvents.filter((ev) => ev.date === dateKey)

                return (
                  <div
                    key={i}
                    className={`month-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${
                      isToday ? 'is-today' : ''
                    }`}
                    onClick={() => {
                      setSelectedDate(dayDate)
                      setViewMode('DAY')
                    }}
                  >
                    <div className="month-cell-header">
                      <span className="cell-date-num">{dayDate.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <span className="cell-badge">{dayEvents.length}</span>
                      )}
                    </div>
                    <div className="month-cell-events">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className={`month-event-item type-${ev.type.toLowerCase()}`}
                          title={`${ev.time} - ${ev.title}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveEvent(ev)
                          }}
                        >
                          <span className="dot" />
                          <span className="txt">{ev.time} {ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="more-events">+{dayEvents.length - 3} khác</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CHI TIẾT SỰ KIỆN ── */}
      {activeEvent && (
        <div className="calendar-modal-overlay" onClick={() => setActiveEvent(null)}>
          <div
            className="calendar-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <span className={`event-type-tag type-${activeEvent.type.toLowerCase()}`}>
                {activeEvent.type === 'MEETING'
                  ? 'Cuộc gặp khách hàng'
                  : activeEvent.type === 'CALL'
                  ? 'Cuộc gọi'
                  : 'Công việc có hạn'}
              </span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <h3 className="event-detail-title">{activeEvent.title}</h3>

              <div className="event-detail-meta-grid">
                <div className="meta-row">
                  <span className="label">Thời gian:</span>
                  <strong>{activeEvent.date} lúc {activeEvent.time} ({activeEvent.durationMinutes} phút)</strong>
                </div>
                <div className="meta-row">
                  <span className="label">Người thực hiện:</span>
                  <strong>{activeEvent.assigneeName}</strong>
                </div>
                {activeEvent.customerName && (
                  <div className="meta-row">
                    <span className="label">Khách hàng:</span>
                    <strong>{activeEvent.customerName}</strong>
                  </div>
                )}
                {activeEvent.opportunityTitle && (
                  <div className="meta-row">
                    <span className="label">Cơ hội liên quan:</span>
                    <strong>{activeEvent.opportunityTitle}</strong>
                  </div>
                )}
                {activeEvent.status && (
                  <div className="meta-row">
                    <span className="label">Trạng thái:</span>
                    <span>{activeEvent.status}</span>
                  </div>
                )}
              </div>

              {activeEvent.description && (
                <div className="event-detail-desc">
                  <div className="desc-label">Nội dung chi tiết:</div>
                  <p>{activeEvent.description}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveEvent(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ĐẶT LỊCH / TẠO VIỆC MỚI (S6-07) ── */}
      {isCreateModalOpen && (
        <div className="calendar-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="calendar-modal-card"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Đặt lịch hẹn / Giao việc mới (S6-07)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {/* Chọn loại sự kiện */}
                <div className="form-group">
                  <label>Loại lịch trình *</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="createType"
                        checked={createType === 'MEETING'}
                        onChange={() => setCreateType('MEETING')}
                      />
                      Cuộc gặp khách hàng
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="createType"
                        checked={createType === 'TASK'}
                        onChange={() => setCreateType('TASK')}
                      />
                      Công việc có hạn
                    </label>
                  </div>
                </div>

                {/* Tiêu đề */}
                <div className="form-group">
                  <label htmlFor="calendar-new-title">Tiêu đề *</label>
                  <input
                    id="calendar-new-title"
                    type="text"
                    required
                    className="form-control"
                    placeholder="VD: Họp demo giải pháp CRM cho Ban giám đốc..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {/* Ngày & Giờ & Thời lượng */}
                <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label htmlFor="calendar-new-date">Ngày *</label>
                    <input
                      id="calendar-new-date"
                      type="date"
                      required
                      className="form-control"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="calendar-new-time">Giờ bắt đầu *</label>
                    <input
                      id="calendar-new-time"
                      type="time"
                      required
                      className="form-control"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="calendar-new-duration">Thời lượng (p)</label>
                    <input
                      id="calendar-new-duration"
                      type="number"
                      min="15"
                      step="15"
                      className="form-control"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>
                </div>

                {/* Người thực hiện (Trưởng nhóm giao việc) */}
                <div className="form-group">
                  <label htmlFor="calendar-new-assignee">Người phụ trách (Thành viên nhóm)</label>
                  {teamUsers.length > 0 ? (
                    <select
                      id="calendar-new-assignee"
                      className="form-control"
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                    >
                      <option value="">-- Mặc định ({user?.full_name || 'Tôi'}) --</option>
                      {teamUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email} ({u.role || 'Thành viên'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={user?.full_name || 'Tôi'}
                      disabled
                    />
                  )}
                </div>

                {/* Khách hàng liên quan */}
                <div className="form-group">
                  <label htmlFor="calendar-new-customer">Khách hàng liên quan</label>
                  <input
                    id="calendar-new-customer"
                    type="text"
                    className="form-control"
                    placeholder="Tên doanh nghiệp / Khách hàng..."
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>

                {/* Mô tả */}
                <div className="form-group">
                  <label htmlFor="calendar-new-desc">Ghi chú chi tiết</label>
                  <textarea
                    id="calendar-new-desc"
                    rows={3}
                    className="form-control"
                    placeholder="Địa điểm gặp (Zoom/Văn phòng khách), nội dung chuẩn bị..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-submit-calendar-event"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Đang lưu...' : 'Lưu vào lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
