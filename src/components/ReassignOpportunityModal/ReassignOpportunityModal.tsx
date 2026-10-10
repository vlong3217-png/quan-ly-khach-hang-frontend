import React, { useState } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { opportunityTaskService } from '../../services/opportunityTaskService.ts'
import './ReassignOpportunityModal.css'

interface ReassignOpportunityModalProps {
  opportunity: Opportunity
  isOpen: boolean
  managerName?: string
  managerId?: number
  onClose: () => void
  onSuccess: (updatedOpp: Opportunity) => void
}

// Danh sách thành viên cùng đội kinh doanh có thể tiếp nhận
interface TeamMember {
  id: number
  name: string
  role: string
  team: string
  activeDealsCount: number
  capacityStatus: 'FREE' | 'NORMAL' | 'OVERLOAD'
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: 2, name: 'Trần Thị Bình', role: 'Trưởng nhóm / NVKD Senior', team: 'Đội Kinh Doanh 1', activeDealsCount: 2, capacityStatus: 'NORMAL' },
  { id: 3, name: 'Lê Hoàng Cường', role: 'Nhân viên kinh doanh', team: 'Đội Kinh Doanh 1', activeDealsCount: 4, capacityStatus: 'NORMAL' },
  { id: 5, name: 'Hoàng Thị Em', role: 'Nhân viên kinh doanh', team: 'Đội Kinh Doanh 1', activeDealsCount: 1, capacityStatus: 'FREE' },
  { id: 7, name: 'Đặng Thùy Giang', role: 'Nhân viên kinh doanh', team: 'Đội Kinh Doanh 1', activeDealsCount: 2, capacityStatus: 'NORMAL' },
  { id: 8, name: 'Bùi Quốc Hùng', role: 'Nhân viên kinh doanh', team: 'Đội Kinh Doanh 1', activeDealsCount: 6, capacityStatus: 'OVERLOAD' },
  { id: 10, name: 'Bế Hoàng Quân', role: 'Trưởng nhóm kinh doanh', team: 'Đội Kinh Doanh 1', activeDealsCount: 0, capacityStatus: 'FREE' },
]

const COMMON_REASONS = [
  'Người phụ trách nghỉ ốm / nghỉ phép dài ngày',
  'Nhân viên hiện tại bị quá tải công việc, cần san sẻ',
  'Chuyển đổi khu vực / địa bàn quản lý kinh doanh',
  'Khách hàng yêu cầu đổi người phụ trách có chuyên môn phù hợp hơn',
  'Tái cơ cấu danh mục khách hàng theo định kỳ',
]

