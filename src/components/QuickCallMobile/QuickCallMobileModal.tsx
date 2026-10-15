import { useState, useEffect, useMemo } from 'react'
import { opportunityService } from '../../services/opportunityService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { opportunityTaskService } from '../../services/opportunityTaskService.ts'
import { customerService } from '../../services/customerService.ts'
import type { CustomerEnterprise } from '../../types/customer.ts'
import type { Opportunity } from '../../types/opportunity.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './QuickCallMobileModal.css'

export interface QuickCallMobileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  preselectedCustomerId?: string
  preselectedCustomerName?: string
}

/* Call outcome presets (Chạm 1) */
const OUTCOMES = [
  {
    id: 'INTERESTED',
    label: 'Khách nghe máy & Quan tâm',
    badge: '🟢 Quan tâm',
    defaultNote: 'Khách nghe máy vui vẻ, rất quan tâm giải pháp, muốn nhận báo giá.',
    suggestedCallback: 'TOMORROW_MORNING',
  },
  {
    id: 'BUSY_RESCHEDULE',
    label: 'Khách bận - Hẹn gọi lại',
    badge: '🟡 Hẹn gọi lại',
    defaultNote: 'Khách đang bận họp/di chuyển, đề nghị liên hệ lại vào khung giờ khác.',
    suggestedCallback: 'TODAY_AFTERNOON',
  },
  {
    id: 'NO_ANSWER',
    label: 'Không nghe máy / Thuê bao',
    badge: '🟠 Không bắt máy',
    defaultNote: 'Đổ chuông không nhấc máy hoặc máy bận thuê bao.',
    suggestedCallback: 'TOMORROW_MORNING',
  },
  {
    id: 'NOT_INTERESTED',
    label: 'Từ chối / Không nhu cầu',
    badge: '🔴 Không nhu cầu',
    defaultNote: 'Khách thông báo hiện chưa có kế hoạch hoặc không có nhu cầu.',
    suggestedCallback: 'NONE',
  },
]

/* Quick note chips (Chạm 2) */
const QUICK_NOTES = [
  'Đã trao đổi sơ bộ, cần gửi báo giá chi tiết',
  'Khách đang họp, nhờ liên lạc lại sau',
  'Đang cân nhắc ngân sách với ban giám đốc',
  'Xin gửi hồ sơ năng lực & brochure qua Zalo/Email',
  'Khách hài lòng, đồng ý chốt hợp đồng',
]

/* Callback presets (Chạm 3) */
interface CallbackPreset {
  id: string
  label: string
  getDate: () => { dateStr: string; timeStr: string }
}

const CALLBACK_PRESETS: CallbackPreset[] = [
  {
    id: 'TODAY_AFTERNOON',
    label: 'Chiều nay (15:00)',
    getDate: () => {
      const now = new Date()
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0)
      return {
        dateStr: d.toISOString().split('T')[0],
        timeStr: '15:00',
      }
    },
  },
  {
    id: 'TOMORROW_MORNING',
    label: 'Sáng mai (09:00)',
    getDate: () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return {
        dateStr: tomorrow.toISOString().split('T')[0],
        timeStr: '09:00',
      }
    },
  },
  {
    id: 'IN_2_DAYS',
    label: 'Sau 2 ngày (09:30)',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 2)
      return {
        dateStr: d.toISOString().split('T')[0],
        timeStr: '09:30',
      }
    },
  },
  {
    id: 'NONE',
    label: 'Không hẹn lại',
    getDate: () => ({ dateStr: '', timeStr: '' }),
  },
]

