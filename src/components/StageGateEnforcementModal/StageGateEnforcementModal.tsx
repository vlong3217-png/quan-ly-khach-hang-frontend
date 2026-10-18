import React, { useState } from 'react'
import Button from '../ui/Button.tsx'
import type { Opportunity, StageGateEvaluation } from '../../types/opportunity.ts'
import './StageGateEnforcementModal.css'

interface StageGateEnforcementModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity: Opportunity
  targetStageId: string
  evaluation: StageGateEvaluation
  isManagerOrAdmin: boolean
  currentUserId?: number
  currentUserName?: string
  currentUserRole?: string
  onConfirmedStageChange: () => void
  onOverrideApproved: (reason: string) => Promise<void>
}

export default function StageGateEnforcementModal({
  isOpen,
  onClose,
  opportunity,
  evaluation,
  isManagerOrAdmin,
  onOverrideApproved,
}: StageGateEnforcementModalProps) {
  const [overrideReason, setOverrideReason] = useState('')
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do ghi đè bắt buộc để chuyển giai đoạn ngoại lệ.')
      return
    }

    try {
      setIsSubmittingOverride(true)
      setErrorMessage(null)
      await onOverrideApproved(overrideReason.trim())
      onClose()
    } catch {
      setErrorMessage('Có lỗi xảy ra khi phê duyệt ghi đè giai đoạn.')
    } finally {
      setIsSubmittingOverride(false)
    }
  }

  return (
    <div className="stage-gate-overlay" onClick={onClose}>
      <div className="stage-gate-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="stage-gate-header">
          <div className="stage-gate-icon-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h3 className="stage-gate-title">Ràng buộc điều kiện chuyển giai đoạn (S5-04)</h3>
            <p className="stage-gate-subtitle">
              Cơ hội "<strong>{opportunity.title}</strong>" ({opportunity.code}) đang yêu cầu chuyển từ giai đoạn <strong>"{evaluation.current_stage_name}"</strong> sang <strong>"{evaluation.target_stage_name}"</strong>.
            </p>
          </div>
        </div>

        {/* Nội dung danh sách điều kiện */}
        <div className="stage-gate-body">
          <div className="stage-gate-alert-block">
            <strong>Chưa thỏa mãn {evaluation.unmet_conditions.length} điều kiện bắt buộc để rời giai đoạn!</strong>
            <p>
              Hệ thống yêu cầu các bằng chứng và hoạt động thực tế để đảm bảo pipeline phản ánh chính xác tiến độ thương vụ thay vì chuyển vội để làm đẹp báo cáo.
            </p>
          </div>

          <div className="stage-gate-conditions-list">
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: '#1e293b' }}>
              Chi tiết điều kiện rời giai đoạn "{evaluation.current_stage_name}":
            </h4>

            {evaluation.all_conditions.map((cond, idx) => (
              <div
                key={`cond-${idx}`}
                className={`stage-gate-condition-item ${cond.is_met ? 'met' : 'unmet'}`}
              >
                <div className="cond-status-icon">
                  {cond.is_met ? (
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 800 }}>✕</span>
                  )}
                </div>
                <div className="cond-details">
                  <div className="cond-title font-bold">
                    {cond.condition}
                  </div>
                  <div className="cond-desc text-muted">
                    {cond.detail || (cond.is_met ? 'Đã đạt điều kiện' : 'Chưa hoàn thành điều kiện này')}
                  </div>
                </div>
                <div>
                  <span className={`badge-cond ${cond.is_met ? 'pass' : 'fail'}`}>
                    {cond.is_met ? 'Đã đạt' : 'Còn thiếu'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Phần Ghi đè dành cho Trưởng nhóm trở lên (S5-04 AC3) */}
          {isManagerOrAdmin ? (
            <form onSubmit={handleConfirmOverride} className="stage-gate-override-box">
              <div className="override-header">
                <span className="override-tag">Quyền Giám đốc / Trưởng nhóm</span>
                <h4>Ghi đè quy trình & Phê duyệt chuyển giai đoạn ngoại lệ</h4>
              </div>
              <p className="override-hint">
                Là cấp quản lý, bạn có thể ghi đè kèm lý do chính đáng. Quyết định ghi đè sẽ được ghi nhận vào nhật ký kiểm toán (Audit Trail) và dòng thời gian của cơ hội.
              </p>

              {errorMessage && <div className="override-error">{errorMessage}</div>}

              <div className="stage-gate-input-wrapper">
                <label className="stage-gate-input-label">
                  Lý do ghi đè bắt buộc <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  className="stage-gate-textarea"
                  rows={4}
                  required
                  placeholder="Nhập căn cứ ngoại lệ (VD: Khách hàng VIP đã đồng ý chủ trương qua trao đổi trực tiếp với Ban Tổng Giám đốc...)"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>

              <div className="stage-gate-actions">
                <Button
                  type="button"
                  variant="secondary"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  className="btn btn-danger"
                  disabled={isSubmittingOverride}
                >
                  {isSubmittingOverride ? 'Đang duyệt...' : 'Xác nhận Ghi đè & Chuyển giai đoạn'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="stage-gate-nvkd-hint">
              <strong>Lưu ý cho Nhân viên kinh doanh:</strong> Bạn cần hoàn thiện các hoạt động trên (như đặt lịch hẹn gặp demo, gửi báo giá hoặc cập nhật thông tin) trước khi có thể chuyển tiếp cơ hội. Nếu có trường hợp đặc biệt, vui lòng báo cáo Trưởng nhóm để xem xét ghi đè.
            </div>
          )}
        </div>

        {/* Footer */}
        {!isManagerOrAdmin && (
          <div className="stage-gate-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đã hiểu & Quay lại hoàn thiện
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
