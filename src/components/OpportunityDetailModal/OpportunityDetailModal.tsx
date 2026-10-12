import { useState, useEffect } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import { pipelineService } from '../../services/pipelineService.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { winLossService } from '../../services/winLossService.ts'
import OpportunityActivityTimeline from '../OpportunityActivityTimeline/OpportunityActivityTimeline.tsx'
import OpportunityTaskManager from '../OpportunityTaskManager/OpportunityTaskManager.tsx'
import ReassignOpportunityModal from '../ReassignOpportunityModal/ReassignOpportunityModal.tsx'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityDetailModal.css'

interface OpportunityDetailModalProps {
  opportunity: Opportunity
  isOpen: boolean
  initialTab?: 'ACTIVITIES' | 'DETAILS' | 'TASKS'
  onClose: () => void
  onOpportunityUpdated: (updated: Opportunity) => void
}

export default function OpportunityDetailModal({
  opportunity,
  isOpen,
  initialTab = 'ACTIVITIES',
  onClose,
  onOpportunityUpdated,
}: OpportunityDetailModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'ACTIVITIES' | 'DETAILS' | 'TASKS'>(initialTab)
  const [stages] = useState<PipelineStage[]>(() => pipelineService.getStages())
  const [currentOpp, setCurrentOpp] = useState<Opportunity>(opportunity)
  const [isChangingStage, setIsChangingStage] = useState<boolean>(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Đồng bộ lại currentOpp và activeTab khi modal mở hoặc props đổi
  useEffect(() => {
    setCurrentOpp(opportunity)
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [opportunity, initialTab, isOpen])

  if (!isOpen) return null

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  // Format tiền tệ VNĐ
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Chuyển giai đoạn Pipeline
  const handleStageChange = async (targetStage: PipelineStage) => {
    if (targetStage.id === currentOpp.stage_id) return
    setIsChangingStage(true)
    try {
      const oldStageName = currentOpp.stage_name
      const updated = await opportunityService.updateOpportunity(currentOpp.id, {
        stage_id: targetStage.id,
        stage_name: targetStage.name,
        win_probability: targetStage.win_probability,
        stage_color: targetStage.color,
      })
      setCurrentOpp(updated)
      onOpportunityUpdated(updated)

      // Ghi nhận hoạt động STAGE_CHANGE tự động vào timeline (S5-03)
      await opportunityActivityService.createActivity({
        opportunity_id: currentOpp.id,
        type: 'STAGE_CHANGE',
        title: `Chuyển giai đoạn: ${oldStageName} → ${targetStage.name}`,
        content: `Cơ hội được chuyển sang giai đoạn "${targetStage.name}" với xác suất thắng dự báo là ${targetStage.win_probability}%.`,
        performed_by_id: user?.id ? Number(user.id) : undefined,
        performed_by_name: user?.full_name || 'Người dùng',
      })

      showNotice(`Đã chuyển sang giai đoạn "${targetStage.name}"!`)
    } catch {
      alert('Không thể cập nhật giai đoạn cơ hội. Vui lòng thử lại.')
    } finally {
      setIsChangingStage(false)
    }
  }

  const isClosed = currentOpp.status === 'WON' || currentOpp.status === 'LOST'
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // State Modal Đóng Thắng (S5-05)
  const [isCloseWonModalOpen, setIsCloseWonModalOpen] = useState(false)
  const [actualRevenueInput, setActualRevenueInput] = useState<string>(
    String(currentOpp.actual_revenue || currentOpp.expected_revenue || '')
  )
  const [actualCloseDateInput, setActualCloseDateInput] = useState<string>(
    currentOpp.actual_close_date || new Date().toISOString().split('T')[0]
  )
  const [winReasonIdInput, setWinReasonIdInput] = useState<string>(currentOpp.win_reason_id || '')
  const [winNotesInput, setWinNotesInput] = useState<string>(currentOpp.win_notes || '')
  const [winLossSubmitting, setWinLossSubmitting] = useState(false)
  const [winModalError, setWinModalError] = useState<string | null>(null)

  // State Modal Đóng Thua (S5-05)
  const [isCloseLostModalOpen, setIsCloseLostModalOpen] = useState(false)
  const [lostReasonIdInput, setLostReasonIdInput] = useState<string>(currentOpp.lost_reason_id || '')
  const [competitorIdInput, setCompetitorIdInput] = useState<string>(currentOpp.competitor_id || '')
  const [lossNotesInput, setLossNotesInput] = useState<string>(currentOpp.loss_notes || '')
  const [lossModalError, setLossModalError] = useState<string | null>(null)

  // State Modal Mở lại cơ hội (S5-05)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)
  const [reopenReasonInput, setReopenReasonInput] = useState<string>('')
  const [reopenTargetStageId, setReopenTargetStageId] = useState<string>('stage-5')
  const [reopenModalError, setReopenModalError] = useState<string | null>(null)

  // State Modal Phân bổ lại cơ hội (S5-08)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)

  // Data lý do và đối thủ từ winLossService
  const winReasons = winLossService.getReasons('WIN_REASON').filter((r) => r.is_active)
  const lossReasons = winLossService.getReasons('LOSS_REASON').filter((r) => r.is_active)
  const competitors = winLossService.getCompetitors().filter((c) => c.is_active)

  // Xử lý submit Đóng Thắng (S5-05 AC1)
  const handleConfirmCloseWon = async (e: React.FormEvent) => {
    e.preventDefault()
    const rev = Number(actualRevenueInput)
    if (!rev || rev <= 0) {
      setWinModalError('Vui lòng nhập giá trị chốt thực tế lớn hơn 0!')
      return
    }
    if (!actualCloseDateInput) {
      setWinModalError('Vui lòng nhập ngày ký hợp đồng thực tế!')
      return
    }

    setWinLossSubmitting(true)
    setWinModalError(null)
    try {
      const selectedWinReason = winReasons.find((r) => r.id === winReasonIdInput)
      const updated = await opportunityService.closeWon(currentOpp.id, {
        actual_revenue: rev,
        actual_close_date: actualCloseDateInput,
        win_reason_id: winReasonIdInput || undefined,
        win_reason_name: selectedWinReason?.name || undefined,
        win_notes: winNotesInput,
        closed_by_id: user?.id ? Number(user.id) : 1,
        closed_by_name: user?.full_name || 'Nhân viên kinh doanh',
      })

      // Ghi hoạt động hệ thống vào Timeline (S5-03)
      await opportunityActivityService.createActivity({
        opportunity_id: currentOpp.id,
        type: 'SYSTEM',
        title: `🎉 Đóng Thắng cơ hội (Deal Won): ${formatCurrency(rev)}`,
        content: `Cơ hội đã được chốt thành công ngày ${actualCloseDateInput}. Giá trị thực tế: ${formatCurrency(rev)}${selectedWinReason ? ` | Lý do thắng: ${selectedWinReason.name}` : ''}. Doanh số được tính vào chỉ tiêu của ${currentOpp.owner_name}.`,
        performed_by_id: user?.id ? Number(user.id) : 1,
        performed_by_name: user?.full_name || 'Nhân viên kinh doanh',
        outcome: 'Thành công - Đã ký hợp đồng',
      })

      setCurrentOpp(updated)
      onOpportunityUpdated(updated)
      setIsCloseWonModalOpen(false)
      showNotice('Chúc mừng! Đã đóng Thắng cơ hội và ghi nhận doanh số thành công!')
    } catch (err) {
      setWinModalError(err instanceof Error ? err.message : 'Lỗi khi đóng thắng cơ hội.')
    } finally {
      setWinLossSubmitting(false)
    }
  }

  // Xử lý submit Đóng Thua (S5-05 AC2)
  const handleConfirmCloseLost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lostReasonIdInput) {
      setLossModalError('Vui lòng chọn lý do thua!')
      return
    }

    setWinLossSubmitting(true)
    setLossModalError(null)
    try {
      const selectedLossReason = lossReasons.find((r) => r.id === lostReasonIdInput)
      const selectedComp = competitors.find((c) => c.id === competitorIdInput)

      const updated = await opportunityService.closeLost(currentOpp.id, {
        lost_reason_id: lostReasonIdInput,
        lost_reason: selectedLossReason?.name || 'Không xác định',
        competitor_id: competitorIdInput || undefined,
        competitor_name: selectedComp?.name || undefined,
        loss_notes: lossNotesInput,
        closed_by_id: user?.id ? Number(user.id) : 1,
        closed_by_name: user?.full_name || 'Nhân viên kinh doanh',
      })

      // Ghi hoạt động hệ thống vào Timeline (S5-03)
      await opportunityActivityService.createActivity({
        opportunity_id: currentOpp.id,
        type: 'SYSTEM',
        title: `Đóng Thua cơ hội (Deal Lost)`,
        content: `Lý do thất bại: "${selectedLossReason?.name}".${selectedComp ? ` Đối thủ thắng thầu: ${selectedComp.name}.` : ''}${lossNotesInput ? ` Ghi chú: ${lossNotesInput}` : ''}`,
        performed_by_id: user?.id ? Number(user.id) : 1,
        performed_by_name: user?.full_name || 'Nhân viên kinh doanh',
        outcome: 'Thất bại - Đã đóng deal',
      })

      setCurrentOpp(updated)
      onOpportunityUpdated(updated)
      setIsCloseLostModalOpen(false)
      showNotice('Đã ghi nhận Đóng Thua cơ hội để phân tích nguyên nhân.')
    } catch (err) {
      setLossModalError(err instanceof Error ? err.message : 'Lỗi khi đóng thua cơ hội.')
    } finally {
      setWinLossSubmitting(false)
    }
  }

  // Xử lý submit Mở lại cơ hội (S5-05 AC3)
  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reopenReasonInput.trim()) {
      setReopenModalError('Trưởng nhóm bắt buộc phải nhập lý do mở lại cơ hội!')
      return
    }

    setWinLossSubmitting(true)
    setReopenModalError(null)
    try {
      const targetStage = stages.find((s) => s.id === reopenTargetStageId)
      const updated = await opportunityService.reopenOpportunity(currentOpp.id, {
        reopen_reason: reopenReasonInput.trim(),
        target_stage_id: reopenTargetStageId,
        target_stage_name: targetStage?.name || 'Đàm phán hợp đồng',
        target_win_probability: targetStage?.win_probability || 85,
        reopened_by_id: user?.id ? Number(user.id) : 1,
        reopened_by_name: user?.full_name || 'Trưởng nhóm',
      })

      // Ghi hoạt động hệ thống vào Timeline
      await opportunityActivityService.createActivity({
        opportunity_id: currentOpp.id,
        type: 'SYSTEM',
        title: `🔓 Trưởng nhóm mở lại cơ hội bán hàng`,
        content: `Cơ hội đã được mở lại sang giai đoạn "${targetStage?.name || 'Đàm phán hợp đồng'}". Lý do mở lại: "${reopenReasonInput.trim()}". Thực hiện bởi: ${user?.full_name || 'Trưởng nhóm'}.`,
        performed_by_id: user?.id ? Number(user.id) : 1,
        performed_by_name: user?.full_name || 'Trưởng nhóm',
        outcome: 'Mở lại quy trình bán hàng',
      })

      setCurrentOpp(updated)
      onOpportunityUpdated(updated)
      setIsReopenModalOpen(false)
      showNotice('Đã mở lại cơ hội thành công để tiếp tục chăm sóc!')
    } catch (err) {
      setReopenModalError(err instanceof Error ? err.message : 'Lỗi khi mở lại cơ hội.')
    } finally {
      setWinLossSubmitting(false)
    }
  }


  return (
    <div className="modal-overlay opp-detail-modal-overlay" onClick={onClose}>
      <div
        className="modal-content opp-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Toast thông báo */}
        {notice && (
          <div className="opp-toast-notice">
            <span>✓ {notice}</span>
          </div>
        )}

        {/* ── Modal Header ── */}
        <div className="opp-modal-header">
          <div className="opp-header-title-block">
            <div className="opp-header-badges">
              <span className="opp-code-badge">{currentOpp.code}</span>
              <span className={`opp-status-badge status-${currentOpp.status.toLowerCase()}`}>
                {currentOpp.status === 'OPEN'
                  ? 'Đang mở'
                  : currentOpp.status === 'WON'
                  ? 'Thắng deal'
                  : currentOpp.status === 'LOST'
                  ? 'Thua deal'
                  : currentOpp.status}
              </span>
              {currentOpp.lead_id && (
                <span className="opp-converted-badge" title="Cơ hội sinh ra từ chuyển đổi Lead">
                  Lead converted
                </span>
              )}
            </div>
            <h2 className="opp-title-heading">{currentOpp.title}</h2>
            <div className="opp-customer-subtitle">
              <span>🏢 Khách hàng: <strong>{currentOpp.customer_name}</strong></span>
              {currentOpp.contact_name && (
                <span> | 👤 Người liên hệ: {currentOpp.contact_name}</span>
              )}
              {currentOpp.contact_phone && (
                <span> ({currentOpp.contact_phone})</span>
              )}
            </div>
          </div>

          <div className="opp-header-kpi-block">
            <div className="kpi-box">
              <span className="kpi-label">Giá trị cơ hội</span>
              <span className="kpi-value revenue-value">
                {formatCurrency(currentOpp.expected_revenue)}
              </span>
            </div>
            <div className="kpi-box">
              <span className="kpi-label">Xác suất thắng</span>
              <span className="kpi-value prob-value">
                {currentOpp.win_probability}%
              </span>
            </div>
            <div className="kpi-box">
              <span className="kpi-label">Dự kiến chốt</span>
              <span className="kpi-value date-value">
                {currentOpp.expected_close_date || 'Chưa đặt'}
              </span>
            </div>
            <button
              type="button"
              className="opp-close-btn"
              onClick={onClose}
              aria-label="Đóng chi tiết cơ hội"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Pipeline Stage Flow Ribbon & Close Actions (S5-05) ── */}
        <div className="opp-pipeline-ribbon">
          <div className="ribbon-label">Quy trình bán hàng (Pipeline):</div>
          <div className="ribbon-steps-container">
            {stages.map((stage) => {
              const isCurrent = stage.id === currentOpp.stage_id
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`ribbon-step-btn ${isCurrent ? 'active-step' : ''} ${isClosed ? 'step-locked' : ''}`}
                  disabled={isChangingStage || isClosed}
                  onClick={() => handleStageChange(stage)}
                  title={
                    isClosed
                      ? 'Cơ hội đã đóng, không thể đổi giai đoạn trực tiếp'
                      : `Nhấp để chuyển sang: ${stage.name} (${stage.win_probability}%)`
                  }
                >
                  <span className="step-name">{stage.name}</span>
                  <span className="step-prob">{stage.win_probability}%</span>
                </button>
              )
            })}
          </div>

          {/* S5-05 Quick Action Buttons in Ribbon */}
          <div className="opp-close-actions-ribbon">
            {!isClosed ? (
              <>
                {isManagerOrAdmin && (
                  <button
                    type="button"
                    className="opp-btn-action-reassign-ribbon"
                    onClick={() => setIsReassignModalOpen(true)}
                    title="Phân bổ lại cơ hội cho nhân viên khác trong nhóm (S5-08)"
                    id="btn-reassign-ribbon"
                  >
                    🔄 Phân bổ lại
                  </button>
                )}
                <button
                  type="button"
                  className="opp-btn-action-won"
                  onClick={() => setIsCloseWonModalOpen(true)}
                  title="Chốt thành công cơ hội (S5-05 AC1)"
                  id="btn-close-won"
                >
                  🏆 Đóng Thắng
                </button>
                <button
                  type="button"
                  className="opp-btn-action-lost"
                  onClick={() => setIsCloseLostModalOpen(true)}
                  title="Chốt thất bại cơ hội (S5-05 AC2)"
                  id="btn-close-lost"
                >
                  ❌ Đóng Thua
                </button>
              </>
            ) : (
              <div className="opp-closed-status-pill">
                <span className={`pill-badge badge-${currentOpp.status.toLowerCase()}`}>
                  {currentOpp.status === 'WON' ? '✓ ĐÃ ĐÓNG THẮNG' : '✕ ĐÃ ĐÓNG THUA'}
                </span>
                {isManagerOrAdmin && (
                  <button
                    type="button"
                    className="opp-btn-action-reopen"
                    onClick={() => setIsReopenModalOpen(true)}
                    title="Chỉ Quản lý/Trưởng nhóm mới có quyền mở lại cơ hội (S5-05 AC3)"
                    id="btn-reopen-opportunity"
                  >
                    🔓 Mở lại cơ hội
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Notice Banner if Closed (S5-05) ── */}
        {isClosed && (
          <div className={`opp-closed-banner banner-${currentOpp.status.toLowerCase()}`}>
            <div className="closed-banner-icon">
              {currentOpp.status === 'WON' ? '🏆' : '📌'}
            </div>
            <div className="closed-banner-content">
              <strong>
                {currentOpp.status === 'WON'
                  ? `Cơ hội đã Chốt Thắng (Ký kết ngày ${currentOpp.actual_close_date || 'N/A'}) - Doanh số thực tế: ${formatCurrency(currentOpp.actual_revenue || currentOpp.expected_revenue)}`
                  : `Cơ hội đã Đóng Thua - Lý do: "${currentOpp.lost_reason || 'Không rõ'}"${currentOpp.competitor_name ? ` (Thua đối thủ: ${currentOpp.competitor_name})` : ''}`}
              </strong>
              <span>
                Cơ hội đã đóng ở chế độ chỉ đọc. Không thể chỉnh sửa giai đoạn ngoại trừ Trưởng nhóm/Quản trị viên mở lại kèm lý do.
              </span>
            </div>
            {isManagerOrAdmin && (
              <button
                type="button"
                className="opp-btn-banner-reopen"
                onClick={() => setIsReopenModalOpen(true)}
              >
                Mở lại
              </button>
            )}
          </div>
        )}

        {/* ── Navigation Tabs ── */}
        <div className="opp-modal-tabs">
          <button
            type="button"
            className={`opp-tab-btn ${activeTab === 'ACTIVITIES' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVITIES')}
            id="tab-btn-activities"
          >
            📋 Lịch sử hoạt động (S5-03)
          </button>
          <button
            type="button"
            className={`opp-tab-btn ${activeTab === 'TASKS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TASKS')}
            id="tab-btn-tasks"
          >
            ✅ Công việc & Lịch nhắc (S5-04)
          </button>
          <button
            type="button"
            className={`opp-tab-btn ${activeTab === 'DETAILS' ? 'active' : ''}`}
            onClick={() => setActiveTab('DETAILS')}
            id="tab-btn-details"
          >
            ℹ️ Thông tin chi tiết cơ hội
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="opp-modal-tab-content">
          {/* TAB 1: Lịch sử hoạt động (S5-03) */}
          {activeTab === 'ACTIVITIES' && (
            <OpportunityActivityTimeline
              opportunityId={currentOpp.id}
              opportunityTitle={currentOpp.title}
              onActivityAdded={() => {
                // Refresh if needed
              }}
            />
          )}

          {/* TAB 2: Công việc & Lịch nhắc (S5-04) */}
          {activeTab === 'TASKS' && (
            <OpportunityTaskManager
              opportunityId={currentOpp.id}
              opportunityTitle={currentOpp.title}
            />
          )}

          {/* TAB 3: Thông tin chi tiết cơ hội */}
          {activeTab === 'DETAILS' && (
            <div className="opp-details-tab-grid">
              {/* Thẻ Kết quả Đóng Deal S5-05 nếu đã đóng */}
              {isClosed && (
                <div className={`details-card full-width win-loss-summary-card ${currentOpp.status.toLowerCase()}-card`}>
                  <h4>{currentOpp.status === 'WON' ? '🏆 Kết quả Chốt Thắng (Deal Won - S5-05)' : '❌ Kết quả Đóng Thua (Deal Lost - S5-05)'}</h4>
                  <div className="win-loss-grid">
                    {currentOpp.status === 'WON' ? (
                      <>
                        <div className="detail-item">
                          <span className="d-label">Giá trị chốt thực tế:</span>
                          <span className="d-val font-bold text-success" style={{ fontSize: '1.05rem' }}>
                            {formatCurrency(currentOpp.actual_revenue || currentOpp.expected_revenue)}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="d-label">Ngày ký kết thực tế:</span>
                          <span className="d-val font-bold">{currentOpp.actual_close_date || '—'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="d-label">Lý do thắng thầu:</span>
                          <span className="d-val">{currentOpp.win_reason_name || 'Giá cả & tính năng phù hợp'}</span>
                        </div>
                        {currentOpp.win_notes && (
                          <div className="detail-item full-row">
                            <span className="d-label">Ghi chú thắng:</span>
                            <span className="d-val">{currentOpp.win_notes}</span>
                          </div>
                        )}
                        <div className="detail-item full-row note-quota-counted">
                          <span>✓ Doanh số này đã được tự động tính vào chỉ tiêu của nhân viên <strong>{currentOpp.owner_name}</strong>.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="detail-item">
                          <span className="d-label">Lý do thua thầu:</span>
                          <span className="d-val font-bold text-danger">{currentOpp.lost_reason || 'Không rõ lý do'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="d-label">Đối thủ cạnh tranh thắng:</span>
                          <span className="d-val">{currentOpp.competitor_name || 'Không có / Không xác định'}</span>
                        </div>
                        {currentOpp.loss_notes && (
                          <div className="detail-item full-row">
                            <span className="d-label">Ghi chú phân tích nguyên nhân:</span>
                            <span className="d-val">{currentOpp.loss_notes}</span>
                          </div>
                        )}
                      </>
                    )}
                    {currentOpp.reopen_reason && (
                      <div className="detail-item full-row reopen-history-item">
                        <span className="d-label">Lịch sử mở lại:</span>
                        <span className="d-val">
                          Đã từng mở lại bởi {currentOpp.reopened_by_name || 'Trưởng nhóm'}. Lý do: "{currentOpp.reopen_reason}"
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="details-card">
                <h4>Thông tin chung</h4>
                <div className="detail-item">
                  <span className="d-label">Mã cơ hội:</span>
                  <span className="d-val font-mono">{currentOpp.code}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Tên cơ hội:</span>
                  <span className="d-val font-bold">{currentOpp.title}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Khách hàng:</span>
                  <span className="d-val">{currentOpp.customer_name}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Người liên hệ:</span>
                  <span className="d-val">{currentOpp.contact_name || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Số điện thoại:</span>
                  <span className="d-val">{currentOpp.contact_phone || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Email:</span>
                  <span className="d-val">{currentOpp.contact_email || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Nguồn cơ hội:</span>
                  <span className="d-val">{currentOpp.source}</span>
                </div>
              </div>

              <div className="details-card">
                <h4>Thông số thương mại & Bán hàng</h4>
                <div className="detail-item">
                  <span className="d-label">Giai đoạn hiện tại:</span>
                  <span className="d-val font-bold" style={{ color: currentOpp.stage_color || '#2563eb' }}>
                    {currentOpp.stage_name}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Doanh số dự kiến:</span>
                  <span className="d-val font-bold text-success">
                    {formatCurrency(currentOpp.expected_revenue)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Xác suất thắng:</span>
                  <span className="d-val font-bold">{currentOpp.win_probability}%</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Doanh thu dự báo:</span>
                  <span className="d-val font-bold">
                    {formatCurrency((currentOpp.expected_revenue * currentOpp.win_probability) / 100)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Ngày dự kiến chốt:</span>
                  <span className="d-val">{currentOpp.expected_close_date || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Người phụ trách:</span>
                  <span className="d-val font-bold text-primary">
                    {currentOpp.owner_name}
                    {isManagerOrAdmin && !isClosed && (
                      <button
                        type="button"
                        className="btn-quick-reassign-link"
                        onClick={() => setIsReassignModalOpen(true)}
                        title="Bàn giao cơ hội cho người khác (S5-08)"
                      >
                        [Chuyển giao 🔄]
                      </button>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Đội nhóm:</span>
                  <span className="d-val">{currentOpp.team_name || 'Đội Kinh Doanh 1'}</span>
                </div>
              </div>

              {/* Lịch sử phân bổ lại cơ hội (S5-08) */}
              {(() => {
                const reassignHistory = opportunityService.getReassignHistory(currentOpp.id)
                if (reassignHistory.length === 0) return null
                return (
                  <div className="details-card full-width reassign-history-card">
                    <h4>🔄 Lịch sử Phân bổ lại & Bàn giao Cơ hội (S5-08)</h4>
                    <div className="reassign-history-list">
                      {reassignHistory.map((item) => (
                        <div key={item.id} className="reassign-history-entry">
                          <div className="entry-header">
                            <span className="entry-users">
                              Từ <strong>{item.from_owner_name}</strong> ➜ Tiếp nhận:{' '}
                              <strong className="text-primary">{item.to_owner_name}</strong>
                            </span>
                            <span className="entry-date">
                              {new Date(item.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div className="entry-body">
                            <span className="reason-label">Lý do:</span> {item.reassign_reason}
                            {item.transfer_notes && (
                              <div className="notes-val">
                                <em>Ghi chú bàn giao:</em> "{item.transfer_notes}"
                              </div>
                            )}
                            <div className="manager-sign">
                              Người điều phối: {item.reassigned_by_name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {currentOpp.description && (
                <div className="details-card full-width">
                  <h4>Mô tả & Ghi chú nhu cầu</h4>
                  <p className="opp-desc-text">{currentOpp.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐÓNG THẮNG (S5-05 AC1)
          ───────────────────────────────────────────────────────────── */}
      {isCloseWonModalOpen && (
        <div className="modal-overlay opp-submodal-overlay" onClick={() => !winLossSubmitting && setIsCloseWonModalOpen(false)}>
          <div className="modal-content opp-submodal-card" onClick={(e) => e.stopPropagation()}>
            <div className="submodal-header won-header">
              <h3>🏆 Đóng Thắng Cơ Hội (Deal Won - S5-05)</h3>
              <button type="button" className="submodal-close-btn" onClick={() => setIsCloseWonModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmCloseWon} className="submodal-form">
              <div className="submodal-intro">
                Chúc mừng bạn đã chốt thành công cơ hội <strong>{currentOpp.title}</strong>! Vui lòng nhập thông tin hợp đồng thực tế để ghi nhận doanh số vào chỉ tiêu của <strong>{currentOpp.owner_name}</strong>.
              </div>

              {winModalError && <div className="submodal-error-alert">{winModalError}</div>}

              <div className="form-group">
                <label>
                  Giá trị chốt thực tế (VNĐ) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  required
                  className="form-control"
                  value={actualRevenueInput}
                  onChange={(e) => setActualRevenueInput(e.target.value)}
                  placeholder="Nhập giá trị thực tế hợp đồng..."
                  disabled={winLossSubmitting}
                />
                <span className="field-hint">
                  Doanh số dự kiến ban đầu: {formatCurrency(currentOpp.expected_revenue)}
                </span>
              </div>

              <div className="form-group">
                <label>
                  Ngày ký hợp đồng / Chốt thực tế <span className="req">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={actualCloseDateInput}
                  onChange={(e) => setActualCloseDateInput(e.target.value)}
                  disabled={winLossSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Lý do thành công (Win Reason)</label>
                <select
                  className="form-control"
                  value={winReasonIdInput}
                  onChange={(e) => setWinReasonIdInput(e.target.value)}
                  disabled={winLossSubmitting}
                >
                  <option value="">-- Chọn lý do thành công (tùy chọn) --</option>
                  {winReasons.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ghi chú thành công</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={winNotesInput}
                  onChange={(e) => setWinNotesInput(e.target.value)}
                  placeholder="Ghi chú thêm về điều khoản hợp đồng hoặc kinh nghiệm chốt..."
                  disabled={winLossSubmitting}
                />
              </div>

              <div className="submodal-actions">
                <button
                  type="button"
                  className="btn-submodal-cancel"
                  onClick={() => setIsCloseWonModalOpen(false)}
                  disabled={winLossSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-submodal-submit won-submit"
                  disabled={winLossSubmitting}
                >
                  {winLossSubmitting ? 'Đang lưu...' : 'Xác nhận Đóng Thắng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐÓNG THUA (S5-05 AC2)
          ───────────────────────────────────────────────────────────── */}
      {isCloseLostModalOpen && (
        <div className="modal-overlay opp-submodal-overlay" onClick={() => !winLossSubmitting && setIsCloseLostModalOpen(false)}>
          <div className="modal-content opp-submodal-card" onClick={(e) => e.stopPropagation()}>
            <div className="submodal-header lost-header">
              <h3>❌ Đóng Thua Cơ Hội (Deal Lost - S5-05)</h3>
              <button type="button" className="submodal-close-btn" onClick={() => setIsCloseLostModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmCloseLost} className="submodal-form">
              <div className="submodal-intro">
                Xác nhận dừng chăm sóc cơ hội <strong>{currentOpp.title}</strong>. Vui lòng ghi nhận lý do thua và đối thủ (nếu có) để phục vụ báo cáo và phân tích kinh nghiệm.
              </div>

              {lossModalError && <div className="submodal-error-alert">{lossModalError}</div>}

              <div className="form-group">
                <label>
                  Lý do thua thầu <span className="req">*</span>
                </label>
                <select
                  required
                  className="form-control"
                  value={lostReasonIdInput}
                  onChange={(e) => setLostReasonIdInput(e.target.value)}
                  disabled={winLossSubmitting}
                >
                  <option value="">-- Chọn lý do thua (bắt buộc) --</option>
                  {lossReasons.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Đối thủ cạnh tranh thắng thầu (nếu có)</label>
                <select
                  className="form-control"
                  value={competitorIdInput}
                  onChange={(e) => setCompetitorIdInput(e.target.value)}
                  disabled={winLossSubmitting}
                >
                  <option value="">-- Chọn đối thủ (nếu khách chọn bên khác) --</option>
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ghi chú phân tích nguyên nhân</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={lossNotesInput}
                  onChange={(e) => setLossNotesInput(e.target.value)}
                  placeholder="Ghi chú chi tiết lý do khách hàng từ chối, phản hồi của khách..."
                  disabled={winLossSubmitting}
                />
              </div>

              <div className="submodal-actions">
                <button
                  type="button"
                  className="btn-submodal-cancel"
                  onClick={() => setIsCloseLostModalOpen(false)}
                  disabled={winLossSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-submodal-submit lost-submit"
                  disabled={winLossSubmitting}
                >
                  {winLossSubmitting ? 'Đang lưu...' : 'Xác nhận Đóng Thua'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MỞ LẠI CƠ HỘI (S5-05 AC3) - CHỈ DÀNH CHO TRƯỞNG NHÓM/ADMIN
          ───────────────────────────────────────────────────────────── */}
      {isReopenModalOpen && (
        <div className="modal-overlay opp-submodal-overlay" onClick={() => !winLossSubmitting && setIsReopenModalOpen(false)}>
          <div className="modal-content opp-submodal-card" onClick={(e) => e.stopPropagation()}>
            <div className="submodal-header reopen-header">
              <h3>🔓 Mở Lại Cơ Hội Bán Hàng (S5-05 AC3)</h3>
              <button type="button" className="submodal-close-btn" onClick={() => setIsReopenModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmReopen} className="submodal-form">
              <div className="submodal-intro">
                Bạn đang thực hiện quyền hạn <strong>{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Trưởng nhóm / Quản lý'}</strong> để mở lại cơ hội <strong>{currentOpp.title}</strong>. Vui lòng cung cấp lý do mở lại.
              </div>

              {reopenModalError && <div className="submodal-error-alert">{reopenModalError}</div>}

              <div className="form-group">
                <label>
                  Lý do mở lại cơ hội <span className="req">*</span>
                </label>
                <textarea
                  required
                  className="form-control"
                  rows={3}
                  value={reopenReasonInput}
                  onChange={(e) => setReopenReasonInput(e.target.value)}
                  placeholder="Bắt buộc: Khách hàng liên hệ lại tái khởi động dự án, thay đổi ngân sách..."
                  disabled={winLossSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Chuyển về giai đoạn Pipeline</label>
                <select
                  className="form-control"
                  value={reopenTargetStageId}
                  onChange={(e) => setReopenTargetStageId(e.target.value)}
                  disabled={winLossSubmitting}
                >
                  {stages.filter((s) => s.id !== 'stage-6').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.win_probability}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="submodal-actions">
                <button
                  type="button"
                  className="btn-submodal-cancel"
                  onClick={() => setIsReopenModalOpen(false)}
                  disabled={winLossSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-submodal-submit reopen-submit"
                  disabled={winLossSubmitting}
                >
                  {winLossSubmitting ? 'Đang lưu...' : 'Xác nhận Mở lại cơ hội'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PHÂN BỔ LẠI CƠ HỘI (S5-08) ── */}
      {isReassignModalOpen && (
        <ReassignOpportunityModal
          opportunity={currentOpp}
          isOpen={isReassignModalOpen}
          managerName={user?.full_name || 'Bế Hoàng Quân (Trưởng nhóm)'}
          managerId={user?.id ? Number(user.id) : 1}
          onClose={() => setIsReassignModalOpen(false)}
          onSuccess={(updated) => {
            setCurrentOpp(updated)
            onOpportunityUpdated(updated)
            showNotice(`Đã bàn giao cơ hội ${updated.code} cho ${updated.owner_name} thành công!`)
          }}
        />
      )}
    </div>
  )
}
