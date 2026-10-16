import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { pipelineService } from '../../services/pipelineService.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import './PipelineStagesPage.css'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Button from '../../components/ui/Button.tsx'

export default function PipelineStagesPage() {
  const navigate = useNavigate()
  const [stages, setStages] = useState<PipelineStage[]>(() => pipelineService.getStages())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Phân trang & Tìm kiếm
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return stages
    const q = searchQuery.toLowerCase().trim()
    return stages.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.required_conditions || []).some((c) => c.toLowerCase().includes(q))
    )
  }, [stages, searchQuery])

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

  // Modal Thêm quy tắc bổ sung (Exit Criteria Rules)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [selectedStageForRule, setSelectedStageForRule] = useState<PipelineStage | null>(null)
  const [newRuleText, setNewRuleText] = useState('')

  const RULE_TEMPLATES: { label: string; text: string }[] = [
    { label: 'Bắt buộc có Báo giá xuất cho khách', text: 'Phải xuất và gửi bảng báo giá chính thức từ bảng giá niêm yết' },
    { label: 'Bắt buộc Demo giải pháp trực tiếp', text: 'Đã hoàn thành ít nhất 1 buổi Demo giải pháp hoặc gặp mặt trực tiếp' },
    { label: 'Xác định Người quyết định mua', text: 'Hồ sơ cơ hội phải gắn với ít nhất 1 người liên hệ có vai trò Người quyết định (Decision Maker)' },
    { label: 'Đàm phán điều khoản hợp đồng', text: 'Đã thống nhất dự thảo hợp đồng và các điều khoản thanh toán thương mại' },
    { label: 'Doanh thu kỳ vọng hợp lệ (>0)', text: 'Doanh thu kỳ vọng của thương vụ phải được cập nhật lớn hơn 0 đồng' },
  ]

  const handleOpenAddRule = (stage?: PipelineStage) => {
    const targetStage = stage || stages[0] || null
    setSelectedStageForRule(targetStage)
    setNewRuleText('')
    setIsRuleModalOpen(true)
  }

  const handleSaveAdditionalRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStageForRule) {
      showToast('Vui lòng chọn giai đoạn áp dụng quy tắc!', 'error')
      return
    }
    const ruleContent = newRuleText.trim()
    if (!ruleContent) {
      showToast('Vui lòng nhập nội dung quy tắc bổ sung!', 'error')
      return
    }

    try {
      const updatedConditions = [...selectedStageForRule.required_conditions, ruleContent]
      pipelineService.updateStage(selectedStageForRule.id, {
        required_conditions: updatedConditions,
      })
      showToast(`Đã thêm quy tắc bổ sung vào giai đoạn "${selectedStageForRule.name}" thành công!`, 'success')
      setIsRuleModalOpen(false)
      setNewRuleText('')
      reloadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi khi thêm quy tắc', 'error')
    }
  }

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

  return (
    <div className="pipeline-page-container">
      {toast && (
        <div className={`pipe-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Cấu hình Giai đoạn Pipeline & Xác suất Thắng"
        className="pipe-header"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="button"
              variant="secondary"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard/opportunities')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Quản lý Cơ hội bán hàng</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn btn-secondary"
              onClick={() => handleOpenAddRule()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: '#2563eb', color: '#2563eb' }}
            >
              <span>+ Thêm quy tắc bổ sung</span>
            </Button>
            <Button type="button" variant="primary" className="btn btn-primary" onClick={handleOpenCreate}>
              Thêm giai đoạn mới
            </Button>
          </div>
        }
      />

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

      {/* Bảng cấu hình chi tiết & Tìm kiếm */}
      <div className="pipeline-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0 12px' }}>
        <input
          type="text"
          placeholder="Tìm kiếm giai đoạn theo tên, mã hoặc quy tắc điều kiện..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          style={{
            flex: 1,
            maxWidth: '420px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setCurrentPage(1)
            }}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      <div className="pipe-table-wrapper">
        <table className="pipe-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Thứ tự</th>
              <th>Tên giai đoạn</th>
              <th>Xác suất thắng (%)</th>
              <th>Điều kiện bắt buộc để chuyển giai đoạn (Exit criteria)</th>
              <th>Cơ hội đang chạy</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStages
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((stage) => {
                return (
                  <tr key={stage.id}>
                    <td><span className="order-num">{stage.order}</span></td>
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
                      <button
                        type="button"
                        onClick={() => handleOpenAddRule(stage)}
                        style={{
                          marginTop: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px dashed #2563eb',
                          background: '#eff6ff',
                          color: '#2563eb',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        + Thêm quy tắc bổ sung
                      </button>
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
                      <details className="crm-more-actions">
                        <summary className="crm-more-trigger" title="Thao tác khác" aria-label="Thao tác khác">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </summary>
                        <div className="crm-more-menu">
                          <button
                            type="button"
                            className="crm-more-item danger"
                            disabled={(stage.active_opportunities_count || 0) > 0}
                            title={
                              (stage.active_opportunities_count || 0) > 0
                                ? 'Đang có cơ hội chạy - không thể xóa để tránh làm hỏng dữ liệu!'
                                : 'Xóa giai đoạn'
                            }
                            onClick={(event) => {
                              event.currentTarget.closest('details')?.removeAttribute('open')
                              handleDelete(stage)
                            }}
                          >
                            Xóa giai đoạn
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        {/* Thanh phân trang Pagination */}
        {filteredStages.length > 0 && (
          <div className="customer-pagination" style={{ margin: '16px 20px 20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div className="customer-pagination-info">
              <span>
                Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredStages.length)}</strong> -{' '}
                <strong>{Math.min(currentPage * pageSize, filteredStages.length)}</strong> trên tổng số{' '}
                <strong>{filteredStages.length}</strong> giai đoạn
              </span>
              <div className="customer-pagination-size">
                <label htmlFor="stage-page-size-select">Hiển thị:</label>
                <select
                  id="stage-page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="customer-pagination-select"
                >
                  <option value={3}>3 giai đoạn / trang</option>
                  <option value={5}>5 giai đoạn / trang</option>
                  <option value={10}>10 giai đoạn / trang</option>
                </select>
              </div>
            </div>

            <div className="customer-pagination-controls">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="customer-page-btn nav-btn"
              >
                Trước
              </button>

              <div className="customer-page-numbers">
                {Array.from({ length: Math.max(1, Math.ceil(filteredStages.length / pageSize)) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`customer-page-btn page-num ${currentPage === p ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage === Math.max(1, Math.ceil(filteredStages.length / pageSize))}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, Math.max(1, Math.ceil(filteredStages.length / pageSize))))}
                className="customer-page-btn nav-btn"
              >
                Sau
              </button>
            </div>
          </div>
        )}
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
      {/* Modal Thêm quy tắc bổ sung (Exit criteria rule) */}
      {isRuleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRuleModalOpen(false)}>
          <div className="modal-content pipe-modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm quy tắc bổ sung cho Giai đoạn Pipeline</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsRuleModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAdditionalRule}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Giai đoạn áp dụng quy tắc *</label>
                  <select
                    value={selectedStageForRule?.id || ''}
                    onChange={(e) => {
                      const st = stages.find((s) => s.id === e.target.value) || null
                      setSelectedStageForRule(st)
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                    }}
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.order}. {st.name} ({st.win_probability}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label>Mẫu quy tắc nghiệp vụ gợi ý (Chọn nhanh)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {RULE_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewRuleText(tpl.text)}
                        style={{
                          textAlign: 'left',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: newRuleText === tpl.text ? '#eff6ff' : '#f8fafc',
                          borderColor: newRuleText === tpl.text ? '#93c5fd' : '#e2e8f0',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: '#334155',
                        }}
                      >
                        <strong>{tpl.label}:</strong> {tpl.text}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Nội dung quy tắc bổ sung bắt buộc *</label>
                  <textarea
                    rows={3}
                    required
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    placeholder="Nhập nội dung quy tắc bắt buộc để rời giai đoạn..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                    }}
                  />
                  <small style={{ color: '#64748b' }}>
                    Khi cơ hội được chuyển sang giai đoạn tiếp theo, hệ thống Stage Gate sẽ bắt buộc kiểm tra điều kiện này.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRuleModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu quy tắc vào giai đoạn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