export default function QuickCallMobileModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomerId,
  preselectedCustomerName,
}: QuickCallMobileModalProps) {
  const { user } = useAuth()

  const [customers, setCustomers] = useState<CustomerEnterprise[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '')
  const [customerSearch, setCustomerSearch] = useState<string>('')

  // 3-tap state
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('')
  const [selectedNote, setSelectedNote] = useState<string>('')
  const [customNote, setCustomNote] = useState<string>('')
  const [selectedCallbackId, setSelectedCallbackId] = useState<string>('')

  const [submitting, setSubmitting] = useState<boolean>(false)

  // Load customers & opportunities
  useEffect(() => {
    if (!isOpen) return

    const loadInit = async () => {
      try {
        const [custRes, oppsRes] = await Promise.all([
          Promise.resolve(customerService.getCustomers()),
          opportunityService.getOpportunities(),
        ])
        const custList = Array.isArray(custRes) ? custRes : (custRes as any)?.customers || []
        setCustomers(custList)
        setOpportunities(oppsRes || [])

        if (preselectedCustomerId) {
          setSelectedCustomerId(preselectedCustomerId)
        } else if (custList.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custList[0].id)
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu cho ghi nhanh cuộc gọi:', err)
      }
    }

    loadInit()
  }, [isOpen, preselectedCustomerId])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOutcomeId('')
      setSelectedNote('')
      setCustomNote('')
      setSelectedCallbackId('')
    }
  }, [isOpen])

  // Current customer
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId)
  }, [customers, selectedCustomerId])

  // Auto-find latest open opportunity for this customer (S6-10 AC: Tự động gắn vào cơ hội đang mở gần nhất)
  const latestOpenOpportunity = useMemo(() => {
    if (!selectedCustomerId) return null
    const matched = opportunities.filter((o) => {
      const matchCust = String(o.customer_id) === String(selectedCustomerId)
      const isNotClosed = o.status === 'OPEN'
      return matchCust && isNotClosed
    })

    if (matched.length === 0) return null

    // Sort by updated_at or created_at desc
    matched.sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || '').getTime()
      const timeB = new Date(b.updated_at || b.created_at || '').getTime()
      return timeB - timeA
    })

    return matched[0]
  }, [opportunities, selectedCustomerId])

  // Count taps performed
  const tapCount = useMemo(() => {
    let count = 0
    if (selectedOutcomeId) count++
    if (selectedNote || customNote) count++
    if (selectedCallbackId) count++
    return count
  }, [selectedOutcomeId, selectedNote, customNote, selectedCallbackId])

  // Handle Tap 1: Outcome
  const handleSelectOutcome = (outcomeId: string) => {
    setSelectedOutcomeId(outcomeId)
    const outcome = OUTCOMES.find((o) => o.id === outcomeId)
    if (outcome && !selectedNote && !customNote) {
      setSelectedNote(outcome.defaultNote)
    }
    if (outcome && !selectedCallbackId) {
      setSelectedCallbackId(outcome.suggestedCallback)
    }
  }

  // Handle Tap 2: Note
  const handleSelectNote = (noteText: string) => {
    setSelectedNote(noteText)
    setCustomNote('')
  }

  // Handle Tap 3: Callback Schedule
  const handleSelectCallback = (callbackId: string) => {
    setSelectedCallbackId(callbackId)
  }

  // Final submit handler
  const handleFinalSubmit = async () => {
    if (!selectedOutcomeId) {
      alert('Vui lòng chọn kết quả cuộc gọi (Chạm 1).')
      return
    }

    setSubmitting(true)
    try {
      const outcomeObj = OUTCOMES.find((o) => o.id === selectedOutcomeId)
      const finalNote = customNote.trim() || selectedNote || outcomeObj?.defaultNote || 'Ghi nhanh cuộc gọi'
      const callbackObj = CALLBACK_PRESETS.find((c) => c.id === selectedCallbackId)
      const callbackTiming = callbackObj ? callbackObj.getDate() : { dateStr: '', timeStr: '' }

      const targetCustId = selectedCustomerId
      const targetCustName = currentCustomer?.name || preselectedCustomerName || 'Khách hàng'
      const oppId = latestOpenOpportunity ? latestOpenOpportunity.id : ''
      const oppTitle = latestOpenOpportunity ? latestOpenOpportunity.title : ''

      // 1. Create Opportunity Activity (or standalone customer activity)
      if (oppId) {
        await opportunityActivityService.createActivity({
          opportunity_id: oppId,
          opportunity_title: oppTitle,
          customer_id: targetCustId,
          customer_name: targetCustName,
          type: 'CALL',
          title: `[Ghi nhanh Mobile] ${outcomeObj?.label || 'Cuộc gọi điện thoại'}`,
          content: finalNote,
          outcome: outcomeObj?.badge || outcomeObj?.label,
          occurred_at: new Date().toISOString(),
          performed_by_name: user?.full_name || user?.email || 'Nhân viên kinh doanh',
          next_action: callbackObj && callbackObj.id !== 'NONE' ? `Gọi lại: ${callbackObj.label}` : undefined,
          next_action_due: callbackTiming.dateStr || undefined,
        })
      }

      // 2. Also log to Customer Activities if customer exists
      if (targetCustId) {
        customerService.addActivity({
          customer_id: targetCustId,
          type: 'CALL',
          title: `[Ghi nhanh Mobile] Cuộc gọi: ${outcomeObj?.label}`,
          description: finalNote,
          performed_by_name: user?.full_name || user?.email || 'Nhân viên',
        })
      }

      // 3. Create reminder Task if callback scheduled
      if (callbackObj && callbackObj.id !== 'NONE' && callbackTiming.dateStr) {
        await opportunityTaskService.createTask({
          opportunity_id: oppId || undefined,
          opportunity_title: oppTitle || undefined,
          customer_id: targetCustId,
          customer_name: targetCustName,
          title: `[Gọi lại] ${targetCustName} - ${callbackObj.label}`,
          due_date: callbackTiming.dateStr,
          due_time: callbackTiming.timeStr,
          priority: 'HIGH',
          description: `Ghi chú cuộc gọi trước: ${finalNote}`,
          assigned_to_id: user?.id,
          assigned_to_name: user?.full_name || user?.email || 'Tôi',
        })
      }

      if (onSuccess) {
        onSuccess(`Đã lưu nhanh cuộc gọi thành công! ${oppId ? `(Tự động gắn vào deal: ${oppTitle})` : ''}`)
      }
      onClose()
    } catch (err) {
      console.error('Lỗi khi lưu cuộc gọi nhanh:', err)
      alert('Không thể lưu cuộc gọi. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter customers for dropdown/search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8)
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    ).slice(0, 8)
  }, [customers, customerSearch])

  if (!isOpen) return null

  return (
    <div className="quick-call-mobile-overlay" onClick={onClose}>
      <div
        className="quick-call-mobile-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-call-title"
      >
        {/* Mobile Header Bar */}
        <div className="sheet-handle-bar" />
        <div className="sheet-header">
          <div className="title-area">
            <span className="icon-phone-badge">📞</span>
            <div>
              <h3 id="quick-call-title">Ghi nhanh cuộc gọi (Mobile 3 chạm)</h3>
              <span className="sub-hint">Hoàn tất trong tối đa 3 thao tác chạm</span>
            </div>
          </div>
          <button type="button" className="sheet-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* 3-tap indicator pill */}
        <div className="tap-progress-indicator">
          <div className={`step-dot ${selectedOutcomeId ? 'active' : ''}`}>
            <span>1</span> Kết quả
          </div>
          <div className="step-connector" />
          <div className={`step-dot ${selectedNote || customNote ? 'active' : ''}`}>
            <span>2</span> Ghi chú
          </div>
          <div className="step-connector" />
          <div className={`step-dot ${selectedCallbackId ? 'active' : ''}`}>
            <span>3</span> Lịch hẹn
          </div>
          <span className="tap-badge">{tapCount}/3 chạm</span>
        </div>

        <div className="sheet-body">
          {/* Customer & Auto-linked Opportunity Box (S6-10 AC) */}
          <div className="quick-call-target-box">
            <div className="customer-select-row">
              <label htmlFor="qc-cust-select">Khách hàng:</label>
              {!preselectedCustomerId ? (
                <div className="cust-search-wrapper">
                  <input
                    type="text"
                    id="qc-cust-select"
                    className="form-control form-control-sm"
                    placeholder="Tìm tên hoặc SĐT khách..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {filteredCustomers.length > 0 && customerSearch && (
                    <div className="cust-quick-dropdown">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          className={`dropdown-cust-item ${c.id === selectedCustomerId ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCustomerId(c.id)
                            setCustomerSearch(c.name)
                          }}
                        >
                          <strong>{c.name}</strong>
                          <span>{c.phone || c.email || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="preselected-cust-name">
                  🏢 <strong>{currentCustomer?.name || preselectedCustomerName}</strong>
                </span>
              )}
            </div>

            {/* S6-10 AC: Tự động gắn vào cơ hội đang mở gần nhất của khách hàng */}
            <div className="auto-deal-link-banner" id="auto-linked-opportunity-banner">
              {latestOpenOpportunity ? (
                <div className="deal-linked-success">
                  <span className="badge-target-deal">🎯 Deal liên kết tự động</span>
                  <strong className="deal-name">{latestOpenOpportunity.title}</strong>
                  <span className="deal-stage">({latestOpenOpportunity.stage_name || 'Đang mở'})</span>
                </div>
              ) : (
                <div className="deal-linked-empty">
                  <span>ℹ️ Khách chưa có deal mở. Cuộc gọi sẽ được ghi vào Dòng thời gian 360 khách hàng.</span>
                </div>
              )}
            </div>
          </div>

          {/* ── CHẠM 1: KẾT QUẢ CUỘC GỌI ── */}
          <div className="tap-section" id="tap-step-1">
            <div className="section-title">
              <span className="step-num">1</span>
              <h4>Chọn kết quả cuộc gọi:</h4>
            </div>
            <div className="outcome-chips-grid">
              {OUTCOMES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`outcome-chip-btn ${selectedOutcomeId === o.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOutcome(o.id)}
                >
                  <span className="chip-badge">{o.badge}</span>
                  <span className="chip-label">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CHẠM 2: GHI CHÚ NHANH ── */}
          <div className="tap-section" id="tap-step-2">
            <div className="section-title">
              <span className="step-num">2</span>
              <h4>Chọn ghi chú ngắn (hoặc nhập thêm):</h4>
            </div>
            <div className="quick-notes-flex">
              {QUICK_NOTES.map((note, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`note-chip-btn ${selectedNote === note && !customNote ? 'selected' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  {note}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="form-control quick-note-input"
              placeholder="Hoặc gõ nhanh ghi chú tại đây..."
              value={customNote || (selectedNote ? '' : '')}
              onChange={(e) => {
                setCustomNote(e.target.value)
                if (e.target.value) setSelectedNote('')
              }}
            />
          </div>

          {/* ── CHẠM 3: ĐẶT LỊCH GỌI LẠI ── */}
          <div className="tap-section" id="tap-step-3">
            <div className="section-title">
              <span className="step-num">3</span>
              <h4>Đặt lịch gọi lại (Tự tạo việc nhắc):</h4>
            </div>
            <div className="callback-chips-grid">
              {CALLBACK_PRESETS.map((cb) => (
                <button
                  key={cb.id}
                  type="button"
                  className={`callback-chip-btn ${selectedCallbackId === cb.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCallback(cb.id)}
                >
                  🕒 {cb.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="sheet-footer">
          <button
            type="button"
            className="btn btn-secondary btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary btn-submit-3tap"
            id="btn-quick-call-submit"
            onClick={handleFinalSubmit}
            disabled={!selectedOutcomeId || submitting}
          >
            {submitting ? 'Đang lưu...' : '⚡ Hoàn tất & Lưu ngay'}
          </button>
        </div>
      </div>
    </div>
  )
}
