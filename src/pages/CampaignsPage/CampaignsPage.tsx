import React, { useState, useEffect, useMemo } from 'react'
import { campaignService } from '../../services/campaignService.ts'
import type {
  Campaign,
  CampaignChannel,
  CampaignStatus,
  CreateCampaignPayload,
  CampaignSummaryStats,
} from '../../types/campaign.ts'
import type { Lead } from '../../types/lead.ts'
import './CampaignsPage.css'

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

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

/* ──────────── Cấu hình Kênh và Trạng thái ──────────── */
const CHANNEL_CONFIG: Record<
  CampaignChannel,
  { label: string; bg: string; color: string }
> = {
  FACEBOOK: { label: 'Facebook Ads', bg: '#eff6ff', color: '#1d4ed8' },
  GOOGLE: { label: 'Google Search Ads', bg: '#fef2f2', color: '#dc2626' },
  EMAIL: { label: 'Email Marketing', bg: '#f0fdf4', color: '#16a34a' },
  EVENT: { label: 'Hội thảo / Triển lãm', bg: '#fdf4ff', color: '#c026d3' },
  WEBSITE: { label: 'Website Organic', bg: '#f0f9ff', color: '#0284c7' },
  TIKTOK: { label: 'TikTok Ads', bg: '#f8fafc', color: '#0f172a' },
  LINKEDIN: { label: 'LinkedIn B2B', bg: '#e0f2fe', color: '#0369a1' },
  OTHER: { label: 'Kênh khác', bg: '#f1f5f9', color: '#475569' },
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  PLANNING: { label: 'Lên kế hoạch', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
  ACTIVE: { label: 'Đang chạy', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  COMPLETED: { label: 'Đã hoàn thành', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  PAUSED: { label: 'Tạm dừng', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<CampaignSummaryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('')
  const [filterChannel, setFilterChannel] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Modal Tạo / Sửa Chiến dịch
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState<CreateCampaignPayload>({
    name: '',
    channel: 'FACEBOOK',
    budget: 20000000,
    actual_cost: 0,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: 'ACTIVE',
    target_leads: 50,
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal Xem Lead theo Campaign (S4-03 Drilldown)
  const [selectedCampaignForLeads, setSelectedCampaignForLeads] = useState<Campaign | null>(null)
  const [campaignLeads, setCampaignLeads] = useState<Lead[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  const [leadModalSearch, setLeadModalSearch] = useState('')

  // Modal Xóa
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 3200)
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [list, summary] = await Promise.all([
        campaignService.getCampaigns(),
        campaignService.getCampaignStats(),
      ])
      setCampaigns(list)
      setStats(summary)
    } catch {
      showToast('Lỗi khi tải dữ liệu chiến dịch', true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Lọc danh sách chiến dịch
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchChannel = filterChannel === 'ALL' || c.channel === filterChannel
      const matchStatus = filterStatus === 'ALL' || c.status === filterStatus
      return matchSearch && matchChannel && matchStatus
    })
  }, [campaigns, searchQuery, filterChannel, filterStatus])

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingCampaign(null)
    setFormData({
      name: '',
      channel: 'FACEBOOK',
      budget: 20000000,
      actual_cost: 0,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      target_leads: 50,
      description: '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Mở modal sửa
  const handleOpenEditModal = (c: Campaign) => {
    setEditingCampaign(c)
    setFormData({
      name: c.name,
      channel: c.channel,
      budget: c.budget,
      actual_cost: c.actual_cost,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      target_leads: c.target_leads,
      description: c.description || '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Lưu chiến dịch
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên chiến dịch'
    if (formData.budget <= 0) errs.budget = 'Ngân sách phải lớn hơn 0'
    if (!formData.start_date) errs.start_date = 'Vui lòng chọn ngày bắt đầu'
    if (!formData.end_date) errs.end_date = 'Vui lòng chọn ngày kết thúc'
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errs.end_date = 'Ngày kết thúc phải sau ngày bắt đầu'
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    try {
      setIsSubmitting(true)
      if (editingCampaign) {
        const updated = await campaignService.updateCampaign(editingCampaign.id, formData)
        setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        showToast(`Đã cập nhật chiến dịch "${updated.name}"`)
      } else {
        const created = await campaignService.createCampaign(formData)
        setCampaigns((prev) => [created, ...prev])
        showToast(`Đã tạo chiến dịch "${created.name}" (${created.code})`)
      }
      const newStats = await campaignService.getCampaignStats()
      setStats(newStats)
      setIsModalOpen(false)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu chiến dịch', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xóa chiến dịch
  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return
    try {
      await campaignService.deleteCampaign(deletingCampaign.id)
      setCampaigns((prev) => prev.filter((c) => c.id !== deletingCampaign.id))
      showToast(`Đã xóa chiến dịch "${deletingCampaign.name}"`)
      setDeletingCampaign(null)
      const newStats = await campaignService.getCampaignStats()
      setStats(newStats)
    } catch {
      showToast('Không thể xóa chiến dịch', true)
    }
  }

  // Mở modal Xem Leads theo Campaign
  const handleOpenLeadsModal = async (c: Campaign) => {
    setSelectedCampaignForLeads(c)
    setCampaignLeads([])
    setLeadModalSearch('')
    setIsLoadingLeads(true)
    try {
      const leads = await campaignService.getLeadsByCampaign(c.id)
      setCampaignLeads(leads)
    } catch {
      showToast('Lỗi khi tải danh sách Lead của chiến dịch', true)
    } finally {
      setIsLoadingLeads(false)
    }
  }

  // Lọc lead trong modal
  const filteredModalLeads = useMemo(() => {
    return campaignLeads.filter((l) => {
      const q = leadModalSearch.toLowerCase()
      return (
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.company.toLowerCase().includes(q)
      )
    })
  }, [campaignLeads, leadModalSearch])

  return (
    <div className="campaigns-page-container">
      {/* ── 1. Page Header ── */}
      <div className="campaign-page-header">
        <div className="campaign-header-info">
          <h1 className="campaign-page-title">Quản lý Chiến dịch & Theo dõi Lead</h1>
          <p className="campaign-page-subtitle">
            Theo dõi ngân sách, kênh tiếp thị, số lượng Lead và tỷ lệ chuyển đổi khách hàng theo từng chiến dịch (S4-03).
          </p>
        </div>

        <div className="campaign-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            id="btn-create-campaign"
          >
            <IconPlus />
            <span>Tạo chiến dịch mới</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stat Summary Cards (Thống kê Backend & Tính toán) ── */}
      <div className="campaign-stats-grid">
        <div className="campaign-stat-card">
          <div className="campaign-stat-content">
            <span className="campaign-stat-value">{stats?.total_campaigns ?? 0}</span>
            <span className="campaign-stat-label">
              Tổng số chiến dịch ({stats?.active_campaigns ?? 0} đang chạy)
            </span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="campaign-stat-content">
            <span className="campaign-stat-value" style={{ color: '#047857' }}>
              {(stats?.total_budget ?? 0).toLocaleString('vi-VN')} đ
            </span>
            <span className="campaign-stat-label">
              Tổng ngân sách phân bổ ({((((stats?.total_actual_cost ?? 0) / (stats?.total_budget || 1)) * 100).toFixed(0))}% đã tiêu)
            </span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="campaign-stat-content">
            <span className="campaign-stat-value" style={{ color: '#2563eb' }}>
              {stats?.total_leads ?? 0} Leads
            </span>
            <span className="campaign-stat-label">
              Tổng Lead thu về ({stats?.total_converted ?? 0} chuyển đổi thành công)
            </span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="campaign-stat-content">
            <span className="campaign-stat-value" style={{ color: '#d97706' }}>
              {(stats?.average_cpl ?? 0).toLocaleString('vi-VN')} đ
            </span>
            <span className="campaign-stat-label">
              Chi phí / Lead (CPL) — Tỷ lệ CĐ: {stats?.conversion_rate ?? 0}%
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Controls & Filter Bar ── */}
      <div className="campaign-card-panel">
        <div className="campaign-panel-controls">
          <div className="campaign-search-box">
            <IconSearch />
            <input
              type="text"
              placeholder="Tìm theo tên chiến dịch hoặc mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="campaign-filters-group">
            <select
              className="campaign-select-filter"
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              <option value="ALL">Tất cả kênh tiếp thị</option>
              <option value="FACEBOOK">Facebook Ads</option>
              <option value="GOOGLE">Google Search Ads</option>
              <option value="EMAIL">Email Marketing</option>
              <option value="EVENT">Hội thảo / Sự kiện</option>
              <option value="WEBSITE">Website Organic</option>
              <option value="OTHER">Kênh khác</option>
            </select>

            <select
              className="campaign-select-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="PLANNING">Lên kế hoạch</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="PAUSED">Tạm dừng</option>
            </select>
          </div>
        </div>

        {/* ── 4. Bảng danh sách Chiến dịch ── */}
        {isLoading ? (
          <div className="campaign-loading-box">
            <div className="campaign-spinner" />
            <span>Đang tải danh sách chiến dịch...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="campaign-empty-state">
            <div className="campaign-empty-icon">📢</div>
            <h4>Không tìm thấy chiến dịch nào</h4>
            <p>Tạo chiến dịch tiếp thị mới để phân bổ ngân sách và theo dõi nguồn khách hàng tiềm năng.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
              style={{ marginTop: '12px' }}
            >
              <IconPlus />
              <span>Tạo chiến dịch đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="campaign-table-responsive">
            <table className="campaign-data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Mã CD</th>
                  <th>Tên chiến dịch & Kênh</th>
                  <th style={{ width: '180px' }}>Ngân sách & Chi phí</th>
                  <th style={{ width: '180px' }}>Thời gian thực hiện</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Hiệu quả Lead</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((camp) => {
                  const channelCfg = CHANNEL_CONFIG[camp.channel] || CHANNEL_CONFIG.OTHER
                  const statusCfg = STATUS_CONFIG[camp.status] || STATUS_CONFIG.PLANNING
                  const costPct = camp.budget > 0 ? Math.min(100, Math.round((camp.actual_cost / camp.budget) * 100)) : 0

                  return (
                    <tr key={camp.id} id={`campaign-row-${camp.id}`}>
                      <td>
                        <span className="camp-code-tag">{camp.code}</span>
                      </td>

                      <td>
                        <div className="camp-info-cell">
                          <strong className="camp-name">{camp.name}</strong>
                          <div className="camp-channel-badge" style={{ backgroundColor: channelCfg.bg, color: channelCfg.color }}>
                            {channelCfg.label}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="camp-budget-cell">
                          <div className="budget-row">
                            <span className="cost-num">{camp.actual_cost.toLocaleString('vi-VN')} đ</span>
                            <span className="budget-target">/ {camp.budget.toLocaleString('vi-VN')} đ</span>
                          </div>
                          {/* Progress bar */}
                          <div className="camp-progress-track" title={`Đã dùng ${costPct}% ngân sách`}>
                            <div
                              className="camp-progress-bar"
                              style={{
                                width: `${costPct}%`,
                                backgroundColor: costPct > 90 ? '#ef4444' : costPct > 60 ? '#f59e0b' : '#10b981',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="camp-date-cell">
                          <div className="date-item">
                            <IconCalendar />
                            <span>
                              {new Date(camp.start_date).toLocaleDateString('vi-VN')} -{' '}
                              {new Date(camp.end_date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="camp-lead-count-btn"
                          onClick={() => handleOpenLeadsModal(camp)}
                          title="Bấm để xem danh sách chi tiết các Lead thuộc chiến dịch này"
                        >
                          <IconUsers />
                          <strong>{camp.actual_leads} Leads</strong>
                          <span className="converted-sub">({camp.converted_leads} CĐ)</span>
                        </button>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="camp-status-badge"
                          style={{
                            backgroundColor: statusCfg.bg,
                            color: statusCfg.color,
                            border: `1px solid ${statusCfg.border}`,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      <td>
                        <div className="camp-actions-cluster">
                          {/* Xem Lead theo Campaign */}
                          <button
                            type="button"
                            className="btn-action-icon view-leads"
                            onClick={() => handleOpenLeadsModal(camp)}
                            title="Xem chi tiết các Lead thuộc chiến dịch"
                          >
                            <IconUsers />
                            <span>Leads</span>
                          </button>

                          {/* Sửa */}
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleOpenEditModal(camp)}
                            title="Chỉnh sửa thông tin chiến dịch"
                          >
                            <IconEdit />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => setDeletingCampaign(camp)}
                            title="Xóa chiến dịch"
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
          MODAL: TẠO / SỬA CHIẾN DỊCH (S4-03)
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="camp-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="camp-modal-content"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="camp-modal-header">
              <h3>{editingCampaign ? 'Chỉnh sửa Chiến dịch' : 'Tạo mới Chiến dịch Tiếp thị'}</h3>
              <button
                type="button"
                className="camp-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCampaign}>
              <div className="camp-modal-body">
                {/* Tên chiến dịch */}
                <div className="camp-modal-field">
                  <label>
                    Tên chiến dịch <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className={`camp-modal-input ${formErrors.name ? 'has-error' : ''}`}
                    placeholder="Ví dụ: Chiến dịch Q4 Chuyển đổi số Doanh nghiệp 2026"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                    }}
                  />
                  {formErrors.name && <span className="camp-modal-field-error">{formErrors.name}</span>}
                </div>

                {/* Kênh & Trạng thái */}
                <div className="camp-modal-grid-2">
                  <div className="camp-modal-field">
                    <label>Kênh tiếp thị (Channel)</label>
                    <select
                      className="camp-modal-input"
                      value={formData.channel}
                      onChange={(e) =>
                        setFormData({ ...formData, channel: e.target.value as CampaignChannel })
                      }
                    >
                      <option value="FACEBOOK">Facebook Ads</option>
                      <option value="GOOGLE">Google Search Ads</option>
                      <option value="EMAIL">Email Marketing</option>
                      <option value="EVENT">Hội thảo / Sự kiện</option>
                      <option value="WEBSITE">Website Organic</option>
                      <option value="TIKTOK">TikTok Ads</option>
                      <option value="LINKEDIN">LinkedIn B2B</option>
                      <option value="OTHER">Kênh khác</option>
                    </select>
                  </div>

                  <div className="camp-modal-field">
                    <label>Trạng thái chiến dịch</label>
                    <select
                      className="camp-modal-input"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as CampaignStatus })
                      }
                    >
                      <option value="PLANNING">Lên kế hoạch</option>
                      <option value="ACTIVE">Đang chạy (Kích hoạt)</option>
                      <option value="COMPLETED">Đã hoàn thành</option>
                      <option value="PAUSED">Tạm dừng</option>
                    </select>
                  </div>
                </div>

                {/* Ngân sách dự kiến & Chi phí thực tế */}
                <div className="camp-modal-grid-2">
                  <div className="camp-modal-field">
                    <label>
                      Ngân sách dự kiến (VNĐ) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000000}
                      className={`camp-modal-input ${formErrors.budget ? 'has-error' : ''}`}
                      placeholder="50000000"
                      value={formData.budget}
                      onChange={(e) => {
                        setFormData({ ...formData, budget: Number(e.target.value) })
                        if (formErrors.budget) setFormErrors({ ...formErrors, budget: '' })
                      }}
                    />
                    {formErrors.budget && (
                      <span className="camp-modal-field-error">{formErrors.budget}</span>
                    )}
                  </div>

                  <div className="camp-modal-field">
                    <label>Chi phí thực tế đã sử dụng (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      step={500000}
                      className="camp-modal-input"
                      placeholder="0"
                      value={formData.actual_cost}
                      onChange={(e) =>
                        setFormData({ ...formData, actual_cost: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                {/* Thời gian Bắt đầu & Kết thúc */}
                <div className="camp-modal-grid-2">
                  <div className="camp-modal-field">
                    <label>
                      Ngày bắt đầu <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className={`camp-modal-input ${formErrors.start_date ? 'has-error' : ''}`}
                      value={formData.start_date}
                      onChange={(e) => {
                        setFormData({ ...formData, start_date: e.target.value })
                        if (formErrors.start_date) setFormErrors({ ...formErrors, start_date: '' })
                      }}
                    />
                    {formErrors.start_date && (
                      <span className="camp-modal-field-error">{formErrors.start_date}</span>
                    )}
                  </div>

                  <div className="camp-modal-field">
                    <label>
                      Ngày kết thúc <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className={`camp-modal-input ${formErrors.end_date ? 'has-error' : ''}`}
                      value={formData.end_date}
                      onChange={(e) => {
                        setFormData({ ...formData, end_date: e.target.value })
                        if (formErrors.end_date) setFormErrors({ ...formErrors, end_date: '' })
                      }}
                    />
                    {formErrors.end_date && (
                      <span className="camp-modal-field-error">{formErrors.end_date}</span>
                    )}
                  </div>
                </div>

                {/* Mục tiêu số lượng Lead */}
                <div className="camp-modal-field">
                  <label>Mục tiêu số lượng Lead (Target Leads)</label>
                  <input
                    type="number"
                    min={0}
                    className="camp-modal-input"
                    placeholder="Ví dụ: 80"
                    value={formData.target_leads}
                    onChange={(e) =>
                      setFormData({ ...formData, target_leads: Number(e.target.value) })
                    }
                  />
                </div>

                {/* Mô tả / Mục tiêu */}
                <div className="camp-modal-field">
                  <label>Mô tả & Kế hoạch triển khai</label>
                  <textarea
                    rows={2}
                    className="camp-modal-textarea"
                    placeholder="Mục tiêu doanh thu, nhóm khách hàng mục tiêu hoặc thông điệp quảng cáo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="camp-modal-footer">
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
                >
                  {isSubmitting ? 'Đang lưu...' : editingCampaign ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: XEM LEAD THEO TỪNG CAMPAIGN (S4-03 DRILLDOWN)
          ───────────────────────────────────────────────────────────── */}
      {selectedCampaignForLeads && (
        <div
          className="camp-modal-backdrop"
          onClick={() => setSelectedCampaignForLeads(null)}
        >
          <div
            className="camp-modal-content"
            style={{ maxWidth: '880px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="camp-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '17px' }}>
                  Danh sách Lead Chiến dịch: {selectedCampaignForLeads.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Mã: <strong>{selectedCampaignForLeads.code}</strong> — Kênh:{' '}
                  <strong>{CHANNEL_CONFIG[selectedCampaignForLeads.channel]?.label}</strong>
                </span>
              </div>
              <button
                type="button"
                className="camp-modal-close-btn"
                onClick={() => setSelectedCampaignForLeads(null)}
              >
                &times;
              </button>
            </div>

            <div className="camp-modal-body">
              {/* Thống kê nhanh trong modal */}
              <div className="modal-lead-stats-bar">
                <div className="modal-metric">
                  <span className="lbl">Tổng Lead ghi nhận</span>
                  <span className="val">{campaignLeads.length}</span>
                </div>
                <div className="modal-metric">
                  <span className="lbl">Mới tiếp nhận</span>
                  <span className="val" style={{ color: '#d97706' }}>
                    {campaignLeads.filter((l) => l.status === 'NEW').length}
                  </span>
                </div>
                <div className="modal-metric">
                  <span className="lbl">Đủ tiêu chuẩn (BANT)</span>
                  <span className="val" style={{ color: '#047857' }}>
                    {campaignLeads.filter((l) => l.status === 'QUALIFIED').length}
                  </span>
                </div>
                <div className="modal-metric">
                  <span className="lbl">Đã chuyển đổi</span>
                  <span className="val" style={{ color: '#2563eb' }}>
                    {campaignLeads.filter((l) => l.status === 'CONVERTED').length}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-export-modal"
                  onClick={() =>
                    campaignService.exportCampaignLeadsToExcel(
                      selectedCampaignForLeads,
                      campaignLeads
                    )
                  }
                  title="Xuất danh sách Lead này ra file Excel"
                >
                  <IconDownload />
                  <span>Xuất Excel</span>
                </button>
              </div>

              {/* Ô tìm kiếm trong modal */}
              <div className="modal-search-box">
                <IconSearch />
                <input
                  type="text"
                  placeholder="Tìm kiếm Lead trong chiến dịch này..."
                  value={leadModalSearch}
                  onChange={(e) => setLeadModalSearch(e.target.value)}
                />
              </div>

              {/* Table Leads */}
              {isLoadingLeads ? (
                <div className="campaign-loading-box">
                  <div className="campaign-spinner" />
                  <span>Đang tải danh sách Lead...</span>
                </div>
              ) : filteredModalLeads.length === 0 ? (
                <div className="campaign-empty-state" style={{ padding: '32px 16px' }}>
                  <div className="campaign-empty-icon">👥</div>
                  <h4>Chưa có Lead nào thuộc chiến dịch này</h4>
                  <p>Khi khách hàng đăng ký qua biểu mẫu hoặc nhân viên gán lead vào chiến dịch này, dữ liệu sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div className="lead-table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="lead-data-table">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Họ và tên</th>
                        <th>Số điện thoại & Email</th>
                        <th>Doanh nghiệp</th>
                        <th>Nhu cầu</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th>Ngày nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModalLeads.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <span className="camp-code-tag">{l.code}</span>
                          </td>
                          <td>
                            <strong>{l.full_name}</strong>
                          </td>
                          <td>
                            <div style={{ fontSize: '12.5px' }}>
                              <div>📞 {l.phone}</div>
                              <div style={{ color: '#64748b' }}>✉️ {l.email}</div>
                            </div>
                          </td>
                          <td>{l.company || '—'}</td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#475569' }}>
                              {l.requirement || '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="camp-status-badge active" style={{ fontSize: '11px' }}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {new Date(l.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="camp-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedCampaignForLeads(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Xác nhận Xóa Chiến dịch ── */}
      {deletingCampaign && (
        <div className="camp-modal-backdrop" onClick={() => setDeletingCampaign(null)}>
          <div
            className="camp-modal-content"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="camp-modal-header">
              <h3>Xác nhận xóa chiến dịch</h3>
              <button
                type="button"
                className="camp-modal-close-btn"
                onClick={() => setDeletingCampaign(null)}
              >
                &times;
              </button>
            </div>
            <div className="camp-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa chiến dịch <strong>{deletingCampaign.name}</strong> ({deletingCampaign.code}) không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="camp-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingCampaign(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteCampaign}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast && (
        <div className={`camp-toast ${toast.isError ? 'error' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
