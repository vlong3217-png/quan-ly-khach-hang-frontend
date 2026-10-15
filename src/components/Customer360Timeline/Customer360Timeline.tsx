import React, { useState, useEffect, useMemo } from 'react'
import { customerService } from '../../services/customerService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { opportunityHistoryService } from '../../services/opportunityHistoryService.ts'
import { opportunityTaskService } from '../../services/opportunityTaskService.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import type { OpportunityActivityType } from '../../types/opportunity.ts'
import './Customer360Timeline.css'

export type UnifiedTimelineType =
  | 'CALL'
  | 'MEETING'
  | 'EMAIL'
  | 'NOTE'
  | 'STAGE_CHANGE'
  | 'QUOTE'
  | 'TASK'

export interface UnifiedTimelineEvent {
  id: string
  type: UnifiedTimelineType
  title: string
  description?: string
  performedBy: string
  timestamp: string // ISO
  outcome?: string
  durationMinutes?: number
  oldValue?: string
  newValue?: string
  quoteAmount?: number
  nextAction?: string
  dealTitle?: string
}

interface Customer360TimelineProps {
  customerId: string
  customerName: string
  customerOwnerName?: string
}

/* ─────────── Inline SVG Icons ─────────── */
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const IconTrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconDollar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const IconCheckSquare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

