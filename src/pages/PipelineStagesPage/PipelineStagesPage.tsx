import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pipelineService } from '../../services/pipelineService.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import './PipelineStagesPage.css'

export default function PipelineStagesPage() {
  const navigate = useNavigate()
  const [stages, setStages] = useState<PipelineStage[]>(() => pipelineService.getStages())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal Thêm / Chỉnh sửa
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    win_probability: 20,
    requiredConditionsText: '',
    description: '',
    color: '#2563eb',
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const reloadData = () => {
    setStages(pipelineService.getStages())
  }

  const handleOpenCreate = () => {
    setEditingStage(null)
    setFormData({
      code: `STG-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      win_probability: 30,
      requiredConditionsText: 'Phải có ít nhất một cuộc gặp trực tiếp hoặc trao đổi',
      description: '',
      color: '#2563eb',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (stage: PipelineStage) => {
    setEditingStage(stage)
    setFormData({
      code: stage.code,
      name: stage.name,
      win_probability: stage.win_probability,
      requiredConditionsText: stage.required_conditions.join('\n'),
      description: stage.description || '',
      color: stage.color || '#2563eb',
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Vui lòng điền tên và mã giai đoạn!', 'error')
      return
    }

    const conditions = formData.requiredConditionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      if (editingStage) {
        pipelineService.updateStage(editingStage.id, {
          name: formData.name,
          code: formData.code,
          win_probability: formData.win_probability,
          required_conditions: conditions,
          description: formData.description,
          color: formData.color,
        })
        showToast(`Đã cập nhật giai đoạn "${formData.name}" thành công!`, 'success')
      } else {
        pipelineService.createStage({
          name: formData.name,
          code: formData.code,
          win_probability: formData.win_probability,
          required_conditions: conditions,
          description: formData.description,
          color: formData.color,
        })
        showToast(`Đã tạo giai đoạn "${formData.name}" thành công!`, 'success')
      }
      setIsModalOpen(false)
      reloadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const handleDelete = (stage: PipelineStage) => {
    try {
      pipelineService.deleteStage(stage.id)
      showToast(`Đã xóa giai đoạn "${stage.name}" thành công!`, 'success')
      reloadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return
    const updated = pipelineService.reorder(idx, idx - 1)
    setStages(updated)
    showToast('Đã cập nhật thứ tự chuỗi pipeline!', 'success')
  }

  const handleMoveDown = (idx: number) => {
    if (idx >= stages.length - 1) return
    const updated = pipelineService.reorder(idx, idx + 1)
    setStages(updated)
    showToast('Đã cập nhật thứ tự chuỗi pipeline!', 'success')
  }

  return (
    <div className="pipeline-page-container">
      {toast && (
        <div className={`pipe-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="pipe-header">
        <div>
          <h2>Cấu hình Giai đoạn Pipeline & Xác suất Thắng</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard/opportunities')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Quản lý Cơ hội bán hàng</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            Thêm giai đoạn mới
          </button>
        </div>
      </div>

      {/* Sơ đồ trực quan chuỗi Pipeline */}
      <div className="pipeline-flow-diagram">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="pipeline-flow-step" style={{ borderTopColor: stage.color || '#2563eb' }}>
            <div className="step-num">{idx + 1}</div>
            <div className="step-name">{stage.name}</div>
            <div className="step-prob" style={{ color: stage.color }}>
              Xác suất: <strong>{stage.win_probability}%</strong>
            </div>
            {stage.active_opportunities_count !== undefined && (
              <div className="step-count">
                {stage.active_opportunities_count} cơ hội
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bảng cấu hình chi tiết */}
      <div className="pipe-table-wrapper">
        <table className="pipe-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Thứ tự</th>
              <th>Mã</th>
              <th>Tên giai đoạn</th>
              <th>Xác suất thắng (%)</th>
              <th>Điều kiện bắt buộc để chuyển giai đoạn (Exit criteria)</th>
              <th>Cơ hội đang chạy</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, idx) => (
              <tr key={stage.id}>
                <td>
                  <div className="reorder-controls">
                    <button
                      type="button"
                      className="order-btn"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                    >
                      ▲
                    </button>
                    <span className="order-num">{stage.order}</span>
                    <button
                      type="button"
                      className="order-btn"
                      disabled={idx === stages.length - 1}
                      onClick={() => handleMoveDown(idx)}
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td><code>{stage.code}</code></td>
                <td>
                  <strong style={{ color: stage.color }}>{stage.name}</strong>
                  {stage.is_closed_stage && <span className="closed-badge">Giai đoạn chốt</span>}
                </td>
                <td>
                  <div className="prob-bar-container">
                    <div className="prob-bar-fill" style={{ width: `${stage.win_probability}%`, background: stage.color || '#2563eb' }} />
                    <span className="prob-label">{stage.win_probability}%</span>
                  </div>
                </td>
                <td>
                  <ul className="conditions-list">
                    {stage.required_conditions.map((cond, cIdx) => (
                      <li key={cIdx}>{cond}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <span className="active-deals-badge">
                    {stage.active_opportunities_count || 0} deals
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="pipe-action-btn edit-btn"
                    onClick={() => handleOpenEdit(stage)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="pipe-action-btn delete-btn"
                    disabled={(stage.active_opportunities_count || 0) > 0}
                    title={
                      (stage.active_opportunities_count || 0) > 0
                        ? 'Đang có cơ hội chạy - không thể xóa để tránh làm hỏng dữ liệu!'
                        : 'Xóa giai đoạn'
                    }
                    onClick={() => handleDelete(stage)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Chỉnh sửa Giai đoạn */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content pipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStage ? 'Chỉnh sửa Giai đoạn Pipeline' : 'Thêm mới Giai đoạn Pipeline'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Mã giai đoạn *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Màu nhận diện</label>
                    <input
                      type="color"
                      style={{ height: '40px', padding: '2px', cursor: 'pointer' }}
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Tên giai đoạn bán hàng *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Đề xuất giải pháp & Demo"
                  />
                </div>

                <div className="modal-form-group">
                  <label>Xác suất thắng dự báo (%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formData.win_probability}
                    onChange={(e) => setFormData({ ...formData, win_probability: Number(e.target.value) })}
                  />
                  <small style={{ color: '#64748b' }}>Hệ thống dùng con số này để tính Doanh số dự báo (Weighted Pipeline = Giá trị x Xác suất).</small>
                </div>

                <div className="modal-form-group">
                  <label>Điều kiện bắt buộc để chuyển giai đoạn (mỗi dòng 1 điều kiện) *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.requiredConditionsText}
                    onChange={(e) => setFormData({ ...formData, requiredConditionsText: e.target.value })}
                    placeholder="VD: Phải có ít nhất 1 cuộc gặp trực tiếp&#10;Đã gửi bảng chào giá cho khách hàng"
                  />
                </div>

                <div className="modal-form-group">
                  <label>Mô tả mục tiêu giai đoạn</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStage ? 'Lưu thay đổi' : 'Thêm giai đoạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
