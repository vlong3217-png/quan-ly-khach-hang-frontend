import { useState } from 'react'
import { winLossService } from '../../services/winLossService.ts'
import type { WinLossReason, WinLossType, Competitor } from '../../types/winLossCompetitor.ts'
import './WinLossCompetitorsPage.css'

export default function WinLossCompetitorsPage() {
  const [activeTab, setActiveTab] = useState<'WIN' | 'LOSS' | 'COMPETITOR'>('WIN')
  const [reasons, setReasons] = useState<WinLossReason[]>(() => winLossService.getReasons())
  const [competitors, setCompetitors] = useState<Competitor[]>(() => winLossService.getCompetitors())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal Lý do
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false)
  const [editingReason, setEditingReason] = useState<WinLossReason | null>(null)
  const [reasonForm, setReasonForm] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  })

  // Modal Đối thủ
  const [isCompModalOpen, setIsCompModalOpen] = useState(false)
  const [editingComp, setEditingComp] = useState<Competitor | null>(null)
  const [compForm, setCompForm] = useState({
    code: '',
    name: '',
    website: '',
    strengths: '',
    weaknesses: '',
    price_segment: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    is_active: true,
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const reloadData = () => {
    setReasons(winLossService.getReasons())
    setCompetitors(winLossService.getCompetitors())
  }

  // --- Handlers Lý do ---
  const handleOpenCreateReason = () => {
    setEditingReason(null)
    const typeCode = activeTab === 'WIN' ? 'WIN' : 'LOSS'
    setReasonForm({
      code: `${typeCode}-${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      description: '',
      is_active: true,
    })
    setIsReasonModalOpen(true)
  }

  const handleOpenEditReason = (r: WinLossReason) => {
    setEditingReason(r)
    setReasonForm({
      code: r.code,
      name: r.name,
      description: r.description || '',
      is_active: r.is_active,
    })
    setIsReasonModalOpen(true)
  }

  const handleSaveReason = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reasonForm.name.trim() || !reasonForm.code.trim()) {
      showToast('Vui lòng điền mã và nội dung lý do!', 'error')
      return
    }

    const type: WinLossType = activeTab === 'WIN' ? 'WIN_REASON' : 'LOSS_REASON'
    if (editingReason) {
      winLossService.updateReason(editingReason.id, reasonForm)
      showToast('Đã cập nhật lý do thành công!', 'success')
    } else {
      winLossService.createReason({ ...reasonForm, type })
      showToast('Đã thêm lý do mới thành công!', 'success')
    }
    setIsReasonModalOpen(false)
    reloadData()
  }

  const handleDeleteReason = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lý do này?')) {
      winLossService.deleteReason(id)
      showToast('Đã xóa lý do thành công!', 'success')
      reloadData()
    }
  }

  // --- Handlers Đối thủ ---
  const handleOpenCreateComp = () => {
    setEditingComp(null)
    setCompForm({
      code: `CP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      website: '',
      strengths: '',
      weaknesses: '',
      price_segment: 'MEDIUM',
      is_active: true,
    })
    setIsCompModalOpen(true)
  }

  const handleOpenEditComp = (c: Competitor) => {
    setEditingComp(c)
    setCompForm({
      code: c.code,
      name: c.name,
      website: c.website || '',
      strengths: c.strengths || '',
      weaknesses: c.weaknesses || '',
      price_segment: c.price_segment || 'MEDIUM',
      is_active: c.is_active,
    })
    setIsCompModalOpen(true)
  }

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!compForm.name.trim() || !compForm.code.trim()) {
      showToast('Vui lòng điền tên và mã đối thủ!', 'error')
      return
    }

    if (editingComp) {
      winLossService.updateCompetitor(editingComp.id, compForm)
      showToast(`Đã cập nhật thông tin đối thủ "${compForm.name}"!`, 'success')
    } else {
      winLossService.createCompetitor(compForm)
      showToast(`Đã thêm đối thủ "${compForm.name}" vào danh mục!`, 'success')
    }
    setIsCompModalOpen(false)
    reloadData()
  }

  const handleDeleteComp = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối thủ này?')) {
      winLossService.deleteCompetitor(id)
      showToast('Đã xóa đối thủ thành công!', 'success')
      reloadData()
    }
  }

  const currentReasons = reasons.filter(
    (r) => r.type === (activeTab === 'WIN' ? 'WIN_REASON' : 'LOSS_REASON')
  )

  return (
    <div className="winloss-container">
      {toast && (
        <div className={`wl-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="wl-header">
        <div>
          <h2>Danh mục Lý do Thắng / Thua & Đối thủ cạnh tranh</h2>
          <p className="wl-subtitle">
            Khai báo danh mục nguyên nhân thắng thua và hồ sơ đối thủ, phục vụ phân tích rút kinh nghiệm khi đóng cơ hội (Sprint 5).
          </p>
        </div>
        <div>
          {activeTab === 'COMPETITOR' ? (
            <button type="button" className="btn btn-primary" onClick={handleOpenCreateComp}>
              + Thêm đối thủ cạnh tranh
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleOpenCreateReason}>
              + Thêm lý do {activeTab === 'WIN' ? 'thắng' : 'thua'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="wl-tabs">
        <button
          type="button"
          className={`wl-tab-btn ${activeTab === 'WIN' ? 'active' : ''}`}
          onClick={() => setActiveTab('WIN')}
        >
          Lý do Thắng ({reasons.filter((r) => r.type === 'WIN_REASON').length})
        </button>
        <button
          type="button"
          className={`wl-tab-btn ${activeTab === 'LOSS' ? 'active' : ''}`}
          onClick={() => setActiveTab('LOSS')}
        >
          Lý do Thua ({reasons.filter((r) => r.type === 'LOSS_REASON').length})
        </button>
        <button
          type="button"
          className={`wl-tab-btn ${activeTab === 'COMPETITOR' ? 'active' : ''}`}
          onClick={() => setActiveTab('COMPETITOR')}
        >
          Đối thủ cạnh tranh ({competitors.length})
        </button>
      </div>

      {/* Nội dung theo Tab */}
      {activeTab !== 'COMPETITOR' ? (
        <div className="wl-table-wrapper">
          <table className="wl-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Mã lý do</th>
                <th>Tên lý do</th>
                <th>Mô tả ngữ cảnh</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentReasons.map((r) => (
                <tr key={r.id}>
                  <td><code>{r.code}</code></td>
                  <td><strong>{r.name}</strong></td>
                  <td className="desc-cell">{r.description || '—'}</td>
                  <td>
                    <span className={`status-tag ${r.is_active ? 'active' : 'inactive'}`}>
                      {r.is_active ? 'Đang kích hoạt' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="wl-action-btn edit-btn"
                      onClick={() => handleOpenEditReason(r)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="wl-action-btn delete-btn"
                      onClick={() => handleDeleteReason(r.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="competitors-grid">
          {competitors.map((c) => (
            <div key={c.id} className="competitor-card">
              <div className="card-top">
                <div>
                  <span className="comp-code">{c.code}</span>
                  <h3>{c.name}</h3>
                </div>
                <span className={`price-segment segment-${c.price_segment?.toLowerCase()}`}>
                  Phân khúc: {c.price_segment === 'HIGH' ? 'Cao cấp' : c.price_segment === 'LOW' ? 'Giá rẻ' : 'Trung bình'}
                </span>
              </div>

              {c.website && (
                <a href={c.website} target="_blank" rel="noreferrer" className="comp-website">
                  🔗 {c.website}
                </a>
              )}

              <div className="strengths-weaknesses">
                <div className="sw-box sw-strengths">
                  <span className="sw-title">💪 Điểm mạnh của đối thủ:</span>
                  <p>{c.strengths || 'Chưa cập nhật'}</p>
                </div>
                <div className="sw-box sw-weaknesses">
                  <span className="sw-title">⚠️ Điểm yếu / Lợi thế của ta:</span>
                  <p>{c.weaknesses || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="wl-action-btn edit-btn"
                  onClick={() => handleOpenEditComp(c)}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  className="wl-action-btn delete-btn"
                  onClick={() => handleDeleteComp(c.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lý do Thắng/Thua */}
      {isReasonModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReasonModalOpen(false)}>
          <div className="modal-content wl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingReason ? 'Chỉnh sửa lý do' : `Thêm mới lý do ${activeTab === 'WIN' ? 'Thắng' : 'Thua'}`}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsReasonModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveReason}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Mã lý do *</label>
                  <input
                    type="text"
                    required
                    value={reasonForm.code}
                    onChange={(e) => setReasonForm({ ...reasonForm, code: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Nội dung lý do *</label>
                  <input
                    type="text"
                    required
                    value={reasonForm.name}
                    onChange={(e) => setReasonForm({ ...reasonForm, name: e.target.value })}
                    placeholder="VD: Giá cạnh tranh hơn đối thủ..."
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    rows={2}
                    value={reasonForm.description}
                    onChange={(e) => setReasonForm({ ...reasonForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsReasonModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReason ? 'Lưu thay đổi' : 'Thêm lý do'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đối thủ cạnh tranh */}
      {isCompModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCompModalOpen(false)}>
          <div className="modal-content wl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingComp ? 'Chỉnh sửa thông tin đối thủ' : 'Thêm mới đối thủ cạnh tranh'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsCompModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveComp}>
              <div className="modal-body">
                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Mã đối thủ *</label>
                    <input
                      type="text"
                      required
                      value={compForm.code}
                      onChange={(e) => setCompForm({ ...compForm, code: e.target.value })}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Phân khúc giá</label>
                    <select
                      value={compForm.price_segment}
                      onChange={(e) => setCompForm({ ...compForm, price_segment: e.target.value as any })}
                    >
                      <option value="LOW">Giá rẻ / Phổ thông</option>
                      <option value="MEDIUM">Tầm trung (Medium)</option>
                      <option value="HIGH">Cao cấp (Enterprise)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Tên đối thủ cạnh tranh *</label>
                  <input
                    type="text"
                    required
                    value={compForm.name}
                    onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                    placeholder="VD: HubSpot CRM"
                  />
                </div>

                <div className="modal-form-group">
                  <label>Website tham chiếu</label>
                  <input
                    type="url"
                    value={compForm.website}
                    onChange={(e) => setCompForm({ ...compForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="modal-form-group">
                  <label>Điểm mạnh của họ</label>
                  <textarea
                    rows={2}
                    value={compForm.strengths}
                    onChange={(e) => setCompForm({ ...compForm, strengths: e.target.value })}
                    placeholder="Tính năng nổi trội, quan hệ thị trường..."
                  />
                </div>

                <div className="modal-form-group">
                  <label>Điểm yếu / Lợi thế cạnh tranh của ta</label>
                  <textarea
                    rows={2}
                    value={compForm.weaknesses}
                    onChange={(e) => setCompForm({ ...compForm, weaknesses: e.target.value })}
                    placeholder="Chi phí cao, hỗ trợ chậm, thiếu ngôn ngữ tiếng Việt..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCompModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingComp ? 'Lưu thay đổi' : 'Thêm đối thủ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
