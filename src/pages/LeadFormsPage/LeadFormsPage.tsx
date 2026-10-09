import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { leadFormService } from '../../services/leadFormService.ts'
import { leadService } from '../../services/leadService.ts'
import { leadScoringService } from '../../services/leadScoringService.ts'
import { leadConversionService } from '../../services/leadConversionService.ts'
import { leadInteractionService } from '../../services/leadInteractionService.ts'
import { customerService } from '../../services/customerService.ts'
import { pipelineService } from '../../services/pipelineService.ts'
import type {
  LeadForm,
  LeadSubmission,
  CreateLeadFormPayload,
} from '../../types/leadForm.ts'
import type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadScoreTier,
  LeadSegment,
  LeadConversionPayload,
  LeadConversionResult,
  LeadInteraction,
  LeadInteractionType,
  CreateLeadPayload,
  ExcelLeadRow,
  ImportLeadResult,
} from '../../types/lead.ts'
import type { CustomerEnterprise } from '../../types/customer.ts'
import type { PipelineStage } from '../../types/pipeline.ts'
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

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
)

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
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

const IconTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const IconRefreshCw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconSliders = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
)

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
)

const IconTrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const LEAD_TIER_CONFIG: Record<LeadScoreTier, { label: string; emoji: string; className: string }> = {
  HOT: { label: 'Nóng (Hot)', emoji: '', className: 'hot' },
  WARM: { label: 'Ấm (Warm)', emoji: '', className: 'warm' },
  COLD: { label: 'Lạnh (Cold)', emoji: '', className: 'cold' },
}

const LEAD_SEGMENT_CONFIG: Record<LeadSegment, { label: string; className: string; icon: string }> = {
  ENTERPRISE_VIP: { label: 'Doanh nghiệp VIP', className: 'vip', icon: '' },
  HIGH_POTENTIAL: { label: 'Tiềm năng cao', className: 'potential', icon: '' },
  NURTURE: { label: 'Cần nuôi dưỡng', className: 'nurture', icon: '' },
  UNQUALIFIED: { label: 'Không phù hợp', className: 'unqualified', icon: '' },
  UNCLASSIFIED: { label: 'Chưa phân nhóm', className: 'unqualified', icon: '' },
}

