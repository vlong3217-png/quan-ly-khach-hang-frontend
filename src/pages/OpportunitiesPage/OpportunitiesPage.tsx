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
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function OpportunitiesPage() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

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

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('ALL')
  const [filterSource, setFilterSource] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

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
      // Nếu contact hiện tại không thuộc khách hàng mới, reset
      if (formData.contact_id && !contacts.some((c) => c.id === formData.contact_id)) {
        setFormData((prev) => ({ ...prev, contact_id: '', contact_name: '' }))
      }
    } else {
      setAvailableContacts([])
    }
  }, [formData.customer_id])

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingOpp(null)
    const defaultStage = stages[0]?.id || 'stage-1'
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
      // AC S5-01: Không cho chọn ngày chốt trong quá khứ
      errors.expected_close_date = 'Ngày dự kiến chốt không được là ngày trong quá khứ'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Lưu cơ hội (Tạo mới hoặc Cập nhật)
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
      // Tải lại dữ liệu
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

  // Lọc danh sách hiển thị
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Tìm kiếm text
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchTitle = opp.title.toLowerCase().includes(q)
        const matchCode = opp.code.toLowerCase().includes(q)
        const matchCust = opp.customer_name.toLowerCase().includes(q)
        const matchContact = opp.contact_name ? opp.contact_name.toLowerCase().includes(q) : false
        if (!matchTitle && !matchCode && !matchCust && !matchContact) return false
      }
      // Giai đoạn
      if (filterStage !== 'ALL' && opp.stage_id !== filterStage) return false
      // Nguồn
      if (filterSource !== 'ALL' && opp.source !== filterSource) return false
      // Trạng thái
      if (filterStatus !== 'ALL' && opp.status !== filterStatus) return false

      return true
    })
  }, [opportunities, searchQuery, filterStage, filterSource, filterStatus])

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
          <h2>Quản lý Cơ hội bán hàng (Opportunities)</h2>
          <p>Tạo, theo dõi các thương vụ tiềm năng, dự báo doanh thu và quản lý tiến độ đàm phán</p>
        </div>
        <div className="opp-header-actions">
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
            onClick={handleOpenCreateModal}
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

      {/* ── 3. Panel & Search Filters ── */}
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
            {/* Lọc Giai đoạn */}
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

            {/* Lọc Nguồn */}
            <select
              className="opp-select-filter"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              id="select-filter-source"
            >
              <option value="ALL">Tất cả nguồn cơ hội</option>
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
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Đang theo đuổi (Open)</option>
              <option value="WON">Chốt thành công (Won)</option>
              <option value="LOST">Thất bại (Lost)</option>
            </select>
          </div>
        </div>

        {/* ── 4. Table Danh sách cơ hội ── */}
        {isLoading ? (
          <div className="opp-loading-box">
            <div className="opp-spinner" />
            <span>Đang tải danh sách cơ hội bán hàng...</span>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="opp-empty-state">
            <div className="opp-empty-icon">💼</div>
            <h4>Không tìm thấy cơ hội bán hàng nào</h4>
            <p>
              Hãy tạo mới cơ hội bán hàng đầu tiên để theo dõi tiến độ thương lượng và dự báo doanh số.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
              style={{ marginTop: '14px' }}
            >
              <IconPlus />
              <span>Tạo cơ hội bán hàng</span>
            </button>
          </div>
        ) : (
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
                  <th style={{ width: '150px' }}>Nguồn</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opp) => {
                  const stageObj = stages.find((s) => s.id === opp.stage_id)
                  const stageColor = stageObj?.color || opp.stage_color || '#2563eb'
                  const isClosed = opp.status === 'WON' || opp.status === 'LOST'

                  // Kiểm tra hạn chốt
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
                          {/* Progress bar xác suất thắng */}
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
                        <span className="opp-source-tag">{opp.source}</span>
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
          MODAL: TẠO MỚI / CHỈNH SỬA CƠ HỘI BÁN HÀNG (S5-01)
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
