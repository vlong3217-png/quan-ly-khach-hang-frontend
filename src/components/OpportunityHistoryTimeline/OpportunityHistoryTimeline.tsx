import { useState, useEffect } from 'react'
import type { OpportunityFieldChange, OpportunityChangeField } from '../../types/opportunityHistory.ts'
import { opportunityHistoryService } from '../../services/opportunityHistoryService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityHistoryTimeline.css'

interface OpportunityHistoryTimelineProps {
  opportunityId: string
  opportunityTitle?: string
}

export default function OpportunityHistoryTimeline({
  opportunityId,
  opportunityTitle,
}: OpportunityHistoryTimelineProps) {
  const { user } = useAuth()
  const [historyList, setHistoryList] = useState<OpportunityFieldChange[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedField, setSelectedField] = useState<OpportunityChangeField | 'ALL'>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Form ghi chú bổ sung lý do thay đổi
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [customField, setCustomField] = useState<OpportunityChangeField>('expected_revenue')
  const [oldValInput, setOldValInput] = useState('')
  const [newValInput, setNewValInput] = useState('')
  const [reasonInput, setReasonInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await opportunityHistoryService.getHistory(opportunityId)
      setHistoryList(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [opportunityId])

  const filteredHistory = historyList.filter((item) => {
    if (selectedField !== 'ALL' && item.field !== selectedField) return false
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase()
      const matchLabel = item.field_label.toLowerCase().includes(q)
      const matchOld = (item.old_display || item.old_value).toLowerCase().includes(q)
      const matchNew = (item.new_display || item.new_value).toLowerCase().includes(q)
      const matchUser = item.changed_by_name.toLowerCase().includes(q)
      const matchReason = (item.reason || '').toLowerCase().includes(q)
      return matchLabel || matchOld || matchNew || matchUser || matchReason
    }
    return true
  })

  const getFieldIcon = (field: OpportunityChangeField) => {
    switch (field) {
      case 'stage':
        return '🔄'
      case 'expected_revenue':
        return '💰'
      case 'expected_close_date':
        return '📅'
      case 'owner':
        return '👤'
      case 'win_probability':
        return '📈'
      default:
        return '📝'
    }
  }

  const getFieldBadgeClass = (field: OpportunityChangeField) => {
    switch (field) {
      case 'stage':
        return 'badge-stage'
      case 'expected_revenue':
        return 'badge-revenue'
      case 'expected_close_date':
        return 'badge-date'
      case 'owner':
        return 'badge-owner'
      case 'win_probability':
        return 'badge-probability'
      default:
        return 'badge-other'
    }
  }

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  const handleManualRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newValInput.trim()) return

    setSubmitting(true)
    try {
      const fieldLabels: Record<OpportunityChangeField, string> = {
        stage: 'Giai đoạn Pipeline',
        expected_revenue: 'Doanh số dự kiến',
        expected_close_date: 'Ngày chốt dự kiến',
        owner: 'Người phụ trách',
        win_probability: 'Xác suất thắng',
        other: 'Thông tin khác',
      }

      await opportunityHistoryService.recordChange({
        opportunity_id: opportunityId,
        field: customField,
        field_label: fieldLabels[customField] || 'Thông tin cơ hội',
        old_value: oldValInput.trim(),
        new_value: newValInput.trim(),
        old_display: oldValInput.trim() || '—',
        new_display: newValInput.trim(),
        reason: reasonInput.trim() || 'Ghi nhận điều chỉnh thủ công',
        changed_by_id: user?.id ? Number(user.id) : undefined,
        changed_by_name: user?.full_name || 'Người dùng hiện tại',
      })

      setOldValInput('')
      setNewValInput('')
      setReasonInput('')
      setIsAddNoteOpen(false)
      await loadHistory()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="opportunity-history-timeline-container" id="s6-01-history-timeline">
      {/* Header & Controls */}
      <div className="history-header">
        <div className="history-title-wrap">
          <h4 className="history-title">
            📜 Lịch sử thay đổi cơ hội
            {opportunityTitle ? ` · ${opportunityTitle}` : ''}
          </h4>
          <span className="history-count-badge">
            {historyList.length} lần cập nhật
          </span>
        </div>
        <div className="history-actions">
          <button
            type="button"
            className="btn-refresh-history"
            onClick={loadHistory}
            title="Tải lại nhật ký"
          >
            ↻ Làm mới
          </button>
          <button
            type="button"
            className="btn-add-history-note"
            onClick={() => setIsAddNoteOpen(!isAddNoteOpen)}
          >
            {isAddNoteOpen ? '✕ Đóng form' : '+ Ghi chú thay đổi'}
          </button>
        </div>
      </div>

      {/* Form ghi chú bổ sung thay đổi nếu cần */}
      {isAddNoteOpen && (
        <form className="history-quick-form" onSubmit={handleManualRecord}>
          <div className="history-form-grid">
            <div className="form-group">
              <label>Thuộc tính thay đổi *</label>
              <select
                className="form-control"
                value={customField}
                onChange={(e) => setCustomField(e.target.value as OpportunityChangeField)}
              >
                <option value="expected_revenue">💰 Doanh số dự kiến</option>
                <option value="expected_close_date">📅 Ngày chốt dự kiến</option>
                <option value="stage">🔄 Giai đoạn Pipeline</option>
                <option value="owner">👤 Người phụ trách</option>
                <option value="win_probability">📈 Xác suất thắng (%)</option>
                <option value="other">📝 Thuộc tính khác</option>
              </select>
            </div>
            <div className="form-group">
              <label>Giá trị trước đây</label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: 50.000.000 ₫ hoặc 2026-10-20"
                value={oldValInput}
                onChange={(e) => setOldValInput(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Giá trị mới *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="VD: 120.000.000 ₫ hoặc 2026-11-15"
                value={newValInput}
                onChange={(e) => setNewValInput(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Lý do điều chỉnh (giúp Trưởng nhóm & Quản lý nắm bối cảnh) *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="VD: Khách hàng yêu cầu mở rộng gói dịch vụ thêm 50 user license"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            />
          </div>
          <div className="form-actions" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddNoteOpen(false)}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Lưu vào lịch sử'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Search */}
      <div className="history-filter-bar">
        <div className="history-chips">
          <button
            type="button"
            className={`chip-btn ${selectedField === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedField('ALL')}
          >
            Tất cả ({historyList.length})
          </button>
          <button
            type="button"
            className={`chip-btn ${selectedField === 'stage' ? 'active' : ''}`}
            onClick={() => setSelectedField('stage')}
          >
            🔄 Giai đoạn ({historyList.filter((h) => h.field === 'stage').length})
          </button>
          <button
            type="button"
            className={`chip-btn ${selectedField === 'expected_revenue' ? 'active' : ''}`}
            onClick={() => setSelectedField('expected_revenue')}
          >
            💰 Doanh số ({historyList.filter((h) => h.field === 'expected_revenue').length})
          </button>
          <button
            type="button"
            className={`chip-btn ${selectedField === 'expected_close_date' ? 'active' : ''}`}
            onClick={() => setSelectedField('expected_close_date')}
          >
            📅 Ngày chốt ({historyList.filter((h) => h.field === 'expected_close_date').length})
          </button>
          <button
            type="button"
            className={`chip-btn ${selectedField === 'owner' ? 'active' : ''}`}
            onClick={() => setSelectedField('owner')}
          >
            👤 Phụ trách ({historyList.filter((h) => h.field === 'owner').length})
          </button>
        </div>
        <div className="history-search-box">
          <input
            type="text"
            className="history-search-input"
            placeholder="Tìm theo người sửa, lý do, giá trị..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="history-timeline-body">
        {loading ? (
          <div className="history-loading">Đang tải lịch sử thay đổi...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="history-empty">
            <div className="empty-icon">📂</div>
            <p className="empty-text">Chưa có bản ghi thay đổi nào cho cơ hội này.</p>
            <span className="empty-hint">
              Mọi thay đổi về Giai đoạn, Doanh số, Ngày chốt và Người phụ trách sẽ được hệ thống tự động ghi nhật ký tại đây.
            </span>
          </div>
        ) : (
          <div className="history-timeline-list">
            {filteredHistory.map((item) => (
              <div key={item.id} className="history-timeline-card">
                <div className="card-timeline-indicator">
                  <div className={`indicator-icon ${getFieldBadgeClass(item.field)}`}>
                    {getFieldIcon(item.field)}
                  </div>
                  <div className="indicator-line" />
                </div>

                <div className="card-main-content">
                  <div className="card-header-row">
                    <div className="card-field-info">
                      <span className={`field-badge ${getFieldBadgeClass(item.field)}`}>
                        {item.field_label}
                      </span>
                    </div>
                    <div className="card-meta-info">
                      <span className="card-author">
                        👤 <strong>{item.changed_by_name}</strong>
                      </span>
                      <span className="card-separator">·</span>
                      <span className="card-time" title={item.changed_at}>
                        🕒 {formatDateTime(item.changed_at)}
                      </span>
                    </div>
                  </div>

                  {/* Giá trị trước vs sau thay đổi */}
                  <div className="card-diff-box">
                    <div className="diff-segment old-segment">
                      <span className="diff-label">Trước:</span>
                      <span className="diff-value old-val">
                        {item.old_display || item.old_value || 'Chưa thiết lập'}
                      </span>
                    </div>
                    <div className="diff-arrow">➔</div>
                    <div className="diff-segment new-segment">
                      <span className="diff-label">Sau:</span>
                      <span className="diff-value new-val">
                        {item.new_display || item.new_value}
                      </span>
                    </div>
                  </div>

                  {/* Lý do thay đổi nếu có */}
                  {item.reason && (
                    <div className="card-reason-box">
                      <span className="reason-label">Lý do:</span>
                      <span className="reason-text">{item.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