export default function Customer360Timeline({
  customerId,
  customerName,
  customerOwnerName,
}: Customer360TimelineProps) {
  const { user } = useAuth()

  // State
  const [events, setEvents] = useState<UnifiedTimelineEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterPerformer, setFilterPerformer] = useState<string>('ALL')
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // Quick log activity modal
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false)
  const [logType, setLogType] = useState<OpportunityActivityType>('CALL')
  const [logTitle, setLogTitle] = useState<string>('')
  const [logContent, setLogContent] = useState<string>('')
  const [logOutcome, setLogOutcome] = useState<string>('')
  const [logDuration, setLogDuration] = useState<string>('15')
  const [logSubmitting, setLogSubmitting] = useState<boolean>(false)

  // Load and merge all customer timeline data
  const loadUnifiedTimeline = async () => {
    setLoading(true)
    try {
      const [oppActivities, allHistories, allTasks, allOpps] = await Promise.all([
        opportunityActivityService.getAllActivities(),
        Promise.resolve(opportunityHistoryService.getAllHistory()),
        opportunityTaskService.getTasks(),
        opportunityService.getOpportunities(),
      ])

      const merged: UnifiedTimelineEvent[] = []

      // 1. Customer Direct Activities
      const custActs = customerService.getActivities(customerId)
      custActs.forEach((act) => {
        let type: UnifiedTimelineType = 'NOTE'
        if (act.type === 'CALL') type = 'CALL'
        else if (act.type === 'MEETING') type = 'MEETING'
        else if (act.type === 'EMAIL') type = 'EMAIL'

        merged.push({
          id: `c-act-${act.id}`,
          type,
          title: act.title,
          description: act.description,
          performedBy: act.performed_by_name,
          timestamp: act.performed_at,
        })
      })

      // 2. Opportunity Activities linked to this customer
      oppActivities.forEach((oa) => {
        const isMatch =
          oa.customer_id === customerId ||
          (oa.customer_name && oa.customer_name.toLowerCase().includes(customerName.toLowerCase()))
        if (isMatch) {
          merged.push({
            id: `opp-act-${oa.id}`,
            type: (oa.type as UnifiedTimelineType) || 'CALL',
            title: oa.title,
            description: oa.content,
            performedBy: oa.performed_by_name,
            timestamp: oa.occurred_at || oa.created_at,
            outcome: oa.outcome,
            durationMinutes: oa.duration_minutes,
            nextAction: oa.next_action,
            dealTitle: oa.opportunity_title,
          })
        }
      })

      // 3. Customer Deals / Quotes
      const customerDeals = customerService.getDeals(customerId)
      customerDeals.forEach((d) => {
        merged.push({
          id: `deal-quote-${d.id}`,
          type: 'QUOTE',
          title: `Gửi báo giá thương vụ: "${d.title}"`,
          description: `Giá trị báo giá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.value)} | Giai đoạn: ${d.stage} | Trạng thái: ${d.status === 'CLOSED_WON' ? 'Đã chốt (Won)' : d.status === 'CLOSED_LOST' ? 'Thất bại (Lost)' : 'Đang theo dõi'}`,
          performedBy: customerOwnerName || 'Đội kinh doanh',
          timestamp: d.created_at || new Date().toISOString(),
          quoteAmount: d.value,
          dealTitle: d.title,
        })
      })

      // 4. Opportunities of this customer and their History/Stage changes
      const customerOpps = allOpps.filter(
        (o) =>
          String(o.customer_id) === String(customerId) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(customerName.toLowerCase()))
      )
      const customerOppIds = new Set(customerOpps.map((o) => o.id))

      allHistories.forEach((h) => {
        if (customerOppIds.has(h.opportunity_id)) {
          const matchedOpp = customerOpps.find((o) => o.id === h.opportunity_id)
          merged.push({
            id: `hist-${h.id}`,
            type: 'STAGE_CHANGE',
            title: `Thay đổi cơ hội: ${h.field_label} của deal "${matchedOpp?.title || 'Cơ hội'}"`,
            description: h.reason
              ? `Lý do: ${h.reason}. Giá trị: ${h.old_display} ➔ ${h.new_display}`
              : `Chuyển từ: "${h.old_display}" ➔ "${h.new_display}"`,
            performedBy: h.changed_by_name,
            timestamp: h.changed_at,
            oldValue: h.old_display,
            newValue: h.new_display,
            dealTitle: matchedOpp?.title,
          })
        }
      })

      // 5. Tasks linked to this customer
      allTasks.forEach((t) => {
        const isMatch =
          t.customer_id === customerId ||
          (t.customer_name && t.customer_name.toLowerCase().includes(customerName.toLowerCase())) ||
          (t.opportunity_id && customerOppIds.has(t.opportunity_id))

        if (isMatch) {
          merged.push({
            id: `task-${t.id}`,
            type: 'TASK',
            title: `Công việc: ${t.title}`,
            description: t.description || `Hạn chót: ${t.due_date} ${t.due_time || ''}. Phụ trách: ${t.assigned_to_name}. Trạng thái: ${t.is_completed ? 'Đã hoàn thành' : t.status === 'POSTPONED' ? `Đã hoãn (${t.postponed_reason})` : 'Cần làm'}`,
            performedBy: t.assigned_to_name,
            timestamp: t.created_at || new Date().toISOString(),
            dealTitle: t.opportunity_title,
          })
        }
      })

      // Sort chronological newest first
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setEvents(merged)
    } catch (err) {
      console.error('Error loading Customer 360 timeline:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnifiedTimeline()
  }, [customerId, customerName])

  // Get distinct performers list for filter dropdown
  const performersList = useMemo(() => {
    const set = new Set<string>()
    events.forEach((e) => {
      if (e.performedBy && e.performedBy.trim()) {
        set.add(e.performedBy.trim())
      }
    })
    return Array.from(set).sort()
  }, [events])

  // Filtered timeline events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Type filter
      if (filterType !== 'ALL' && ev.type !== filterType) {
        return false
      }

      // Performer filter
      if (filterPerformer !== 'ALL' && ev.performedBy !== filterPerformer) {
        return false
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim()
        const matchTitle = ev.title.toLowerCase().includes(q)
        const matchDesc = ev.description ? ev.description.toLowerCase().includes(q) : false
        const matchPerformer = ev.performedBy.toLowerCase().includes(q)
        const matchDeal = ev.dealTitle ? ev.dealTitle.toLowerCase().includes(q) : false
        if (!matchTitle && !matchDesc && !matchPerformer && !matchDeal) return false
      }

      return true
    })
  }, [events, filterType, filterPerformer, searchKeyword])

  // Quick 5-minute handover context summary (AC: nắm được bối cảnh trong năm phút)
  const contextSummary = useMemo(() => {
    const latestInteraction = events.find((e) => ['CALL', 'MEETING', 'EMAIL'].includes(e.type))
    const latestQuote = events.find((e) => e.type === 'QUOTE')
    const pendingTasks = events.filter((e) => e.type === 'TASK')
    const totalDeals = events.filter((e) => e.type === 'QUOTE').length

    return {
      latestInteraction,
      latestQuote,
      pendingTasksCount: pendingTasks.length,
      totalDeals,
    }
  }, [events])

  // Format datetime
  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  // Helper render type badge
  const renderTypeIcon = (type: UnifiedTimelineType) => {
    switch (type) {
      case 'CALL':
        return <IconPhone />
      case 'MEETING':
        return <IconUsers />
      case 'EMAIL':
        return <IconMail />
      case 'STAGE_CHANGE':
        return <IconTrendingUp />
      case 'QUOTE':
        return <IconDollar />
      case 'TASK':
        return <IconCheckSquare />
      case 'NOTE':
      default:
        return <IconFileText />
    }
  }

  const getTypeLabel = (type: UnifiedTimelineType) => {
    switch (type) {
      case 'CALL':
        return 'Cuộc gọi'
      case 'MEETING':
        return 'Gặp mặt / Demo'
      case 'EMAIL':
        return 'Email'
      case 'STAGE_CHANGE':
        return 'Thay đổi cơ hội'
      case 'QUOTE':
        return 'Báo giá đã gửi'
      case 'TASK':
        return 'Công việc'
      case 'NOTE':
      default:
        return 'Ghi chú'
    }
  }

  // Handle Quick Activity Submit
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logTitle.trim()) return

    setLogSubmitting(true)
    try {
      await opportunityActivityService.createActivity({
        opportunity_id: 'customer-' + customerId,
        customer_id: customerId,
        customer_name: customerName,
        type: logType,
        title: logTitle.trim(),
        content: logContent.trim() || 'Ghi nhận trao đổi trực tiếp trên Customer 360',
        outcome: logOutcome.trim() || undefined,
        duration_minutes: Number(logDuration) || 15,
        performed_by_name: user?.full_name || 'Người dùng',
        occurred_at: new Date().toISOString(),
      })

      setIsLogModalOpen(false)
      setLogTitle('')
      setLogContent('')
      setLogOutcome('')
      await loadUnifiedTimeline()
    } catch (err) {
      alert('Không thể lưu hoạt động: ' + (err instanceof Error ? err.message : 'Lỗi'))
    } finally {
      setLogSubmitting(false)
    }
  }

  return (
    <div className="c360-unified-timeline-container" id="customer-360-unified-timeline">
      {/* ── 1. FAST HANDOVER CONTEXT BOX (Nắm bắt bối cảnh trong 5 phút - AC S6-08) ── */}
      <div className="c360-context-handover-card">
        <div className="handover-header">
          <div className="handover-title">
            <span className="badge-pill-5m">⚡ Tóm tắt tiếp nhận trong 5 phút</span>
            <h4>Bối cảnh khách hàng: {customerName}</h4>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary quick-log-btn"
            id="btn-quick-log-activity"
            onClick={() => setIsLogModalOpen(true)}
          >
            + Ghi nhận tương tác mới
          </button>
        </div>

        <div className="handover-stats-grid">
          <div className="handover-stat-item">
            <span className="stat-label">🕒 Tương tác gần nhất:</span>
            {contextSummary.latestInteraction ? (
              <span className="stat-val">
                <strong>{getTypeLabel(contextSummary.latestInteraction.type)}:</strong>{' '}
                {contextSummary.latestInteraction.title} ({formatDateTime(contextSummary.latestInteraction.timestamp)}) bởi{' '}
                <em>{contextSummary.latestInteraction.performedBy}</em>
              </span>
            ) : (
              <span className="stat-val text-muted">Chưa có ghi nhận</span>
            )}
          </div>

          <div className="handover-stat-item">
            <span className="stat-label">📑 Báo giá gần nhất:</span>
            {contextSummary.latestQuote ? (
              <span className="stat-val text-success">
                <strong>{contextSummary.latestQuote.title}</strong>{' '}
                ({formatDateTime(contextSummary.latestQuote.timestamp)})
              </span>
            ) : (
              <span className="stat-val text-muted">Chưa gửi báo giá</span>
            )}
          </div>

          <div className="handover-stat-item">
            <span className="stat-label">👤 Nhân sự phụ trách:</span>
            <span className="stat-val">
              <strong>{customerOwnerName || 'Chưa phân công'}</strong>
            </span>
          </div>

          <div className="handover-stat-item">
            <span className="stat-label">📋 Công việc chờ xử lý:</span>
            <span className="stat-val">
              <strong>{contextSummary.pendingTasksCount}</strong> công việc
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & SEARCH BAR (AC S6-08: Lọc theo loại hoạt động & người thực hiện) ── */}
      <div className="c360-timeline-filter-bar">
        {/* Type pills */}
        <div className="type-pills-row">
          <button
            type="button"
            className={`type-pill ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            Tất cả ({events.length})
          </button>
          <button
            type="button"
            className={`type-pill ${filterType === 'CALL' ? 'active' : ''}`}
            onClick={() => setFilterType('CALL')}
          >
            Cuộc gọi ({events.filter((e) => e.type === 'CALL').length})
          </button>
          <button
            type="button"
            className={`type-pill ${filterType === 'MEETING' ? 'active' : ''}`}
            onClick={() => setFilterType('MEETING')}
          >
            Cuộc gặp ({events.filter((e) => e.type === 'MEETING').length})
          </button>
          <button
            type="button"
            className={`type-pill ${filterType === 'EMAIL' ? 'active' : ''}`}
            onClick={() => setFilterType('EMAIL')}
          >
            Email ({events.filter((e) => e.type === 'EMAIL').length})
          </button>
          <button
            type="button"
            className={`type-pill ${filterType === 'STAGE_CHANGE' ? 'active' : ''}`}
            onClick={() => setFilterType('STAGE_CHANGE')}
          >
            Thay đổi cơ hội ({events.filter((e) => e.type === 'STAGE_CHANGE').length})
          </button>
          <button
            type="button"
            className={`type-pill ${filterType === 'QUOTE' ? 'active' : ''}`}
            onClick={() => setFilterType('QUOTE')}
          >
            Báo giá ({events.filter((e) => e.type === 'QUOTE').length})
          </button>
          <button
            type="button"
            className={`type-pill ${filterType === 'TASK' ? 'active' : ''}`}
            onClick={() => setFilterType('TASK')}
          >
            Công việc ({events.filter((e) => e.type === 'TASK').length})
          </button>
        </div>

        {/* Filter controls row */}
        <div className="filter-controls-row">
          {/* Performer Filter */}
          <div className="performer-filter-box">
            <label htmlFor="filter-performer-select">Người thực hiện:</label>
            <select
              id="filter-performer-select"
              className="form-control form-control-sm"
              value={filterPerformer}
              onChange={(e) => setFilterPerformer(e.target.value)}
            >
              <option value="ALL">Tất cả nhân sự ({performersList.length})</option>
              {performersList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="search-filter-box">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Tìm theo nội dung, người làm, thương vụ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              id="c360-timeline-search-input"
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
      </div>

      {/* ── 3. TIMELINE FEED STREAM ── */}
      {loading ? (
        <div className="c360-loading-state">
          <div className="spinner-border" />
          <p>Đang gộp dòng thời gian tương tác khách hàng...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="c360-empty-timeline" id="c360-empty-timeline">
          <h4>Chưa có tương tác nào được ghi nhận</h4>
          <p>
            {searchKeyword || filterType !== 'ALL' || filterPerformer !== 'ALL'
              ? 'Không tìm thấy dòng tương tác nào khớp với bộ lọc.'
              : 'Ghi nhận cuộc gọi, cuộc gặp hoặc gửi báo giá đầu tiên cho khách hàng này.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsLogModalOpen(true)}
          >
            + Ghi nhận tương tác đầu tiên
          </button>
        </div>
      ) : (
        <div className="c360-timeline-stream">
          {filteredEvents.map((ev, idx) => (
            <div
              key={ev.id}
              className={`timeline-feed-item type-${ev.type.toLowerCase()}`}
              data-testid={`timeline-event-${idx}`}
            >
              {/* Dot Icon marker */}
              <div className="feed-marker-col">
                <div className={`feed-marker-circle circle-${ev.type.toLowerCase()}`}>
                  {renderTypeIcon(ev.type)}
                </div>
                {idx !== filteredEvents.length - 1 && <div className="feed-marker-line" />}
              </div>

              {/* Event Content Card */}
              <div className="feed-card-content">
                <div className="feed-card-header">
                  <div className="badge-title-group">
                    <span className={`event-type-badge badge-${ev.type.toLowerCase()}`}>
                      {renderTypeIcon(ev.type)}
                      <span>{getTypeLabel(ev.type)}</span>
                    </span>

                    {ev.dealTitle && (
                      <span className="deal-ref-badge" title="Cơ hội liên quan">
                        🎯 {ev.dealTitle}
                      </span>
                    )}

                    {ev.durationMinutes && (
                      <span className="duration-pill">
                        ⏱️ {ev.durationMinutes} phút
                      </span>
                    )}

                    {ev.outcome && (
                      <span className="outcome-pill" title="Kết quả tương tác">
                        {ev.outcome}
                      </span>
                    )}
                  </div>

                  <span className="feed-timestamp" title={ev.timestamp}>
                    {formatDateTime(ev.timestamp)}
                  </span>
                </div>

                <h5 className="feed-title">{ev.title}</h5>

                {ev.description && (
                  <p className="feed-description">{ev.description}</p>
                )}

                {ev.nextAction && (
                  <div className="feed-next-action">
                    <strong>Hành động kế tiếp:</strong> {ev.nextAction}
                  </div>
                )}

                <div className="feed-footer-meta">
                  <span className="performer-tag">
                    👤 Người thực hiện: <strong>{ev.performedBy}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. QUICK LOG ACTIVITY MODAL ── */}
      {isLogModalOpen && (
        <div className="c360-modal-overlay" onClick={() => setIsLogModalOpen(false)}>
          <div
            className="c360-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Ghi nhận tương tác với {customerName}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsLogModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Loại tương tác *</label>
                  <select
                    className="form-control"
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as OpportunityActivityType)}
                  >
                    <option value="CALL">Cuộc gọi điện thoại</option>
                    <option value="MEETING">Cuộc gặp mặt / Demo</option>
                    <option value="EMAIL">Gửi Email trao đổi</option>
                    <option value="NOTE">Ghi chú chăm sóc khách hàng</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="VD: Trao đổi nhu cầu nâng cấp gói dịch vụ..."
                    value={logTitle}
                    onChange={(e) => setLogTitle(e.target.value)}
                  />
                </div>

                <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Kết quả đạt được</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Hài lòng, Đã chốt, Cần suy nghĩ thêm..."
                      value={logOutcome}
                      onChange={(e) => setLogOutcome(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời lượng (phút)</label>
                    <input
                      type="number"
                      min="5"
                      className="form-control"
                      value={logDuration}
                      onChange={(e) => setLogDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Chi tiết trao đổi *</label>
                  <textarea
                    rows={4}
                    required
                    className="form-control"
                    placeholder="Ghi nhận các ý kiến, thắc mắc, đề xuất và phản hồi của khách hàng để đồng nghiệp tiếp nhận nắm được ngay..."
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsLogModalOpen(false)}
                  disabled={logSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={logSubmitting}
                  id="btn-submit-quick-log"
                >
                  {logSubmitting ? 'Đang lưu...' : 'Lưu tương tác'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
