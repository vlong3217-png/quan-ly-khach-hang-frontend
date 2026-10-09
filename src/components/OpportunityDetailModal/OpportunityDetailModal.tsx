import { useState } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import { pipelineService } from '../../services/pipelineService.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import OpportunityActivityTimeline from '../OpportunityActivityTimeline/OpportunityActivityTimeline.tsx'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityDetailModal.css'

interface OpportunityDetailModalProps {
  opportunity: Opportunity
  isOpen: boolean
  onClose: () => void
  onOpportunityUpdated: (updated: Opportunity) => void
}

export default function OpportunityDetailModal({
  opportunity,
  isOpen,
  onClose,
  onOpportunityUpdated,
}: OpportunityDetailModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'ACTIVITIES' | 'DETAILS' | 'TASKS'>('ACTIVITIES')
  const [stages] = useState<PipelineStage[]>(() => pipelineService.getStages())
  const [currentOpp, setCurrentOpp] = useState<Opportunity>(opportunity)
  const [isChangingStage, setIsChangingStage] = useState<boolean>(false)
  const [notice, setNotice] = useState<string | null>(null)

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

        {/* ── Pipeline Stage Flow Ribbon ── */}
        <div className="opp-pipeline-ribbon">
          <div className="ribbon-label">Quy trình bán hàng (Pipeline):</div>
          <div className="ribbon-steps-container">
            {stages.map((stage) => {
              const isCurrent = stage.id === currentOpp.stage_id
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`ribbon-step-btn ${isCurrent ? 'active-step' : ''}`}
                  disabled={isChangingStage}
                  onClick={() => handleStageChange(stage)}
                  title={`Nhấp để chuyển sang: ${stage.name} (${stage.win_probability}%)`}
                >
                  <span className="step-name">{stage.name}</span>
                  <span className="step-prob">{stage.win_probability}%</span>
                </button>
              )
            })}
          </div>
        </div>

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
            <div className="opp-tasks-tab-container" id="opp-tasks-tab-container">
              <div className="tasks-placeholder-banner">
                <h4>Quản lý công việc và lịch nhắc liên quan đến cơ hội (S5-04)</h4>
                <p>
                  Khu vực theo dõi và phân công các công việc cần thực hiện cho deal <strong>{currentOpp.title}</strong>.
                </p>
                <div className="s5-04-preview-card">
                  <span>Sẽ triển khai đầy đủ với các chức năng tạo/sửa/xóa việc, hẹn giờ nhắc nhở, phân công người phụ trách và cảnh báo quá hạn.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Thông tin chi tiết cơ hội */}
          {activeTab === 'DETAILS' && (
            <div className="opp-details-tab-grid">
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
                  <span className="d-val">{currentOpp.owner_name}</span>
                </div>
                <div className="detail-item">
                  <span className="d-label">Đội nhóm:</span>
                  <span className="d-val">{currentOpp.team_name || 'Đội Kinh Doanh 1'}</span>
                </div>
              </div>

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
    </div>
  )
}