export default function ReassignOpportunityModal({
  opportunity,
  isOpen,
  managerName = 'Trưởng nhóm',
  managerId,
  onClose,
  onSuccess,
}: ReassignOpportunityModalProps) {
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<number | ''>('')
  const [reasonCategory, setReasonCategory] = useState<string>(COMMON_REASONS[0])
  const [reasonDetail, setReasonDetail] = useState<string>('')
  const [transferNotes, setTransferNotes] = useState<string>('')
  const [transferOpenTasks, setTransferOpenTasks] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  // Format tiền tệ
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Danh sách ứng viên loại trừ người hiện tại
  const candidateMembers = TEAM_MEMBERS.filter((m) => m.id !== opportunity.owner_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNewOwnerId) {
      setErrorMsg('Vui lòng chọn nhân viên tiếp nhận cơ hội.')
      return
    }

    const newOwner = TEAM_MEMBERS.find((m) => m.id === selectedNewOwnerId)
    if (!newOwner) {
      setErrorMsg('Nhân viên đã chọn không hợp lệ.')
      return
    }

    const fullReason = reasonDetail.trim()
      ? `${reasonCategory}: ${reasonDetail.trim()}`
      : reasonCategory

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const updated = await opportunityService.reassignOpportunity(opportunity.id, {
        new_owner_id: newOwner.id,
        new_owner_name: newOwner.name,
        new_team_id: opportunity.team_id,
        new_team_name: opportunity.team_name,
        reassign_reason: fullReason,
        transfer_notes: transferNotes.trim(),
        transfer_open_tasks: transferOpenTasks,
        reassigned_by_id: managerId,
        reassigned_by_name: managerName,
      })

      // Chuyển giao các tasks chưa hoàn thành nếu được chọn
      let transferredCount = 0
      if (transferOpenTasks) {
        transferredCount = await opportunityTaskService.reassignTasksForOpportunity(
          opportunity.id,
          newOwner.id,
          newOwner.name
        )
      }

      // Ghi nhận vào Timeline Hoạt động của cơ hội (S5-03)
      await opportunityActivityService.createActivity({
        opportunity_id: opportunity.id,
        type: 'SYSTEM',
        title: `🔄 Phân bổ lại cơ hội: ${opportunity.owner_name} → ${newOwner.name}`,
        content: `Trưởng nhóm "${managerName}" đã bàn giao cơ hội cho "${newOwner.name}". Lý do: ${fullReason}.${
          transferNotes ? ` Ghi chú bàn giao: "${transferNotes.trim()}".` : ''
        }${transferredCount > 0 ? ` Đã tự động chuyển ${transferredCount} công việc tồn đọng sang người mới.` : ''}`,
        performed_by_id: managerId,
        performed_by_name: managerName,
        outcome: `Bàn giao thành công cho ${newOwner.name}`,
      })

      onSuccess(updated)
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi phân bổ lại cơ hội.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay reassign-modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="modal-content reassign-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header reassign-header">
          <div className="title-box">
            <h3>🔄 Phân Bổ Lại Cơ Hội Bán Hàng (S5-08)</h3>
            <span className="subtitle">Dành riêng cho Trưởng nhóm kinh doanh (Manager)</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="reassign-form">
          {errorMsg && <div className="reassign-error-banner">{errorMsg}</div>}

          {/* Thông tin cơ hội hiện tại */}
          <div className="deal-summary-box">
            <div className="summary-col">
              <span className="lbl">Mã & Tên thương vụ:</span>
              <strong className="val title-val">
                [{opportunity.code}] {opportunity.title}
              </strong>
            </div>
            <div className="summary-col">
              <span className="lbl">Doanh nghiệp khách hàng:</span>
              <span className="val">🏢 {opportunity.customer_name}</span>
            </div>
            <div className="summary-grid-3">
              <div>
                <span className="lbl">Giá trị thương vụ:</span>
                <span className="val text-success font-bold">
                  {formatCurrency(opportunity.expected_revenue)}
                </span>
              </div>
              <div>
                <span className="lbl">Giai đoạn:</span>
                <span className="val" style={{ color: opportunity.stage_color || '#2563eb', fontWeight: 600 }}>
                  {opportunity.stage_name}
                </span>
              </div>
              <div>
                <span className="lbl">Người đang phụ trách:</span>
                <span className="val current-owner-badge">👤 {opportunity.owner_name}</span>
              </div>
            </div>
          </div>

          {/* Chọn người nhận mới */}
          <div className="form-group">
            <label htmlFor="new-owner-select">
              1. Chọn người tiếp nhận mới trong nhóm (*):
            </label>
            <select
              id="new-owner-select"
              required
              value={selectedNewOwnerId}
              onChange={(e) => setSelectedNewOwnerId(Number(e.target.value))}
            >
              <option value="">-- Chọn nhân viên kinh doanh tiếp nhận --</option>
              {candidateMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role}) — {m.activeDealsCount} deal đang chạy [
                  {m.capacityStatus === 'FREE' ? 'Đang trống việc' : m.capacityStatus === 'NORMAL' ? 'Tải việc bình thường' : 'Đang nhiều việc'}
                  ]
                </option>
              ))}
            </select>
            <span className="field-hint">
              💡 Ưu tiên giao việc cho nhân sự đang có ít deal để đảm bảo thương vụ được chăm sóc sát sao nhất.
            </span>
          </div>

          {/* Lý do phân bổ lại */}
          <div className="form-group">
            <label htmlFor="reason-category-select">2. Lý do phân bổ lại (*):</label>
            <select
              id="reason-category-select"
              required
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
            >
              {COMMON_REASONS.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
              <option value="Khác">Lý do khác...</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason-detail-input">Chi tiết lý do / Hoàn cảnh phát sinh:</label>
            <input
              type="text"
              id="reason-detail-input"
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="VD: Nghỉ ốm điều trị 2 tuần từ 10/10, hoặc nhân viên đang ôm 8 hợp đồng lớn..."
            />
          </div>

          {/* Ghi chú bàn giao */}
          <div className="form-group">
            <label htmlFor="transfer-notes-area">3. Ghi chú & Chỉ đạo bàn giao cho người mới:</label>
            <textarea
              id="transfer-notes-area"
              rows={3}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Nhập lưu ý về khách hàng, tính cách người liên hệ, các điều khoản đang đàm phán dở..."
            />
          </div>

          {/* Tùy chọn chuyển giao Task */}
          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={transferOpenTasks}
                onChange={(e) => setTransferOpenTasks(e.target.checked)}
              />
              <span>
                <strong>Tự động chuyển giao toàn bộ công việc chưa hoàn thành (Tasks)</strong> sang người mới phụ trách.
              </span>
            </label>
            <span className="field-hint" style={{ paddingLeft: '1.75rem' }}>
              Bao gồm các lịch gọi, lịch hẹn gặp và soạn báo giá đang dang dở của thương vụ này.
            </span>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-confirm-reassign"
              disabled={isSubmitting}
              id="confirm-reassign-btn"
            >
              {isSubmitting ? 'Đang phân bổ...' : 'Xác nhận phân bổ lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
