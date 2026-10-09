import React, { useState, useEffect, useMemo } from 'react'
import { opportunityService } from '../../services/opportunityService.ts'
import { customerService } from '../../services/customerService.ts'
import { pipelineService } from '../../services/pipelineService.ts'
import { categoryService } from '../../services/categoryService.ts'
import type {
  Opportunity,
  CreateOpportunityPayload,
  OpportunitySummary,
} from '../../types/opportunity.ts'
import type { CustomerEnterprise, CustomerContact } from '../../types/customer.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
import './OpportunitiesPage.css'

/* ──────────── Inline Icons ──────────── */
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconKanban = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="6" height="14" x="3" y="5" rx="1" />
    <rect width="6" height="10" x="11" y="5" rx="1" />
    <rect width="6" height="16" x="19" y="5" rx="1" />
  </svg>
)

const IconTable = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </svg>
)

const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

export default function OpportunitiesPage() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Chế độ xem: KANBAN (S5-02) hoặc TABLE (S5-01)
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN')

  // Dữ liệu chính
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [summary, setSummary] = useState<OpportunitySummary | null>(null)
  const [customers, setCustomers] = useState<CustomerEnterprise[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [sources, setSources] = useState<string[]>([])

  // Trạng thái tải & lỗi
  const [isLoading, setIsLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<'NONE' | '401' | '403' | 'GENERAL'>('NONE')
  const [errorMessage, setErrorMessage] = useState('')
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  // Bộ lọc nâng cao (AC S5-02: filter theo người sở hữu, nhóm, ngày chốt)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('ALL')
  const [filterSource, setFilterSource] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterOwner, setFilterOwner] = useState<string>('ALL')
  const [filterTeam, setFilterTeam] = useState<string>('ALL')
  const [filterDateRange, setFilterDateRange] = useState<string>('ALL')

  // Drag and drop state
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  // Modal Tạo / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
  const [availableContacts, setAvailableContacts] = useState<CustomerContact[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState<CreateOpportunityPayload>({
    title: '',
    customer_id: '',
    customer_name: '',
    contact_id: '',
    contact_name: '',
    stage_id: '',
    expected_revenue: 50000000,
    expected_close_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    source: 'Website & Đăng ký Form',
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Modal Xóa
  const [deletingOpp, setDeletingOpp] = useState<Opportunity | null>(null)

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 3200)
  }

  // Tải dữ liệu ban đầu
  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setErrorStatus('NONE')

      // Tải danh mục hỗ trợ
      const custList = customerService.getCustomers()
      const stageList = pipelineService.getStages()
      const srcCats = categoryService.getCategories('LEAD_SOURCE').map((c) => c.name)

      setCustomers(custList)
      setStages(stageList)
      setSources(
        srcCats.length > 0
          ? srcCats
          : ['Website & Đăng ký Form', 'Facebook Ads / Fanpage', 'Khách hàng cũ giới thiệu', 'Hội thảo / Triển lãm ngành', 'Telesale & Data tự tìm']
      )

      // Tải cơ hội & thống kê
      const [oppList, sumData] = await Promise.all([
        opportunityService.getOpportunities(),
        opportunityService.getOpportunitySummary(),
      ])

      setOpportunities(oppList)
      setSummary(sumData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401_UNAUTHORIZED')) {
        setErrorStatus('401')
        setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (msg.includes('403_FORBIDDEN')) {
        setErrorStatus('403')
        setErrorMessage('Bạn không có quyền truy cập module Cơ hội bán hàng.')
      } else {
        setErrorStatus('GENERAL')
        setErrorMessage(msg || 'Có lỗi xảy ra khi tải dữ liệu cơ hội bán hàng.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Khi chọn khách hàng trong Modal, tự động lấy danh sách người liên hệ tương ứng
  useEffect(() => {
    if (formData.customer_id) {
      const contacts = customerService.getContacts(formData.customer_id)
      setAvailableContacts(contacts)
      if (formData.contact_id && !contacts.some((c) => c.id === formData.contact_id)) {
        setFormData((prev) => ({ ...prev, contact_id: '', contact_name: '' }))
      }
    } else {
      setAvailableContacts([])
    }
  }, [formData.customer_id])

  // Danh sách Người sở hữu và Đội nhóm (từ dữ liệu thực tế)
  const ownerOptions = useMemo(() => {
    const map = new Map<number, string>()
    opportunities.forEach((o) => {
      if (o.owner_id && o.owner_name) {
        map.set(o.owner_id, o.owner_name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [opportunities])

  const teamOptions = useMemo(() => {
    const set = new Set<string>()
    opportunities.forEach((o) => {
      if (o.team_name) set.add(o.team_name)
    })
    return Array.from(set)
  }, [opportunities])

  // Mở modal tạo mới
  const handleOpenCreateModal = (presetStageId?: string) => {
    setEditingOpp(null)
    const defaultStage = presetStageId || stages[0]?.id || 'stage-1'
    const defaultCustomer = customers[0]?.id || ''
    const defaultCustomerName = customers[0]?.name || ''

    setFormData({
      title: '',
      customer_id: defaultCustomer,
      customer_name: defaultCustomerName,
      contact_id: '',
      contact_name: '',
      stage_id: defaultStage,
      expected_revenue: 50000000,
      expected_close_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      source: sources[0] || 'Website & Đăng ký Form',
      description: '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (opp: Opportunity) => {
    setEditingOpp(opp)
    setFormData({
      title: opp.title,
      customer_id: opp.customer_id,
      customer_name: opp.customer_name,
      contact_id: opp.contact_id || '',
      contact_name: opp.contact_name || '',
      stage_id: opp.stage_id,
      expected_revenue: opp.expected_revenue,
      expected_close_date: opp.expected_close_date,
      source: opp.source,
      description: opp.description || '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Validation Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tên cơ hội bán hàng'
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Tên cơ hội phải có ít nhất 3 ký tự'
    }

    if (!formData.customer_id) {
      errors.customer_id = 'Vui lòng chọn khách hàng liên kết'
    }

    if (!formData.stage_id) {
      errors.stage_id = 'Vui lòng chọn giai đoạn Pipeline'
    }

    if (formData.expected_revenue < 0 || isNaN(formData.expected_revenue)) {
      errors.expected_revenue = 'Giá trị dự kiến không được để âm'
    }

    if (!formData.expected_close_date) {
      errors.expected_close_date = 'Vui lòng chọn ngày dự kiến chốt'
    } else if (formData.expected_close_date < todayStr) {
      errors.expected_close_date = 'Ngày dự kiến chốt không được là ngày trong quá khứ'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Lưu cơ hội
  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      if (editingOpp) {
        await opportunityService.updateOpportunity(editingOpp.id, formData)
        showToast(`Đã cập nhật cơ hội "${formData.title}" thành công!`)
      } else {
        await opportunityService.createOpportunity(formData)
        showToast(`Đã tạo mới cơ hội "${formData.title}" thành công!`)
      }

      setIsModalOpen(false)
      const [oppList, sumData] = await Promise.all([
        opportunityService.getOpportunities(),
        opportunityService.getOpportunitySummary(),
      ])
      setOpportunities(oppList)
      setSummary(sumData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(msg || 'Lỗi khi lưu cơ hội bán hàng', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xóa cơ hội
  const handleDeleteOpportunity = async () => {
    if (!deletingOpp) return
    try {
      await opportunityService.deleteOpportunity(deletingOpp.id)
      showToast(`Đã xóa cơ hội "${deletingOpp.title}" thành công!`)
      setDeletingOpp(null)

      const [oppList, sumData] = await Promise.all([
        opportunityService.getOpportunities(),
        opportunityService.getOpportunitySummary(),
      ])
      setOpportunities(oppList)
      setSummary(sumData)
    } catch {
      showToast('Lỗi khi xóa cơ hội bán hàng', true)
    }
  }

  // ── S5-02: Chuyển giai đoạn (Move Stage) ──
  const handleMoveStage = async (oppId: string, targetStageId: string) => {
    const opp = opportunities.find((o) => o.id === oppId)
    const targetStage = stages.find((s) => s.id === targetStageId)
    if (!opp || !targetStage || opp.stage_id === targetStageId) return

    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              stage_id: targetStageId,
              stage_name: targetStage.name,
              stage_order: targetStage.order,
              stage_color: targetStage.color,
              win_probability: targetStage.win_probability,
              status: targetStage.is_closed_stage
                ? targetStage.code.includes('WON')
                  ? 'WON'
                  : 'LOST'
                : 'OPEN',
            }
          : o
      )
    )

    try {
      await opportunityService.changeStage(oppId, targetStageId)
      showToast(`Đã chuyển cơ hội "${opp.title}" sang "${targetStage.name}" (${targetStage.win_probability}%)`)
      // Refresh summary
      const sumData = await opportunityService.getOpportunitySummary()
      setSummary(sumData)
    } catch {
      showToast('Lỗi khi chuyển giai đoạn cơ hội bán hàng', true)
      // Rollback nếu lỗi
      const freshList = await opportunityService.getOpportunities()
      setOpportunities(freshList)
    }
  }

  // Di chuyển bước trước / sau
  const handleStepStage = (opp: Opportunity, direction: 'PREV' | 'NEXT') => {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order)
    const curIdx = sortedStages.findIndex((s) => s.id === opp.stage_id)
    if (curIdx === -1) return

    const targetIdx = direction === 'PREV' ? curIdx - 1 : curIdx + 1
    if (targetIdx >= 0 && targetIdx < sortedStages.length) {
      handleMoveStage(opp.id, sortedStages[targetIdx].id)
    }
  }

  // ── Drag & Drop Handlers ──
  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData('text/plain', oppId)
    setDraggedOppId(oppId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId)
    }
  }

  const handleDragLeave = (_e: React.DragEvent, stageId: string) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const oppId = e.dataTransfer.getData('text/plain') || draggedOppId
    setDraggedOppId(null)
    setDragOverStageId(null)
    if (oppId) {
      handleMoveStage(oppId, stageId)
    }
  }

  // Lọc danh sách hiển thị kết hợp tất cả các bộ lọc (AC S5-02)
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Tìm kiếm text
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchTitle = opp.title.toLowerCase().includes(q)
        const matchCode = opp.code.toLowerCase().includes(q)
        const matchCust = opp.customer_name.toLowerCase().includes(q)
        const matchContact = opp.contact_name ? opp.contact_name.toLowerCase().includes(q) : false
        if (!matchTitle && !matchCode && !matchCust && !matchContact) return false
      }
      // 2. Giai đoạn
      if (filterStage !== 'ALL' && opp.stage_id !== filterStage) return false
      // 3. Nguồn
      if (filterSource !== 'ALL' && opp.source !== filterSource) return false
      // 4. Trạng thái
      if (filterStatus !== 'ALL' && opp.status !== filterStatus) return false
      // 5. Người sở hữu (Owner)
      if (filterOwner !== 'ALL' && opp.owner_id !== Number(filterOwner)) return false
      // 6. Đội nhóm (Team)
      if (filterTeam !== 'ALL' && opp.team_name !== filterTeam) return false

      // 7. Lọc theo khoảng ngày chốt (Close Date)
      if (filterDateRange !== 'ALL') {
        const oppDate = opp.expected_close_date
        const isClosed = opp.status === 'WON' || opp.status === 'LOST'

        if (filterDateRange === 'OVERDUE') {
          // Quá hạn chốt mà chưa đóng
          if (isClosed || oppDate >= todayStr) return false
        } else if (filterDateRange === 'THIS_MONTH') {
          const now = new Date()
          const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          if (!oppDate.startsWith(currentMonthPrefix)) return false
        } else if (filterDateRange === 'NEXT_MONTH') {
          const now = new Date()
          now.setMonth(now.getMonth() + 1)
          const nextMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          if (!oppDate.startsWith(nextMonthPrefix)) return false
        }
      }

      return true
    })
  }, [opportunities, searchQuery, filterStage, filterSource, filterStatus, filterOwner, filterTeam, filterDateRange, todayStr])

  // Thống kê phân nhóm theo từng giai đoạn trên Kanban
  const kanbanColumnsData = useMemo(() => {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order)
    return sortedStages.map((stage) => {
      const oppsInStage = filteredOpportunities.filter((o) => o.stage_id === stage.id)
      const totalRevenueInStage = oppsInStage.reduce((sum, o) => sum + (o.expected_revenue || 0), 0)
      return {
        stage,
        opportunities: oppsInStage,
        count: oppsInStage.length,
        totalRevenue: totalRevenueInStage,
      }
    })
  }, [stages, filteredOpportunities])

  // Xuất file Excel
  const handleExportExcel = () => {
    if (filteredOpportunities.length === 0) {
      showToast('Không có dữ liệu cơ hội để xuất', true)
      return
    }
    opportunityService.exportOpportunitiesToExcel(filteredOpportunities)
    showToast(`Đã xuất ${filteredOpportunities.length} cơ hội ra file Excel thành công!`)
  }

  /* ──────────── XỬ LÝ LỖI PHÂN QUYỀN / ĐĂNG NHẬP ──────────── */
  if (errorStatus === '401') {
    return (
      <div className="opportunities-page-container">
        <div className="opp-error-state">
          <div className="opp-error-icon">🔒</div>
          <h3>Phiên đăng nhập đã hết hạn (Mã 401)</h3>
          <p>{errorMessage}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (window.location.href = '/login')}
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    )
  }

  if (errorStatus === '403') {
    return (
      <div className="opportunities-page-container">
        <div className="opp-error-state">
          <div className="opp-error-icon">🚫</div>
          <h3>Từ chối quyền truy cập (Mã 403)</h3>
          <p>{errorMessage}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => (window.location.href = '/dashboard')}
          >
            Về bảng điều khiển
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="opportunities-page-container" id="opportunities-management-page">
      {/* ── 1. Page Header ── */}
      <div className="opp-page-header">
        <div className="opp-header-left">
          <h2>Quản lý Cơ hội bán hàng & Pipeline Kanban</h2>
          <p>Điều hành thương vụ, kéo thả chuyển giai đoạn, dự báo doanh số và theo dõi tỷ lệ thắng</p>
        </div>

        <div className="opp-header-actions">
          {/* Switcher: Bảng Kanban <-> Bảng danh sách */}
          <div className="view-mode-switcher" id="view-mode-toggle">
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'KANBAN' ? 'active' : ''}`}
              onClick={() => setViewMode('KANBAN')}
              title="Xem bảng Pipeline dạng Kanban (Kéo thả)"
              id="btn-view-kanban"
            >
              <IconKanban />
              <span>Bảng Kanban</span>
            </button>
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'TABLE' ? 'active' : ''}`}
              onClick={() => setViewMode('TABLE')}
              title="Xem danh sách cơ hội dạng Bảng"
              id="btn-view-table"
            >
              <IconTable />
              <span>Dạng Bảng</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportExcel}
            title="Xuất danh sách cơ hội bán hàng ra file Excel"
            id="btn-export-opportunities"
          >
            <IconDownload />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenCreateModal()}
            id="btn-create-opportunity"
          >
            <IconPlus />
            <span>Thêm mới cơ hội</span>
          </button>
        </div>
      </div>

      {/* ── 2. Summary Metric Cards ── */}
      <div className="opp-stats-grid">
        <div className="opp-stat-card">
          <div className="opp-stat-content">
            <span className="opp-stat-value">{summary?.open_count ?? 0}</span>
            <span className="opp-stat-label">
              Cơ hội đang theo đuổi ({summary?.total_count ?? 0} tổng số)
            </span>
          </div>
        </div>

        <div className="opp-stat-card">
          <div className="opp-stat-content">
            <span className="opp-stat-value" style={{ color: '#2563eb' }}>
              {(summary?.total_expected_revenue ?? 0).toLocaleString('vi-VN')} đ
            </span>
            <span className="opp-stat-label">Tổng giá trị Pipeline kỳ này</span>
          </div>
        </div>

        <div className="opp-stat-card">
          <div className="opp-stat-content">
            <span className="opp-stat-value" style={{ color: '#059669' }}>
              {(summary?.forecast_revenue ?? 0).toLocaleString('vi-VN')} đ
            </span>
            <span className="opp-stat-label">
              Dự báo doanh thu (Weighted Forecast)
            </span>
          </div>
        </div>

        <div className="opp-stat-card">
          <div className="opp-stat-content">
            <span className="opp-stat-value" style={{ color: '#d97706' }}>
              {summary?.won_count ?? 0} Thắng ({summary?.avg_win_rate ?? 0}% Win Rate)
            </span>
            <span className="opp-stat-label">
              Đã chốt: {(summary?.won_revenue ?? 0).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Panel & Search Filters (AC S5-02: Lọc theo người sở hữu, nhóm, ngày chốt) ── */}
      <div className="opp-card-panel">
        <div className="opp-panel-controls">
          <div className="opp-search-box">
            <IconSearch />
            <input
              type="text"
              placeholder="Tìm theo tên cơ hội, mã định danh, khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-search-opportunity"
            />
          </div>

          <div className="opp-filters-group">
            {/* Lọc Người sở hữu (Owner) */}
            <select
              className="opp-select-filter"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              id="select-filter-owner"
              title="Lọc theo người phụ trách"
            >
              <option value="ALL">Tất cả người phụ trách</option>
              {ownerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  👤 {o.name}
                </option>
              ))}
            </select>

            {/* Lọc Nhóm (Team) */}
            <select
              className="opp-select-filter"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              id="select-filter-team"
              title="Lọc theo đội nhóm kinh doanh"
            >
              <option value="ALL">Tất cả đội nhóm</option>
              {teamOptions.map((t) => (
                <option key={t} value={t}>
                  👥 {t}
                </option>
              ))}
            </select>

            {/* Lọc Ngày chốt (Close Date) */}
            <select
              className="opp-select-filter"
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              id="select-filter-daterange"
              title="Lọc theo hạn chốt"
            >
              <option value="ALL">Tất cả ngày chốt</option>
              <option value="THIS_MONTH">Chốt trong tháng này</option>
              <option value="NEXT_MONTH">Chốt trong tháng tới</option>
              <option value="OVERDUE">Đã quá hạn chốt ⚠️</option>
            </select>

            {/* Lọc Giai đoạn (khi ở Table mode) */}
            {viewMode === 'TABLE' && (
              <select
                className="opp-select-filter"
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                id="select-filter-stage"
              >
                <option value="ALL">Tất cả giai đoạn</option>
                {stages.map((stg) => (
                  <option key={stg.id} value={stg.id}>
                    {stg.name} ({stg.win_probability}%)
                  </option>
                ))}
              </select>
            )}

            {/* Lọc Nguồn */}
            <select
              className="opp-select-filter"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              id="select-filter-source"
            >
              <option value="ALL">Tất cả nguồn</option>
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>

            {/* Lọc Trạng thái */}
            <select
              className="opp-select-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              id="select-filter-status"
              title="Lọc theo trạng thái"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Đang theo đuổi (Open)</option>
              <option value="WON">Chốt thành công (Won)</option>
              <option value="LOST">Thất bại (Lost)</option>
            </select>
          </div>
        </div>

        {/* ── 4. Main View Content ── */}
        {isLoading ? (
          <div className="opp-loading-box">
            <div className="opp-spinner" />
            <span>Đang tải danh sách cơ hội bán hàng...</span>
          </div>
        ) : filteredOpportunities.length === 0 && viewMode === 'TABLE' ? (
          <div className="opp-empty-state">
            <div className="opp-empty-icon">💼</div>
            <h4>Không tìm thấy cơ hội bán hàng nào phù hợp</h4>
            <p>
              Hãy thử điều chỉnh bộ lọc hoặc tạo mới cơ hội bán hàng đầu tiên để theo dõi tiến độ thương lượng.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenCreateModal()}
              style={{ marginTop: '14px' }}
            >
              <IconPlus />
              <span>Tạo cơ hội bán hàng</span>
            </button>
          </div>
        ) : viewMode === 'KANBAN' ? (
          /* ─────────────────────────────────────────────────────────────
              VIEW CHẾ ĐỘ: BẢNG PIPELINE DẠNG KANBAN (S5-02)
              ───────────────────────────────────────────────────────────── */
          <div className="opp-kanban-board" id="pipeline-kanban-board">
            {kanbanColumnsData.map(({ stage, opportunities: colOpps, count, totalRevenue }) => {
              const stageColor = stage.color || '#2563eb'
              const isDragTarget = dragOverStageId === stage.id

              return (
                <div
                  key={stage.id}
                  className={`opp-kanban-column ${isDragTarget ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  id={`kanban-column-${stage.id}`}
                >
                  {/* Column Header: Tên giai đoạn, số lượng, tổng giá trị (AC S5-02) */}
                  <div className="opp-column-header" style={{ borderTopColor: stageColor }}>
                    <div className="opp-column-header-top">
                      <h4 className="stage-title">{stage.name}</h4>
                      <span
                        className="stage-win-badge"
                        style={{
                          backgroundColor: `${stageColor}18`,
                          color: stageColor,
                          border: `1px solid ${stageColor}40`,
                        }}
                      >
                        {stage.win_probability}%
                      </span>
                    </div>

                    <div className="opp-column-header-meta">
                      <span className="opp-count-badge">
                        <strong>{count}</strong> cơ hội
                      </span>
                      <span className="opp-total-val" title="Tổng giá trị các cơ hội trong giai đoạn này">
                        {totalRevenue.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Danh sách thẻ trong cột */}
                  <div className="opp-column-cards">
                    {colOpps.length === 0 ? (
                      <div className="kanban-empty-dropzone">
                        <span>Kéo thẻ vào đây hoặc</span>
                        <button
                          type="button"
                          className="btn-quick-add-col"
                          onClick={() => handleOpenCreateModal(stage.id)}
                        >
                          + Thêm cơ hội
                        </button>
                      </div>
                    ) : (
                      colOpps.map((opp) => {
                        const isClosed = opp.status === 'WON' || opp.status === 'LOST'
                        const isPastDue = !isClosed && opp.expected_close_date < todayStr
                        const isDragging = draggedOppId === opp.id

                        return (
                          <div
                            key={opp.id}
                            className={`opp-kanban-card ${isDragging ? 'is-dragging' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, opp.id)}
                            id={`kanban-card-${opp.id}`}
                          >
                            {/* Card Header: Code & Source */}
                            <div className="opp-card-top">
                              <span className="card-code-tag">{opp.code}</span>
                              <span className="card-source-tag">{opp.source}</span>
                            </div>

                            {/* Tên cơ hội */}
                            <h5 className="card-title" title={opp.title}>
                              {opp.title}
                            </h5>

                            {/* Khách hàng & Người liên hệ */}
                            <div className="card-customer-row">
                              <span className="cust-name" title={opp.customer_name}>
                                🏢 {opp.customer_name}
                              </span>
                              {opp.contact_name && (
                                <span className="contact-name" title={`Người liên hệ: ${opp.contact_name}`}>
                                  👤 {opp.contact_name}
                                </span>
                              )}
                            </div>

                            {/* Giá trị dự kiến */}
                            <div className="card-revenue-row">
                              <span className="revenue-lbl">Giá trị:</span>
                              <strong className="revenue-num">
                                {opp.expected_revenue.toLocaleString('vi-VN')} đ
                              </strong>
                            </div>

                            {/* Hạn chốt & Phụ trách */}
                            <div className="card-footer-meta">
                              <div
                                className={`card-date-badge ${isPastDue ? 'overdue' : ''}`}
                                title={isPastDue ? 'Cơ hội đã quá ngày dự kiến chốt!' : 'Ngày dự kiến chốt'}
                              >
                                <IconCalendar />
                                <span>{new Date(opp.expected_close_date).toLocaleDateString('vi-VN')}</span>
                                {isPastDue && <span className="text-danger-star">*</span>}
                              </div>

                              <div className="card-owner-tag" title={`Phụ trách: ${opp.owner_name} (${opp.team_name || ''})`}>
                                <span className="owner-avatar">
                                  {opp.owner_name?.slice(0, 1) || 'A'}
                                </span>
                                <span className="owner-name-short">
                                  {opp.owner_name?.split(' ').pop()}
                                </span>
                              </div>
                            </div>

                            {/* Thao tác chuyển giai đoạn & Sửa/Xóa (AC S5-02) */}
                            <div className="card-quick-actions">
                              <div className="stage-step-buttons">
                                <button
                                  type="button"
                                  className="btn-card-step"
                                  title="Lùi về giai đoạn trước"
                                  onClick={() => handleStepStage(opp, 'PREV')}
                                >
                                  <IconArrowLeft />
                                </button>
                                <button
                                  type="button"
                                  className="btn-card-step"
                                  title="Chuyển sang giai đoạn kế tiếp"
                                  onClick={() => handleStepStage(opp, 'NEXT')}
                                >
                                  <IconArrowRight />
                                </button>
                              </div>

                              <div className="card-edit-cluster">
                                <button
                                  type="button"
                                  className="btn-card-mini edit"
                                  title="Chỉnh sửa thông tin cơ hội"
                                  onClick={() => handleOpenEditModal(opp)}
                                >
                                  <IconEdit />
                                </button>
                                <button
                                  type="button"
                                  className="btn-card-mini delete"
                                  title="Xóa cơ hội"
                                  onClick={() => setDeletingOpp(opp)}
                                >
                                  <IconTrash />
                                </button>
                              </div>
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
        ) : (
          /* ─────────────────────────────────────────────────────────────
              VIEW CHẾ ĐỘ: DANH SÁCH BẢNG (TABLE VIEW - S5-01)
              ───────────────────────────────────────────────────────────── */
          <div className="opp-table-responsive">
            <table className="opp-data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Mã CH</th>
                  <th>Tên cơ hội & Khách hàng</th>
                  <th style={{ width: '170px' }}>Người liên hệ</th>
                  <th style={{ width: '200px' }}>Giai đoạn & Xác suất</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Giá trị dự kiến</th>
                  <th style={{ width: '150px' }}>Ngày dự kiến chốt</th>
                  <th style={{ width: '150px' }}>Nguồn & Phụ trách</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opp) => {
                  const stageObj = stages.find((s) => s.id === opp.stage_id)
                  const stageColor = stageObj?.color || opp.stage_color || '#2563eb'
                  const isClosed = opp.status === 'WON' || opp.status === 'LOST'
                  const isPastDue = !isClosed && opp.expected_close_date < todayStr

                  return (
                    <tr key={opp.id} id={`opportunity-row-${opp.id}`}>
                      <td>
                        <span className="opp-code-tag">{opp.code}</span>
                      </td>

                      <td>
                        <div className="opp-info-cell">
                          <strong className="opp-title">{opp.title}</strong>
                          <span className="opp-customer-name">🏢 {opp.customer_name}</span>
                        </div>
                      </td>

                      <td>
                        <div className="opp-contact-cell">
                          {opp.contact_name ? (
                            <>
                              <span className="contact-person">👤 {opp.contact_name}</span>
                              {opp.contact_phone && (
                                <span className="contact-sub">📞 {opp.contact_phone}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="opp-stage-cell">
                          <div className="stage-badge-row">
                            <span
                              className="opp-stage-badge"
                              style={{
                                backgroundColor: `${stageColor}18`,
                                color: stageColor,
                                borderColor: `${stageColor}40`,
                              }}
                            >
                              {opp.stage_name}
                            </span>
                            <span className="win-prob-tag">{opp.win_probability}%</span>
                          </div>
                          <div className="opp-prob-track">
                            <div
                              className="opp-prob-bar"
                              style={{
                                width: `${opp.win_probability}%`,
                                backgroundColor: stageColor,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span className="opp-revenue-num">
                          {opp.expected_revenue.toLocaleString('vi-VN')} đ
                        </span>
                      </td>

                      <td>
                        <div className={`opp-date-cell ${isPastDue ? 'past-due' : ''}`}>
                          <IconCalendar />
                          <span>{new Date(opp.expected_close_date).toLocaleDateString('vi-VN')}</span>
                          {isPastDue && (
                            <span className="badge-due-warning" title="Đã quá ngày dự kiến chốt">
                              Quá hạn
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="opp-source-owner-cell">
                          <span className="opp-source-tag">{opp.source}</span>
                          <span className="opp-owner-sub">👤 {opp.owner_name}</span>
                        </div>
                      </td>

                      <td>
                        <div className="opp-actions-cluster">
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleOpenEditModal(opp)}
                            title="Chỉnh sửa thông tin cơ hội"
                            id={`btn-edit-opp-${opp.id}`}
                          >
                            <IconEdit />
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => setDeletingOpp(opp)}
                            title="Xóa cơ hội bán hàng"
                            id={`btn-delete-opp-${opp.id}`}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TẠO MỚI / CHỈNH SỬA CƠ HỘI BÁN HÀNG (S5-01 & S5-02)
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="opp-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="opp-modal-content"
            style={{ maxWidth: '680px' }}
            onClick={(e) => e.stopPropagation()}
            id="modal-opportunity-form"
          >
            <div className="opp-modal-header">
              <h3>{editingOpp ? 'Chỉnh sửa Cơ hội bán hàng' : 'Thêm mới Cơ hội bán hàng'}</h3>
              <button
                type="button"
                className="opp-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity}>
              <div className="opp-modal-body">
                {/* 1. Tên cơ hội */}
                <div className="opp-modal-field">
                  <label htmlFor="opp-form-title">
                    Tên cơ hội bán hàng <span className="required-star">*</span>
                  </label>
                  <input
                    id="opp-form-title"
                    type="text"
                    className={`opp-modal-input ${formErrors.title ? 'has-error' : ''}`}
                    placeholder="Ví dụ: Triển khai phần mềm CRM cho AlphaTech..."
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      if (formErrors.title) setFormErrors({ ...formErrors, title: '' })
                    }}
                  />
                  {formErrors.title && (
                    <span className="opp-modal-field-error">{formErrors.title}</span>
                  )}
                </div>

                {/* 2. Khách hàng & Người liên hệ */}
                <div className="opp-modal-grid-2">
                  <div className="opp-modal-field">
                    <label htmlFor="opp-form-customer">
                      Khách hàng doanh nghiệp <span className="required-star">*</span>
                    </label>
                    <select
                      id="opp-form-customer"
                      className={`opp-modal-input ${formErrors.customer_id ? 'has-error' : ''}`}
                      value={formData.customer_id}
                      onChange={(e) => {
                        const selId = e.target.value
                        const cust = customers.find((c) => c.id === selId)
                        setFormData({
                          ...formData,
                          customer_id: selId,
                          customer_name: cust?.name || '',
                        })
                        if (formErrors.customer_id) setFormErrors({ ...formErrors, customer_id: '' })
                      }}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {formErrors.customer_id && (
                      <span className="opp-modal-field-error">{formErrors.customer_id}</span>
                    )}
                  </div>

                  <div className="opp-modal-field">
                    <label htmlFor="opp-form-contact">Người liên hệ chính</label>
                    <select
                      id="opp-form-contact"
                      className="opp-modal-input"
                      value={formData.contact_id || ''}
                      onChange={(e) => {
                        const ctId = e.target.value
                        const ct = availableContacts.find((c) => c.id === ctId)
                        setFormData({
                          ...formData,
                          contact_id: ctId,
                          contact_name: ct?.full_name || '',
                        })
                      }}
                      disabled={!formData.customer_id}
                    >
                      <option value="">
                        {formData.customer_id
                          ? availableContacts.length > 0
                            ? '-- Chọn người liên hệ --'
                            : 'Không có người liên hệ nào (Mặc định)'
                          : 'Vui lòng chọn khách hàng trước'}
                      </option>
                      {availableContacts.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.full_name} ({ct.title || 'Liên hệ'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Giai đoạn & Xác suất thắng */}
                <div className="opp-modal-grid-2">
                  <div className="opp-modal-field">
                    <label htmlFor="opp-form-stage">
                      Giai đoạn Pipeline <span className="required-star">*</span>
                    </label>
                    <select
                      id="opp-form-stage"
                      className={`opp-modal-input ${formErrors.stage_id ? 'has-error' : ''}`}
                      value={formData.stage_id}
                      onChange={(e) => {
                        setFormData({ ...formData, stage_id: e.target.value })
                        if (formErrors.stage_id) setFormErrors({ ...formErrors, stage_id: '' })
                      }}
                    >
                      <option value="">-- Chọn giai đoạn --</option>
                      {stages.map((stg) => (
                        <option key={stg.id} value={stg.id}>
                          {stg.order}. {stg.name} (Xác suất {stg.win_probability}%)
                        </option>
                      ))}
                    </select>
                    {formErrors.stage_id && (
                      <span className="opp-modal-field-error">{formErrors.stage_id}</span>
                    )}
                  </div>

                  <div className="opp-modal-field">
                    <label htmlFor="opp-form-source">Nguồn cơ hội</label>
                    <select
                      id="opp-form-source"
                      className="opp-modal-input"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      {sources.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Giá trị dự kiến & Ngày dự kiến chốt */}
                <div className="opp-modal-grid-2">
                  <div className="opp-modal-field">
                    <label htmlFor="opp-form-revenue">
                      Giá trị dự kiến (VNĐ) <span className="required-star">*</span>
                    </label>
                    <input
                      id="opp-form-revenue"
                      type="number"
                      min={0}
                      step={1000000}
                      className={`opp-modal-input ${formErrors.expected_revenue ? 'has-error' : ''}`}
                      placeholder="50000000"
                      value={formData.expected_revenue}
                      onChange={(e) => {
                        setFormData({ ...formData, expected_revenue: Number(e.target.value) })
                        if (formErrors.expected_revenue)
                          setFormErrors({ ...formErrors, expected_revenue: '' })
                      }}
                    />
                    {formErrors.expected_revenue && (
                      <span className="opp-modal-field-error">{formErrors.expected_revenue}</span>
                    )}
                  </div>

                  <div className="opp-modal-field">
                    <label htmlFor="opp-form-close-date">
                      Ngày dự kiến chốt <span className="required-star">*</span>
                    </label>
                    {/* AC S5-01: Không cho chọn ngày chốt trong quá khứ */}
                    <input
                      id="opp-form-close-date"
                      type="date"
                      min={todayStr}
                      className={`opp-modal-input ${formErrors.expected_close_date ? 'has-error' : ''}`}
                      value={formData.expected_close_date}
                      onChange={(e) => {
                        setFormData({ ...formData, expected_close_date: e.target.value })
                        if (formErrors.expected_close_date)
                          setFormErrors({ ...formErrors, expected_close_date: '' })
                      }}
                    />
                    {formErrors.expected_close_date ? (
                      <span className="opp-modal-field-error">
                        {formErrors.expected_close_date}
                      </span>
                    ) : (
                      <span className="opp-modal-field-hint">
                        Chỉ cho phép chọn từ ngày hôm nay ({new Date().toLocaleDateString('vi-VN')}) trở đi.
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Ghi chú & Nhu cầu khách hàng */}
                <div className="opp-modal-field">
                  <label htmlFor="opp-form-desc">Mô tả chi tiết & Kế hoạch theo đuổi</label>
                  <textarea
                    id="opp-form-desc"
                    rows={3}
                    className="opp-modal-textarea"
                    placeholder="Ghi chú về bài toán của khách, đối thủ cạnh tranh, hoặc mốc thời gian tiếp theo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="opp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  id="btn-submit-opp"
                >
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingOpp
                    ? 'Lưu thay đổi'
                    : 'Tạo cơ hội bán hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Xác nhận Xóa Cơ hội ── */}
      {deletingOpp && (
        <div className="opp-modal-backdrop" onClick={() => setDeletingOpp(null)}>
          <div
            className="opp-modal-content"
            style={{ maxWidth: '450px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="opp-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <IconAlertCircle />
                <h3 style={{ margin: 0, color: '#dc2626' }}>Xác nhận xóa cơ hội</h3>
              </div>
              <button
                type="button"
                className="opp-modal-close-btn"
                onClick={() => setDeletingOpp(null)}
              >
                &times;
              </button>
            </div>
            <div className="opp-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa cơ hội <strong>{deletingOpp.title}</strong> (
                {deletingOpp.code}) của khách hàng <strong>{deletingOpp.customer_name}</strong> không?
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="opp-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingOpp(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteOpportunity}
                id="btn-confirm-delete-opp"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast && (
        <div className={`opp-toast ${toast.isError ? 'error' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
