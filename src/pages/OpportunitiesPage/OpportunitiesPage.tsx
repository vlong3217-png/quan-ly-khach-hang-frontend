import { useState, useEffect, useCallback } from 'react'
import type {
  Opportunity,
  CreateOpportunityPayload,
} from '../../types/opportunity.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { pipelineService } from '../../services/pipelineService.ts'
import OpportunityDetailModal from '../../components/OpportunityDetailModal/OpportunityDetailModal.tsx'
import WinLossCompetitorsPage from '../WinLossCompetitorsPage/WinLossCompetitorsPage.tsx'
import SalesForecastView from '../../components/SalesForecastView/SalesForecastView.tsx'
import StalledOpportunityAlerts from '../../components/StalledOpportunityAlerts/StalledOpportunityAlerts.tsx'
import ReassignOpportunityModal from '../../components/ReassignOpportunityModal/ReassignOpportunityModal.tsx'
import StageGateEnforcementModal from '../../components/StageGateEnforcementModal/StageGateEnforcementModal.tsx'
import { opportunityActivityService } from '../../services/opportunityActivityService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import TableActionMenu from '../../components/TableActionMenu/TableActionMenu.tsx'
import './OpportunitiesPage.css'



export default function OpportunitiesPage() {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // State danh sách
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Drag and drop state
  const [draggingOppId, setDraggingOppId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [isUpdatingStage, setIsUpdatingStage] = useState<boolean>(false)

  // Bộ lọc
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [selectedStageId, setSelectedStageId] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE')

  // Phân trang cho Table view
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)

  // Main Nav Tab (Danh sách Cơ hội vs Dự báo doanh số S5-06 vs Cảnh báo đình trệ S5-07 vs Lý do Thắng/Thua S5-05)
  const [mainNavTab, setMainNavTab] = useState<'PIPELINE' | 'FORECAST' | 'STALLED' | 'WIN_LOSS'>('PIPELINE')

  // Modal Chi tiết Cơ hội
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [detailTab, setDetailTab] = useState<'ACTIVITIES' | 'DETAILS' | 'TASKS'>('ACTIVITIES')

  // Modal Phân bổ lại cơ hội (S5-08)
  const [oppToReassign, setOppToReassign] = useState<Opportunity | null>(null)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState<boolean>(false)

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
  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val)
    if (isNaN(num)) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  // Mở modal chi tiết
  const handleOpenDetail = (
    opp: Opportunity,
    tab: 'ACTIVITIES' | 'DETAILS' | 'TASKS' = 'ACTIVITIES'
  ) => {
    setSelectedOpp(opp)
    setDetailTab(tab)
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

  // ── S5-04: State kiểm tra điều kiện rời giai đoạn trên Kanban ──
  const [isStageGateModalOpen, setIsStageGateModalOpen] = useState(false)
  const [gateOpp, setGateOpp] = useState<Opportunity | null>(null)
  const [targetGateStageId, setTargetGateStageId] = useState<string | null>(null)
  const [stageGateEvaluation, setStageGateEvaluation] = useState<import('../../types/opportunity.ts').StageGateEvaluation | null>(null)

  // Đổi nhanh giai đoạn (Hỗ trợ kéo thả Pipeline & chọn giai đoạn - S5-04 Ràng buộc điều kiện)
  const handleQuickChangeStage = async (opp: Opportunity, targetStageId: string) => {
    const targetStage = stages.find((s) => s.id === targetStageId)
    if (!targetStage || targetStage.id === opp.stage_id) return

    // S5-04: Đánh giá điều kiện rời giai đoạn trước khi cho phép chuyển
    const evaluation = await opportunityService.evaluateStageGate(opp, targetStageId)
    if (!evaluation.can_proceed) {
      setGateOpp(opp)
      setTargetGateStageId(targetStageId)
      setStageGateEvaluation(evaluation)
      setIsStageGateModalOpen(true)
      return
    }

    await executeQuickStageChange(opp, targetStage)
  }

  const executeQuickStageChange = async (opp: Opportunity, targetStage: PipelineStage) => {
    setIsUpdatingStage(true)
    try {
      const oldStageName = opp.stage_name
      const updated = await opportunityService.updateOpportunity(opp.id, {
        stage_id: targetStage.id,
        stage_name: targetStage.name,
        win_probability: targetStage.win_probability,
        stage_color: targetStage.color,
      })
      handleOppUpdated(updated)

      // Ghi nhận hoạt động STAGE_CHANGE tự động vào timeline (S5-03)
      await opportunityActivityService.createActivity({
        opportunity_id: opp.id,
        type: 'STAGE_CHANGE',
        title: `Chuyển giai đoạn (Pipeline): ${oldStageName} → ${targetStage.name}`,
        content: `Cơ hội "${opp.title}" được kéo thả/chuyển sang giai đoạn "${targetStage.name}" (xác suất chốt: ${targetStage.win_probability}%).`,
        performed_by_id: user?.id ? Number(user.id) : undefined,
        performed_by_name: user?.full_name || 'Người dùng',
      })

      showToast(`Đã chuyển cơ hội "${opp.code}" sang "${targetStage.name}"`, 'success')
    } catch {
      showToast('Không thể chuyển giai đoạn. Vui lòng thử lại.', 'error')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  // Quản lý phê duyệt ghi đè từ Kanban (S5-04 AC3)
  const handleKanbanOverrideApproved = async (reason: string) => {
    if (!gateOpp || !targetGateStageId || !stageGateEvaluation) return
    const targetStage = stages.find((s) => s.id === targetGateStageId)
    const updated = await opportunityService.overrideAndChangeStage(
      gateOpp.id,
      targetGateStageId,
      {
        user_id: user?.id ? Number(user.id) : 1,
        user_name: user?.full_name || 'Trưởng nhóm kinh doanh',
        user_role: user?.role === 'ADMIN' ? 'Giám đốc kinh doanh' : 'Trưởng nhóm kinh doanh',
        reason,
        unmet_conditions: stageGateEvaluation.unmet_conditions.map((c) => c.condition),
      }
    )
    handleOppUpdated(updated)
    showToast(`Đã ghi đè và chuyển cơ hội sang "${targetStage?.name || 'Giai đoạn mới'}" thành công!`, 'success')
  }

  // Ref lưu ID cơ hội đang được kéo để đảm bảo không bị mất qua DataTransfer của các trình duyệt
  const draggedOppRef = (window as any).__draggedOppRef || { current: null }
  ;(window as any).__draggedOppRef = draggedOppRef

  // Xử lý kéo thả Kanban (Drag & Drop)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, opp: Opportunity) => {
    try {
      e.dataTransfer.setData('text/plain', opp.id)
      e.dataTransfer.effectAllowed = 'move'
    } catch {}
    draggedOppRef.current = opp.id
    setDraggingOppId(opp.id)
  }

  const handleDragEnd = () => {
    setDraggingOppId(null)
    setDragOverStageId(null)
    draggedOppRef.current = null
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      e.dataTransfer.dropEffect = 'move'
    } catch {}
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault()
    // Chỉ reset khi con trỏ thật sự rời khỏi container stage
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (dragOverStageId === stageId) {
      setDragOverStageId(null)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverStageId(null)

    let oppId = ''
    try {
      oppId = e.dataTransfer.getData('text/plain')
    } catch {}
    if (!oppId) {
      oppId = draggedOppRef.current || draggingOppId || ''
    }

    setDraggingOppId(null)
    draggedOppRef.current = null

    if (!oppId) return
    const opp = opportunities.find((o) => o.id === oppId)
    if (!opp || opp.stage_id === targetStageId) return

    await handleQuickChangeStage(opp, targetStageId)
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

  // Reset về trang 1 khi lọc
  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword, selectedStageId, selectedStatus])

  // Phân trang cho Table view
  const totalPages = Math.max(1, Math.ceil(filteredOpportunities.length / pageSize))
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

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
          <h2>Cơ hội bán hàng</h2>
        </div>

        {mainNavTab === 'PIPELINE' && (
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary"
              id="create-opp-btn"
              onClick={handleOpenCreateModal}
            >
              <span>Thêm cơ hội mới</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Main Sub-tabs: Cơ hội bán hàng vs Dự báo doanh số (S5-06) vs Cảnh báo đình trệ (S5-07) vs Lý do Thắng / Thua (S5-05) ── */}
      <div className="opp-main-tabs" id="opp-main-tabs">
        <button
          type="button"
          className={`opp-main-tab-btn ${mainNavTab === 'PIPELINE' ? 'active' : ''}`}
          id="tab-btn-opp-pipeline"
          onClick={() => setMainNavTab('PIPELINE')}
        >
          <span className="tab-title">Danh sách Cơ hội & Pipeline</span>
        </button>
        <button
          type="button"
          className={`opp-main-tab-btn ${mainNavTab === 'STALLED' ? 'active' : ''}`}
          id="tab-btn-opp-stalled"
          onClick={() => setMainNavTab('STALLED')}
        >
          <span className="tab-title"> Cảnh báo Đình trệ</span>
        </button>
        <button
          type="button"
          className={`opp-main-tab-btn ${mainNavTab === 'FORECAST' ? 'active' : ''}`}
          id="tab-btn-opp-forecast"
          onClick={() => setMainNavTab('FORECAST')}
        >
          <span className="tab-title">Dự báo Doanh số</span>
        </button>
        <button
          type="button"
          className={`opp-main-tab-btn ${mainNavTab === 'WIN_LOSS' ? 'active' : ''}`}
          id="tab-btn-opp-winloss"
          onClick={() => setMainNavTab('WIN_LOSS')}
        >
          <span className="tab-title">Lý do Thắng/Thua</span>

        </button>
      </div>

      {mainNavTab === 'STALLED' ? (
        <div className="opp-stalled-container">
          <StalledOpportunityAlerts
            opportunities={opportunities}
            isManagerOrAdmin={isManagerOrAdmin}
            managerName={user?.full_name || 'Bế Hoàng Quân (Trưởng nhóm)'}
            managerId={user?.id ? Number(user.id) : 1}
            onOpportunityUpdated={handleOppUpdated}
            onOpenOpportunityDetail={(opp) => handleOpenDetail(opp, 'DETAILS')}
            onReassignOpportunity={(opp) => {
              setOppToReassign(opp)
              setIsReassignModalOpen(true)
            }}
          />
        </div>
      ) : mainNavTab === 'FORECAST' ? (
        <div className="opp-forecast-container">
          <SalesForecastView
            opportunities={opportunities}
            onOpenOpportunityDetail={(opp) => handleOpenDetail(opp, 'DETAILS')}
          />
        </div>
      ) : mainNavTab === 'WIN_LOSS' ? (
        <div className="opp-winloss-container">
          <WinLossCompetitorsPage />
        </div>
      ) : (
        <>
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
                Bảng
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'KANBAN' ? 'active' : ''}`}
                onClick={() => setViewMode('KANBAN')}
                title="Xem dạng Pipeline Kanban"
              >
                Pipeline
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
                <>
                  <table className="opp-table" id="opportunities-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Số thứ tự</th>
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
                    {paginatedOpportunities.map((opp, idx) => (
                      <tr key={opp.id} className="opp-row-item">
                        <td style={{ textAlign: 'center' }}>
                          <span className="order-num" style={{ fontWeight: 600, color: '#64748b' }}>
                            {(currentPage - 1) * pageSize + idx + 1}
                          </span>
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
                            {(() => {
                              const stalledCheck = opportunityService.analyzeStalledOpportunity(opp)
                              if (!stalledCheck.isStalled) return null
                              return (
                                <span
                                  className={`opp-stalled-table-badge ${stalledCheck.severity === 'CRITICAL' ? 'badge-crit' : 'badge-warn'}`}
                                  title={`[Cảnh báo S5-07]: ${stalledCheck.message}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMainNavTab('STALLED')
                                  }}
                                >
                                  {stalledCheck.severity === 'CRITICAL' ? 'Đình trệ nguy cấp' : 'Cảnh báo đình trệ'}
                                </span>
                              )
                            })()}
                            <div className="opp-cust-sub">
                              {opp.customer_name}
                              {opp.lead_id && <span className="lead-tag">Từ Lead</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          {opp.status === 'WON' ? (
                            <span className="opp-status-badge status-won" title="Đã đóng thắng">Thắng deal</span>
                          ) : opp.status === 'LOST' ? (
                            <span className="opp-status-badge status-lost" title="Đã đóng thua">Thua deal</span>
                          ) : (
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
                          )}
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
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div className="table-actions-container">
                            <button
                              type="button"
                              className="btn-action view-btn"
                              title="Xem chi tiết & Lịch sử hoạt động (S5-03)"
                              onClick={() => handleOpenDetail(opp, 'ACTIVITIES')}
                            >
                              <span>Hoạt động</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action task-btn"
                              title="Quản lý công việc & lịch nhắc (S5-04)"
                              onClick={() => handleOpenDetail(opp, 'TASKS')}
                            >
                              <span>Công việc</span>
                            </button>
                            <TableActionMenu
                              buttonId={`btn-more-opp-${opp.id}`}
                              items={[
                                {
                                  key: 'detail',
                                  label: 'Xem chi tiết cơ hội',
                                  onClick: () => handleOpenDetail(opp, 'DETAILS'),
                                },
                                {
                                  key: 'reassign',
                                  label: 'Phân bổ lại (Chuyển giao)',
                                  onClick: () => {
                                    setOppToReassign(opp)
                                    setIsReassignModalOpen(true)
                                  },
                                  disabled: !(isManagerOrAdmin && opp.status === 'OPEN'),
                                },
                                {
                                  key: 'delete',
                                  label: 'Xóa cơ hội',
                                  onClick: () => handleDeleteOpp(opp),
                                  danger: true,
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Thanh phân trang Pagination */}
                {filteredOpportunities.length > 0 && (
                  <div className="customer-pagination" style={{ margin: '16px 20px 20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <div className="customer-pagination-info">
                      <span>
                        Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredOpportunities.length)}</strong> -{' '}
                        <strong>{Math.min(currentPage * pageSize, filteredOpportunities.length)}</strong> trên tổng số{' '}
                        <strong>{filteredOpportunities.length}</strong> cơ hội
                      </span>
                      <div className="customer-pagination-size">
                        <label htmlFor="opp-page-size-select">Hiển thị:</label>
                        <select
                          id="opp-page-size-select"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className="customer-pagination-select"
                        >
                          <option value={5}>5 cơ hội / trang</option>
                          <option value={10}>10 cơ hội / trang</option>
                          <option value={20}>20 cơ hội / trang</option>
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        className="customer-page-btn nav-btn"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
              )}
            </div>
          ) : (
            /* ── Opportunities Pipeline Kanban View ── */
            <div className="opp-kanban-board">
              {stages.map((stage) => {
                const stageOpps = filteredOpportunities.filter((o) => o.stage_id === stage.id)
                const stageTotal = stageOpps.reduce((acc, o) => acc + o.expected_revenue, 0)
                const isDragOver = dragOverStageId === stage.id

                return (
                  <div
                    key={stage.id}
                    className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={(e) => handleDragLeave(e, stage.id)}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
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
                        <div className={`kanban-empty ${isDragOver ? 'drag-target-placeholder' : ''}`}>
                          {isDragOver ? 'Thả cơ hội vào đây...' : 'Không có cơ hội'}
                        </div>
                      ) : (
                        stageOpps.map((opp) => {
                          const isDragging = draggingOppId === opp.id
                          return (
                            <div
                              key={opp.id}
                              draggable={!isUpdatingStage}
                              onDragStart={(e) => handleDragStart(e, opp)}
                              onDragEnd={handleDragEnd}
                              className={`kanban-deal-card ${isDragging ? 'dragging' : ''}`}
                              onClick={() => handleOpenDetail(opp)}
                            >
                              <div className="card-top">
                                <span className="code-pill">{opp.code}</span>
                                {(() => {
                                  const stalledCheck = opportunityService.analyzeStalledOpportunity(opp)
                                  if (!stalledCheck.isStalled) return null
                                  return (
                                    <span
                                      className={`kanban-stalled-tag ${stalledCheck.severity === 'CRITICAL' ? 'crit' : 'warn'}`}
                                      title={`[Cảnh báo S5-07]: ${stalledCheck.message}`}
                                    >
                                      Đình trệ
                                    </span>
                                  )
                                })()}
                                <span className="deal-prob">{opp.win_probability}%</span>
                              </div>
                              <h5 className="deal-title">{opp.title}</h5>
                              <div className="deal-cust">{opp.customer_name}</div>
                              <div className="card-bottom">
                                <strong className="deal-revenue">
                                  {formatCurrency(opp.expected_revenue)}
                                </strong>
                                <span className="deal-owner">{opp.owner_name}</span>
                              </div>

                              {/* Thanh nút bấm chuyển giai đoạn nhanh không cần kéo thả */}
                              <div
                                className="card-quick-actions"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'flex',
                                  gap: '4px',
                                  marginTop: '6px',
                                  paddingTop: '6px',
                                  borderTop: '1px dashed #e2e8f0',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <select
                                  value={opp.stage_id}
                                  onChange={(e) => handleQuickChangeStage(opp, e.target.value)}
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#334155',
                                    fontWeight: 600,
                                    width: '100%',
                                    cursor: 'pointer',
                                  }}
                                  title="Chuyển nhanh giai đoạn hoặc kéo thả thẻ sang cột mong muốn"
                                >
                                  {stages.map((stg) => (
                                    <option key={stg.id} value={stg.id}>
                                      ➜ {stg.name} ({stg.win_probability}%)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── MODAL CHI TIẾT CƠ HỘI & LỊCH SỬ HOẠT ĐỘNG (S5-03) ── */}
      {selectedOpp && isDetailModalOpen && (
        <OpportunityDetailModal
          opportunity={selectedOpp}
          isOpen={isDetailModalOpen}
          initialTab={detailTab}
          onClose={() => setIsDetailModalOpen(false)}
          onOpportunityUpdated={handleOppUpdated}
        />
      )}

      {/* ── MODAL PHÂN BỔ LẠI CƠ HỘI (S5-08) ── */}
      {oppToReassign && isReassignModalOpen && (
        <ReassignOpportunityModal
          opportunity={oppToReassign}
          isOpen={isReassignModalOpen}
          managerName={user?.full_name || 'Bế Hoàng Quân (Trưởng nhóm)'}
          managerId={user?.id ? Number(user.id) : 1}
          onClose={() => {
            setIsReassignModalOpen(false)
            setOppToReassign(null)
          }}
          onSuccess={(updated) => {
            handleOppUpdated(updated)
            showToast(`Đã chuyển giao cơ hội ${updated.code} sang ${updated.owner_name} thành công!`, 'success')
          }}
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
                  <div className="modal-alert-error">{createError}</div>
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
                    <small style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                      💡 S5-03: Sau khi tạo, bạn có thể vào tab <strong>"Sản phẩm & Dịch vụ"</strong> để chọn mặt hàng từ Bảng giá niêm yết và tự động tính lại giá trị hợp đồng chính xác.
                    </small>
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

      {/* ── MODAL: RÀNG BUỘC ĐIỀU KIỆN RỜI GIAI ĐOẠN TRÊN PIPELINE (S5-04) ── */}
      {isStageGateModalOpen && gateOpp && stageGateEvaluation && targetGateStageId && (
        <StageGateEnforcementModal
          isOpen={isStageGateModalOpen}
          opportunity={gateOpp}
          targetStageId={targetGateStageId}
          evaluation={stageGateEvaluation}
          isManagerOrAdmin={isManagerOrAdmin}
          currentUserId={user?.id ? Number(user.id) : 1}
          currentUserName={user?.full_name || 'Trưởng nhóm kinh doanh'}
          currentUserRole={user?.role === 'ADMIN' ? 'Giám đốc kinh doanh' : 'Trưởng nhóm kinh doanh'}
          onClose={() => {
            setIsStageGateModalOpen(false)
            setGateOpp(null)
            setTargetGateStageId(null)
            setStageGateEvaluation(null)
          }}
          onConfirmedStageChange={() => {
            const stg = stages.find((s) => s.id === targetGateStageId)
            if (stg) executeQuickStageChange(gateOpp, stg)
          }}
          onOverrideApproved={handleKanbanOverrideApproved}
        />
      )}
    </div>
  )
}