export default function LeadFormsPage() {
  const { user } = useAuth()
  const canManageScoring = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [activeTab, setActiveTab] = useState<'LEADS_LIST' | 'LEAD_SCORING' | 'LEAD_CONVERSION' | 'LEAD_INTERACTIONS' | 'IMPORT_EXCEL' | 'FORMS' | 'SUBMISSIONS'>('LEADS_LIST')

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

  // ── S4-04: State cho Phân loại & Chấm điểm Lead ──
  const [scoreSearchQuery, setScoreSearchQuery] = useState('')
  const [scoreTierFilter, setScoreTierFilter] = useState<string>('ALL')
  const [scoreSegmentFilter, setScoreSegmentFilter] = useState<string>('ALL')

  // Modal Chi tiết Chấm điểm & Điều chỉnh Lead (S4-04)
  const [selectedLeadForScore, setSelectedLeadForScore] = useState<Lead | null>(null)
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [manualScoreInput, setManualScoreInput] = useState<number>(0)
  const [manualSegmentInput, setManualSegmentInput] = useState<LeadSegment>('HIGH_POTENTIAL')
  const [manualNotesInput, setManualNotesInput] = useState<string>('')
  const [isManualOverrideActive, setIsManualOverrideActive] = useState(false)
  const [isScoringActionLoading, setIsScoringActionLoading] = useState(false)
  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false)

  // ── S4-05: State cho Chuyển đổi Lead thành Khách hàng & Cơ hội ──
  const navigate = useNavigate()
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [conversionForm, setConversionForm] = useState<LeadConversionPayload>({
    lead_id: '',
    create_new_customer: true,
    customer_name: '',
    tax_code: '',
    industry: 'Công nghệ thông tin & Viễn thông',
    company_size: '10 - 50 nhân sự',
    address: '',
    website: '',
    phone: '',
    email: '',
    create_opportunity: true,
    opportunity_title: '',
    stage_id: 'stage-1',
    stage_name: 'Tiếp cận & Đánh giá',
    expected_revenue: 50000000,
    expected_close_date: '',
    win_probability: 20,
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    notes: '',
  })
  const [conversionErrors, setConversionErrors] = useState<Record<string, string>>({})
  const [isConverting, setIsConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<LeadConversionResult | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [existingCustomers, setExistingCustomers] = useState<CustomerEnterprise[]>([])
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])

  // ── S4-06: State cho Lịch sử tương tác với Lead ──
  const [selectedLeadForInteraction, setSelectedLeadForInteraction] = useState<Lead | null>(null)
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false)
  const [leadInteractions, setLeadInteractions] = useState<LeadInteraction[]>([])
  const [allRecentInteractions, setAllRecentInteractions] = useState<LeadInteraction[]>([])
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false)
  const [interactionFilter, setInteractionFilter] = useState<'ALL' | LeadInteractionType>('ALL')
  const [newInteractionType, setNewInteractionType] = useState<LeadInteractionType>('CALL')
  const [newInteractionTitle, setNewInteractionTitle] = useState('')
  const [newInteractionOutcome, setNewInteractionOutcome] = useState('Thành công - Quan tâm cao')
  const [newInteractionContent, setNewInteractionContent] = useState('')
  const [newInteractionNextAction, setNewInteractionNextAction] = useState('')
  const [newInteractionNextActionDue, setNewInteractionNextActionDue] = useState('')
  const [isSavingInteraction, setIsSavingInteraction] = useState(false)
  const [timelineSearchQuery, setTimelineSearchQuery] = useState('')

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
      const [fetchedLeads, fetchedForms, fetchedSubs, fetchedInteractions] = await Promise.all([
        leadService.getLeads(),
        leadFormService.getLeadForms(),
        leadFormService.getLeadSubmissions(),
        leadInteractionService.getAllRecentInteractions(),
      ])
      setLeads(fetchedLeads)
      setForms(fetchedForms)
      setSubmissions(fetchedSubs)
      setAllRecentInteractions(fetchedInteractions)
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

  // ── S4-04: Thống kê & Lọc Chấm điểm Lead ──
  const scoringStats = useMemo(() => {
    return leadScoringService.getScoringStats(leads)
  }, [leads])

  const filteredScoredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = scoreSearchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.phone.includes(q)

      const matchTier = scoreTierFilter === 'ALL' || l.score_tier === scoreTierFilter
      const matchSegment = scoreSegmentFilter === 'ALL' || l.segment === scoreSegmentFilter
      return matchSearch && matchTier && matchSegment
    })
  }, [leads, scoreSearchQuery, scoreTierFilter, scoreSegmentFilter])

  // Mở modal xem chi tiết điểm số Lead (S4-04)
  const handleOpenScoreModal = (lead: Lead) => {
    setSelectedLeadForScore(lead)
    setManualScoreInput(lead.score ?? 50)
    setManualSegmentInput(lead.segment || 'HIGH_POTENTIAL')
    setManualNotesInput(lead.scoring_notes || '')
    setIsManualOverrideActive(Boolean(lead.is_manually_scored))
    setIsScoreModalOpen(true)
  }

  // Chấm điểm lại cho 1 lead cụ thể (S4-04)
  const handleRecalculateSingleLead = async (leadId: string) => {
    try {
      setIsScoringActionLoading(true)
      const updated = await leadScoringService.recalculateLeadScore(leadId)
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      if (selectedLeadForScore?.id === leadId) {
        setSelectedLeadForScore(updated)
        setManualScoreInput(updated.score ?? 50)
        setManualSegmentInput(updated.segment || 'HIGH_POTENTIAL')
        setManualNotesInput(updated.scoring_notes || '')
        setIsManualOverrideActive(false)
      }
      showToast(`Đã tính lại điểm cho "${updated.full_name}": ${updated.score} điểm (${LEAD_TIER_CONFIG[updated.score_tier || 'WARM'].label})`)
    } catch {
      showToast('Không thể chấm lại điểm khách hàng tiềm năng', true)
    } finally {
      setIsScoringActionLoading(false)
    }
  }

  // Lưu điểm điều chỉnh thủ công (S4-04: Admin & Manager)
  const handleSaveManualScore = async () => {
    if (!selectedLeadForScore) return
    if (!canManageScoring) {
      showToast('Bạn không có quyền điều chỉnh điểm số hoặc phân loại lead', true)
      return
    }

    try {
      setIsScoringActionLoading(true)
      const updated = await leadScoringService.updateManualScore(selectedLeadForScore.id, {
        score: Number(manualScoreInput),
        segment: manualSegmentInput,
        scoring_notes: manualNotesInput,
        is_manually_scored: isManualOverrideActive,
      })
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setSelectedLeadForScore(updated)

      // Ghi nhận tương tác đổi điểm (S4-06)
      leadInteractionService
        .recordScoreChange(
          selectedLeadForScore.id,
          selectedLeadForScore.score ?? 50,
          Number(manualScoreInput),
          manualNotesInput,
          user?.full_name || 'Quản lý'
        )
        .then((act) => setAllRecentInteractions((prev) => [act, ...prev]))
        .catch(() => {})

      showToast(`Đã lưu phân loại và điểm số mới cho "${updated.full_name}"!`)
      setIsScoreModalOpen(false)
    } catch {
      showToast('Lỗi khi lưu điểm điều chỉnh', true)
    } finally {
      setIsScoringActionLoading(false)
    }
  }

  // Chấm điểm lại toàn bộ danh sách lead (S4-04)
  const handleRecalculateAll = async () => {
    if (!canManageScoring) {
      showToast('Chỉ Quản trị viên và Quản lý mới có quyền chấm lại điểm toàn bộ hệ thống', true)
      return
    }

    try {
      setIsRecalculatingAll(true)
      const updatedList = await leadScoringService.recalculateAllLeads()
      setLeads(updatedList)
      showToast(`Đã chấm điểm lại thành công cho tất cả ${updatedList.length} khách hàng tiềm năng!`)
    } catch {
      showToast('Lỗi khi chấm điểm lại toàn bộ danh sách', true)
    } finally {
      setIsRecalculatingAll(false)
    }
  }

  // ── S4-05: Chuyển đổi Lead thành Khách hàng & Cơ hội ──
  const handleOpenConvertModal = (lead: Lead) => {
    if (lead.status === 'CONVERTED') {
      showToast(`Lead "${lead.full_name}" đã được chuyển đổi sang Khách hàng trước đó!`, true)
      return
    }

    const customers = customerService.getCustomers()
    const stages = pipelineService.getStages()
    setExistingCustomers(customers)
    setPipelineStages(stages)

    const preview = leadConversionService.getConversionPreview(lead)
    setConvertingLead(lead)
    setConversionErrors({})

    setConversionForm({
      lead_id: lead.id,
      create_new_customer: true,
      customer_id: customers[0]?.id || '',
      customer_name: preview.default_customer_name,
      tax_code: '',
      industry: preview.lead_industry,
      company_size: '10 - 50 nhân sự',
      address: '',
      website: '',
      phone: preview.lead_phone,
      email: preview.lead_email,
      create_opportunity: true,
      opportunity_title: preview.default_opportunity_title,
      stage_id: preview.default_stage_id,
      stage_name: preview.default_stage_name,
      expected_revenue: preview.default_expected_revenue,
      expected_close_date: preview.default_close_date,
      win_probability: preview.default_win_probability,
      owner_id: lead.owner_id || 1,
      owner_name: lead.owner_name || 'Nguyễn Văn An',
      notes: lead.requirement || '',
    })

    setIsConvertModalOpen(true)
  }

  const handleConfirmConversion = async () => {
    if (!convertingLead) return

    // Validation
    const errs: Record<string, string> = {}
    if (conversionForm.create_new_customer) {
      if (!conversionForm.customer_name?.trim()) {
        errs.customer_name = 'Vui lòng nhập tên công ty / khách hàng'
      }
    } else {
      if (!conversionForm.customer_id) {
        errs.customer_id = 'Vui lòng chọn khách hàng trong CRM để liên kết'
      }
    }

    if (conversionForm.create_opportunity) {
      if (!conversionForm.opportunity_title?.trim()) {
        errs.opportunity_title = 'Vui lòng nhập tên cơ hội bán hàng'
      }
      if (!conversionForm.expected_close_date) {
        errs.expected_close_date = 'Vui lòng chọn ngày dự kiến chốt'
      } else {
        const todayStr = new Date().toISOString().split('T')[0]
        if (conversionForm.expected_close_date < todayStr) {
          errs.expected_close_date = 'Ngày dự kiến chốt không được ở trong quá khứ'
        }
      }
    }

    if (Object.keys(errs).length > 0) {
      setConversionErrors(errs)
      return
    }

    try {
      setIsConverting(true)
      const result = await leadConversionService.convertLead(conversionForm)

      // Cập nhật danh sách Leads
      setLeads((prev) =>
        prev.map((l) =>
          l.id === convertingLead.id
            ? {
                ...l,
                status: 'CONVERTED' as LeadStatus,
                converted_customer_id: result.customer?.id,
                converted_customer_name: result.customer?.name,
                converted_opportunity_id: result.opportunity?.id,
                converted_opportunity_title: result.opportunity?.title,
                converted_at: new Date().toISOString(),
              }
            : l
        )
      )

      setIsConvertModalOpen(false)
      setConversionResult(result)
      setIsSuccessModalOpen(true)
      showToast(result.message)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi chuyển đổi Lead', true)
    } finally {
      setIsConverting(false)
    }
  }

  // ── S4-06: Handlers cho Lịch sử tương tác với Lead ──
  const handleOpenInteractionModal = async (lead: Lead) => {
    setSelectedLeadForInteraction(lead)
    setIsInteractionModalOpen(true)
    setIsLoadingInteractions(true)
    setNewInteractionTitle('')
    setNewInteractionContent('')
    setNewInteractionNextAction('')
    setNewInteractionNextActionDue('')
    setNewInteractionType('CALL')
    setNewInteractionOutcome('Thành công - Quan tâm cao')
    setInteractionFilter('ALL')

    try {
      const items = await leadInteractionService.getInteractionsByLead(lead.id)
      setLeadInteractions(items)
    } catch {
      showToast('Lỗi khi tải lịch sử tương tác của Lead', true)
    } finally {
      setIsLoadingInteractions(false)
    }
  }

  const handleCreateInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeadForInteraction) return
    if (!newInteractionTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề tương tác', true)
      return
    }

    try {
      setIsSavingInteraction(true)
      const created = await leadInteractionService.createInteraction({
        lead_id: selectedLeadForInteraction.id,
        type: newInteractionType,
        title: newInteractionTitle,
        outcome: newInteractionOutcome,
        content: newInteractionContent,
        next_action: newInteractionNextAction,
        next_action_due: newInteractionNextActionDue,
        performed_by_id: user?.id ? Number(user.id) : 1,
        performed_by_name: user?.full_name || 'Nguyễn Văn An',
      })

      setLeadInteractions((prev) => [created, ...prev])
      setAllRecentInteractions((prev) => [created, ...prev])
      setNewInteractionTitle('')
      setNewInteractionContent('')
      setNewInteractionNextAction('')
      setNewInteractionNextActionDue('')
      showToast('Đã ghi nhận tương tác thành công!')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu tương tác', true)
    } finally {
      setIsSavingInteraction(false)
    }
  }

  const handleDeleteInteraction = async (interactionId: string) => {
    try {
      await leadInteractionService.deleteInteraction(interactionId)
      setLeadInteractions((prev) => prev.filter((item) => item.id !== interactionId))
      setAllRecentInteractions((prev) => prev.filter((item) => item.id !== interactionId))
      showToast('Đã xóa lịch sử tương tác')
    } catch {
      showToast('Không thể xóa tương tác này', true)
    }
  }

  const filteredLeadInteractions = useMemo(() => {
    return leadInteractions.filter((item) => {
      if (interactionFilter === 'ALL') return true
      return item.type === interactionFilter
    })
  }, [leadInteractions, interactionFilter])

  const filteredTimelineInteractions = useMemo(() => {
    return allRecentInteractions.filter((item) => {
      const matchFilter = interactionFilter === 'ALL' || item.type === interactionFilter
      const q = timelineSearchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        item.performed_by_name.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [allRecentInteractions, interactionFilter, timelineSearchQuery])

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
    const current = leads.find((l) => l.id === leadId)
    const oldStatus = current?.status || 'NEW'
    try {
      const updated = await leadService.updateLead(leadId, { status })
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))

      // Ghi nhận tương tác đổi trạng thái (S4-06)
      leadInteractionService
        .recordStatusChange(leadId, oldStatus, status, user?.full_name || 'Nhân viên kinh doanh')
        .then((act) => setAllRecentInteractions((prev) => [act, ...prev]))
        .catch(() => {})

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
            <span>Tạo Lead thủ công</span>
          </button>

          {/* Nút Chuyển sang Tab Nhập Excel */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('IMPORT_EXCEL')}
            id="btn-nav-import-excel"
          >
            <span>Nhập từ Excel</span>
          </button>

          {/* Nút Xem chấm điểm & phân loại (S4-04) */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('LEAD_SCORING')}
            id="btn-nav-lead-scoring"
            title="Xem bảng xếp hạng điểm và phân loại Lead"
          >
            <span>Chấm điểm Lead</span>
          </button>

          {/* Nút Chuyển đổi Lead sang Khách hàng & Cơ hội (S4-05) */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('LEAD_CONVERSION')}
            id="btn-nav-lead-conversion"
            title="Chuyển đổi Lead thành Khách hàng và Cơ hội bán hàng"
            style={{ color: '#1d4ed8', borderColor: '#93c5fd', background: '#eff6ff' }}
          >
            <span>Chuyển đổi Lead (S4-05)</span>
          </button>

          {/* Nút Dòng thời gian tương tác (S4-06) */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('LEAD_INTERACTIONS')}
            id="btn-nav-lead-interactions"
            title="Xem toàn bộ lịch sử tương tác và chăm sóc Lead"
          >
            <span>Dòng thời gian tương tác</span>
          </button>

          {/* Nút Xuất Excel */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => leadService.exportLeadsToExcel(leads)}
            title="Xuất danh sách Lead ra file Excel"
          >
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
          id="tab-btn-leads-list"
        >
          <span>Danh sách Lead tổng hợp</span>
          <span className="tab-badge">{leads.length}</span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'LEAD_SCORING' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEAD_SCORING')}
          id="tab-btn-lead-scoring"
        >
          <span>Chấm điểm & Phân loại (S4-04)</span>
          <span className="tab-badge primary">
            {scoringStats.hotCount} Nóng
          </span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'LEAD_CONVERSION' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEAD_CONVERSION')}
          id="tab-btn-lead-conversion"
        >
          <span>Chuyển đổi Lead (S4-05)</span>
          <span className="tab-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
            {stats.convertedLeads} đã chuyển
          </span>
        </button>

        <button
          type="button"
          className={`lead-tab-btn ${activeTab === 'LEAD_INTERACTIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('LEAD_INTERACTIONS')}
          id="tab-btn-lead-interactions"
        >
          <span>Dòng thời gian tương tác (S4-06)</span>
          <span className="tab-badge" style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}>
            {allRecentInteractions.length} hoạt động
          </span>
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
              <h4>Không tìm thấy khách hàng tiềm năng nào</h4>
              <p>Bạn có thể tạo lead thủ công hoặc tải file Excel lên để nhập hàng loạt vào hệ thống.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreateLeadModalOpen(true)}
                >
                  <span>Tạo Lead thủ công</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('IMPORT_EXCEL')}
                >
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
                    <th style={{ width: '140px', textAlign: 'center' }}>Điểm & Phân loại</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '155px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l) => {
                    const statusCfg = LEAD_STATUS_CONFIG[l.status]
                    const tier = l.score_tier || 'WARM'
                    const seg = l.segment || 'HIGH_POTENTIAL'
                    const segCfg = LEAD_SEGMENT_CONFIG[seg]
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
                          <button
                            type="button"
                            className="lead-score-btn-cell"
                            onClick={() => handleOpenScoreModal(l)}
                            title="Xem chi tiết phân tích điểm & tiêu chí"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <span className={`lead-score-pill ${tier.toLowerCase()}`}>
                                {l.score ?? 50}đ
                              </span>
                              {l.segment && (
                                <span className={`lead-segment-badge ${segCfg?.className || 'unqualified'}`}>
                                  {segCfg?.label}
                                </span>
                              )}
                            </div>
                          </button>
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {/* Nút Chuyển đổi (S4-05) */}
                            {l.status === 'CONVERTED' ? (
                              <span
                                className="tab-badge"
                                style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontSize: '11px', cursor: 'default' }}
                                title={`Đã chuyển đổi sang Khách hàng: ${l.converted_customer_name || 'Khách hàng CRM'}`}
                              >
                                Đã chuyển
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-action-icon"
                                style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                                onClick={() => handleOpenConvertModal(l)}
                                title="Chuyển đổi thành Khách hàng & Cơ hội (S4-05)"
                                id={`btn-convert-lead-${l.id}`}
                              >
                                <IconUserCheck />
                              </button>
                            )}

                            {/* Nút Xem lịch sử tương tác (S4-06) */}
                            <button
                              type="button"
                              className="btn-action-icon"
                              style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                              onClick={() => handleOpenInteractionModal(l)}
                              title="Lịch sử tương tác & Chăm sóc Lead (S4-06)"
                              id={`btn-interactions-lead-${l.id}`}
                            >
                              <IconHistory />
                            </button>

                            {/* Nút Chấm điểm */}
                            <button
                              type="button"
                              className="btn-action-icon edit"
                              onClick={() => handleOpenScoreModal(l)}
                              title="Xem chi tiết & Điều chỉnh điểm số"
                              id={`btn-score-lead-${l.id}`}
                            >
                              <IconTarget />
                            </button>

                            {/* Nút Xóa */}
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              onClick={() => setDeletingLead(l)}
                              title="Xóa Lead này"
                              id={`btn-delete-lead-${l.id}`}
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PHÂN LOẠI & CHẤM ĐIỂM LEAD (USER STORY S4-04)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'LEAD_SCORING' && (
        <div className="lead-card-panel lead-scoring-panel" id="lead-scoring-panel">
          {/* Header Panel */}
          <div className="lead-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Phân loại & Chấm điểm Khách hàng Tiềm năng (S4-04)</h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                Hệ thống đánh giá chất lượng Lead tự động theo 3 trụ cột (Hồ sơ Doanh nghiệp, Nhu cầu tư vấn, Kênh tiếp cận) và hỗ trợ Quản lý điều chỉnh điểm thủ công.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {canManageScoring && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRecalculateAll}
                  disabled={isRecalculatingAll}
                  id="btn-recalculate-all-scores"
                  title="Chấm điểm lại tất cả khách hàng dựa trên dữ liệu mới nhất"
                >
                  <IconRefreshCw />
                  <span>{isRecalculatingAll ? 'Đang chấm lại toàn bộ...' : 'Chấm lại tất cả'}</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="scoring-summary-cards">
            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value">{scoringStats.averageScore} / 100</span>
                <span className="scoring-stat-label">Điểm trung bình hệ thống</span>
              </div>
            </div>

            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value" style={{ color: '#dc2626' }}>{scoringStats.hotCount}</span>
                <span className="scoring-stat-label">Khách Nóng (Hot &ge; 70đ)</span>
              </div>
            </div>

            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value" style={{ color: '#d97706' }}>{scoringStats.warmCount}</span>
                <span className="scoring-stat-label">Khách Ấm (Warm 40-69đ)</span>
              </div>
            </div>

            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value" style={{ color: '#64748b' }}>{scoringStats.coldCount}</span>
                <span className="scoring-stat-label">Khách Lạnh (Cold &lt; 40đ)</span>
              </div>
            </div>

            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value" style={{ color: '#7e22ce' }}>{scoringStats.vipCount}</span>
                <span className="scoring-stat-label">Doanh nghiệp VIP</span>
              </div>
            </div>
          </div>

          {/* Toolbar / Filters */}
          <div className="lead-table-toolbar">
            <div className="lead-search-box">
              <IconSearch />
              <input
                type="text"
                placeholder="Tìm theo tên, email, công ty, mã lead..."
                value={scoreSearchQuery}
                onChange={(e) => setScoreSearchQuery(e.target.value)}
                id="input-score-search"
              />
            </div>

            <div className="lead-filters-group">
              <select
                className="lead-select-filter"
                value={scoreTierFilter}
                onChange={(e) => setScoreTierFilter(e.target.value)}
                id="select-filter-score-tier"
              >
                <option value="ALL">Tất cả phân hạng điểm</option>
                <option value="HOT">Khách Nóng (Hot &ge; 70đ)</option>
                <option value="WARM">Khách Ấm (Warm 40-69đ)</option>
                <option value="COLD">Khách Lạnh (Cold &lt; 40đ)</option>
              </select>

              <select
                className="lead-select-filter"
                value={scoreSegmentFilter}
                onChange={(e) => setScoreSegmentFilter(e.target.value)}
                id="select-filter-score-segment"
              >
                <option value="ALL">Tất cả nhóm phân loại</option>
                <option value="ENTERPRISE_VIP">Doanh nghiệp VIP</option>
                <option value="HIGH_POTENTIAL">Tiềm năng cao</option>
                <option value="NURTURE">Cần nuôi dưỡng</option>
                <option value="UNQUALIFIED">Không phù hợp</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="lead-loading-box">
              <div className="lead-spinner" />
              <span>Đang tính toán ma trận điểm khách hàng tiềm năng...</span>
            </div>
          ) : filteredScoredLeads.length === 0 ? (
            <div className="lead-empty-state">
              <h4>Không tìm thấy khách hàng tiềm năng nào phù hợp bộ lọc</h4>
              <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phân hạng/nhóm.</p>
            </div>
          ) : (
            <div className="lead-table-responsive">
              <table className="lead-data-table" id="table-lead-scoring">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>Mã Lead</th>
                    <th>Họ và tên & Liên hệ</th>
                    <th>Công ty & Ngành</th>
                    <th style={{ width: '130px' }}>Nguồn Lead</th>
                    <th style={{ width: '160px' }}>Điểm số & Mức độ</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Phân hạng</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Phân nhóm</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Cách chấm</th>
                    <th style={{ width: '195px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScoredLeads.map((l) => {
                    const tier = l.score_tier || 'WARM'
                    const tierCfg = LEAD_TIER_CONFIG[tier]
                    const seg = l.segment || 'HIGH_POTENTIAL'
                    const segCfg = LEAD_SEGMENT_CONFIG[seg]
                    const score = l.score ?? 50
                    return (
                      <tr key={l.id} id={`score-row-${l.id}`}>
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
                            <span className="lead-company-text">{l.company || <span style={{ color: '#94a3b8' }}>—</span>}</span>
                            {l.industry && <span style={{ fontSize: '11.5px', color: '#64748b' }}>{l.industry}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="lead-source-tag">{LEAD_SOURCE_LABELS[l.source] || l.source}</span>
                        </td>
                        <td>
                          <div className="score-cell-wrapper">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{score}/100</strong>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                {tier === 'HOT' ? 'Ưu tiên gọi' : tier === 'WARM' ? 'Theo dõi' : 'Lưu trữ'}
                              </span>
                            </div>
                            <div className="score-progress-bar-bg">
                              <div
                                className={`score-progress-bar-fill ${tier.toLowerCase()}`}
                                style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`lead-score-pill ${tier.toLowerCase()}`}>
                            {tierCfg.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`lead-segment-badge ${segCfg?.className || 'unqualified'}`}>
                            {segCfg?.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '11.5px', color: l.is_manually_scored ? '#7e22ce' : '#0369a1', fontWeight: 600 }}>
                            {l.is_manually_scored ? 'Thủ công' : 'AI / Quy tắc'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {/* Nút Chuyển đổi (S4-05) */}
                            {l.status === 'CONVERTED' ? (
                              <span
                                className="tab-badge"
                                style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontSize: '11px', cursor: 'default' }}
                              >
                                Đã chuyển
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-action-icon"
                                style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                                onClick={() => handleOpenConvertModal(l)}
                                title="Chuyển đổi thành Khách hàng & Cơ hội (S4-05)"
                                id={`btn-convert-score-lead-${l.id}`}
                              >
                                <IconUserCheck />
                              </button>
                            )}

                            {/* Nút Xem lịch sử tương tác (S4-06) */}
                            <button
                              type="button"
                              className="btn-action-icon"
                              style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                              onClick={() => handleOpenInteractionModal(l)}
                              title="Lịch sử tương tác & Chăm sóc Lead (S4-06)"
                              id={`btn-interactions-score-lead-${l.id}`}
                            >
                              <IconHistory />
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenScoreModal(l)}
                              title="Xem chi tiết các tiêu chí và điều chỉnh điểm"
                              id={`btn-open-score-modal-${l.id}`}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              <IconSliders />
                              <span>Chi tiết</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action-icon edit"
                              onClick={() => handleRecalculateSingleLead(l.id)}
                              title="Chấm lại điểm theo quy tắc"
                              id={`btn-recalc-score-${l.id}`}
                            >
                              <IconRefreshCw />
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: CHUYỂN ĐỔI LEAD SANG KHÁCH HÀNG & CƠ HỘI (USER STORY S4-05)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'LEAD_CONVERSION' && (
        <div className="lead-card-panel lead-scoring-panel" id="panel-lead-conversion">
          <div className="scoring-summary-cards">
            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value">{stats.convertedLeads}</span>
                <span className="scoring-stat-label">Lead đã chuyển đổi thành công</span>
              </div>
            </div>
            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value">
                  {leads.filter((l) => l.status === 'QUALIFIED' || l.score_tier === 'HOT').length}
                </span>
                <span className="scoring-stat-label">Lead đủ tiêu chuẩn (BANT / Hot)</span>
              </div>
            </div>
            <div className="scoring-stat-card">
              <div className="scoring-stat-info">
                <span className="scoring-stat-value">
                  {leads.length > 0 ? Math.round((stats.convertedLeads / leads.length) * 100) : 0}%
                </span>
                <span className="scoring-stat-label">Tỷ lệ chuyển đổi tổng thể</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                  Khách hàng tiềm năng sẵn sàng chuyển đổi
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Bấm "Chuyển đổi" để tạo hồ sơ Khách hàng doanh nghiệp trong danh bạ và tạo Cơ hội bán hàng (Opportunity) vào Pipeline.
                </p>
              </div>
            </div>

            <div className="lead-table-container">
              <table className="lead-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Mã Lead</th>
                    <th style={{ width: '220px' }}>Khách hàng tiềm năng</th>
                    <th style={{ width: '220px' }}>Doanh nghiệp / Nhu cầu</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Điểm & Phân hạng</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '170px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.filter((l) => l.status !== 'CONVERTED').map((l) => {
                    const statusCfg = LEAD_STATUS_CONFIG[l.status]
                    return (
                      <tr key={l.id}>
                        <td><span className="lead-code-tag">{l.code}</span></td>
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
                          <div>
                            <span className="lead-company-text">{l.company || 'Cá nhân'}</span>
                            <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                              {l.requirement || 'Nhu cầu chung'}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`lead-score-pill ${l.score_tier?.toLowerCase() || 'warm'}`}>
                            {l.score ?? 50}đ
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="tab-badge"
                            style={{ backgroundColor: statusCfg?.bg || '#eff6ff', color: statusCfg?.color || '#1e40af', borderColor: statusCfg?.border || '#bfdbfe' }}
                          >
                            {statusCfg?.label || l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenConvertModal(l)}
                            id={`btn-tab-convert-${l.id}`}
                            style={{ padding: '5px 12px', fontSize: '12px' }}
                          >
                            <IconUserCheck />
                            <span>Chuyển đổi ngay</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Danh sách Lead đã chuyển đổi thành công */}
            {leads.filter((l) => l.status === 'CONVERTED').length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Lịch sử Lead đã chuyển đổi thành công ({leads.filter((l) => l.status === 'CONVERTED').length})</span>
                </h4>
                <div className="lead-table-container">
                  <table className="lead-table">
                    <thead>
                      <tr>
                        <th style={{ width: '100px' }}>Mã Lead</th>
                        <th style={{ width: '200px' }}>Lead nguồn</th>
                        <th style={{ width: '220px' }}>Khách hàng CRM đã tạo</th>
                        <th style={{ width: '220px' }}>Cơ hội bán hàng đã tạo</th>
                        <th style={{ width: '150px' }}>Thời gian chuyển</th>
                        <th style={{ width: '140px', textAlign: 'center' }}>Liên kết nhanh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.filter((l) => l.status === 'CONVERTED').map((l) => (
                        <tr key={l.id}>
                          <td><span className="lead-code-tag">{l.code}</span></td>
                          <td><strong>{l.full_name}</strong></td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#1d4ed8' }}>
                              {l.converted_customer_name || 'Khách hàng CRM'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#7c3aed' }}>
                              {l.converted_opportunity_title || 'Cơ hội mới'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>
                            {l.converted_at ? new Date(l.converted_at).toLocaleString('vi-VN') : 'Hôm nay'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate('/dashboard/customers')}
                              style={{ fontSize: '11px', padding: '3px 8px' }}
                            >
                              Xem CRM →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: DÒNG THỜI GIAN TƯƠNG TÁC TỔNG HỢP (USER STORY S4-06)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'LEAD_INTERACTIONS' && (
        <div className="lead-card-panel lead-interaction-panel">
          <div className="lead-panel-controls">
            <div className="lead-search-box">
              <IconSearch />
              <input
                type="text"
                placeholder="Tìm hoạt động theo tiêu đề, nội dung hoặc người thực hiện..."
                value={timelineSearchQuery}
                onChange={(e) => setTimelineSearchQuery(e.target.value)}
                id="input-search-timeline"
              />
            </div>

            <div className="interaction-filter-tabs">
              <button
                type="button"
                className={`interaction-filter-tab ${interactionFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setInteractionFilter('ALL')}
              >
                Tất cả ({allRecentInteractions.length})
              </button>
              <button
                type="button"
                className={`interaction-filter-tab ${interactionFilter === 'CALL' ? 'active' : ''}`}
                onClick={() => setInteractionFilter('CALL')}
              >
                Cuộc gọi
              </button>
              <button
                type="button"
                className={`interaction-filter-tab ${interactionFilter === 'EMAIL' ? 'active' : ''}`}
                onClick={() => setInteractionFilter('EMAIL')}
              >
                Email
              </button>
              <button
                type="button"
                className={`interaction-filter-tab ${interactionFilter === 'MEETING' ? 'active' : ''}`}
                onClick={() => setInteractionFilter('MEETING')}
              >
                Cuộc họp
              </button>
              <button
                type="button"
                className={`interaction-filter-tab ${interactionFilter === 'NOTE' ? 'active' : ''}`}
                onClick={() => setInteractionFilter('NOTE')}
              >
                Ghi chú
              </button>
              <button
                type="button"
                className={`interaction-filter-tab ${interactionFilter === 'STATUS_CHANGE' || interactionFilter === 'SYSTEM' ? 'active' : ''}`}
                onClick={() => setInteractionFilter('STATUS_CHANGE')}
              >
                Hệ thống & Trạng thái
              </button>
            </div>
          </div>

          {filteredTimelineInteractions.length === 0 ? (
            <div className="lead-empty-state">
              <h4>Không có hoạt động tương tác nào phù hợp</h4>
              <p>Chưa có ghi nhận cuộc gọi, email hoặc cập nhật trạng thái nào theo điều kiện tìm kiếm.</p>
            </div>
          ) : (
            <div className="interaction-timeline">
              {filteredTimelineInteractions.map((act) => {
                const leadFound = leads.find((l) => l.id === act.lead_id)
                const getIconAndClass = () => {
                  switch (act.type) {
                    case 'CALL':
                      return { icon: <IconPhone />, cls: 'call' }
                    case 'EMAIL':
                      return { icon: <IconMail />, cls: 'email' }
                    case 'MEETING':
                      return { icon: <IconCalendar />, cls: 'meeting' }
                    case 'NOTE':
                      return { icon: <IconFileText />, cls: 'note' }
                    case 'STATUS_CHANGE':
                      return { icon: '', cls: 'status_change' }
                    case 'SCORE_UPDATE':
                      return { icon: '', cls: 'score_update' }
                    default:
                      return { icon: '', cls: 'system' }
                  }
                }
                const { icon, cls } = getIconAndClass()

                return (
                  <div key={act.id} className="interaction-timeline-item" id={`timeline-act-${act.id}`}>
                    <div className={`interaction-icon-badge ${cls}`}>{icon}</div>

                    <div className="interaction-card">
                      <div className="interaction-card-header">
                        <div className="interaction-card-title-group">
                          <span className="interaction-card-title">{act.title}</span>
                          <div className="interaction-card-meta">
                            <span>{act.performed_by_name}</span>
                            <span>•</span>
                            <span>
                              {new Date(act.performed_at).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {leadFound && (
                              <>
                                <span>•</span>
                                <span
                                  style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                                  onClick={() => handleOpenInteractionModal(leadFound)}
                                  title="Xem toàn bộ tương tác của Lead này"
                                >
                                  {leadFound.full_name} ({leadFound.code})
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {act.outcome && (
                            <span className={`interaction-outcome-tag ${act.outcome.includes('Thành công') ? 'success' : ''}`}>
                              {act.outcome}
                            </span>
                          )}
                          <button
                            type="button"
                            className="interaction-delete-btn"
                            onClick={() => handleDeleteInteraction(act.id)}
                            title="Xóa hoạt động này"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>

                      {act.content && (
                        <div className="interaction-card-body">{act.content}</div>
                      )}

                      {act.next_action && (
                        <div className="interaction-next-action">
                          <span className="interaction-next-action-text">
                            <span>Việc tiếp theo:</span> {act.next_action}
                          </span>
                          {act.next_action_due && (
                            <span className="interaction-next-action-due">
                              Hạn: {new Date(act.next_action_due).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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
                                  {e}
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
              <h4>Không tìm thấy biểu mẫu nào</h4>
              <p>Hãy tạo biểu mẫu mới để lấy mã nhúng iFrame hoặc liên kết thu thập thông tin khách hàng.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreateModal}
                style={{ marginTop: '12px' }}
              >
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
                    <strong>Cách dùng:</strong> Sao chép đoạn mã iFrame bên dưới và dán vào vị trí bạn muốn hiển thị trên website WordPress, Webflow, Landing Page hoặc trang HTML tĩnh. Form sẽ tự động co giãn và thu thập dữ liệu về CRM.
                  </p>
                )}
                {embedType === 'HTML' && (
                  <p>
                    <strong>Cách dùng:</strong> Dành cho Lập trình viên muốn tùy biến hoàn toàn mã HTML và giao diện CSS theo phong cách riêng của website.
                  </p>
                )}
                {embedType === 'LINK' && (
                  <p>
                    <strong>Cách dùng:</strong> Sử dụng đường link độc lập này để gửi trực tiếp cho khách qua Zalo, Messenger, Email hoặc chèn vào nút kêu gọi hành động (CTA).
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

      {/* ── S4-04: Modal Chi tiết Chấm điểm & Điều chỉnh Lead ── */}
      {isScoreModalOpen && selectedLeadForScore && (
        <div className="lead-modal-backdrop" onClick={() => setIsScoreModalOpen(false)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '680px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
            id="modal-score-detail"
          >
            <div className="lead-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconTarget />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>
                    Chi tiết Chấm điểm & Phân loại Lead
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {selectedLeadForScore.full_name} — {selectedLeadForScore.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="lead-modal-close-btn"
                onClick={() => setIsScoreModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="score-modal-body">
              {/* Banner Overview */}
              <div className="score-overview-banner">
                <div className="score-gauge-box">
                  <div className={`score-big-circle ${(selectedLeadForScore.score_tier || 'WARM').toLowerCase()}`}>
                    <span>{selectedLeadForScore.score ?? 50}</span>
                    <span className="score-circle-sub">/ 100đ</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`lead-score-pill ${(selectedLeadForScore.score_tier || 'WARM').toLowerCase()}`}>
                        {LEAD_TIER_CONFIG[selectedLeadForScore.score_tier || 'WARM']?.label}
                      </span>
                      {selectedLeadForScore.segment && (
                        <span className={`lead-segment-badge ${(LEAD_SEGMENT_CONFIG[selectedLeadForScore.segment]?.className || 'unqualified')}`}>
                          {LEAD_SEGMENT_CONFIG[selectedLeadForScore.segment]?.label}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#475569' }}>
                      {selectedLeadForScore.is_manually_scored
                        ? 'Điểm số và phân nhóm được điều chỉnh thủ công bởi quản trị viên.'
                        : 'Điểm số được hệ thống tự động tính toán dựa trên dữ liệu BANT và hành vi.'}
                    </p>
                    {selectedLeadForScore.last_scored_at && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Lần chấm gần nhất: {new Date(selectedLeadForScore.last_scored_at).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRecalculateSingleLead(selectedLeadForScore.id)}
                  disabled={isScoringActionLoading}
                  title="Tính lại điểm số tự động theo quy tắc hệ thống"
                >
                  <IconRefreshCw />
                  <span>{isScoringActionLoading ? 'Đang tính...' : 'Chấm lại'}</span>
                </button>
              </div>

              {/* 3 Pillars Score Breakdown */}
              <div className="score-pillars-grid">
                <div className="score-pillar-card">
                  <span className="score-pillar-title">1. Hồ sơ Doanh nghiệp</span>
                  <span className="score-pillar-pts">
                    {selectedLeadForScore.score_breakdown?.demographic_score ?? 15}{' '}
                    <span style={{ fontSize: '12px', color: '#64748b' }}>/ 35đ</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedLeadForScore.company ? selectedLeadForScore.company : 'Cá nhân (Chưa có cty)'}
                  </span>
                </div>

                <div className="score-pillar-card">
                  <span className="score-pillar-title">2. Nhu cầu & Tương tác</span>
                  <span className="score-pillar-pts">
                    {selectedLeadForScore.score_breakdown?.engagement_score ?? 20}{' '}
                    <span style={{ fontSize: '12px', color: '#64748b' }}>/ 40đ</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedLeadForScore.requirement ? 'Đã có mô tả nhu cầu' : 'Chưa có nhu cầu cụ thể'}
                  </span>
                </div>

                <div className="score-pillar-card">
                  <span className="score-pillar-title">3. Kênh tiếp cận</span>
                  <span className="score-pillar-pts">
                    {selectedLeadForScore.score_breakdown?.source_score ?? 15}{' '}
                    <span style={{ fontSize: '12px', color: '#64748b' }}>/ 25đ</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {LEAD_SOURCE_LABELS[selectedLeadForScore.source] || selectedLeadForScore.source}
                  </span>
                </div>
              </div>

              {/* Score Reasons List */}
              <div className="score-reasons-container">
                <h4 className="score-reasons-title">
                  <span>Tiêu chí đánh giá & Cộng/Trừ điểm chi tiết</span>
                </h4>
                {selectedLeadForScore.score_breakdown?.reasons && selectedLeadForScore.score_breakdown.reasons.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedLeadForScore.score_breakdown.reasons.map((r, idx) => (
                      <div key={idx} className={`score-reason-item ${r.type.toLowerCase()}`}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{r.criterion}</strong>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569' }}>
                            {r.description}
                          </p>
                        </div>
                        <span className={`score-pts-badge ${r.type.toLowerCase()}`}>
                          {r.points > 0 ? `+${r.points}đ` : `${r.points}đ`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Chưa có lịch sử các tiêu chí chi tiết. Hãy bấm "Chấm lại" để hệ thống phân tích.
                  </p>
                )}
              </div>

              {/* Manual Override Section (Quản lý & Quản trị viên) */}
              <div className="manual-override-panel">
                <div className="manual-override-header">
                  <h4 className="manual-override-title">
                    <IconSliders />
                    <span>Điều chỉnh điểm & Phân nhóm thủ công (Dành cho Quản lý)</span>
                  </h4>
                  {canManageScoring && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#6b21a8', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={isManualOverrideActive}
                        onChange={(e) => setIsManualOverrideActive(e.target.checked)}
                        id="checkbox-enable-manual-scoring"
                      />
                      <span>Bật can thiệp thủ công</span>
                    </label>
                  )}
                </div>

                {isManualOverrideActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="manual-override-inputs">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          Điểm số tùy chỉnh (0 - 100): <strong>{manualScoreInput}đ</strong>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={manualScoreInput}
                            onChange={(e) => setManualScoreInput(Number(e.target.value))}
                            style={{ flex: 1 }}
                            id="input-range-manual-score"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={manualScoreInput}
                            onChange={(e) => setManualScoreInput(Math.min(100, Math.max(0, Number(e.target.value))))}
                            style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            id="input-number-manual-score"
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          Nhóm phân loại mục tiêu:
                        </label>
                        <select
                          className="form-control"
                          value={manualSegmentInput}
                          onChange={(e) => setManualSegmentInput(e.target.value as LeadSegment)}
                          style={{ padding: '7px 10px', fontSize: '13px' }}
                          id="select-manual-segment"
                        >
                          <option value="ENTERPRISE_VIP">Doanh nghiệp VIP</option>
                          <option value="HIGH_POTENTIAL">Tiềm năng cao</option>
                          <option value="NURTURE">Cần nuôi dưỡng</option>
                          <option value="UNQUALIFIED">Không phù hợp</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                        Ghi chú lý do điều chỉnh:
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Khách vừa gọi xác nhận ngân sách lớn, nâng lên nhóm VIP..."
                        value={manualNotesInput}
                        onChange={(e) => setManualNotesInput(e.target.value)}
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                        id="input-manual-scoring-notes"
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b21a8' }}>
                    {canManageScoring
                      ? 'Tích chọn "Bật can thiệp thủ công" nếu bạn muốn ghi đè điểm số hoặc thay đổi nhóm phân loại cho lead này.'
                      : 'Chỉ Quản lý (Manager) và Quản trị viên (Admin) mới có quyền can thiệp điểm số và phân nhóm.'}
                  </p>
                )}
              </div>
            </div>

            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsScoreModalOpen(false)}
              >
                Đóng
              </button>
              {canManageScoring && isManualOverrideActive && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveManualScore}
                  disabled={isScoringActionLoading}
                  id="btn-save-manual-score"
                >
                  <IconCheck />
                  <span>{isScoringActionLoading ? 'Đang lưu...' : 'Lưu điểm & Phân loại'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL S4-05: CHUYỂN ĐỔI LEAD THÀNH KHÁCH HÀNG & CƠ HỘI
          ───────────────────────────────────────────────────────────── */}
      {isConvertModalOpen && convertingLead && (
        <div className="lead-modal-backdrop" onClick={() => !isConverting && setIsConvertModalOpen(false)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '840px' }}
            onClick={(e) => e.stopPropagation()}
            id="modal-convert-lead"
          >
            <div className="lead-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: '#2563eb' }}><IconUserCheck /></div>
                <h3 className="lead-modal-title">Chuyển đổi Khách hàng tiềm năng</h3>
              </div>
              <button
                type="button"
                className="lead-modal-close"
                onClick={() => !isConverting && setIsConvertModalOpen(false)}
              >
                <IconX />
              </button>
            </div>

            <div className="convert-modal-body">
              {/* Thẻ tóm tắt Lead */}
              <div className="convert-preview-card">
                <div className="convert-preview-header">
                  <div className="convert-preview-title">
                    <span>Khách hàng tiềm năng: <strong>{convertingLead.full_name}</strong></span>
                    <span className={`lead-status-badge ${convertingLead.status.toLowerCase()}`}>
                      {LEAD_STATUS_CONFIG[convertingLead.status]?.label || convertingLead.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`lead-score-pill ${convertingLead.score_tier?.toLowerCase() || 'warm'}`}>
                      {convertingLead.score ?? 50}đ
                    </span>
                    <span className={`lead-segment-badge ${convertingLead.segment ? LEAD_SEGMENT_CONFIG[convertingLead.segment]?.className : 'potential'}`}>
                      {convertingLead.segment ? LEAD_SEGMENT_CONFIG[convertingLead.segment]?.label : 'Tiềm năng cao'}
                    </span>
                  </div>
                </div>

                <div className="convert-preview-grid">
                  <div className="convert-preview-item">
                    <span className="lbl">Số điện thoại</span>
                    <span className="val">{convertingLead.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="convert-preview-item">
                    <span className="lbl">Email</span>
                    <span className="val">{convertingLead.email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="convert-preview-item">
                    <span className="lbl">Công ty / Doanh nghiệp</span>
                    <span className="val">{convertingLead.company || 'Chưa có thông tin công ty'}</span>
                  </div>
                  <div className="convert-preview-item">
                    <span className="lbl">Nhu cầu tư vấn</span>
                    <span className="val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {convertingLead.requirement || 'Nhu cầu chung'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mục 1: Thông tin Khách hàng Doanh nghiệp */}
              <div className="convert-section-panel">
                <h4 className="convert-section-title">
                  <span>1. Khách hàng trong CRM (Doanh nghiệp)</span>
                </h4>

                <div className="convert-radio-group">
                  <label className={`convert-radio-label ${conversionForm.create_new_customer ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="customer_action"
                      checked={conversionForm.create_new_customer}
                      onChange={() => setConversionForm((prev) => ({ ...prev, create_new_customer: true }))}
                    />
                    <div>
                      <div><strong>Tạo hồ sơ Khách hàng mới</strong></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Tạo tài khoản Doanh nghiệp mới từ thông tin của Lead này vào danh bạ khách hàng
                      </div>
                    </div>
                  </label>

                  <label className={`convert-radio-label ${!conversionForm.create_new_customer ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="customer_action"
                      checked={!conversionForm.create_new_customer}
                      onChange={() => setConversionForm((prev) => ({ ...prev, create_new_customer: false }))}
                    />
                    <div>
                      <div><strong>Liên kết vào Khách hàng đã có sẵn</strong></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Gắn Lead này như một liên hệ hoặc cơ hội mới vào một doanh nghiệp đã có trong hệ thống
                      </div>
                    </div>
                  </label>
                </div>

                {conversionForm.create_new_customer ? (
                  <div className="convert-form-grid">
                    <div className="form-group">
                      <label>Tên Doanh nghiệp / Tổ chức *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập tên doanh nghiệp..."
                        value={conversionForm.customer_name || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                        id="input-convert-customer-name"
                      />
                      {conversionErrors.customer_name && (
                        <div className="field-error">{conversionErrors.customer_name}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Mã số thuế</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: 0101234567"
                        value={conversionForm.tax_code || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, tax_code: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Lĩnh vực ngành nghề</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Công nghệ thông tin..."
                        value={conversionForm.industry || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, industry: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Quy mô nhân sự</label>
                      <select
                        className="form-control"
                        value={conversionForm.company_size || '10 - 50 nhân sự'}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, company_size: e.target.value }))}
                      >
                        <option value="Dưới 10 nhân sự">Dưới 10 nhân sự</option>
                        <option value="10 - 50 nhân sự">10 - 50 nhân sự</option>
                        <option value="50 - 200 nhân sự">50 - 200 nhân sự</option>
                        <option value="200 - 500 nhân sự">200 - 500 nhân sự</option>
                        <option value="Trên 500 nhân sự">Trên 500 nhân sự</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        value={conversionForm.phone || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Email liên hệ</label>
                      <input
                        type="email"
                        className="form-control"
                        value={conversionForm.email || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Địa chỉ trụ sở</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập địa chỉ công ty..."
                        value={conversionForm.address || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Chọn Khách hàng trong CRM *</label>
                    <select
                      className="form-control"
                      value={conversionForm.customer_id || ''}
                      onChange={(e) => setConversionForm((prev) => ({ ...prev, customer_id: e.target.value }))}
                      id="select-convert-existing-customer"
                    >
                      <option value="">-- Chọn khách hàng đã có --</option>
                      {existingCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.code ? `(${c.code})` : ''} - {c.phone || c.email}
                        </option>
                      ))}
                    </select>
                    {conversionErrors.customer_id && (
                      <div className="field-error">{conversionErrors.customer_id}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Mục 2: Cơ hội bán hàng (Opportunity) */}
              <div className="convert-section-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 className="convert-section-title">
                    <IconTrendingUp />
                    <span>2. Cơ hội bán hàng (Deal / Opportunity)</span>
                  </h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>
                    <input
                      type="checkbox"
                      checked={conversionForm.create_opportunity}
                      onChange={(e) => setConversionForm((prev) => ({ ...prev, create_opportunity: e.target.checked }))}
                      id="checkbox-create-opportunity"
                    />
                    <span>Tạo Cơ hội bán hàng ngay</span>
                  </label>
                </div>

                {conversionForm.create_opportunity && (
                  <div className="convert-form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Tên cơ hội bán hàng *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Triển khai CRM Enterprise cho Alpha Corp"
                        value={conversionForm.opportunity_title || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, opportunity_title: e.target.value }))}
                        id="input-convert-opportunity-title"
                      />
                      {conversionErrors.opportunity_title && (
                        <div className="field-error">{conversionErrors.opportunity_title}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Giai đoạn bán hàng ban đầu</label>
                      <select
                        className="form-control"
                        value={conversionForm.stage_id || 'stage-1'}
                        onChange={(e) => {
                          const stId = e.target.value
                          const stObj = pipelineStages.find((s) => s.id === stId)
                          setConversionForm((prev) => ({
                            ...prev,
                            stage_id: stId,
                            stage_name: stObj?.name || 'Tiếp cận & Đánh giá',
                            win_probability: stObj?.win_probability ?? prev.win_probability,
                          }))
                        }}
                      >
                        {pipelineStages.length > 0 ? (
                          pipelineStages.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.win_probability}%)
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="stage-1">1. Tiếp cận & Đánh giá (20%)</option>
                            <option value="stage-2">2. Demo & Trình bày giải pháp (40%)</option>
                            <option value="stage-3">3. Đề xuất & Báo giá (60%)</option>
                            <option value="stage-4">4. Đàm phán hợp đồng (80%)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Doanh thu kỳ vọng (VND)</label>
                      <div className="currency-input-wrapper">
                        <input
                          type="number"
                          step="1000000"
                          min="0"
                          className="form-control"
                          value={conversionForm.expected_revenue || 0}
                          onChange={(e) => setConversionForm((prev) => ({ ...prev, expected_revenue: Number(e.target.value) }))}
                        />
                        <span className="currency-symbol">VND</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Ngày dự kiến chốt hợp đồng *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={conversionForm.expected_close_date || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, expected_close_date: e.target.value }))}
                        id="input-convert-close-date"
                      />
                      {conversionErrors.expected_close_date && (
                        <div className="field-error">{conversionErrors.expected_close_date}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Tỷ lệ thành công (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control"
                        value={conversionForm.win_probability || 20}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, win_probability: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Ghi chú cơ hội</label>
                      <textarea
                        rows={2}
                        className="form-control"
                        placeholder="Nội dung nhu cầu, lưu ý đàm phán..."
                        value={conversionForm.notes || ''}
                        onChange={(e) => setConversionForm((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => !isConverting && setIsConvertModalOpen(false)}
                disabled={isConverting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmConversion}
                disabled={isConverting}
                id="btn-confirm-lead-conversion"
              >
                <IconCheck />
                <span>{isConverting ? 'Đang chuyển đổi...' : 'Xác nhận chuyển đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL S4-05: KẾT QUẢ CHUYỂN ĐỔI THÀNH CÔNG
          ───────────────────────────────────────────────────────────── */}
      {isSuccessModalOpen && conversionResult && (
        <div className="lead-modal-backdrop" onClick={() => setIsSuccessModalOpen(false)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '620px' }}
            onClick={(e) => e.stopPropagation()}
            id="modal-conversion-success"
          >
            <div className="convert-success-modal-body">
              <div className="convert-success-icon-badge">
                ✓
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0f172a' }}>
                  Chuyển đổi Lead thành công!
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>
                  {conversionResult.message}
                </p>
              </div>

              <div className="convert-success-cards-grid">
                {conversionResult.customer && (
                  <div className="convert-result-card customer">
                    <span className="res-title">Khách hàng CRM</span>
                    <span className="res-name">{conversionResult.customer.name}</span>
                    <span className="res-sub">Mã: {conversionResult.customer.code}</span>
                    <span className="res-sub">SĐT: {conversionResult.customer.phone || 'N/A'}</span>
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setIsSuccessModalOpen(false)
                          navigate('/dashboard/customers')
                        }}
                      >
                        Xem hồ sơ khách hàng →
                      </button>
                    </div>
                  </div>
                )}

                {conversionResult.opportunity && (
                  <div className="convert-result-card opportunity">
                    <span className="res-title">Cơ hội bán hàng</span>
                    <span className="res-name">{conversionResult.opportunity.title}</span>
                    <span className="res-sub">Mã: {conversionResult.opportunity.code}</span>
                    <span className="res-sub">
                      Giá trị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(conversionResult.opportunity.expected_revenue)}
                    </span>
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setIsSuccessModalOpen(false)
                          navigate('/dashboard/pipeline')
                        }}
                      >
                        Xem Pipeline →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsSuccessModalOpen(false)}
                id="btn-close-conversion-success"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL S4-06: LỊCH SỬ TƯƠNG TÁC CHI TIẾT CỦA LEAD
          ───────────────────────────────────────────────────────────── */}
      {isInteractionModalOpen && selectedLeadForInteraction && (
        <div className="lead-modal-backdrop" onClick={() => setIsInteractionModalOpen(false)}>
          <div
            className="lead-modal-content"
            style={{ maxWidth: '820px' }}
            onClick={(e) => e.stopPropagation()}
            id="modal-lead-interactions"
          >
            <div className="lead-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: '#0284c7' }}><IconHistory /></div>
                <h3 className="lead-modal-title">
                  Lịch sử tương tác: {selectedLeadForInteraction.full_name} ({selectedLeadForInteraction.code})
                </h3>
              </div>
              <button
                type="button"
                className="lead-modal-close"
                onClick={() => setIsInteractionModalOpen(false)}
              >
                <IconX />
              </button>
            </div>

            <div className="interaction-modal-body">
              {/* Thẻ Lead Info tóm tắt */}
              <div className="convert-preview-card">
                <div className="convert-preview-header">
                  <div className="convert-preview-title">
                    <span>{selectedLeadForInteraction.full_name}</span>
                    <span className={`lead-status-badge ${selectedLeadForInteraction.status.toLowerCase()}`}>
                      {LEAD_STATUS_CONFIG[selectedLeadForInteraction.status]?.label || selectedLeadForInteraction.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`lead-score-pill ${selectedLeadForInteraction.score_tier?.toLowerCase() || 'warm'}`}>
                      {selectedLeadForInteraction.score ?? 50}đ
                    </span>
                    <span className="tab-badge info">
                      {selectedLeadForInteraction.phone} • {selectedLeadForInteraction.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Ghi nhận tương tác mới */}
              <form onSubmit={handleCreateInteraction} className="interaction-create-panel" id="form-create-interaction">
                <div className="interaction-create-header">
                  <h4 className="interaction-create-title">
                    <IconPlus />
                    <span>Ghi nhận tương tác mới</span>
                  </h4>

                  <div className="interaction-type-selector">
                    <button
                      type="button"
                      className={`interaction-type-btn ${newInteractionType === 'CALL' ? 'active call' : ''}`}
                      onClick={() => {
                        setNewInteractionType('CALL')
                        setNewInteractionOutcome('Thành công - Quan tâm cao')
                        if (!newInteractionTitle) setNewInteractionTitle('Cuộc gọi trao đổi nhu cầu')
                      }}
                      id="btn-select-type-call"
                    >
                      <IconPhone />
                      <span>Cuộc gọi</span>
                    </button>
                    <button
                      type="button"
                      className={`interaction-type-btn ${newInteractionType === 'EMAIL' ? 'active email' : ''}`}
                      onClick={() => {
                        setNewInteractionType('EMAIL')
                        setNewInteractionOutcome('Đã gửi email')
                        if (!newInteractionTitle) setNewInteractionTitle('Gửi email tài liệu & báo giá')
                      }}
                      id="btn-select-type-email"
                    >
                      <IconMail />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      className={`interaction-type-btn ${newInteractionType === 'MEETING' ? 'active meeting' : ''}`}
                      onClick={() => {
                        setNewInteractionType('MEETING')
                        setNewInteractionOutcome('Họp thành công')
                        if (!newInteractionTitle) setNewInteractionTitle('Họp demo trực tuyến')
                      }}
                      id="btn-select-type-meeting"
                    >
                      <IconCalendar />
                      <span>Cuộc họp</span>
                    </button>
                    <button
                      type="button"
                      className={`interaction-type-btn ${newInteractionType === 'NOTE' ? 'active note' : ''}`}
                      onClick={() => {
                        setNewInteractionType('NOTE')
                        setNewInteractionOutcome('Ghi chú nội bộ')
                        if (!newInteractionTitle) setNewInteractionTitle('Ghi chú tiến độ chăm sóc')
                      }}
                      id="btn-select-type-note"
                    >
                      <IconFileText />
                      <span>Ghi chú</span>
                    </button>
                  </div>
                </div>

                <div className="convert-form-grid">
                  <div className="form-group">
                    <label>Tiêu đề hoạt động *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Gọi điện trao đổi về yêu cầu tích hợp..."
                      value={newInteractionTitle}
                      onChange={(e) => setNewInteractionTitle(e.target.value)}
                      id="input-interaction-title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Kết quả tương tác</label>
                    <select
                      className="form-control"
                      value={newInteractionOutcome}
                      onChange={(e) => setNewInteractionOutcome(e.target.value)}
                      id="select-interaction-outcome"
                    >
                      <option value="Thành công - Quan tâm cao">Thành công - Khách quan tâm cao</option>
                      <option value="Hẹn gọi lại sau">Khách bận - Hẹn gọi lại</option>
                      <option value="Đã gửi thông tin / Báo giá">Đã gửi brochure / báo giá</option>
                      <option value="Đã chốt lịch Demo">Đã chốt lịch hẹn Demo</option>
                      <option value="Không nghe máy">Không nghe máy / Thuê bao</option>
                      <option value="Chưa có nhu cầu lúc này">Chưa có nhu cầu / Từ chối</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Nội dung chi tiết trao đổi</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="Ghi lại các ý chính trao đổi, phản hồi của khách, thắc mắc tính năng..."
                      value={newInteractionContent}
                      onChange={(e) => setNewInteractionContent(e.target.value)}
                      id="textarea-interaction-content"
                    />
                  </div>

                  <div className="form-group">
                    <label>Hành động tiếp theo (Next Action)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Gọi lại nhắc demo giải pháp..."
                      value={newInteractionNextAction}
                      onChange={(e) => setNewInteractionNextAction(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Hạn chót hành động</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newInteractionNextActionDue}
                      onChange={(e) => setNewInteractionNextActionDue(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingInteraction}
                    id="btn-submit-interaction"
                  >
                    <IconCheck />
                    <span>{isSavingInteraction ? 'Đang lưu...' : 'Lưu tương tác'}</span>
                  </button>
                </div>
              </form>

              {/* Bộ lọc timeline tương tác */}
              <div className="interaction-filter-bar">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  <span>Dòng thời gian tương tác ({filteredLeadInteractions.length})</span>
                </div>

                <div className="interaction-filter-tabs">
                  <button
                    type="button"
                    className={`interaction-filter-tab ${interactionFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setInteractionFilter('ALL')}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    className={`interaction-filter-tab ${interactionFilter === 'CALL' ? 'active' : ''}`}
                    onClick={() => setInteractionFilter('CALL')}
                  >
                    Cuộc gọi
                  </button>
                  <button
                    type="button"
                    className={`interaction-filter-tab ${interactionFilter === 'EMAIL' ? 'active' : ''}`}
                    onClick={() => setInteractionFilter('EMAIL')}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`interaction-filter-tab ${interactionFilter === 'MEETING' ? 'active' : ''}`}
                    onClick={() => setInteractionFilter('MEETING')}
                  >
                    Họp
                  </button>
                  <button
                    type="button"
                    className={`interaction-filter-tab ${interactionFilter === 'NOTE' ? 'active' : ''}`}
                    onClick={() => setInteractionFilter('NOTE')}
                  >
                    Ghi chú
                  </button>
                </div>
              </div>

              {/* Danh sách Timeline */}
              {isLoadingInteractions ? (
                <div className="lead-loading-box">
                  <div className="lead-spinner" />
                  <span>Đang tải dòng thời gian...</span>
                </div>
              ) : filteredLeadInteractions.length === 0 ? (
                <div className="lead-empty-state" style={{ padding: '24px' }}>
                  <h4>Chưa có tương tác nào với khách hàng này</h4>
                  <p>Hãy sử dụng biểu mẫu phía trên để ghi lại cuộc gọi hoặc email đầu tiên.</p>
                </div>
              ) : (
                <div className="interaction-timeline">
                  {filteredLeadInteractions.map((act) => {
                    const getIconAndClass = () => {
                      switch (act.type) {
                        case 'CALL':
                          return { icon: <IconPhone />, cls: 'call' }
                        case 'EMAIL':
                          return { icon: <IconMail />, cls: 'email' }
                        case 'MEETING':
                          return { icon: <IconCalendar />, cls: 'meeting' }
                        case 'NOTE':
                          return { icon: <IconFileText />, cls: 'note' }
                        case 'STATUS_CHANGE':
                          return { icon: '', cls: 'status_change' }
                        case 'SCORE_UPDATE':
                          return { icon: '', cls: 'score_update' }
                        default:
                          return { icon: '', cls: 'system' }
                      }
                    }
                    const { icon, cls } = getIconAndClass()

                    return (
                      <div key={act.id} className="interaction-timeline-item">
                        <div className={`interaction-icon-badge ${cls}`}>{icon}</div>

                        <div className="interaction-card">
                          <div className="interaction-card-header">
                            <div className="interaction-card-title-group">
                              <span className="interaction-card-title">{act.title}</span>
                              <div className="interaction-card-meta">
                                <span>{act.performed_by_name}</span>
                                <span>•</span>
                                <span>
                                  {new Date(act.performed_at).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {act.outcome && (
                                <span className={`interaction-outcome-tag ${act.outcome.includes('Thành công') ? 'success' : ''}`}>
                                  {act.outcome}
                                </span>
                              )}
                              <button
                                type="button"
                                className="interaction-delete-btn"
                                onClick={() => handleDeleteInteraction(act.id)}
                                title="Xóa tương tác này"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>

                          {act.content && (
                            <div className="interaction-card-body">{act.content}</div>
                          )}

                          {act.next_action && (
                            <div className="interaction-next-action">
                              <span className="interaction-next-action-text">
                                <span>Việc tiếp theo:</span> {act.next_action}
                              </span>
                              {act.next_action_due && (
                                <span className="interaction-next-action-due">
                                  Hạn: {new Date(act.next_action_due).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="lead-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsInteractionModalOpen(false)}
              >
                Đóng
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
