import React, { useState, useEffect, useMemo, useRef } from 'react'
import { leadFormService } from '../../services/leadFormService.ts'
import { leadService } from '../../services/leadService.ts'
import type {
  LeadForm,
  LeadSubmission,
  CreateLeadFormPayload,
} from '../../types/leadForm.ts'
import type {
  Lead,
  LeadStatus,
  LeadSource,
  CreateLeadPayload,
  ExcelLeadRow,
  ImportLeadResult,
} from '../../types/lead.ts'
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

const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconFileSpreadsheet = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M8 17h2" />
    <path d="M14 17h2" />
  </svg>
)

const IconExternalLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

/* ──────────── Cấu hình Trạng thái & Nguồn Lead ──────────── */
const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  NEW: { label: 'Mới tiếp nhận', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CONTACTED: { label: 'Đã liên hệ', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  QUALIFIED: { label: 'Đủ điều kiện BANT', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  UNQUALIFIED: { label: 'Không tiềm năng', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
  CONVERTED: { label: 'Đã chuyển đổi', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  JUNK: { label: 'Rác / Sai số', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
}

const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEB_FORM: 'Biểu mẫu Website',
  MANUAL: 'Tạo thủ công',
  EXCEL_IMPORT: 'Nhập từ file Excel',
  FACEBOOK: 'Facebook Ads',
  GOOGLE: 'Google Search Ads',
  EVENT: 'Hội thảo / Sự kiện',
  REFERRAL: 'Khách hàng giới thiệu',
  OTHER: 'Khác',
}

export default function LeadFormsPage() {
  const [activeTab, setActiveTab] = useState<'LEADS_LIST' | 'IMPORT_EXCEL' | 'FORMS' | 'SUBMISSIONS'>('LEADS_LIST')

  // Data states
  const [leads, setLeads] = useState<Lead[]>([])
  const [forms, setForms] = useState<LeadForm[]>([])
  const [submissions, setSubmissions] = useState<LeadSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  // Bộ lọc danh sách Leads
  const [leadSearchQuery, setLeadSearchQuery] = useState('')
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('ALL')
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>('ALL')

  // Bộ lọc danh sách form (S4-01)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Bộ lọc submissions (S4-01)
  const [subSearchQuery, setSubSearchQuery] = useState('')
  const [subFormFilter, setSubFormFilter] = useState<string>('ALL')
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL')

  // ── S4-02: Modal Tạo Lead thủ công ──
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false)
  const [createLeadForm, setCreateLeadForm] = useState<CreateLeadPayload>({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Công nghệ thông tin & Viễn thông',
    source: 'MANUAL',
    source_detail: 'Tạo thủ công',
    status: 'NEW',
    owner_id: 1,
    requirement: '',
    notes: '',
  })
  const [createLeadErrors, setCreateLeadErrors] = useState<Record<string, string>>({})
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)

  // ── S4-02: State cho Import Excel ──
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [excelRows, setExcelRows] = useState<ExcelLeadRow[]>([])
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL')
  const [isParsingExcel, setIsParsingExcel] = useState(false)
  const [isCommittingImport, setIsCommittingImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportLeadResult | null>(null)

  // Modal tạo / sửa Form (S4-01)
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

  // Modal hiển thị Mã nhúng (S4-01)
  const [embedModalForm, setEmbedModalForm] = useState<LeadForm | null>(null)
  const [embedType, setEmbedType] = useState<'IFRAME' | 'HTML' | 'LINK'>('IFRAME')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Modal xác nhận xóa Form
  const [deletingForm, setDeletingForm] = useState<LeadForm | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)

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
      const [fetchedLeads, fetchedForms, fetchedSubs] = await Promise.all([
        leadService.getLeads(),
        leadFormService.getLeadForms(),
        leadFormService.getLeadSubmissions(),
      ])
      setLeads(fetchedLeads)
      setForms(fetchedForms)
      setSubmissions(fetchedSubs)
    } catch {
      showToast('Không thể tải danh sách dữ liệu Lead', true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Thống kê số liệu tổng quan
  const stats = useMemo(() => {
    const totalLeads = leads.length
    const newLeads = leads.filter((l) => l.status === 'NEW').length
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length
    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length
    const totalForms = forms.length
    const activeForms = forms.filter((f) => f.is_active).length
    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      totalForms,
      activeForms,
    }
  }, [leads, forms])

  // Lọc danh sách Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        l.full_name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
        l.email.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
        l.phone.includes(leadSearchQuery) ||
        l.company.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
        l.code.toLowerCase().includes(leadSearchQuery.toLowerCase())
      const matchStatus = leadStatusFilter === 'ALL' || l.status === leadStatusFilter
      const matchSource = leadSourceFilter === 'ALL' || l.source === leadSourceFilter
      return matchSearch && matchStatus && matchSource
    })
  }, [leads, leadSearchQuery, leadStatusFilter, leadSourceFilter])

  // Lọc danh sách Form (S4-01)
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

  // Lọc danh sách Submissions (S4-01)
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

  // ── S4-02: Xử lý Tạo Lead thủ công ──
  const validateCreateLead = (): boolean => {
    const errs: Record<string, string> = {}
    if (!createLeadForm.full_name.trim()) {
      errs.full_name = 'Vui lòng nhập họ và tên khách hàng'
    }

    if (!createLeadForm.phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại liên hệ'
    } else if (!/(0[3|5|7|8|9])+([0-9]{8})\b/.test(createLeadForm.phone.trim()) && createLeadForm.phone.trim().length < 9) {
      errs.phone = 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)'
    }

    if (!createLeadForm.email.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createLeadForm.email.trim())) {
      errs.email = 'Email không đúng định dạng (Ví dụ: user@company.vn)'
    }

    setCreateLeadErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCreateLead()) return

    try {
      setIsSubmittingLead(true)
      const newLead = await leadService.createLead(createLeadForm)
      setLeads((prev) => [newLead, ...prev])
      showToast(`Đã tạo thành công Lead "${newLead.full_name}" (${newLead.code})`)
      setIsCreateLeadModalOpen(false)
      setCreateLeadForm({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        industry: 'Công nghệ thông tin & Viễn thông',
        source: 'MANUAL',
        source_detail: 'Tạo thủ công',
        status: 'NEW',
        owner_id: 1,
        requirement: '',
        notes: '',
      })
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi tạo Lead', true)
    } finally {
      setIsSubmittingLead(false)
    }
  }

  // Cập nhật trạng thái Lead trực tiếp trong bảng
  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const updated = await leadService.updateLead(leadId, { status })
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      showToast(`Đã cập nhật trạng thái Lead: ${LEAD_STATUS_CONFIG[status].label}`)
    } catch {
      showToast('Lỗi khi cập nhật trạng thái Lead', true)
    }
  }

  // Xóa Lead
  const handleDeleteLead = async () => {
    if (!deletingLead) return
    try {
      await leadService.deleteLead(deletingLead.id)
      setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id))
      showToast(`Đã xóa Lead "${deletingLead.full_name}"`)
      setDeletingLead(null)
    } catch {
      showToast('Không thể xóa Lead', true)
    }
  }

  // ── S4-02: Xử lý Import Excel ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Kiểm tra định dạng file
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      showToast('Định dạng file không hợp lệ. Vui lòng chọn file .xlsx, .xls hoặc .csv', true)
      return
    }

    setExcelFile(file)
    setImportResult(null)
    setIsParsingExcel(true)

    try {
      const parsedRows = await leadService.parseAndValidateExcel(file)
      setExcelRows(parsedRows)
      showToast(`Đã đọc ${parsedRows.length} dòng từ file "${file.name}"`)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi đọc file Excel', true)
      setExcelRows([])
    } finally {
      setIsParsingExcel(false)
    }
  }

  // Lọc dòng xem trước trong Excel
  const filteredExcelRows = useMemo(() => {
    if (previewFilter === 'VALID') return excelRows.filter((r) => r.is_valid)
    if (previewFilter === 'INVALID') return excelRows.filter((r) => !r.is_valid)
    return excelRows
  }, [excelRows, previewFilter])

  // Tiến hành Import Excel vào hệ thống
  const handleCommitExcelImport = async () => {
    if (excelRows.length === 0) return
    const validCount = excelRows.filter((r) => r.is_valid).length
    if (validCount === 0) {
      showToast('File không có bất kỳ dòng hợp lệ nào để nhập.', true)
      return
    }

    try {
      setIsCommittingImport(true)
      const result = await leadService.commitImport(excelRows)
      setImportResult(result)
      // Tải lại danh sách Lead
      const updatedLeads = await leadService.getLeads()
      setLeads(updatedLeads)
      showToast(`Nhập dữ liệu thành công! Đã thêm ${result.success_count} Lead vào hệ thống.`)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu Import', true)
    } finally {
      setIsCommittingImport(false)
    }
  }

  // Reset trình import Excel
  const handleResetExcelImport = () => {
    setExcelFile(null)
    setExcelRows([])
    setImportResult(null)
    setPreviewFilter('ALL')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── S4-01: Modal & Form Functions ──
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

  const getPublicFormUrl = (formId: string) => {
    const origin = window.location.origin
    return `${origin}/lead-form/${formId}`
  }

  const generateEmbedSnippet = (form: LeadForm, type: 'IFRAME' | 'HTML' | 'LINK') => {
    const url = getPublicFormUrl(form.id)
    if (type === 'LINK') return url
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
          <h1 className="lead-page-title">Quản lý Khách hàng Tiềm năng (Leads)</h1>
          <p className="lead-page-subtitle">
            Thu thập lead đa kênh từ biểu mẫu nhúng website, tạo thủ công và nhập hàng loạt từ file Excel.
          </p>
        </div>

        <div className="lead-page-header-actions">
          {/* Nút Tạo Lead thủ công */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateLeadModalOpen(true)}
            id="btn-create-lead-manual"
          >
            <IconPlus />
            <span>Tạo Lead thủ công</span>
          </button>

          {/* Nút Chuyển sang Tab Nhập Excel */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('IMPORT_EXCEL')}
            id="btn-nav-import-excel"
          >
            <IconUpload />
            <span>Nhập từ Excel</span>
          </button>

          {/* Nút Xuất Excel */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => leadService.exportLeadsToExcel(leads)}
            title="Xuất danh sách Lead ra file Excel"
          >
            <IconDownload />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stat Summary Cards ── */}
      <div className="lead-stats-grid">
        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value">{stats.totalLeads}</span>
            <span className="lead-stat-label">Tổng khách hàng tiềm năng</span>
          </div>
        </div>

        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value" style={{ color: '#d97706' }}>
              {stats.newLeads}
            </span>
            <span className="lead-stat-label">Mới tiếp nhận (Cần gọi ngay)</span>
          </div>
        </div>

        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value" style={{ color: '#047857' }}>
              {stats.qualifiedLeads}
            </span>
            <span className="lead-stat-label">Đủ tiêu chuẩn (Qualified BANT)</span>
          </div>
        </div>

        <div className="lead-stat-card">
          <div className="lead-stat-content">
            <span className="lead-stat-value" style={{ color: '#2563eb' }}>
              {stats.activeForms}
            </span>
            <span className="lead-stat-label">Biểu mẫu website đang mở</span>
          </div>
        </div>
      </div>

      {/* ── 3. Tabs Navigation ── */}
      <div className="lead-tabs-nav">
        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'LEADS_LIST' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEADS_LIST')}
        >
          <span>Danh sách Lead tổng hợp</span>
          <span className="tab-badge">{leads.length}</span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'IMPORT_EXCEL' ? 'active' : ''}`}
          onClick={() => setActiveTab('IMPORT_EXCEL')}
        >
          <span>Nhập Lead từ Excel (S4-02)</span>
          <span className="tab-badge info">Mới</span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'FORMS' ? 'active' : ''}`}
          onClick={() => setActiveTab('FORMS')}
        >
          <span>Biểu mẫu Website (S4-01)</span>
          <span className="tab-badge">{forms.length}</span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'SUBMISSIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUBMISSIONS')}
        >
          <span>Hộp thư Lead từ Web</span>
          <span className="tab-badge warning">{submissions.length}</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DANH SÁCH LEAD TỔNG HỢP (LEADS DIRECTORY)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'LEADS_LIST' && (
        <div className="lead-card-panel">
          <div className="lead-panel-controls">
            <div className="lead-search-box">
              <IconSearch />
              <input
                type="text"
                placeholder="Tìm theo họ tên, email, SĐT, công ty hoặc mã Lead..."
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
              />
            </div>

            <div className="lead-filters-group">
              <select
                className="lead-select-filter"
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NEW">Mới tiếp nhận</option>
                <option value="CONTACTED">Đã liên hệ</option>
                <option value="QUALIFIED">Đủ điều kiện BANT</option>
                <option value="UNQUALIFIED">Không tiềm năng</option>
                <option value="CONVERTED">Đã chuyển đổi</option>
                <option value="JUNK">Rác / Sai số</option>
              </select>

              <select
                className="lead-select-filter"
                value={leadSourceFilter}
                onChange={(e) => setLeadSourceFilter(e.target.value)}
              >
                <option value="ALL">Tất cả nguồn Lead</option>
                <option value="WEB_FORM">Biểu mẫu Website</option>
                <option value="MANUAL">Tạo thủ công</option>
                <option value="EXCEL_IMPORT">Nhập từ file Excel</option>
                <option value="FACEBOOK">Facebook Ads</option>
                <option value="GOOGLE">Google Ads</option>
                <option value="EVENT">Hội thảo / Triển lãm</option>
                <option value="REFERRAL">Giới thiệu</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="lead-loading-box">
              <div className="lead-spinner" />
              <span>Đang tải danh sách khách hàng tiềm năng...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="lead-empty-state">
              <div className="lead-empty-icon">👥</div>
              <h4>Không tìm thấy khách hàng tiềm năng nào</h4>
              <p>Bạn có thể tạo lead thủ công hoặc tải file Excel lên để nhập hàng loạt vào hệ thống.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreateLeadModalOpen(true)}
                >
                  <IconPlus />
                  <span>Tạo Lead thủ công</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('IMPORT_EXCEL')}
                >
                  <IconUpload />
                  <span>Nhập từ Excel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="lead-table-responsive">
              <table className="lead-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Mã Lead</th>
                    <th>Họ và tên & Liên hệ</th>
                    <th>Doanh nghiệp & Ngành nghề</th>
                    <th>Nguồn Lead</th>
                    <th style={{ minWidth: '360px', width: '400px' }}>Nhu cầu tư vấn</th>
                    <th style={{ width: '150px' }}>Người phụ trách</th>
                    <th style={{ width: '150px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l) => {
                    const statusCfg = LEAD_STATUS_CONFIG[l.status]
                    return (
                      <tr key={l.id} id={`lead-row-${l.id}`}>
                        <td>
                          <span className="lead-code-tag">{l.code}</span>
                        </td>

                        <td>
                          <div className="lead-contact-info">
                            <strong className="lead-contact-name">{l.full_name}</strong>
                            <div className="lead-contact-detail">
                              <span>{l.phone}</span>
                              <span>{l.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="lead-company-text">
                              {l.company || <span style={{ color: '#94a3b8' }}>—</span>}
                            </span>
                            {l.industry && <span style={{ fontSize: '11.5px', color: '#64748b' }}>{l.industry}</span>}
                          </div>
                        </td>

                        <td>
                          <span className="lead-source-tag">
                            {LEAD_SOURCE_LABELS[l.source] || l.source}
                          </span>
                        </td>

                        <td>
                          <div className="lead-requirement-bubble">
                            {l.requirement || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có ghi chú</span>}
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '13px', color: '#334155' }}>
                            {l.owner_name || 'Chưa phân công'}
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
                            value={l.status}
                            onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value as LeadStatus)}
                          >
                            <option value="NEW">Mới tiếp nhận</option>
                            <option value="CONTACTED">Đã liên hệ</option>
                            <option value="QUALIFIED">Đủ điều kiện BANT</option>
                            <option value="UNQUALIFIED">Không tiềm năng</option>
                            <option value="CONVERTED">Đã chuyển đổi</option>
                            <option value="JUNK">Rác / Sai số</option>
                          </select>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => setDeletingLead(l)}
                            title="Xóa Lead này"
                          >
                            <IconTrash />
                          </button>
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: NHẬP LEAD TỪ EXCEL (USER STORY S4-02 IMPORT WIZARD)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'IMPORT_EXCEL' && (
        <div className="lead-card-panel import-excel-panel">
          {/* Header Panel */}
          <div className="import-header-banner">
            <div className="import-banner-info">
              <h3>Nhập danh sách Khách hàng Tiềm năng từ Excel</h3>
              <p>
                Tải về biểu mẫu chuẩn, điền danh sách khách hàng và tải lên để hệ thống tự động kiểm tra định dạng, phát hiện trùng lặp và lưu vào CRM.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-template-download"
              onClick={() => leadService.downloadExcelTemplate()}
              title="Tải về file Excel mẫu có định dạng chuẩn (.xlsx)"
            >
              <IconFileSpreadsheet />
              <span>Tải file Excel mẫu chuẩn (.xlsx)</span>
            </button>
          </div>

          {/* Vùng Dropzone Upload */}
          <div className="import-dropzone-section">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <div
              className={`import-dropzone ${excelFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                <IconUpload />
              </div>
              <div className="dropzone-text">
                {excelFile ? (
                  <>
                    <strong style={{ color: '#0f172a', fontSize: '15px' }}>{excelFile.name}</strong>
                    <span>
                      Dung lượng: {(excelFile.size / 1024).toFixed(1)} KB — Bấm để chọn file khác
                    </span>
                  </>
                ) : (
                  <>
                    <strong>Kéo thả file Excel vào đây hoặc bấm để chọn file</strong>
                    <span>Hỗ trợ định dạng .xlsx, .xls hoặc .csv (tối đa 5MB)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Trạng thái đang đọc file */}
          {isParsingExcel && (
            <div className="lead-loading-box">
              <div className="lead-spinner" />
              <span>Đang đọc và kiểm tra tính hợp lệ của từng dòng dữ liệu...</span>
            </div>
          )}

          {/* Kết quả sau khi Import thành công */}
          {importResult && (
            <div className="import-result-summary-card">
              <div className="import-summary-header">
                <div className="summary-status-icon success">✓</div>
                <div>
                  <h4>Kết quả nhập dữ liệu Excel</h4>
                  <p>Hệ thống đã hoàn tất xử lý danh sách Lead từ file.</p>
                </div>
              </div>

              <div className="import-summary-metrics">
                <div className="metric-box total">
                  <span className="metric-num">{importResult.total_rows}</span>
                  <span className="metric-lbl">Tổng số dòng</span>
                </div>
                <div className="metric-box success">
                  <span className="metric-num">{importResult.success_count}</span>
                  <span className="metric-lbl">Thêm thành công</span>
                </div>
                <div className="metric-box errors">
                  <span className="metric-num">{importResult.error_count}</span>
                  <span className="metric-lbl">Dòng bị bỏ qua / lỗi</span>
                </div>
                <div className="metric-box duplicates">
                  <span className="metric-num">{importResult.duplicate_count}</span>
                  <span className="metric-lbl">Trùng Email / SĐT</span>
                </div>
              </div>

              {/* Danh sách lỗi nếu có */}
              {importResult.errors.length > 0 && (
                <div className="import-errors-log-table">
                  <h5>Danh sách dòng lỗi chi tiết:</h5>
                  <div className="error-list-scroll">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="error-row-item">
                        <span className="error-badge-row">Dòng {err.row}</span>
                        <strong className="error-lead-name">{err.name}:</strong>
                        <span className="error-detail-text">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="import-summary-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('LEADS_LIST')}
                >
                  <span>Xem danh sách Lead vừa nhập</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetExcelImport}
                >
                  <span>Nhập thêm file khác</span>
                </button>
              </div>
            </div>
          )}

          {/* Bảng Xem trước & Validation (khi chưa bấm import và có rows) */}
          {!importResult && excelRows.length > 0 && (
            <div className="import-preview-section">
              <div className="preview-controls-bar">
                <div className="preview-stats-badges">
                  <span className="badge-stat total">Tổng: {excelRows.length} dòng</span>
                  <span className="badge-stat valid">
                    Hợp lệ: {excelRows.filter((r) => r.is_valid).length} dòng
                  </span>
                  <span className="badge-stat invalid">
                    Lỗi / Trùng: {excelRows.filter((r) => !r.is_valid).length} dòng
                  </span>
                </div>

                <div className="preview-filter-buttons">
                  <button
                    type="button"
                    className={`btn-filter-pill ${previewFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('ALL')}
                  >
                    Tất cả ({excelRows.length})
                  </button>
                  <button
                    type="button"
                    className={`btn-filter-pill ${previewFilter === 'VALID' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('VALID')}
                  >
                    Hợp lệ ({excelRows.filter((r) => r.is_valid).length})
                  </button>
                  <button
                    type="button"
                    className={`btn-filter-pill ${previewFilter === 'INVALID' ? 'active' : ''}`}
                    onClick={() => setPreviewFilter('INVALID')}
                  >
                    Có lỗi ({excelRows.filter((r) => !r.is_valid).length})
                  </button>
                </div>
              </div>

              <div className="lead-table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="lead-data-table preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Dòng</th>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Công ty / Doanh nghiệp</th>
                      <th>Nhu cầu</th>
                      <th style={{ width: '220px' }}>Kiểm tra tính hợp lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExcelRows.map((row) => (
                      <tr
                        key={row.row_index}
                        className={row.is_valid ? 'row-valid' : 'row-invalid'}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <span className="row-num-badge">{row.row_index}</span>
                        </td>
                        <td>
                          <strong>{row.full_name || <span style={{ color: '#ef4444' }}>(Thiếu)</span>}</strong>
                        </td>
                        <td>{row.email || <span style={{ color: '#ef4444' }}>(Thiếu)</span>}</td>
                        <td>{row.phone || <span style={{ color: '#ef4444' }}>(Thiếu)</span>}</td>
                        <td>{row.company || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                        <td>
                          <span style={{ fontSize: '12.5px', color: '#475569' }}>
                            {row.requirement || '—'}
                          </span>
                        </td>
                        <td>
                          {row.is_valid ? (
                            <span className="valid-check-tag">✓ Hợp lệ</span>
                          ) : (
                            <div className="invalid-errors-box">
                              {row.errors.map((e, idx) => (
                                <span key={idx} className="error-pill">
                                  ⚠️ {e}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Nút hành động import */}
              <div className="preview-commit-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetExcelImport}
                >
                  Hủy file này
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-commit-import"
                  onClick={handleCommitExcelImport}
                  disabled={isCommittingImport || excelRows.filter((r) => r.is_valid).length === 0}
                >
                  {isCommittingImport ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Đang nhập dữ liệu vào CRM...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck />
                      <span>
                        Xác nhận nhập ({excelRows.filter((r) => r.is_valid).length} dòng hợp lệ)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: DANH SÁCH BIỂU MẪU LEAD WEBSITE (S4-01)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'FORMS' && (
        <div className="lead-card-panel">
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

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreateModal}
              >
                <IconPlus />
                <span>Tạo form mới</span>
              </button>
            </div>
          </div>

          {filteredForms.length === 0 ? (
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

                          <a
                            href={getPublicFormUrl(f.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-action-icon preview"
                            title="Mở trang biểu mẫu trực tiếp trên tab mới"
                          >
                            <IconEye />
                          </a>

                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleOpenEditModal(f)}
                            title="Chỉnh sửa thông tin biểu mẫu"
                          >
                            <IconEdit />
                          </button>

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

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: HỘP THƯ LEAD TỪ WEBSITE (S4-01 SUBMISSIONS)
          ───────────────────────────────────────────────────────────── */}
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
                    <th style={{ minWidth: '360px', width: '400px' }}>Nhu cầu tư vấn & Ghi chú</th>
                    <th>Nguồn biểu mẫu</th>
                    <th style={{ width: '130px' }}>Thời gian gửi</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Trạng thái xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const statusCfg = LEAD_STATUS_CONFIG[sub.status as LeadStatus] || LEAD_STATUS_CONFIG.NEW
                    return (
                      <tr key={sub.id} id={`submission-row-${sub.id}`}>
                        <td>
                          <div className="lead-contact-info">
                            <strong className="lead-contact-name">{sub.full_name}</strong>
                            <div className="lead-contact-detail">
                              <span>{sub.phone}</span>
                              <span>{sub.email}</span>
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
                          <span
                            className="lead-status-pill"
                            style={{
                              backgroundColor: statusCfg.bg,
                              color: statusCfg.color,
                              border: `1px solid ${statusCfg.border}`,
                            }}
                          >
                            {statusCfg.label}
                          </span>
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TẠO LEAD THỦ CÔNG (S4-02)
          ───────────────────────────────────────────────────────────── */}
      {isCreateLeadModalOpen && (
        <div className="lead-modal-backdrop" onClick={() => setIsCreateLeadModalOpen(false)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lead-modal-header">
              <h3>Thêm mới Khách hàng Tiềm năng (Tạo thủ công)</h3>
              <button
                type="button"
                className="lead-modal-close-btn"
                onClick={() => setIsCreateLeadModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCreateLead}>
              <div className="lead-modal-body">
                {/* Họ và tên */}
                <div className="lead-modal-field">
                  <label>
                    Họ và tên khách hàng <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className={`lead-modal-input ${createLeadErrors.full_name ? 'has-error' : ''}`}
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    value={createLeadForm.full_name}
                    onChange={(e) => {
                      setCreateLeadForm({ ...createLeadForm, full_name: e.target.value })
                      if (createLeadErrors.full_name) setCreateLeadErrors({ ...createLeadErrors, full_name: '' })
                    }}
                  />
                  {createLeadErrors.full_name && (
                    <span className="lead-modal-field-error">{createLeadErrors.full_name}</span>
                  )}
                </div>

                {/* Email & Số điện thoại */}
                <div className="lead-modal-grid-2">
                  <div className="lead-modal-field">
                    <label>
                      Email liên hệ <span className="required-star">*</span>
                    </label>
                    <input
                      type="email"
                      className={`lead-modal-input ${createLeadErrors.email ? 'has-error' : ''}`}
                      placeholder="hung.nguyen@company.vn"
                      value={createLeadForm.email}
                      onChange={(e) => {
                        setCreateLeadForm({ ...createLeadForm, email: e.target.value })
                        if (createLeadErrors.email) setCreateLeadErrors({ ...createLeadErrors, email: '' })
                      }}
                    />
                    {createLeadErrors.email && (
                      <span className="lead-modal-field-error">{createLeadErrors.email}</span>
                    )}
                  </div>

                  <div className="lead-modal-field">
                    <label>
                      Số điện thoại <span className="required-star">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`lead-modal-input ${createLeadErrors.phone ? 'has-error' : ''}`}
                      placeholder="0912 345 678"
                      value={createLeadForm.phone}
                      onChange={(e) => {
                        setCreateLeadForm({ ...createLeadForm, phone: e.target.value })
                        if (createLeadErrors.phone) setCreateLeadErrors({ ...createLeadErrors, phone: '' })
                      }}
                    />
                    {createLeadErrors.phone && (
                      <span className="lead-modal-field-error">{createLeadErrors.phone}</span>
                    )}
                  </div>
                </div>

                {/* Công ty & Ngành nghề */}
                <div className="lead-modal-grid-2">
                  <div className="lead-modal-field">
                    <label>Tên công ty / Doanh nghiệp</label>
                    <input
                      type="text"
                      className="lead-modal-input"
                      placeholder="Ví dụ: Công ty Cổ phần Xây dựng Việt Á"
                      value={createLeadForm.company}
                      onChange={(e) => setCreateLeadForm({ ...createLeadForm, company: e.target.value })}
                    />
                  </div>

                  <div className="lead-modal-field">
                    <label>Ngành nghề hoạt động</label>
                    <select
                      className="lead-modal-input"
                      value={createLeadForm.industry}
                      onChange={(e) => setCreateLeadForm({ ...createLeadForm, industry: e.target.value })}
                    >
                      <option value="Công nghệ thông tin & Viễn thông">Công nghệ thông tin & Viễn thông</option>
                      <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
                      <option value="Sản xuất & Chế tạo công nghiệp">Sản xuất & Chế tạo công nghiệp</option>
                      <option value="Tài chính - Ngân hàng - Bảo hiểm">Tài chính - Ngân hàng - Bảo hiểm</option>
                      <option value="Hàng tiêu dùng nhanh & Bán lẻ">Hàng tiêu dùng nhanh & Bán lẻ</option>
                      <option value="Giáo dục & Đào tạo">Giáo dục & Đào tạo</option>
                      <option value="Vận tải & Logistics">Vận tải & Logistics</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Nguồn Lead & Trạng thái ban đầu */}
                <div className="lead-modal-grid-2">
                  <div className="lead-modal-field">
                    <label>Nguồn Lead</label>
                    <select
                      className="lead-modal-input"
                      value={createLeadForm.source}
                      onChange={(e) =>
                        setCreateLeadForm({ ...createLeadForm, source: e.target.value as LeadSource })
                      }
                    >
                      <option value="MANUAL">Tạo thủ công</option>
                      <option value="EVENT">Hội thảo / Sự kiện ngành</option>
                      <option value="REFERRAL">Khách hàng cũ giới thiệu</option>
                      <option value="FACEBOOK">Facebook Ads</option>
                      <option value="GOOGLE">Google Ads</option>
                      <option value="OTHER">Nguồn khác</option>
                    </select>
                  </div>

                  <div className="lead-modal-field">
                    <label>Trạng thái ban đầu</label>
                    <select
                      className="lead-modal-input"
                      value={createLeadForm.status}
                      onChange={(e) =>
                        setCreateLeadForm({ ...createLeadForm, status: e.target.value as LeadStatus })
                      }
                    >
                      <option value="NEW">Mới tiếp nhận (Chưa gọi)</option>
                      <option value="CONTACTED">Đã liên hệ</option>
                      <option value="QUALIFIED">Đủ điều kiện BANT</option>
                    </select>
                  </div>
                </div>

                {/* Nhu cầu tư vấn */}
                <div className="lead-modal-field">
                  <label>Nhu cầu tư vấn / Bài toán của khách</label>
                  <textarea
                    rows={2}
                    className="lead-modal-textarea"
                    placeholder="Mô tả nhu cầu mua phần mềm, quy mô số lượng user hoặc các yêu cầu tính năng..."
                    value={createLeadForm.requirement}
                    onChange={(e) => setCreateLeadForm({ ...createLeadForm, requirement: e.target.value })}
                  />
                </div>

                {/* Ghi chú nội bộ */}
                <div className="lead-modal-field">
                  <label>Ghi chú nội bộ cho Sales</label>
                  <input
                    type="text"
                    className="lead-modal-input"
                    placeholder="Ví dụ: Giám đốc yêu cầu gọi lại vào 10h sáng thứ Ba"
                    value={createLeadForm.notes}
                    onChange={(e) => setCreateLeadForm({ ...createLeadForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="lead-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateLeadModalOpen(false)}
                  disabled={isSubmittingLead}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingLead}
                >
                  {isSubmittingLead ? 'Đang tạo...' : 'Tạo Lead ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── S4-01: Modal Tạo / Sửa Biểu mẫu ── */}
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

      {/* ── S4-01: Modal Lấy Mã Nhúng ── */}
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

      {/* ── Modal Xác nhận xóa Form ── */}
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

      {/* ── Modal Xác nhận xóa Lead ── */}
      {deletingLead && (
        <div className="lead-modal-backdrop" onClick={() => setDeletingLead(null)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lead-modal-header">
              <h3>Xác nhận xóa Lead</h3>
              <button
                type="button"
                className="lead-modal-close-btn"
                onClick={() => setDeletingLead(null)}
              >
                &times;
              </button>
            </div>
            <div className="lead-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa khách hàng tiềm năng <strong>{deletingLead.full_name}</strong> ({deletingLead.code}) không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingLead(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteLead}
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
