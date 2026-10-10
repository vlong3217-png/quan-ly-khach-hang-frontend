import React, { useState } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import './StalledOpportunityAlerts.css'

interface StalledOpportunityAlertsProps {
  opportunities: Opportunity[]
  isManagerOrAdmin: boolean
  managerName?: string
  managerId?: number
  onOpportunityUpdated?: (updated: Opportunity) => void
  onOpenOpportunityDetail?: (opp: Opportunity) => void
  onReassignOpportunity?: (opp: Opportunity) => void
}

export default function StalledOpportunityAlerts({
  opportunities,
  isManagerOrAdmin,
  managerName = 'Trưởng nhóm',
  managerId,
  onOpportunityUpdated,
  onOpenOpportunityDetail,
  onReassignOpportunity,
}: StalledOpportunityAlertsProps) {
  const [config, setConfig] = useState(() => opportunityService.getStalledConfig())
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [configDaysInStage, setConfigDaysInStage] = useState(config.max_days_in_stage)
  const [configDaysInactive, setConfigDaysInactive] = useState(config.max_days_inactive)

  // Modal Can thiệp Trưởng nhóm
  const [selectedAlertOpp, setSelectedAlertOpp] = useState<Opportunity | null>(null)
  const [interventionMessage, setInterventionMessage] = useState('')
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Phân tích các cơ hội bị đình trệ
  const stalledAlerts = opportunities
    .map((opp) => {
      const analysis = opportunityService.analyzeStalledOpportunity(opp, config)
      return {
        opp,
        ...analysis,
      }
    })
    .filter((item) => item.isStalled)

  const criticalCount = stalledAlerts.filter((a) => a.severity === 'CRITICAL').length
  const warningCount = stalledAlerts.filter((a) => a.severity === 'WARNING').length
  const totalStalledRevenue = stalledAlerts.reduce((acc, a) => acc + (a.opp.expected_revenue || 0), 0)

  // Format tiền tệ
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Mở modal can thiệp
  const handleOpenIntervene = (opp: Opportunity, defaultMsg: string) => {
    setSelectedAlertOpp(opp)
    setInterventionMessage(
      `Đề nghị ${opp.owner_name} khẩn trương liên hệ lại khách hàng ${opp.customer_name}. ${defaultMsg}`
    )
    setIsInterventionModalOpen(true)
  }

  // Xác nhận gửi chỉ đạo can thiệp
  const handleSubmitIntervention = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAlertOpp || !interventionMessage.trim()) return

    setIsSubmitting(true)
    try {
      await opportunityService.sendStalledInterventionNotice(
        selectedAlertOpp.id,
        interventionMessage.trim(),
        managerName
      )

      // Ghi nhận vào Timeline hoạt động (S5-03)
      await opportunityActivityService.createActivity({
        opportunity_id: selectedAlertOpp.id,
        type: 'NOTE',
        title: `🚨 Trưởng nhóm can thiệp: Cảnh báo đình trệ`,
        content: interventionMessage.trim(),
        performed_by_id: managerId,
        performed_by_name: managerName,
        outcome: 'Đã gửi chỉ đạo khắc phục tới NVKD',
      })

      showToast(`Đã gửi chỉ đạo can thiệp sớm cho cơ hội ${selectedAlertOpp.code}!`)
      setIsInterventionModalOpen(false)
      if (onOpportunityUpdated) {
        onOpportunityUpdated({
          ...selectedAlertOpp,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch {
      alert('Không thể gửi can thiệp. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lưu cấu hình ngưỡng
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    const newCfg = {
      max_days_in_stage: Number(configDaysInStage) || 7,
      max_days_inactive: Number(configDaysInactive) || 5,
    }
    opportunityService.saveStalledConfig(newCfg)
    setConfig(newCfg)
    setIsConfigModalOpen(false)
    showToast('Đã cập nhật ngưỡng cảnh báo đình trệ thành công!')
  }

  return (
    <div className="stalled-alerts-container" id="stalled-alerts-section">
      {toastMessage && <div className="stalled-toast">{toastMessage}</div>}

      {/* ── Banner Header Cảnh báo Đình Trệ ── */}
      <div className="stalled-banner-card">
        <div className="stalled-banner-main">
          <div className="stalled-icon-pulse">
            <span role="img" aria-label="warning">
              ⚠️
            </span>
          </div>
          <div className="stalled-banner-text">
            <div className="stalled-banner-title-row">
              <h3>Hệ Thống Cảnh Báo Cơ Hội Đình Trệ (Stalled Deals Alert)</h3>
              <span className="stalled-badge-role">Dành cho Trưởng nhóm / Quản lý</span>
            </div>
            <p className="stalled-desc">
              Tự động phát hiện các thương vụ có dấu hiệu đứng yên, quá hạn giai đoạn hoặc không có tương tác,
              giúp Trưởng nhóm <strong>can thiệp sớm</strong> trước khi cơ hội bị nguội lạnh hoặc mất vào tay đối thủ.
            </p>
          </div>
        </div>

        <div className="stalled-metrics-grid">
          <div className="stalled-metric-pill critical">
            <span className="metric-count">{criticalCount}</span>
            <span className="metric-label">Cực kỳ nguy cấp</span>
          </div>
          <div className="stalled-metric-pill warning">
            <span className="metric-count">{warningCount}</span>
            <span className="metric-label">Cảnh báo can thiệp</span>
          </div>
          <div className="stalled-metric-pill revenue">
            <span className="metric-count">{formatCurrency(totalStalledRevenue)}</span>
            <span className="metric-label">Doanh thu bị đọng</span>
          </div>
          {isManagerOrAdmin && (
            <button
              type="button"
              className="btn-stalled-config"
              onClick={() => setIsConfigModalOpen(true)}
              title="Cấu hình ngưỡng ngày đình trệ"
            >
              ⚙️ Cấu hình ngưỡng ({config.max_days_in_stage}d / {config.max_days_inactive}d)
            </button>
          )}
        </div>
      </div>

      {/* ── Danh sách các Cơ hội bị đình trệ ── */}
      {stalledAlerts.length === 0 ? (
        <div className="stalled-empty-state">
          <div className="empty-icon">✅</div>
          <h4>Tuyệt vời! Không có cơ hội nào bị đình trệ trong nhóm</h4>
          <p>Tất cả các thương vụ đều đang được tương tác đều đặn và tiến triển đúng tiến độ cam kết.</p>
        </div>
      ) : (
        <div className="stalled-cards-list">
          {stalledAlerts.map(({ opp, stalledType, severity, daysStalled, message, suggestedAction }) => (
            <div
              key={opp.id}
              className={`stalled-deal-card severity-${severity?.toLowerCase() || 'warning'}`}
            >
              <div className="stalled-card-header">
                <div className="header-left">
                  <span className={`severity-tag tag-${severity?.toLowerCase() || 'warning'}`}>
                    {severity === 'CRITICAL' ? '🔴 NGUY CẤP' : '🟡 CẢNH BÁO'}
                  </span>
                  <span className="opp-code-badge">{opp.code}</span>
                  <span className="opp-title-text" onClick={() => onOpenOpportunityDetail?.(opp)}>
                    {opp.title}
                  </span>
                </div>
                <div className="header-right">
                  <span className="stalled-type-pill">
                    {stalledType === 'CLOSE_DATE_PASSED'
                      ? '⏱️ Quá hạn chốt'
                      : stalledType === 'INACTIVE_LONG'
                      ? '💤 Bỏ quên tương tác'
                      : '🛑 Kẹt giai đoạn'}
                  </span>
                  <span className="days-stalled-count">Đình trệ {daysStalled} ngày</span>
                </div>
              </div>

              <div className="stalled-card-body">
                <div className="stalled-meta-row">
                  <div className="meta-item">
                    <span className="meta-lbl">Khách hàng:</span>
                    <span className="meta-val font-semibold">🏢 {opp.customer_name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Giai đoạn:</span>
                    <span className="meta-val" style={{ color: opp.stage_color || '#2563eb' }}>
                      {opp.stage_name} ({opp.win_probability}%)
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Giá trị thương vụ:</span>
                    <span className="meta-val font-bold text-success">
                      {formatCurrency(opp.expected_revenue)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Người phụ trách:</span>
                    <span className="meta-val owner-name">👤 {opp.owner_name}</span>
                  </div>
                </div>

                <div className="stalled-reason-box">
                  <div className="reason-text">
                    <strong>Tình trạng:</strong> {message}
                  </div>
                  <div className="action-suggestion">
                    <strong>Gợi ý Trưởng nhóm:</strong> {suggestedAction}
                  </div>
                </div>
              </div>

              <div className="stalled-card-actions">
                <button
                  type="button"
                  className="btn-action-view"
                  onClick={() => onOpenOpportunityDetail?.(opp)}
                >
                  👁️ Xem chi tiết & Lịch sử
                </button>
                {isManagerOrAdmin && (
                  <>
                    <button
                      type="button"
                      className="btn-action-intervene"
                      onClick={() => handleOpenIntervene(opp, suggestedAction)}
                    >
                      📢 Can thiệp sớm / Đôn đốc
                    </button>
                    {onReassignOpportunity && (
                      <button
                        type="button"
                        className="btn-action-reassign"
                        onClick={() => onReassignOpportunity(opp)}
                        title="Phân bổ lại cơ hội cho NVKD khác (S5-08)"
                      >
                        🔄 Phân bổ lại (S5-08)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: CAN THIỆP SỚM / ĐÔN ĐỐC CƠ HỘI ĐÌNH TRỆ ── */}
      {isInterventionModalOpen && selectedAlertOpp && (
        <div className="modal-overlay stalled-modal-overlay" onClick={() => setIsInterventionModalOpen(false)}>
          <div className="modal-content stalled-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚨 Can Thiệp Sớm Cơ Hội Đình Trệ (S5-07)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsInterventionModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitIntervention} className="stalled-form">
              <div className="form-info-box">
                <p>
                  <strong>Cơ hội:</strong> {selectedAlertOpp.title} ({selectedAlertOpp.code})
                </p>
                <p>
                  <strong>Nhân viên phụ trách:</strong> {selectedAlertOpp.owner_name}
                </p>
                <p>
                  <strong>Doanh số dự kiến:</strong> {formatCurrency(selectedAlertOpp.expected_revenue)}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="intervention-msg-input">
                  Chỉ đạo / Yêu cầu can thiệp từ Trưởng nhóm (*):
                </label>
                <textarea
                  id="intervention-msg-input"
                  rows={4}
                  required
                  value={interventionMessage}
                  onChange={(e) => setInterventionMessage(e.target.value)}
                  placeholder="Nhập nội dung chỉ đạo, phương án hỗ trợ đàm phán hoặc hạn chót phản hồi..."
                />
                <span className="field-hint">
                  Nội dung này sẽ được lưu ngay vào Lịch sử tương tác của cơ hội và gửi thông báo tới nhân viên phụ trách.
                </span>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsInterventionModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi chỉ đạo can thiệp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CẤU HÌNH NGƯỠNG ĐÌNH TRỆ ── */}
      {isConfigModalOpen && (
        <div className="modal-overlay stalled-modal-overlay" onClick={() => setIsConfigModalOpen(false)}>
          <div className="modal-content stalled-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Cấu Hình Ngưỡng Cảnh Báo Đình Trệ</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsConfigModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveConfig} className="stalled-form">
              <div className="form-group">
                <label htmlFor="config-stage-days">
                  Số ngày tối đa ở 1 giai đoạn trước khi báo động (ngày):
                </label>
                <input
                  type="number"
                  id="config-stage-days"
                  min={1}
                  max={60}
                  required
                  value={configDaysInStage}
                  onChange={(e) => setConfigDaysInStage(Number(e.target.value))}
                />
                <span className="field-hint">Mặc định: 7 ngày không chuyển tiếp giai đoạn.</span>
              </div>

              <div className="form-group">
                <label htmlFor="config-inactive-days">
                  Số ngày tối đa không có hoạt động/tương tác mới (ngày):
                </label>
                <input
                  type="number"
                  id="config-inactive-days"
                  min={1}
                  max={30}
                  required
                  value={configDaysInactive}
                  onChange={(e) => setConfigDaysInactive(Number(e.target.value))}
                />
                <span className="field-hint">Mặc định: 5 ngày không có cuộc gọi, email, task hay ghi chú.</span>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsConfigModalOpen(false)}
                >
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
