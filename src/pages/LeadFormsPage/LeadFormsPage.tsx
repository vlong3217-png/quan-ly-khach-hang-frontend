import React, { useState, useEffect, useMemo } from 'react'
import { leadFormService } from '../../services/leadFormService.ts'
import type {
  LeadForm,
  LeadSubmission,
  CreateLeadFormPayload,
  LeadSubmissionStatus,
} from '../../types/leadForm.ts'
import './LeadFormsPage.css'

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

const IconCode = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
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

const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconExternalLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

/* ──────────── Trạng thái Lead ──────────── */
const SUBMISSION_STATUS_CONFIG: Record<
  LeadSubmissionStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  NEW: { label: 'Mới tiếp nhận', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CONTACTED: { label: 'Đã liên hệ', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  QUALIFIED: { label: 'Đủ điều kiện', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  CONVERTED: { label: 'Đã chuyển đổi', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  SPAM: { label: 'Rác / Sai số', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
}

export default function LeadFormsPage() {
  const [activeTab, setActiveTab] = useState<'FORMS' | 'SUBMISSIONS'>('FORMS')
  const [forms, setForms] = useState<LeadForm[]>([])
  const [submissions, setSubmissions] = useState<LeadSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  // Bộ lọc danh sách form
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Bộ lọc submissions
  const [subSearchQuery, setSubSearchQuery] = useState('')
  const [subFormFilter, setSubFormFilter] = useState<string>('ALL')
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL')

  // Modal tạo / sửa Form
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null)
  const [formFormData, setFormFormData] = useState<CreateLeadFormPayload>({
    name: '',
    title: '',
    description: '',
    submit_button_text: 'Đăng ký nhận tư vấn ngay',
    success_message: 'Cảm ơn bạn đã đăng ký! Chuyên viên tư vấn sẽ liên hệ lại trong ít phút.',
    redirect_url: '',
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  // Modal hiển thị Mã nhúng
  const [embedModalForm, setEmbedModalForm] = useState<LeadForm | null>(null)
  const [embedType, setEmbedType] = useState<'IFRAME' | 'HTML' | 'LINK'>('IFRAME')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Modal xác nhận xóa Form
  const [deletingForm, setDeletingForm] = useState<LeadForm | null>(null)

  // Toast helper
  const showToast = (message: string, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => {
      setToast(null)
    }, 3200)
  }

  // Tải dữ liệu ban đầu
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [fetchedForms, fetchedSubs] = await Promise.all([
        leadFormService.getLeadForms(),
        leadFormService.getLeadSubmissions(),
      ])
      setForms(fetchedForms)
      setSubmissions(fetchedSubs)
    } catch {
      showToast('Không thể tải danh sách biểu mẫu', true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Thống kê số liệu
  const stats = useMemo(() => {
    const totalForms = forms.length
    const activeForms = forms.filter((f) => f.is_active).length
    const totalSubmissions = submissions.length
    const newSubmissions = submissions.filter((s) => s.status === 'NEW').length
    return { totalForms, activeForms, totalSubmissions, newSubmissions }
  }, [forms, submissions])

  // Lọc danh sách Form
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus =
        filterActive === 'ALL'
          ? true
          : filterActive === 'ACTIVE'
          ? f.is_active
          : !f.is_active
      return matchSearch && matchStatus
    })
  }, [forms, searchQuery, filterActive])

  // Lọc danh sách Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
        s.phone.includes(subSearchQuery) ||
        s.company.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
        s.requirement.toLowerCase().includes(subSearchQuery.toLowerCase())
      const matchForm = subFormFilter === 'ALL' || s.form_id === subFormFilter
      const matchStatus = subStatusFilter === 'ALL' || s.status === subStatusFilter
      return matchSearch && matchForm && matchStatus
    })
  }, [submissions, subSearchQuery, subFormFilter, subStatusFilter])

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingForm(null)
    setFormFormData({
      name: '',
      title: 'Đăng ký tư vấn giải pháp Khách hàng Doanh nghiệp',
      description: 'Vui lòng để lại thông tin để chuyên viên liên hệ trong vòng 15 phút.',
      submit_button_text: 'Đăng ký nhận tư vấn ngay',
      success_message: 'Cảm ơn bạn đã đăng ký! Chuyên viên tư vấn sẽ liên hệ lại với bạn trong ít phút.',
      redirect_url: '',
      is_active: true,
    })
    setFormErrors({})
    setIsFormModalOpen(true)
  }

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (form: LeadForm) => {
    setEditingForm(form)
    setFormFormData({
      name: form.name,
      title: form.title,
      description: form.description,
      submit_button_text: form.submit_button_text,
      success_message: form.success_message,
      redirect_url: form.redirect_url || '',
      is_active: form.is_active,
    })
    setFormErrors({})
    setIsFormModalOpen(true)
  }

  // Lưu Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!formFormData.name.trim()) errs.name = 'Vui lòng nhập tên biểu mẫu nội bộ'
    if (!formFormData.title.trim()) errs.title = 'Vui lòng nhập tiêu đề hiển thị trên form'
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    try {
      setIsSubmittingForm(true)
      if (editingForm) {
        const updated = await leadFormService.updateLeadForm(editingForm.id, formFormData)
        setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
        showToast(`Đã cập nhật biểu mẫu "${updated.name}"`)
      } else {
        const created = await leadFormService.createLeadForm(formFormData)
        setForms((prev) => [created, ...prev])
        showToast(`Đã tạo thành công biểu mẫu "${created.name}"`)
      }
      setIsFormModalOpen(false)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu biểu mẫu', true)
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // Bật/tắt trạng thái
  const handleToggleActive = async (form: LeadForm) => {
    try {
      const updated = await leadFormService.toggleLeadFormStatus(form.id)
      setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      showToast(
        updated.is_active
          ? `Đã kích hoạt nhận lead cho biểu mẫu "${updated.name}"`
          : `Đã tạm dừng biểu mẫu "${updated.name}"`
      )
    } catch {
      showToast('Không thể thay đổi trạng thái biểu mẫu', true)
    }
  }

  // Xóa form
  const handleDeleteForm = async () => {
    if (!deletingForm) return
    try {
      await leadFormService.deleteLeadForm(deletingForm.id)
      setForms((prev) => prev.filter((f) => f.id !== deletingForm.id))
      showToast(`Đã xóa biểu mẫu "${deletingForm.name}"`)
      setDeletingForm(null)
    } catch {
      showToast('Không thể xóa biểu mẫu', true)
    }
  }

  // Cập nhật trạng thái lead submission
  const handleUpdateSubmissionStatus = async (
    subId: string,
    newStatus: LeadSubmissionStatus
  ) => {
    try {
      const updated = await leadFormService.updateSubmissionStatus(subId, newStatus)
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      showToast('Đã cập nhật trạng thái Lead')
    } catch {
      showToast('Lỗi khi cập nhật trạng thái', true)
    }
  }

  // Lấy đường dẫn public form
  const getPublicFormUrl = (formId: string) => {
    const origin = window.location.origin
    return `${origin}/lead-form/${formId}`
  }

  // Sinh mã nhúng
  const generateEmbedSnippet = (form: LeadForm, type: 'IFRAME' | 'HTML' | 'LINK') => {
    const url = getPublicFormUrl(form.id)

    if (type === 'LINK') {
      return url
    }

    if (type === 'IFRAME') {
      return `<!-- Mã nhúng biểu mẫu thu thập Lead Website - ${form.name} -->
<iframe
  src="${url}"
  width="100%"
  height="620"
  frameborder="0"
  style="border: none; max-width: 600px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
  title="${form.title}"
  loading="lazy"
></iframe>`
    }

    // Direct Web-to-Lead HTML Code
    return `<!-- Mã biểu mẫu HTML trực tiếp (Direct Web-to-Lead Form) -->
<form action="${url}/submit" method="POST" class="crm-lead-form">
  <h3>${form.title}</h3>
  <p>${form.description}</p>
  
  <div class="form-group">
    <label>Họ và tên *</label>
    <input type="text" name="full_name" required placeholder="Nguyễn Văn An" />
  </div>

  <div class="form-group">
    <label>Email làm việc *</label>
    <input type="email" name="email" required placeholder="contact@company.com" />
  </div>

  <div class="form-group">
    <label>Số điện thoại *</label>
    <input type="tel" name="phone" required placeholder="0912 345 678" />
  </div>

  <div class="form-group">
    <label>Tên công ty</label>
    <input type="text" name="company" placeholder="Công ty Cổ phần Alpha" />
  </div>

  <div class="form-group">
    <label>Nhu cầu tư vấn</label>
    <textarea name="requirement" rows="3" placeholder="Mô tả nhu cầu..."></textarea>
  </div>

  <button type="submit">${form.submit_button_text || 'Gửi thông tin'}</button>
</form>`
  }

  // Copy mã nhúng vào clipboard
  const handleCopyCode = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      showToast('Đã sao chép mã nhúng vào bộ nhớ tạm!')
      setTimeout(() => setCopiedKey(null), 2500)
    } catch {
      showToast('Không thể sao chép tự động', true)
    }
  }

  return (
    <div className="lead-forms-container">
      {/* ── 1. Page Header ── */}
      <div className="lead-page-header">
        <div className="lead-page-header-info">
          <h1 className="lead-page-title">Thu thập Lead từ Biểu mẫu Website</h1>
          <p className="lead-page-subtitle">
            Tạo biểu mẫu Web-to-Lead, sao chép mã nhúng iFrame/HTML dán vào website hoặc landing page để tự động thu thập khách hàng tiềm năng.
          </p>
        </div>

        <div className="lead-page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            id="btn-create-lead-form"
          >
            <IconPlus />
            <span>Tạo biểu mẫu mới</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stat Summary Cards ── */}
      <div className="lead-stats-grid">
        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value">{stats.totalForms}</span>
            <span className="lead-stat-label">Tổng biểu mẫu tạo</span>
          </div>
        </div>

        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value" style={{ color: '#16a34a' }}>
              {stats.activeForms}
            </span>
            <span className="lead-stat-label">Đang hoạt động trên web</span>
          </div>
        </div>

        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value" style={{ color: '#2563eb' }}>
              {stats.totalSubmissions}
            </span>
            <span className="lead-stat-label">Lead thu thập qua biểu mẫu</span>
          </div>
        </div>

        <div className="lead-stat-card" style={{ borderColor: stats.newSubmissions > 0 ? '#fde68a' : undefined }}>
          <div className="lead-stat-content">
            <span className="lead-stat-value" style={{ color: '#d97706' }}>
              {stats.newSubmissions}
            </span>
            <span className="lead-stat-label">Lead mới cần xử lý ngay</span>
          </div>
        </div>
      </div>

      {/* ── 3. Tabs Navigation ── */}
      <div className="lead-tabs-nav">
        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'FORMS' ? 'active' : ''}`}
          onClick={() => setActiveTab('FORMS')}
        >
          <span>Danh sách Biểu mẫu Website</span>
          <span className="tab-badge">{forms.length}</span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'SUBMISSIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUBMISSIONS')}
        >
          <span>Hộp thư Lead từ Website</span>
          <span className="tab-badge warning">{submissions.length}</span>
        </button>
      </div>

      {/* ── 4. Tab 1: Danh sách Biểu mẫu Lead ── */}
      {activeTab === 'FORMS' && (
        <div className="lead-card-panel">
          {/* Controls bar */}
          <div className="lead-panel-controls">
            <div className="lead-search-box">
              <IconSearch />
              <input
                type="text"
                placeholder="Tìm theo tên biểu mẫu, mã form hoặc tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="lead-filters-group">
              <select
                className="lead-select-filter"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="lead-loading-box">
              <div className="lead-spinner" />
              <span>Đang tải danh sách biểu mẫu...</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="lead-empty-state">
              <div className="lead-empty-icon">📝</div>
              <h4>Không tìm thấy biểu mẫu nào</h4>
              <p>Hãy tạo biểu mẫu mới để lấy mã nhúng iFrame hoặc liên kết thu thập thông tin khách hàng.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreateModal}
                style={{ marginTop: '12px' }}
              >
                <IconPlus />
                <span>Tạo biểu mẫu đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="lead-table-responsive">
              <table className="lead-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Mã form</th>
                    <th>Tên & Tiêu đề biểu mẫu</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Số lượt gửi</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '130px' }}>Ngày tạo</th>
                    <th style={{ width: '220px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map((f) => (
                    <tr key={f.id} id={`lead-form-row-${f.id}`}>
                      <td>
                        <span className="lead-code-tag">{f.code}</span>
                      </td>

                      <td>
                        <div className="lead-form-info-cell">
                          <strong className="lead-form-name">{f.name}</strong>
                          <span className="lead-form-title-sub">"{f.title}"</span>
                          {f.campaign_name && (
                            <span className="lead-form-campaign-badge">
                              Chiến dịch: {f.campaign_name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className="lead-count-pill" title={`${f.submissions_count} lượt nộp lead`}>
                          {f.submissions_count} Leads
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`lead-status-toggle-btn ${f.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(f)}
                          title={f.is_active ? 'Bấm để tạm dừng nhận lead' : 'Bấm để kích hoạt form'}
                        >
                          <span className="toggle-dot" />
                          <span>{f.is_active ? 'Đang hoạt động' : 'Tạm dừng'}</span>
                        </button>
                      </td>

                      <td>
                        <span className="lead-date-text">
                          {new Date(f.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>

                      <td>
                        <div className="lead-actions-cluster">
                          {/* Lấy mã nhúng */}
                          <button
                            type="button"
                            className="btn-action-icon embed"
                            onClick={() => {
                              setEmbedModalForm(f)
                              setEmbedType('IFRAME')
                            }}
                            title="Lấy mã nhúng website (iFrame / HTML)"
                          >
                            <IconCode />
                            <span>Mã nhúng</span>
                          </button>

                          {/* Mở xem trước public link */}
                          <a
                            href={getPublicFormUrl(f.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-action-icon preview"
                            title="Mở trang biểu mẫu trực tiếp trên tab mới"
                          >
                            <IconEye />
                          </a>

                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleOpenEditModal(f)}
                            title="Chỉnh sửa thông tin biểu mẫu"
                          >
                            <IconEdit />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => setDeletingForm(f)}
                            title="Xóa biểu mẫu"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Tab 2: Hộp thư Lead từ Website ── */}
      {activeTab === 'SUBMISSIONS' && (
        <div className="lead-card-panel">
          <div className="lead-panel-controls">
            <div className="lead-search-box">
              <IconSearch />
              <input
                type="text"
                placeholder="Tìm theo họ tên, email, số điện thoại, công ty hoặc nội dung..."
                value={subSearchQuery}
                onChange={(e) => setSubSearchQuery(e.target.value)}
              />
            </div>

            <div className="lead-filters-group">
              <select
                className="lead-select-filter"
                value={subFormFilter}
                onChange={(e) => setSubFormFilter(e.target.value)}
              >
                <option value="ALL">Tất cả biểu mẫu nguồn</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                className="lead-select-filter"
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NEW">Mới tiếp nhận</option>
                <option value="CONTACTED">Đã liên hệ</option>
                <option value="QUALIFIED">Đủ điều kiện</option>
                <option value="CONVERTED">Đã chuyển đổi</option>
                <option value="SPAM">Rác / Sai số</option>
              </select>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="lead-empty-state">
              <div className="lead-empty-icon">📬</div>
              <h4>Chưa có Lead nào gửi từ biểu mẫu</h4>
              <p>Khi khách truy cập điền và gửi biểu mẫu trên website, dữ liệu sẽ ngay lập tức xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="lead-table-responsive">
              <table className="lead-data-table">
                <thead>
                  <tr>
                    <th>Thông tin người liên hệ</th>
                    <th>Doanh nghiệp / Công ty</th>
                    <th style={{ width: '280px' }}>Nhu cầu tư vấn & Ghi chú</th>
                    <th>Nguồn biểu mẫu</th>
                    <th style={{ width: '130px' }}>Thời gian gửi</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Trạng thái xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const statusCfg = SUBMISSION_STATUS_CONFIG[sub.status]
                    return (
                      <tr key={sub.id} id={`submission-row-${sub.id}`}>
                        <td>
                          <div className="lead-contact-info">
                            <strong className="lead-contact-name">{sub.full_name}</strong>
                            <div className="lead-contact-detail">
                              <span>📞 {sub.phone}</span>
                              <span>✉️ {sub.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="lead-company-text">
                            {sub.company || <span style={{ color: '#94a3b8' }}>—</span>}
                          </span>
                        </td>

                        <td>
                          <div className="lead-requirement-bubble">
                            {sub.requirement || (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                (Khách không để lại mô tả)
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="lead-source-tag">{sub.form_name}</span>
                        </td>

                        <td>
                          <span className="lead-date-text">
                            {new Date(sub.created_at).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <select
                            className="lead-status-dropdown"
                            style={{
                              backgroundColor: statusCfg.bg,
                              color: statusCfg.color,
                              borderColor: statusCfg.border,
                            }}
                            value={sub.status}
                            onChange={(e) =>
                              handleUpdateSubmissionStatus(
                                sub.id,
                                e.target.value as LeadSubmissionStatus
                              )
                            }
                          >
                            <option value="NEW">Mới tiếp nhận</option>
                            <option value="CONTACTED">Đã liên hệ</option>
                            <option value="QUALIFIED">Đủ điều kiện</option>
                            <option value="CONVERTED">Đã chuyển đổi</option>
                            <option value="SPAM">Rác / Sai số</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 6. Modal Tạo / Chỉnh sửa Biểu mẫu ── */}
      {isFormModalOpen && (
        <div className="lead-modal-backdrop" onClick={() => setIsFormModalOpen(false)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lead-modal-header">
              <h3>{editingForm ? 'Chỉnh sửa Biểu mẫu Lead' : 'Tạo mới Biểu mẫu Lead Website'}</h3>
              <button
                type="button"
                className="lead-modal-close-btn"
                onClick={() => setIsFormModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="lead-modal-body">
                {/* Tên biểu mẫu nội bộ */}
                <div className="lead-modal-field">
                  <label>
                    Tên biểu mẫu nội bộ <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className={`lead-modal-input ${formErrors.name ? 'has-error' : ''}`}
                    placeholder="Ví dụ: Biểu mẫu Đăng ký Tư vấn - Trang chủ Website"
                    value={formFormData.name}
                    onChange={(e) => {
                      setFormFormData({ ...formFormData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                    }}
                  />
                  {formErrors.name && (
                    <span className="lead-modal-field-error">{formErrors.name}</span>
                  )}
                  <span className="lead-modal-hint">
                    Tên dùng để quản lý nội bộ và phân loại nguồn khách hàng trong CRM.
                  </span>
                </div>

                {/* Tiêu đề hiển thị trên form */}
                <div className="lead-modal-field">
                  <label>
                    Tiêu đề hiển thị cho khách truy cập <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className={`lead-modal-input ${formErrors.title ? 'has-error' : ''}`}
                    placeholder="Ví dụ: Đăng ký tư vấn miễn phí giải pháp Quản lý Khách hàng"
                    value={formFormData.title}
                    onChange={(e) => {
                      setFormFormData({ ...formFormData, title: e.target.value })
                      if (formErrors.title) setFormErrors({ ...formErrors, title: '' })
                    }}
                  />
                  {formErrors.title && (
                    <span className="lead-modal-field-error">{formErrors.title}</span>
                  )}
                </div>

                {/* Mô tả biểu mẫu */}
                <div className="lead-modal-field">
                  <label>Mô tả / Lời kêu gọi hành động (Call To Action)</label>
                  <textarea
                    rows={2}
                    className="lead-modal-textarea"
                    placeholder="Ví dụ: Điền thông tin bên dưới để chuyên viên liên hệ trong 15 phút..."
                    value={formFormData.description}
                    onChange={(e) => setFormFormData({ ...formFormData, description: e.target.value })}
                  />
                </div>

                {/* Danh sách trường thu thập mặc định */}
                <div className="lead-modal-field">
                  <label>Các trường thông tin thu thập tự động trên form</label>
                  <div className="lead-fields-preview-tags">
                    <span className="field-tag required">✓ Họ và tên (Bắt buộc)</span>
                    <span className="field-tag required">✓ Email làm việc (Bắt buộc)</span>
                    <span className="field-tag required">✓ Số điện thoại (Bắt buộc)</span>
                    <span className="field-tag optional">✓ Tên công ty / Doanh nghiệp</span>
                    <span className="field-tag optional">✓ Nhu cầu tư vấn & Ghi chú</span>
                  </div>
                </div>

                {/* Chữ trên nút gửi & Thông báo thành công */}
                <div className="lead-modal-grid-2">
                  <div className="lead-modal-field">
                    <label>Chữ hiển thị trên nút gửi</label>
                    <input
                      type="text"
                      className="lead-modal-input"
                      placeholder="Gửi thông tin tư vấn"
                      value={formFormData.submit_button_text}
                      onChange={(e) =>
                        setFormFormData({ ...formFormData, submit_button_text: e.target.value })
                      }
                    />
                  </div>

                  <div className="lead-modal-field">
                    <label>URL chuyển hướng sau gửi (Tùy chọn)</label>
                    <input
                      type="url"
                      className="lead-modal-input"
                      placeholder="https://company.vn/cam-on"
                      value={formFormData.redirect_url}
                      onChange={(e) =>
                        setFormFormData({ ...formFormData, redirect_url: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Thông báo thành công */}
                <div className="lead-modal-field">
                  <label>Thông báo sau khi khách gửi form thành công</label>
                  <input
                    type="text"
                    className="lead-modal-input"
                    value={formFormData.success_message}
                    onChange={(e) =>
                      setFormFormData({ ...formFormData, success_message: e.target.value })
                    }
                  />
                </div>

                {/* Trạng thái hoạt động */}
                <div className="lead-modal-field-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formFormData.is_active}
                      onChange={(e) =>
                        setFormFormData({ ...formFormData, is_active: e.target.checked })
                      }
                    />
                    <span>Kích hoạt nhận lead ngay sau khi lưu</span>
                  </label>
                </div>
              </div>

              <div className="lead-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmittingForm}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingForm}
                >
                  {isSubmittingForm ? 'Đang lưu...' : editingForm ? 'Lưu thay đổi' : 'Tạo biểu mẫu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Modal Lấy Mã Nhúng (Embed Code Modal) ── */}
      {embedModalForm && (
        <div className="lead-modal-backdrop" onClick={() => setEmbedModalForm(null)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '780px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lead-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '17px' }}>
                  Mã nhúng Biểu mẫu: {embedModalForm.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Mã form: <strong>{embedModalForm.code}</strong>
                </span>
              </div>
              <button
                type="button"
                className="lead-modal-close-btn"
                onClick={() => setEmbedModalForm(null)}
              >
                &times;
              </button>
            </div>

            <div className="lead-modal-body">
              {/* Type Switcher Tabs */}
              <div className="embed-type-switcher">
                <button
                  type="button"
                  className={`embed-type-btn ${embedType === 'IFRAME' ? 'active' : ''}`}
                  onClick={() => setEmbedType('IFRAME')}
                >
                  <span>Mã nhúng iFrame (Khuyên dùng)</span>
                </button>
                <button
                  type="button"
                  className={`embed-type-btn ${embedType === 'HTML' ? 'active' : ''}`}
                  onClick={() => setEmbedType('HTML')}
                >
                  <span>Mã HTML Form trực tiếp</span>
                </button>
                <button
                  type="button"
                  className={`embed-type-btn ${embedType === 'LINK' ? 'active' : ''}`}
                  onClick={() => setEmbedType('LINK')}
                >
                  <span>Đường dẫn trực tiếp (Link)</span>
                </button>
              </div>

              {/* Hướng dẫn ngắn */}
              <div className="embed-guide-box">
                {embedType === 'IFRAME' && (
                  <p>
                    💡 <strong>Cách dùng:</strong> Sao chép đoạn mã iFrame bên dưới và dán vào vị trí bạn muốn hiển thị trên website WordPress, Webflow, Landing Page hoặc trang HTML tĩnh. Form sẽ tự động co giãn và thu thập dữ liệu về CRM.
                  </p>
                )}
                {embedType === 'HTML' && (
                  <p>
                    💡 <strong>Cách dùng:</strong> Dành cho Lập trình viên muốn tùy biến hoàn toàn mã HTML và giao diện CSS theo phong cách riêng của website.
                  </p>
                )}
                {embedType === 'LINK' && (
                  <p>
                    💡 <strong>Cách dùng:</strong> Sử dụng đường link độc lập này để gửi trực tiếp cho khách qua Zalo, Messenger, Email hoặc chèn vào nút kêu gọi hành động (CTA).
                  </p>
                )}
              </div>

              {/* Code Display Area */}
              <div className="embed-code-wrapper">
                <div className="embed-code-header">
                  <span className="embed-code-label">
                    {embedType === 'IFRAME' ? 'HTML / iFrame Snippet' : embedType === 'HTML' ? 'Web-to-Lead HTML Code' : 'Public URL'}
                  </span>
                  <button
                    type="button"
                    className="btn-copy-code"
                    onClick={() =>
                      handleCopyCode(
                        generateEmbedSnippet(embedModalForm, embedType),
                        `embed-${embedModalForm.id}-${embedType}`
                      )
                    }
                  >
                    {copiedKey === `embed-${embedModalForm.id}-${embedType}` ? (
                      <>
                        <IconCheck />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy />
                        <span>Sao chép mã</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="embed-code-block">
                  <code>{generateEmbedSnippet(embedModalForm, embedType)}</code>
                </pre>
              </div>

              {/* Xem trước trực tiếp (Live Preview) */}
              <div className="embed-live-preview-section">
                <div className="preview-header">
                  <span>Trải nghiệm xem trước form thực tế (Live Preview)</span>
                  <a
                    href={getPublicFormUrl(embedModalForm.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="preview-ext-link"
                  >
                    <span>Mở tab mới</span>
                    <IconExternalLink />
                  </a>
                </div>

                <div className="preview-frame-wrapper">
                  <iframe
                    src={getPublicFormUrl(embedModalForm.id)}
                    title="Live Preview Form"
                    className="preview-iframe"
                  />
                </div>
              </div>
            </div>

            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEmbedModalForm(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Modal Xác nhận xóa ── */}
      {deletingForm && (
        <div className="lead-modal-backdrop" onClick={() => setDeletingForm(null)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lead-modal-header">
              <h3>Xác nhận xóa biểu mẫu</h3>
              <button
                type="button"
                className="lead-modal-close-btn"
                onClick={() => setDeletingForm(null)}
              >
                &times;
              </button>
            </div>
            <div className="lead-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa biểu mẫu <strong>{deletingForm.name}</strong> ({deletingForm.code}) không? Khi xóa, các website đang nhúng biểu mẫu này sẽ không còn thu thập được thông tin nữa.
              </p>
            </div>
            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingForm(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteForm}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast && (
        <div className={`lead-toast ${toast.isError ? 'error' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
