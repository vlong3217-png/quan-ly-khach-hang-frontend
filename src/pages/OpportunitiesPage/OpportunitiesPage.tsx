import { useState, useEffect, useCallback } from 'react'
import type {
  Opportunity,
  CreateOpportunityPayload,
} from '../../types/opportunity.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { pipelineService } from '../../services/pipelineService.ts'
import OpportunityDetailModal from '../../components/OpportunityDetailModal/OpportunityDetailModal.tsx'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunitiesPage.css'

/* ─────────── Inline SVG Icons ─────────── */
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconActivity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

export default function OpportunitiesPage() {
  const { user } = useAuth()

  // State danh sách
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Bộ lọc
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [selectedStageId, setSelectedStageId] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE')

  // Modal Chi tiết Cơ hội
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  // Modal Tạo Cơ hội mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newOppForm, setNewOppForm] = useState<{
    title: string
    customer_name: string
    contact_name: string
    contact_phone: string
    contact_email: string
    stage_id: string
    expected_revenue: string
    expected_close_date: string
    source: string
    description: string
  }>({
    title: '',
    customer_name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    stage_id: 'stage-1',
    expected_revenue: '50000000',
    expected_close_date: '',
    source: 'Website',
    description: '',
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const stgs = pipelineService.getStages()
      setStages(stgs)
      const opps = await opportunityService.getOpportunities()
      setOpportunities(opps)
    } catch {
      showToast('Có lỗi khi tải dữ liệu cơ hội bán hàng.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Format tiền tệ
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Mở modal chi tiết
  const handleOpenDetail = (opp: Opportunity) => {
    setSelectedOpp(opp)
    setIsDetailModalOpen(true)
  }

  // Cập nhật khi opp thay đổi từ modal
  const handleOppUpdated = (updated: Opportunity) => {
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setSelectedOpp(updated)
  }

  // Xóa cơ hội
  const handleDeleteOpp = async (opp: Opportunity) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cơ hội "${opp.title}" (${opp.code})?`)) return
    try {
      await opportunityService.deleteOpportunity(opp.id)
      setOpportunities((prev) => prev.filter((o) => o.id !== opp.id))
      showToast(`Đã xóa cơ hội ${opp.code} thành công!`, 'success')
    } catch {
      showToast('Không thể xóa cơ hội. Vui lòng thử lại.', 'error')
    }
  }

  // Đổi nhanh giai đoạn
  const handleQuickChangeStage = async (opp: Opportunity, targetStageId: string) => {
    const targetStage = stages.find((s) => s.id === targetStageId)
    if (!targetStage || targetStage.id === opp.stage_id) return
    try {
      const updated = await opportunityService.updateOpportunity(opp.id, {
        stage_id: targetStage.id,
        stage_name: targetStage.name,
        win_probability: targetStage.win_probability,
        stage_color: targetStage.color,
      })
      handleOppUpdated(updated)
      showToast(`Đã chuyển cơ hội "${opp.code}" sang "${targetStage.name}"`, 'success')
    } catch {
      showToast('Không thể chuyển giai đoạn.', 'error')
    }
  }

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    const today = new Date()
    const future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    setNewOppForm({
      title: '',
      customer_name: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      stage_id: stages[0]?.id || 'stage-1',
      expected_revenue: '50000000',
      expected_close_date: future.toISOString().split('T')[0],
      source: 'Website',
      description: '',
    })
    setCreateError(null)
    setIsCreateModalOpen(true)
  }

  // Submit tạo mới
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOppForm.title.trim()) {
      setCreateError('Vui lòng nhập tên cơ hội bán hàng.')
      return
    }
    if (!newOppForm.customer_name.trim()) {
      setCreateError('Vui lòng nhập tên khách hàng / doanh nghiệp.')
      return
    }

    setCreateSubmitting(true)
    setCreateError(null)

    try {
      const selectedStage = stages.find((s) => s.id === newOppForm.stage_id)
      const payload: CreateOpportunityPayload = {
        title: newOppForm.title.trim(),
        customer_id: `cust-${Date.now()}`,
        customer_name: newOppForm.customer_name.trim(),
        contact_name: newOppForm.contact_name.trim() || undefined,
        contact_phone: newOppForm.contact_phone.trim() || undefined,
        contact_email: newOppForm.contact_email.trim() || undefined,
        stage_id: newOppForm.stage_id,
        stage_name: selectedStage?.name || 'Tiếp cận & Đánh giá',
        win_probability: selectedStage?.win_probability || 20,
        expected_revenue: Number(newOppForm.expected_revenue) || 0,
        expected_close_date: newOppForm.expected_close_date || new Date().toISOString().split('T')[0],
        source: newOppForm.source,
        description: newOppForm.description.trim(),
        owner_id: user?.id ? Number(user.id) : 1,
        owner_name: user?.full_name || 'Người dùng',
      }

      const created = await opportunityService.createOpportunity(payload)
      setOpportunities((prev) => [created, ...prev])
      setIsCreateModalOpen(false)
      showToast(`Đã tạo thành công cơ hội "${created.title}" (${created.code})!`, 'success')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Có lỗi khi tạo cơ hội bán hàng.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Lọc danh sách
  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedStageId !== 'ALL' && opp.stage_id !== selectedStageId) {
      return false
    }
    if (selectedStatus !== 'ALL' && opp.status !== selectedStatus) {
      return false
    }
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim()
      const matchTitle = opp.title.toLowerCase().includes(q)
      const matchCode = opp.code.toLowerCase().includes(q)
      const matchCust = opp.customer_name.toLowerCase().includes(q)
      const matchOwner = opp.owner_name.toLowerCase().includes(q)
      if (!matchTitle && !matchCode && !matchCust && !matchOwner) {
        return false
      }
    }
    return true
  })

  // Thống kê nhanh KPI
  const totalCount = opportunities.length
  const totalRevenue = opportunities.reduce((acc, o) => acc + (o.expected_revenue || 0), 0)
  const weightedRevenue = opportunities.reduce(
    (acc, o) => acc + ((o.expected_revenue || 0) * (o.win_probability || 0)) / 100,
    0
  )
  const wonCount = opportunities.filter((o) => o.status === 'WON').length

  return (
    <div className="opportunities-page-container" id="opportunities-page-container">
      {/* Toast thông báo */}
      {toast && (
        <div className={`opp-page-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="opportunities-header">
        <div>
          <h2>Cơ hội bán hàng & Pipeline (Opportunities)</h2>
          <p>
            Quản lý phễu cơ hội bán hàng, theo dõi lịch sử hoạt động (S5-03) và công việc liên quan (S5-04).
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            id="create-opp-btn"
            onClick={handleOpenCreateModal}
          >
            <IconPlus />
            <span>Thêm cơ hội mới</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="opp-kpi-grid">
        <div className="opp-kpi-card">
          <span className="kpi-title">Tổng số cơ hội</span>
          <span className="kpi-number">{totalCount}</span>
          <span className="kpi-hint">{wonCount} cơ hội đã chốt thành công</span>
        </div>
        <div className="opp-kpi-card">
          <span className="kpi-title">Tổng giá trị Pipeline</span>
          <span className="kpi-number text-primary">{formatCurrency(totalRevenue)}</span>
          <span className="kpi-hint">Tổng giá trị danh nghĩa</span>
        </div>
        <div className="opp-kpi-card">
          <span className="kpi-title">Doanh số dự báo (Weighted)</span>
          <span className="kpi-number text-success">{formatCurrency(weightedRevenue)}</span>
          <span className="kpi-hint">Tính theo xác suất thắng từng giai đoạn</span>
        </div>
        <div className="opp-kpi-card">
          <span className="kpi-title">Tỷ lệ chốt đơn (Win rate)</span>
          <span className="kpi-number text-info">
            {totalCount > 0 ? `${Math.round((wonCount / totalCount) * 100)}%` : '0%'}
          </span>
          <span className="kpi-hint">Dựa trên toàn bộ cơ hội</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="opp-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm theo mã cơ hội, tên deal, khách hàng..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            id="opp-search-input"
          />
          {searchKeyword && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setSearchKeyword('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-select-group">
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="filter-select"
            id="opp-stage-filter"
          >
            <option value="ALL">-- Tất cả giai đoạn --</option>
            {stages.map((stg) => (
              <option key={stg.id} value={stg.id}>
                {stg.name} ({stg.win_probability}%)
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
            id="opp-status-filter"
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="OPEN">Đang mở (OPEN)</option>
            <option value="WON">Thắng deal (WON)</option>
            <option value="LOST">Thua deal (LOST)</option>
          </select>
        </div>

        <div className="view-mode-toggle">
          <button
            type="button"
            className={`view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
            onClick={() => setViewMode('TABLE')}
            title="Xem dạng Bảng"
          >
            ☰ Bảng
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'KANBAN' ? 'active' : ''}`}
            onClick={() => setViewMode('KANBAN')}
            title="Xem dạng Pipeline Kanban"
          >
            ☷ Pipeline
          </button>
        </div>
      </div>

      {/* ── Opportunities Table View ── */}
      {viewMode === 'TABLE' ? (
        <div className="opp-table-card">
          {loading ? (
            <div className="opp-loading-state">
              <div className="spinner-border" />
              <p>Đang tải danh sách cơ hội bán hàng...</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="opp-empty-state">
              <p>Chưa có cơ hội bán hàng nào phù hợp với bộ lọc.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenCreateModal}
              >
                + Tạo cơ hội bán hàng mới
              </button>
            </div>
          ) : (
            <table className="opp-table" id="opportunities-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Mã OPP</th>
                  <th>Tên cơ hội & Khách hàng</th>
                  <th>Giai đoạn Pipeline</th>
                  <th>Xác suất</th>
                  <th style={{ textAlign: 'right' }}>Giá trị dự kiến</th>
                  <th style={{ textAlign: 'right' }}>Doanh thu dự báo</th>
                  <th>Ngày dự kiến chốt</th>
                  <th>Người phụ trách</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="opp-row-item">
                    <td>
                      <span className="code-pill">{opp.code}</span>
                    </td>
                    <td>
                      <div className="opp-title-cell">
                        <span
                          className="opp-name-link"
                          onClick={() => handleOpenDetail(opp)}
                          title="Nhấp để xem chi tiết và lịch sử hoạt động"
                        >
                          {opp.title}
                        </span>
                        <div className="opp-cust-sub">
                          🏢 {opp.customer_name}
                          {opp.lead_id && <span className="lead-tag">Từ Lead</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="stage-inline-select"
                        value={opp.stage_id}
                        style={{ borderLeftColor: opp.stage_color || '#2563eb' }}
                        onChange={(e) => handleQuickChangeStage(opp, e.target.value)}
                        title="Đổi giai đoạn"
                      >
                        {stages.map((stg) => (
                          <option key={stg.id} value={stg.id}>
                            {stg.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="prob-badge">{opp.win_probability}%</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong className="revenue-text">
                        {formatCurrency(opp.expected_revenue)}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="weighted-text">
                        {formatCurrency((opp.expected_revenue * opp.win_probability) / 100)}
                      </span>
                    </td>
                    <td>
                      <span className="close-date-text">
                        {opp.expected_close_date || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="owner-badge">{opp.owner_name}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-action view-btn"
                          title="Xem chi tiết & Lịch sử hoạt động (S5-03)"
                          onClick={() => handleOpenDetail(opp)}
                        >
                          <IconActivity />
                          <span>Hoạt động</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action delete-btn"
                          title="Xóa cơ hội"
                          onClick={() => handleDeleteOpp(opp)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── Opportunities Pipeline Kanban View ── */
        <div className="opp-kanban-board">
          {stages.map((stage) => {
            const stageOpps = filteredOpportunities.filter((o) => o.stage_id === stage.id)
            const stageTotal = stageOpps.reduce((acc, o) => acc + o.expected_revenue, 0)
            return (
              <div key={stage.id} className="kanban-column">
                <div
                  className="kanban-column-header"
                  style={{ borderTopColor: stage.color || '#2563eb' }}
                >
                  <div className="col-header-top">
                    <h4>{stage.name}</h4>
                    <span className="col-count">{stageOpps.length}</span>
                  </div>
                  <div className="col-header-meta">
                    <span>Xác suất: {stage.win_probability}%</span>
                    <span>{formatCurrency(stageTotal)}</span>
                  </div>
                </div>

                <div className="kanban-column-body">
                  {stageOpps.length === 0 ? (
                    <div className="kanban-empty">Không có cơ hội</div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="kanban-deal-card"
                        onClick={() => handleOpenDetail(opp)}
                      >
                        <div className="card-top">
                          <span className="code-pill">{opp.code}</span>
                          <span className="deal-prob">{opp.win_probability}%</span>
                        </div>
                        <h5 className="deal-title">{opp.title}</h5>
                        <div className="deal-cust">🏢 {opp.customer_name}</div>
                        <div className="card-bottom">
                          <strong className="deal-revenue">
                            {formatCurrency(opp.expected_revenue)}
                          </strong>
                          <span className="deal-owner">{opp.owner_name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL CHI TIẾT CƠ HỘI & LỊCH SỬ HOẠT ĐỘNG (S5-03) ── */}
      {selectedOpp && isDetailModalOpen && (
        <OpportunityDetailModal
          opportunity={selectedOpp}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onOpportunityUpdated={handleOppUpdated}
        />
      )}

      {/* ── MODAL THÊM CƠ HỘI MỚI ── */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal-content create-opp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Thêm mới Cơ hội bán hàng (Opportunity)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <div className="modal-alert-error">⚠️ {createError}</div>
                )}

                <div className="form-group">
                  <label>Tên cơ hội bán hàng *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="VD: Triển khai phần mềm Quản lý Bán hàng cho Hòa Bình Group"
                    value={newOppForm.title}
                    onChange={(e) => setNewOppForm({ ...newOppForm, title: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Tên khách hàng / Công ty *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="VD: Tập đoàn Xây dựng Hòa Bình"
                      value={newOppForm.customer_name}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, customer_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Người liên hệ</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Nguyễn Văn A"
                      value={newOppForm.contact_name}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, contact_name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0912 345 678"
                      value={newOppForm.contact_phone}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, contact_phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Email liên hệ</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="contact@company.com"
                      value={newOppForm.contact_email}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, contact_email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Giai đoạn khởi tạo</label>
                    <select
                      className="form-control"
                      value={newOppForm.stage_id}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, stage_id: e.target.value })
                      }
                    >
                      {stages.map((stg) => (
                        <option key={stg.id} value={stg.id}>
                          {stg.name} ({stg.win_probability}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Doanh số dự kiến (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000000}
                      className="form-control"
                      value={newOppForm.expected_revenue}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, expected_revenue: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Ngày dự kiến chốt hợp đồng</label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={newOppForm.expected_close_date}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, expected_close_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Nguồn cơ hội</label>
                    <select
                      className="form-control"
                      value={newOppForm.source}
                      onChange={(e) =>
                        setNewOppForm({ ...newOppForm, source: e.target.value })
                      }
                    >
                      <option value="Website">Website</option>
                      <option value="Giới thiệu">Giới thiệu (Referral)</option>
                      <option value="Hội thảo / Triển lãm">Hội thảo / Triển lãm</option>
                      <option value="Chăm sóc khách cũ">Chăm sóc khách cũ</option>
                      <option value="Chuyển đổi từ Lead">Chuyển đổi từ Lead</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả nhu cầu & ghi chú</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Mô tả cụ thể về bài toán, quy mô người dùng hoặc yêu cầu triển khai..."
                    value={newOppForm.description}
                    onChange={(e) =>
                      setNewOppForm({ ...newOppForm, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Đang tạo...' : 'Tạo cơ hội bán hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
