import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { usePermission } from '../../hooks/usePermission.ts'
import { customerService } from '../../services/customerService.ts'
import { categoryService } from '../../services/categoryService.ts'
import { userService } from '../../services/userService.ts'
import type {
  CustomerEnterprise,
  CustomerStatus,
  CustomerContact,
  BuyingRole,
  DuplicateCustomerGroup,
  SupportTicket,
  PeriodicCareCustomer,
} from '../../types/customer.ts'
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
  BUYING_ROLE_LABELS,
  BUYING_ROLE_BADGES,
} from '../../types/customer.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import Customer360Timeline from '../../components/Customer360Timeline/Customer360Timeline.tsx'
import './CustomerManagementPage.css'

/* ──────────── Icons ──────────── */
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)


const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)


export default function CustomerManagementPage() {
  const { user } = useAuth()
  const { scope, filterScopedData } = usePermission()

  // Tabs điều hướng chức năng
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'CONTACTS' | 'MERGE' | 'SUPPORT' | 'PERIODIC'>('CUSTOMERS')

  // Danh sách toàn bộ khách hàng và danh sách đã lọc theo scope
  const [allCustomers, setAllCustomers] = useState<CustomerEnterprise[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | ''>('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterCompanySize, setFilterCompanySize] = useState('')
  const [filterCorporateStructure, setFilterCorporateStructure] = useState<'' | 'PARENT' | 'CHILD' | 'INDEPENDENT'>('')

  // Toast thông báo
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  // Danh mục ngành nghề & quy mô từ Master Data
  const [industries, setIndustries] = useState<string[]>([])
  const [companySizes, setCompanySizes] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string; team_name: string }[]>([])

  // Modal Thêm / Sửa khách hàng (S3-01)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerEnterprise | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerEnterprise | null>(null)

  // S3-02 Contacts state
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null)
  const [contactForm, setContactForm] = useState({
    customer_id: '',
    full_name: '',
    title: '',
    email: '',
    phone: '',
    buying_role: 'DECISION_MAKER' as BuyingRole,
    is_primary: false,
    notes: '',
  })
  // Modal chuyển người liên hệ sang công ty khác (AC S3-02)
  const [transferingContact, setTransferingContact] = useState<CustomerContact | null>(null)
  const [transferTargetCustId, setTransferTargetCustId] = useState('')
  const [transferReason, setTransferReason] = useState('')

  // S3-03 360 View state
  const [selected360Customer, setSelected360Customer] = useState<CustomerEnterprise | null>(null)
  const [c360ActiveTab, setC360ActiveTab] = useState<'OVERVIEW' | 'CONTACTS' | 'DEALS' | 'ACTIVITIES' | 'ATTACHMENTS' | 'GROUP'>('OVERVIEW')

  // S3-04 Duplicates state
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateCustomerGroup[]>([])
  const [selectedMergeGroup, setSelectedMergeGroup] = useState<DuplicateCustomerGroup | null>(null)
  const [primaryMergeId, setPrimaryMergeId] = useState<string>('')

  // S3-05 Parent-child state
  const [parentModalCustomer, setParentModalCustomer] = useState<CustomerEnterprise | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  // S3-06 Excel Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<any[] | null>(null)
  const [importSearchQuery, setImportSearchQuery] = useState('')
  const [importStatusFilter, setImportStatusFilter] = useState<'ALL' | 'VALID' | 'DUPLICATE'>('ALL')

  // S3-07 Saved filters state
  const [savedFilters] = useState<Array<{ name: string; status: string; industry: string }>>([
    { name: 'Khách tiềm năng CNTT', status: 'POTENTIAL', industry: 'Công nghệ thông tin & Viễn thông' },
    { name: 'Đang giao dịch', status: 'IN_TRANSACTION', industry: '' },
  ])

  // S3-08 Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    customer_id: '',
    title: '',
    priority: 'HIGH' as const,
    assignee_id: user?.id ?? 1,
    description: '',
  })

  // S3-09 Periodic care state
  const [periodicCareDays, setPeriodicCareDays] = useState(30)
  const [periodicCareList, setPeriodicCareList] = useState<PeriodicCareCustomer[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tax_code: '',
    industry: '',
    company_size: '',
    website: '',
    address: '',
    phone: '',
    email: '',
    owner_id: user?.id ?? 1,
    status: 'POTENTIAL' as CustomerStatus,
    description: '',
    parent_id: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 3500)
  }

  // Load Master Data
  useEffect(() => {
    try {
      const indList = categoryService.getCategories('INDUSTRY').map((i) => i.name)
      setIndustries(indList.length > 0 ? indList : [
        'Công nghệ thông tin & Viễn thông',
        'Tài chính - Ngân hàng - Bảo hiểm',
        'Sản xuất & Chế tạo công nghiệp',
        'Bất động sản & Xây dựng',
        'Hàng tiêu dùng nhanh & Bán lẻ',
      ])

      const sizeList = categoryService.getCategories('COMPANY_SIZE').map((s) => s.name)
      setCompanySizes(sizeList.length > 0 ? sizeList : [
        'Dưới 10 nhân sự (Siêu nhỏ)',
        '10 - 50 nhân sự (Doanh nghiệp nhỏ)',
        '50 - 200 nhân sự (Quy mô vừa)',
        'Trên 200 nhân sự (Tập đoàn lớn)',
      ])

      userService.getUsers().then((usersRes) => {
        if (usersRes && usersRes.users) {
          setTeamMembers(usersRes.users.map((u: { id: number; full_name: string; team?: string }) => ({
            id: u.id,
            name: u.full_name,
            team_name: u.team || 'Đội Kinh Doanh 1',
          })))
        }
      }).catch(() => {})
    } catch {}
  }, [])

  // Load danh sách khách hàng & dữ liệu liên quan
  const loadCustomers = async () => {
    // 1. Tải nhanh từ cache
    const cachedList = customerService.getCustomers({
      search,
      status: filterStatus,
      industry: filterIndustry,
      company_size: filterCompanySize,
      corporate_structure: filterCorporateStructure || undefined,
    })
    setAllCustomers(cachedList)
    setContacts(customerService.getContacts(undefined, contactSearch))
    setDuplicateGroups(customerService.detectDuplicates())
    setTickets(customerService.getTickets())
    setPeriodicCareList(customerService.getPeriodicCareCustomers(periodicCareDays))

    // 2. Đồng bộ từ Backend API qua mạng
    try {
      const apiCusts = await customerService.fetchCustomers({
        search,
        status: filterStatus,
        industry: filterIndustry,
        company_size: filterCompanySize,
      })
      if (apiCusts && apiCusts.length >= 0) {
        setAllCustomers(apiCusts)
      }
      const apiContacts = await customerService.fetchContacts(undefined, contactSearch)
      if (apiContacts) {
        setContacts(apiContacts)
      }
    } catch {}
  }

  useEffect(() => {
    loadCustomers()
    setCurrentPage(1)
  }, [search, filterStatus, filterIndustry, filterCompanySize, filterCorporateStructure, contactSearch, periodicCareDays])

  // Lọc theo phạm vi dữ liệu sở hữu
  const scopedCustomers = useMemo(() => {
    return filterScopedData(allCustomers, {
      getOwnerId: (c) => c.owner_id,
      getTeamId: (c) => c.team_id,
    })
  }, [allCustomers, filterScopedData])

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = scopedCustomers.length
    const potential = scopedCustomers.filter((c) => c.status === 'POTENTIAL').length
    const inTransaction = scopedCustomers.filter((c) => c.status === 'IN_TRANSACTION').length
    const active = scopedCustomers.filter((c) => c.status === 'ACTIVE_CUSTOMER').length
    const stopped = scopedCustomers.filter((c) => c.status === 'STOPPED').length
    const atRiskCount = scopedCustomers.filter((c) => customerService.isCustomerAtRisk(c.id)).length
    return { total, potential, inTransaction, active, stopped, atRiskCount }
  }, [scopedCustomers])

  // Dữ liệu phân trang
  const totalPages = Math.max(1, Math.ceil(scopedCustomers.length / pageSize))
  const pagedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return scopedCustomers.slice(start, start + pageSize)
  }, [scopedCustomers, currentPage, pageSize])

  // Mở modal thêm khách hàng
  const handleOpenCreateModal = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      tax_code: '',
      industry: industries[0] || 'Công nghệ thông tin & Viễn thông',
      company_size: companySizes[1] || '10 - 50 nhân sự (Doanh nghiệp nhỏ)',
      website: '',
      address: '',
      phone: '',
      email: '',
      owner_id: user?.id ?? 1,
      status: 'POTENTIAL',
      description: '',
      parent_id: '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Mở modal sửa khách hàng
  const handleOpenEditModal = (cust: CustomerEnterprise) => {
    setEditingCustomer(cust)
    const pRel = customerService.getParentRelation(cust.id)
    setFormData({
      name: cust.name,
      tax_code: cust.tax_code || '',
      industry: cust.industry,
      company_size: cust.company_size,
      website: cust.website || '',
      address: cust.address || '',
      phone: cust.phone || '',
      email: cust.email || '',
      owner_id: cust.owner_id,
      status: cust.status,
      description: cust.description || '',
      parent_id: pRel ? pRel.parent_id : '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Validate form khách hàng
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên công ty / doanh nghiệp'

    if (formData.tax_code.trim()) {
      const isDuplicate = customerService.isTaxCodeDuplicate(
        formData.tax_code.trim(),
        editingCustomer ? editingCustomer.id : undefined
      )
      if (isDuplicate) {
        errors.tax_code = `Mã số thuế "${formData.tax_code.trim()}" đã tồn tại trên hệ thống!`
      }
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không đúng định dạng'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Lưu khách hàng
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const assignedUser = teamMembers.find((m) => m.id === Number(formData.owner_id))
    const ownerName = assignedUser ? assignedUser.name : (user?.full_name || 'Người dùng')
    const teamName = assignedUser ? assignedUser.team_name : 'Đội Kinh Doanh 1'
    const teamId = typeof user?.team_id === 'number' ? user.team_id : Number(user?.team_id) || 1

    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, {
          name: formData.name.trim(),
          tax_code: formData.tax_code.trim() || undefined,
          industry: formData.industry,
          company_size: formData.company_size,
          website: formData.website.trim() || undefined,
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          owner_id: Number(formData.owner_id),
          owner_name: ownerName,
          team_id: teamId,
          team_name: teamName,
          status: formData.status,
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id,
        })
        showToast(`Đã cập nhật hồ sơ khách hàng "${formData.name.trim()}" thành công!`)
      } else {
        await customerService.createCustomer({
          name: formData.name.trim(),
          tax_code: formData.tax_code.trim() || undefined,
          industry: formData.industry,
          company_size: formData.company_size,
          website: formData.website.trim() || undefined,
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          owner_id: Number(formData.owner_id),
          owner_name: ownerName,
          team_id: teamId,
          team_name: teamName,
          status: formData.status,
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id || undefined,
        })
        showToast(`Đã thêm thành công khách hàng "${formData.name.trim()}"!`)
      }
      setIsModalOpen(false)
      await loadCustomers()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', true)
    }
  }

  // Xóa khách hàng
  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return
    const success = await customerService.deleteCustomer(deletingCustomer.id)
    if (success) {
      showToast(`Đã xóa khách hàng "${deletingCustomer.name}" (${deletingCustomer.code})!`)
      await loadCustomers()
    }
    setDeletingCustomer(null)
  }

  // Xuất file CSV danh sách khách hàng
  const handleExportCSV = () => {
    const headers = ['Mã KH', 'Tên doanh nghiệp', 'Mã số thuế', 'Ngành nghề', 'Quy mô', 'Số điện thoại', 'Website', 'Địa chỉ', 'Người sở hữu', 'Đội nhóm', 'Trạng thái']
    const rows = scopedCustomers.map((c) => [
      c.code,
      `"${c.name.replace(/"/g, '""')}"`,
      c.tax_code ? `"${c.tax_code}"` : '""',
      `"${c.industry}"`,
      `"${c.company_size}"`,
      `"${c.phone || ''}"`,
      `"${c.website || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${c.owner_name}"`,
      `"${c.team_name}"`,
      `"${CUSTOMER_STATUS_LABELS[c.status]}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `danh_sach_khach_hang_${scope.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Đã xuất thành công ${scopedCustomers.length} khách hàng ra file Excel/CSV!`)
  }

  // Tải file mẫu nhập khách hàng (Excel / CSV)
  const handleDownloadTemplate = () => {
    const headers = [
      'Tên doanh nghiệp (*)',
      'Mã số thuế',
      'Ngành nghề (*)',
      'Quy mô nhân sự (*)',
      'Số điện thoại',
      'Email',
      'Website',
      'Địa chỉ',
      'Mô tả ghi chú',
    ]

    const sampleRows = [
      [
        '"Công ty Cổ phần Công nghệ Alpha"',
        '"0102345678"',
        '"Công nghệ thông tin & Viễn thông"',
        '"50 - 200 nhân sự (Quy mô vừa)"',
        '"024 3768 9999"',
        '"contact@alphatech.vn"',
        '"https://alphatech.vn"',
        '"Tầng 12, Tòa nhà Keangnam, Hà Nội"',
        '"Khách hàng doanh nghiệp công nghệ tiềm năng"',
      ],
      [
        '"Tập đoàn Xây dựng & Bất động sản Hòa Bình"',
        '"0301122334"',
        '"Bất động sản & Xây dựng"',
        '"Trên 200 nhân sự (Tập đoàn lớn)"',
        '"028 3822 4567"',
        '"info@hoabinhgroup.vn"',
        '"https://hoabinhgroup.vn"',
        '"235 Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh"',
        '"Tổng thầu xây dựng các dự án dân dụng"',
      ],
    ]

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'file_mau_nhap_khach_hang_crm.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Đã tải xuống file mẫu nhập khách hàng thành công!')
  }

  // ── S3-02 Contact Actions ──
  const handleOpenContactModal = (cust?: CustomerEnterprise) => {
    setEditingContact(null)
    setContactForm({
      customer_id: cust ? cust.id : (allCustomers[0]?.id || ''),
      full_name: '',
      title: '',
      email: '',
      phone: '',
      buying_role: 'DECISION_MAKER',
      is_primary: false,
      notes: '',
    })
    setIsContactModalOpen(true)
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.full_name.trim()) return showToast('Vui lòng nhập họ tên người liên hệ', true)
    const targetCust = allCustomers.find((c) => c.id === contactForm.customer_id)
    const custName = targetCust ? targetCust.name : 'Khách hàng'

    if (editingContact) {
      await customerService.updateContact(editingContact.id, {
        customer_id: contactForm.customer_id,
        customer_name: custName,
        full_name: contactForm.full_name.trim(),
        title: contactForm.title.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        buying_role: contactForm.buying_role,
        is_primary: contactForm.is_primary,
        notes: contactForm.notes.trim() || undefined,
      })
      showToast('Đã cập nhật thông tin người liên hệ thành công!')
    } else {
      await customerService.createContact({
        customer_id: contactForm.customer_id,
        customer_name: custName,
        full_name: contactForm.full_name.trim(),
        title: contactForm.title.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        buying_role: contactForm.buying_role,
        is_primary: contactForm.is_primary,
        notes: contactForm.notes.trim() || undefined,
      })
      showToast('Đã thêm người liên hệ mới thành công!')
    }
    setIsContactModalOpen(false)
    await loadCustomers()
  }

  // Thực hiện chuyển người liên hệ sang cty mới (AC S3-02)
  const handleExecuteTransferContact = () => {
    if (!transferingContact || !transferTargetCustId) return
    const targetCust = allCustomers.find((c) => c.id === transferTargetCustId)
    if (!targetCust) return

    customerService.transferContactToNewCompany(
      transferingContact.id,
      targetCust.id,
      targetCust.name,
      transferReason
    )
    showToast(`Đã chuyển nhân sự "${transferingContact.full_name}" sang "${targetCust.name}" và lưu lại lịch sử!`)
    setTransferingContact(null)
    setTransferTargetCustId('')
    setTransferReason('')
    loadCustomers()
  }

  // ── S3-04 Merge Action ──
  const handleExecuteMerge = () => {
    if (!selectedMergeGroup || !primaryMergeId) return
    const dupCustomer = selectedMergeGroup.customers.find((c) => c.id !== primaryMergeId)
    if (!dupCustomer) return

    try {
      customerService.mergeCustomers(primaryMergeId, dupCustomer.id, user?.role)
      showToast(`Đã gộp thành công dữ liệu từ "${dupCustomer.name}" vào hồ sơ chính!`)
      setSelectedMergeGroup(null)
      loadCustomers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi khi gộp', true)
    }
  }

  // ── S3-05 Parent Company Action ──
  const handleOpenParentModal = (cust: CustomerEnterprise) => {
    setParentModalCustomer(cust)
    const rel = customerService.getParentRelation(cust.id)
    setSelectedParentId(rel ? rel.parent_id : '')
  }

  const handleSaveParentCompany = () => {
    if (!parentModalCustomer || !selectedParentId) return
    try {
      customerService.setParentCompany(parentModalCustomer.id, selectedParentId)
      showToast(`Đã gắn công ty mẹ thành công cho "${parentModalCustomer.name}"!`)
      setParentModalCustomer(null)
      loadCustomers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi gắn công ty mẹ', true)
    }
  }

  const handleRemoveParentCompany = () => {
    if (!parentModalCustomer) return
    try {
      customerService.removeParentCompany(parentModalCustomer.id)
      showToast(`Đã gỡ liên kết công ty mẹ cho "${parentModalCustomer.name}"!`)
      setParentModalCustomer(null)
      loadCustomers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi gỡ công ty mẹ', true)
    }
  }

  // ── S3-06 Excel Import Mock Handler ──
  
  // Lọc và Tìm kiếm các dòng xem trước khi import file Excel khách hàng
  const filteredImportRows = useMemo(() => {
    if (!importPreview) return []
    let result = importPreview

    if (importStatusFilter === 'VALID') {
      result = result.filter((item) => !item.isDuplicate)
    } else if (importStatusFilter === 'DUPLICATE') {
      result = result.filter((item) => item.isDuplicate)
    }

    const q = importSearchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((item) => {
        const nameMatch = (item.name || '').toLowerCase().includes(q)
        const taxMatch = (item.tax_code || '').toLowerCase().includes(q)
        const industryMatch = (item.industry || '').toLowerCase().includes(q)
        const sizeMatch = (item.company_size || '').toLowerCase().includes(q)
        return nameMatch || taxMatch || industryMatch || sizeMatch
      })
    }

    return result
  }, [importPreview, importStatusFilter, importSearchQuery])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Tạo preview giả lập từ file Excel
    const mockPreview = [
      { row: 1, name: 'Công ty Cổ phần AI Solutions', tax_code: '0109998881', industry: 'Công nghệ thông tin & Viễn thông', company_size: '10 - 50 nhân sự (Doanh nghiệp nhỏ)', isDuplicate: false },
      { row: 2, name: 'Công ty Cổ phần Công Nghệ Alpha', tax_code: '0102345678', industry: 'Công nghệ thông tin & Viễn thông', company_size: '50 - 200 nhân sự (Quy mô vừa)', isDuplicate: true },
    ]
    setImportSearchQuery('')
    setImportStatusFilter('ALL')
    setImportPreview(mockPreview)
  }

  const handleConfirmImport = () => {
    if (!importPreview) return
    let count = 0
    importPreview.forEach((row) => {
      if (!row.isDuplicate) {
        try {
          customerService.createCustomer({
            name: row.name,
            tax_code: row.tax_code,
            industry: row.industry,
            company_size: row.company_size,
            owner_id: user?.id ?? 1,
            owner_name: user?.full_name ?? 'Tôi',
            team_id: Number(user?.team_id) || 1,
            team_name: user?.team_name || 'Đội Kinh Doanh 1',
            status: 'POTENTIAL',
          })
          count++
        } catch {}
      }
    })
    showToast(`Đã nhập thành công ${count} khách hàng từ tệp Excel!`)
    setImportPreview(null)
    setImportSearchQuery('')
    setImportStatusFilter('ALL')
    loadCustomers()
  }

  // ── S3-08 Create Ticket ──
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketForm.title.trim() || !ticketForm.customer_id) return showToast('Vui lòng nhập tiêu đề yêu cầu', true)
    const targetCust = allCustomers.find((c) => c.id === ticketForm.customer_id)
    const custName = targetCust ? targetCust.name : 'Khách hàng'
    const assignee = teamMembers.find((m) => m.id === Number(ticketForm.assignee_id))

    customerService.createTicket({
      customer_id: ticketForm.customer_id,
      customer_name: custName,
      title: ticketForm.title.trim(),
      priority: ticketForm.priority,
      status: 'NEW',
      assignee_id: Number(ticketForm.assignee_id),
      assignee_name: assignee ? assignee.name : 'Chuyên viên CSKH',
      description: ticketForm.description.trim(),
    })
    showToast('Đã ghi nhận yêu cầu hỗ trợ sau bán thành công!')
    setIsTicketModalOpen(false)
    loadCustomers()
  }

  // ── Render Trang 360 Độ Khách Hàng Riêng Biệt (Không Double Screen / Double Scroll) ──
  const renderCustomer360View = () => {
    if (!selected360Customer) return null
    return (
      <div className="c360-page-container">
        <div className="c360-page-breadcrumb-nav">
          <button
            type="button"
            className="c360-back-btn"
            onClick={() => setSelected360Customer(null)}
            title="Quay lại danh sách khách hàng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Quay lại danh sách Khách hàng</span>
          </button>
        </div>
        <div className="c360-modal-content c360-page-card" onClick={(e) => e.stopPropagation()}>
          <div className="c360-header">
            <div className="c360-header-info">
              <h3>
                <span>{selected360Customer.name}</span>
              </h3>
              <div className="c360-header-meta">
                <span className="c360-meta-chip">Mã: <strong>{selected360Customer.code}</strong></span>
                <span className="c360-meta-chip">MST: {selected360Customer.tax_code || 'Chưa cập nhật'}</span>
                <span className="c360-meta-chip">Ngành: {selected360Customer.industry}</span>
                <span className="c360-meta-chip">Phụ trách: {selected360Customer.owner_name}</span>
              </div>
            </div>
            <button
              type="button"
              className="cust-modal-close-btn"
              onClick={() => setSelected360Customer(null)}
              title="Đóng cửa sổ"
            >
              &times;
            </button>
          </div>

          {/* KPI Bar */}
          {(() => {
            const summary = customerService.getCustomer360Summary(selected360Customer.id)
            const groupSummary = customerService.getGroupContractTotal(selected360Customer.id)
            const parentRel = customerService.getParentRelation(selected360Customer.id)
            return (
              <div className="c360-kpi-bar">
                <div className="c360-kpi-item">
                  <span className="c360-kpi-label">Tổng đã ký (Won)</span>
                  <span className="c360-kpi-val highlight">{formatCurrencyVND(summary.wonValue)}</span>
                </div>
                <div className="c360-kpi-item">
                  <span className="c360-kpi-label">Cơ hội đang mở (Pipeline)</span>
                  <span className="c360-kpi-val">{formatCurrencyVND(summary.openValue)}</span>
                </div>
                {groupSummary.childrenCount > 0 ? (
                  <div className="c360-kpi-item" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <span className="c360-kpi-label" style={{ color: '#166534', fontWeight: 600 }}>Tổng HĐ Tập đoàn ({groupSummary.childrenCount} cty con)</span>
                    <span className="c360-kpi-val highlight" style={{ color: '#166534' }}>
                      {formatCurrencyVND(groupSummary.totalValue)}
                    </span>
                  </div>
                ) : parentRel ? (
                  <div className="c360-kpi-item">
                    <span className="c360-kpi-label">Thuộc Tập đoàn</span>
                    <div className="c360-parent-chip">
                      <span className="c360-parent-name" title={parentRel.parent_name}>
                        🏢 {parentRel.parent_name}
                      </span>
                      <button
                        type="button"
                        className="c360-parent-jump-btn"
                        title="Xem trang 360 của công ty mẹ"
                        onClick={() => {
                          const pCust = customerService.getCustomerById(parentRel.parent_id)
                          if (pCust) setSelected360Customer(pCust)
                        }}
                      >
                        Xem ↗
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="c360-kpi-item">
                    <span className="c360-kpi-label">Người liên hệ</span>
                    <span className="c360-kpi-val">{summary.contactsCount}</span>
                  </div>
                )}
                <div className="c360-kpi-item">
                  <span className="c360-kpi-label">Tình trạng</span>
                  <span className={`c360-kpi-val ${summary.isAtRisk ? 'risk' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: summary.isAtRisk ? '#ef4444' : '#10b981',
                      display: 'inline-block'
                    }} />
                    {summary.isAtRisk ? 'Nguy cơ rời bỏ' : 'Ổn định'}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Tabs */}
          <div className="c360-tabs">
            <button
              type="button"
              className={`c360-tab-link ${c360ActiveTab === 'OVERVIEW' ? 'active' : ''}`}
              onClick={() => setC360ActiveTab('OVERVIEW')}
            >
              Tổng quan & Cơ hội
            </button>
            <button
              type="button"
              className={`c360-tab-link ${c360ActiveTab === 'GROUP' ? 'active' : ''}`}
              onClick={() => setC360ActiveTab('GROUP')}
            >
              Cơ cấu Tập đoàn ({(() => {
                const g = customerService.getGroupContractTotal(selected360Customer.id)
                const p = customerService.getParentRelation(selected360Customer.id)
                return g.childrenCount > 0 ? `${g.childrenCount} cty con` : p ? 'Cty con' : 'Độc lập'
              })()})
            </button>
            <button
              type="button"
              className={`c360-tab-link ${c360ActiveTab === 'CONTACTS' ? 'active' : ''}`}
              onClick={() => setC360ActiveTab('CONTACTS')}
            >
              Người liên hệ ({customerService.getContacts(selected360Customer.id).length})
            </button>
            <button
              type="button"
              className={`c360-tab-link ${c360ActiveTab === 'ACTIVITIES' ? 'active' : ''}`}
              onClick={() => setC360ActiveTab('ACTIVITIES')}
            >
              Dòng thời gian hoạt động ({customerService.getActivities(selected360Customer.id).length})
            </button>
            <button
              type="button"
              className={`c360-tab-link ${c360ActiveTab === 'ATTACHMENTS' ? 'active' : ''}`}
              onClick={() => setC360ActiveTab('ATTACHMENTS')}
            >
              Tệp đính kèm ({customerService.getAttachments(selected360Customer.id).length})
            </button>
          </div>

          {/* Body */}
          <div className="c360-body">
            {c360ActiveTab === 'GROUP' && (() => {
              const groupSummary = customerService.getGroupContractTotal(selected360Customer.id)
              const parentRel = customerService.getParentRelation(selected360Customer.id)
              return (
                <div>
                  {groupSummary.childrenCount > 0 ? (
                    <div>
                      <div style={{ padding: '14px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#065f46', fontSize: '15px' }}>
                              Cơ cấu Tập đoàn: {selected360Customer.name}
                            </h4>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#047857' }}>
                              Đang quản lý <strong>{groupSummary.childrenCount}</strong> công ty thành viên trực thuộc
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#047857' }}>Tổng giá trị HĐ toàn tập đoàn</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857' }}>
                              {formatCurrencyVND(groupSummary.totalValue)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Hợp đồng riêng công ty mẹ</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                            {formatCurrencyVND(groupSummary.parentWonValue)}
                          </div>
                        </div>
                        <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Đóng góp từ các cty con</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                            {formatCurrencyVND(groupSummary.totalValue - groupSummary.parentWonValue)}
                          </div>
                        </div>
                        <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Số pháp nhân trực thuộc</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                            {groupSummary.childrenCount} công ty con
                          </div>
                        </div>
                      </div>

                      <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>
                        Danh sách công ty con trực thuộc:
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {groupSummary.childrenBreakdown.map((item) => (
                          <div
                            key={item.customer.id}
                            style={{
                              padding: '12px 14px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#ffffff',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                {item.customer.name}
                                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({item.customer.code})</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Mã số thuế: {item.customer.tax_code || 'Chưa cập nhật'} | Ngành: {item.customer.industry} | Phụ trách: {item.customer.owner_name}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>HĐ đã ký ({item.dealsCount})</div>
                                <div style={{ fontWeight: 700, color: '#059669', fontSize: '13.5px' }}>
                                  {formatCurrencyVND(item.wonValue)}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => setSelected360Customer(item.customer)}
                              >
                                Xem 360
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
                                title="Gỡ công ty con khỏi tập đoàn"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn gỡ "${item.customer.name}" khỏi tập đoàn?`)) {
                                    customerService.removeParentCompany(item.customer.id)
                                    showToast(`Đã gỡ "${item.customer.name}" khỏi tập đoàn!`)
                                    loadCustomers()
                                  }
                                }}
                              >
                                Gỡ
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : parentRel ? (
                    <div style={{
                      padding: '24px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                      border: '1px solid #bfdbfe',
                      borderRadius: '14px',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🏢</span>
                        <h4 style={{ margin: 0, color: '#1e40af', fontSize: '16px', fontWeight: 700 }}>
                          Công ty thành viên trực thuộc Tập đoàn
                        </h4>
                      </div>
                      <p style={{ margin: '0 0 18px 30px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                        Doanh nghiệp này là công ty con trực thuộc tập đoàn:{' '}
                        <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                          {parentRel.parent_name}
                        </span>
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginLeft: '30px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '8px', fontWeight: 600 }}
                          onClick={() => {
                            const pCust = customerService.getCustomerById(parentRel.parent_id)
                            if (pCust) setSelected360Customer(pCust)
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Mở xem Trang 360 của Công ty mẹ
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 16px',
                            borderRadius: '8px',
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                            background: '#fff'
                          }}
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn gỡ liên kết công ty mẹ của "${selected360Customer.name}"?`)) {
                              customerService.removeParentCompany(selected360Customer.id)
                              showToast('Đã gỡ liên kết công ty mẹ!')
                              loadCustomers()
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Gỡ khỏi tập đoàn
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '28px 20px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#334155' }}>Doanh nghiệp độc lập</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                        Khách hàng này hiện chưa liên kết với công ty mẹ hoặc tập đoàn nào.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleOpenParentModal(selected360Customer)}
                      >
                        Khai báo Công ty mẹ / Gắn vào Tập đoàn
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
            {c360ActiveTab === 'OVERVIEW' && (
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Danh sách Cơ hội bán hàng</h4>
                {customerService.getDeals(selected360Customer.id).map((deal) => (
                  <div key={deal.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{deal.title}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Giai đoạn: {deal.stage}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#2563eb' }}>{deal.value.toLocaleString('vi-VN')} đ</div>
                      <div style={{ fontSize: '11px', color: deal.status === 'CLOSED_WON' ? '#059669' : '#d97706' }}>
                        {deal.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {c360ActiveTab === 'CONTACTS' && (
              <div>
                {customerService.getContacts(selected360Customer.id).map((ct) => (
                  <div key={ct.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{ct.full_name}</strong> - <span>{ct.title}</span>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{ct.phone} | {ct.email}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{BUYING_ROLE_LABELS[ct.buying_role]}</span>
                  </div>
                ))}
              </div>
            )}

            {c360ActiveTab === 'ACTIVITIES' && (
              <Customer360Timeline
                customerId={selected360Customer.id}
                customerName={selected360Customer.name}
                customerOwnerName={selected360Customer.owner_name}
              />
            )}

            {c360ActiveTab === 'ATTACHMENTS' && (
              <div>
                {customerService.getAttachments(selected360Customer.id).map((att) => (
                  <div key={att.id} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>{att.file_name} ({att.file_size})</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Tải lên bởi: {att.uploaded_by}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-page" id="customer-management-page">
      {selected360Customer ? (
        renderCustomer360View()
      ) : (
        <>
          {/* ── 1. Page Header ── */}
      <div className="customer-header-bar">
        <div className="customer-header-info">
          <h2>
            Quản lý Khách hàng Doanh nghiệp
          </h2>
        </div>

        <div className="customer-header-actions">
          <span className="scope-indicator-pill" title={`Phạm vi dữ liệu: ${scope}`}>
            ● Phạm vi: {scope === 'ALL' ? 'Toàn công ty' : scope === 'TEAM' ? 'Toàn nhóm' : 'Cá nhân phụ trách'}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Nhập dữ liệu khách hàng từ file Excel"
            id="btn-import-customer"
          >
            <IconUpload />
            <span>Nhập</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadTemplate}
            title="Tải về file mẫu Excel/CSV chuẩn để nhập khách hàng"
            id="btn-download-customer-template"
          >
            <IconDownload />
            <span>File mẫu</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Xuất danh sách khách hàng ra file Excel/CSV"
            id="btn-export-customer"
          >
            <IconDownload />
            <span>Xuất</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            id="btn-add-customer"
          >
            <IconPlus />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* ── Tabs chuyển đổi tính năng ── */}
      <div className="customer-nav-tabs">
        <button
          type="button"
          className={`customer-tab-btn ${activeTab === 'CUSTOMERS' ? 'active' : ''}`}
          onClick={() => setActiveTab('CUSTOMERS')}
        >
          Hồ sơ Doanh nghiệp
          <span className="tab-badge">{scopedCustomers.length}</span>
        </button>

        <button
          type="button"
          className={`customer-tab-btn ${activeTab === 'CONTACTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('CONTACTS')}
        >
          Người liên hệ & Quyết định mua
          <span className="tab-badge">{contacts.length}</span>
        </button>

        <button
          type="button"
          className={`customer-tab-btn ${activeTab === 'MERGE' ? 'active' : ''}`}
          onClick={() => setActiveTab('MERGE')}
        >
          Cảnh báo & Gộp trùng
          {duplicateGroups.length > 0 && <span className="tab-badge warning">{duplicateGroups.length}</span>}
        </button>

        <button
          type="button"
          className={`customer-tab-btn ${activeTab === 'SUPPORT' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUPPORT')}
        >
          Cảnh báo rủi ro
          {stats.atRiskCount > 0 && <span className="tab-badge warning">{stats.atRiskCount}</span>}
        </button>

        <button
          type="button"
          className={`customer-tab-btn ${activeTab === 'PERIODIC' ? 'active' : ''}`}
          onClick={() => setActiveTab('PERIODIC')}
        >
          Chăm sóc định kỳ
          <span className="tab-badge">{periodicCareList.length}</span>
        </button>
      </div>

      {/* ── 2. Stat summary cards ── */}
      <div className="customer-stats-grid">
        <div className="customer-stat-card">
          <div className="customer-stat-content">
            <span className="customer-stat-value">{stats.total}</span>
            <span className="customer-stat-label">Tổng khách hàng ({scope})</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-content">
            <span className="customer-stat-value">{stats.potential}</span>
            <span className="customer-stat-label">Tiềm năng</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-content">
            <span className="customer-stat-value">{stats.inTransaction}</span>
            <span className="customer-stat-label">Đang giao dịch</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-content">
            <span className="customer-stat-value">{stats.active}</span>
            <span className="customer-stat-label">Khách hàng chính thức</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-content">
            <span className="customer-stat-value">{stats.stopped}</span>
            <span className="customer-stat-label">Ngừng hợp tác</span>
          </div>
        </div>

        {stats.atRiskCount > 0 && (
          <div className="customer-stat-card" style={{ borderColor: '#fca5a5', background: '#fff5f5' }}>
            <div className="customer-stat-content">
              <span className="customer-stat-value" style={{ color: '#dc2626' }}>{stats.atRiskCount}</span>
              <span className="customer-stat-label" style={{ color: '#b91c1c' }}>Cờ rủi ro rời bỏ</span>
            </div>
          </div>
        )}
      </div>

      {/* ── TAB 1: DANH SÁCH DOANH NGHIỆP (S3-01, S3-05, S3-07) ── */}
      {activeTab === 'CUSTOMERS' && (
        <>
          {/* Filters & Bộ lọc lưu sẵn (S3-07) */}
          <div className="customer-filters-panel">
            <div className="customer-search-box">
              <IconSearch />
              <input
                type="text"
                className="customer-search-input"
                placeholder="Tìm theo tên công ty, mã số thuế, mã KH, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="customer-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CustomerStatus | '')}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="POTENTIAL">Tiềm năng</option>
              <option value="IN_TRANSACTION">Đang giao dịch</option>
              <option value="ACTIVE_CUSTOMER">Khách hàng</option>
              <option value="STOPPED">Ngừng hợp tác</option>
            </select>

            <select
              className="customer-filter-select"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
            >
              <option value="">Tất cả ngành nghề</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            <select
              className="customer-filter-select"
              value={filterCompanySize}
              onChange={(e) => setFilterCompanySize(e.target.value)}
            >
              <option value="">Tất cả quy mô</option>
              {companySizes.map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>

            <select
              className="customer-filter-select"
              value={filterCorporateStructure}
              onChange={(e) => setFilterCorporateStructure(e.target.value as any)}
            >
              <option value="">Tất cả cơ cấu</option>
              <option value="PARENT">Tập đoàn / Cty mẹ</option>
              <option value="CHILD">Công ty con</option>
              <option value="INDEPENDENT">Công ty độc lập</option>
            </select>

            {/* S3-07 Bộ lọc hay dùng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Bộ lọc lưu:</span>
              {savedFilters.map((sf, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px' }}
                  onClick={() => {
                    setFilterStatus(sf.status as CustomerStatus | '')
                    setFilterIndustry(sf.industry)
                  }}
                >
                  {sf.name}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Table */}
          <div className="customer-table-card">
            <div className="customer-table-responsive">
              <table className="enterprise-customer-table cust-main-table">
                <thead>
                  <tr>
                    <th>Mã KH</th>
                    <th>Tên Doanh Nghiệp</th>
                    <th>Ngành nghề & Quy mô</th>
                    <th>Liên hệ</th>
                    <th>Người sở hữu</th>
                    <th>Trạng thái & Rủi ro</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          Không tìm thấy khách hàng nào trong phạm vi dữ liệu của bạn.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedCustomers.map((cust) => {
                      const isMine = cust.owner_id === user?.id
                      const statusColor = (cust.status && CUSTOMER_STATUS_COLORS[cust.status]) || {
                        bg: '#eff6ff',
                        color: '#2563eb',
                        border: '#bfdbfe',
                      }
                      const isAtRisk = customerService.isCustomerAtRisk(cust.id)
                      const groupSummary = customerService.getGroupContractTotal(cust.id)
                      const parentRel = customerService.getParentRelation(cust.id)

                      return (
                        <tr key={cust.id} id={`customer-row-${cust.id}`}>
                          <td>
                            <span className="cust-code-tag">{cust.code}</span>
                          </td>
                          <td>
                            <strong
                              className="cust-company-name"
                              style={{ cursor: 'pointer', color: '#1d4ed8' }}
                              onClick={() => setSelected360Customer(cust)}
                              title="Xem Trang 360 độ khách hàng"
                            >
                              {cust.name}
                            </strong>
                            {cust.tax_code && (
                              <div className="cust-tax-code">
                                Mã số thuế: <span>{cust.tax_code}</span>
                              </div>
                            )}
                            {/* AC S3-05: Hiển thị tổng giá trị hợp đồng nếu là công ty mẹ */}
                            {groupSummary.childrenCount > 0 && (
                              <div className="cust-group-parent-tag">
                                Tập đoàn ({groupSummary.childrenCount} cty con): {formatCurrencyVND(groupSummary.totalValue)}
                              </div>
                            )}
                            {/* AC S3-05: Hiển thị nếu là công ty con trực thuộc */}
                            {parentRel && (
                              <div className="cust-group-child-tag">
                                Thuộc tập đoàn: <strong>{parentRel.parent_name}</strong>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="cust-industry-text">{cust.industry}</div>
                            <div className="cust-size-text">{cust.company_size}</div>
                          </td>
                          <td>
                            {cust.phone ? (
                              <div className="cust-contact-phone">{cust.phone}</div>
                            ) : (
                              <div className="cust-contact-empty">—</div>
                            )}
                            {cust.email && <div className="cust-contact-email">{cust.email}</div>}
                          </td>
                          <td>
                            <div className={`cust-owner-badge ${isMine ? 'is-mine' : ''}`}>
                              {cust.owner_name}
                            </div>
                            <span className="cust-team-text">{cust.team_name}</span>
                          </td>
                          <td>
                            <span
                              className="cust-status-badge"
                              style={{
                                background: statusColor.bg,
                                color: statusColor.color,
                                border: `1px solid ${statusColor.border}`,
                              }}
                            >
                              <span className="cust-status-dot" />
                              {CUSTOMER_STATUS_LABELS[cust.status] || cust.status || 'Tiềm năng'}
                            </span>
                            {/* AC S3-08: Cờ rủi ro rời bỏ tự động */}
                            {isAtRisk && (
                              <div>
                                <span className="cust-risk-badge">Rủi ro rời bỏ</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="cust-action-group">
                              <button
                                type="button"
                                className="cust-action-btn"
                                onClick={() => setSelected360Customer(cust)}
                              >
                                Xem
                              </button>
                              <button
                                type="button"
                                className="cust-action-btn"
                                onClick={() => handleOpenEditModal(cust)}
                              >
                                Sửa
                              </button>
                              <details className="cust-action-menu">
                                <summary className="cust-more-btn" title="Thao tác khác" aria-label="Thao tác khác">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                  </svg>
                                </summary>
                                <div className="cust-more-menu">
                                  <button
                                    type="button"
                                    className="cust-more-menu-item"
                                    onClick={(event) => {
                                      event.currentTarget.closest('details')?.removeAttribute('open')
                                      handleOpenParentModal(cust)
                                    }}
                                  >
                                    <IconLink />
                                    <span>{parentRel ? 'Sửa/gỡ liên kết công ty mẹ' : 'Liên kết công ty mẹ'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="cust-more-menu-item danger"
                                    onClick={(event) => {
                                      event.currentTarget.closest('details')?.removeAttribute('open')
                                      setDeletingCustomer(cust)
                                    }}
                                  >
                                    <IconTrash />
                                    <span>Xóa khách hàng</span>
                                  </button>
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            {scopedCustomers.length > 0 && (
              <div className="customer-pagination" style={{ margin: '16px 20px 20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div className="customer-pagination-info">
                  <span>
                    Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, scopedCustomers.length)}</strong> -{' '}
                    <strong>{Math.min(currentPage * pageSize, scopedCustomers.length)}</strong> trên tổng số{' '}
                    <strong>{scopedCustomers.length}</strong> khách hàng
                  </span>
                  <div className="customer-pagination-size">
                    <label htmlFor="customer-page-size-select">Hiển thị:</label>
                    <select
                      id="customer-page-size-select"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="customer-pagination-select"
                    >
                      <option value={5}>5 khách hàng / trang</option>
                      <option value={10}>10 khách hàng / trang</option>
                      <option value={20}>20 khách hàng / trang</option>
                    </select>
                  </div>
                </div>

                <div className="customer-pagination-controls">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    className="customer-page-btn nav-btn"
                  >
                    Trước
                  </button>

                  <div className="customer-page-numbers">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`customer-page-btn page-num ${currentPage === page ? 'active' : ''}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                    className="customer-page-btn nav-btn"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB 2: NGƯỜI LIÊN HỆ & VAI TRÒ MUA (S3-02) ── */}
      {activeTab === 'CONTACTS' && (
        <div className="customer-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                className="customer-search-input"
                style={{ width: '280px' }}
                placeholder="Tìm theo tên, chức danh, email, SĐT..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenContactModal()}
            >
              <IconPlus />
              <span>Thêm người liên hệ</span>
            </button>
          </div>

          <div className="customer-table-responsive">
            <table className="enterprise-customer-table cust-contacts-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Doanh nghiệp</th>
                  <th>Chức danh</th>
                  <th>Vai trò quyết định mua</th>
                  <th>Đầu mối</th>
                  <th>Thông tin liên lạc</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      Chưa có người liên hệ nào.
                    </td>
                  </tr>
                ) : (
                  contacts.map((ct) => {
                    const badge = (ct.buying_role && BUYING_ROLE_BADGES[ct.buying_role]) || {
                      bg: '#eff6ff',
                      color: '#1d4ed8',
                      border: '#bfdbfe',
                    }
                    return (
                      <tr key={ct.id}>
                        <td>
                          <strong>{ct.full_name}</strong>
                          {ct.history && ct.history.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#2563eb' }}>
                              Đã chuyển từ {ct.history[0].from_customer_name}
                            </div>
                          )}
                        </td>
                        <td>{ct.customer_name}</td>
                        <td>{ct.title}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {BUYING_ROLE_LABELS[ct.buying_role] || ct.buying_role || 'Người ảnh hưởng'}
                          </span>
                        </td>
                        <td>
                          {ct.is_primary ? (
                            <span style={{ color: '#059669', fontWeight: 700, fontSize: '12px' }}>Đầu mối chính</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td>
                          {ct.phone && <div>{ct.phone}</div>}
                          {ct.email && <div style={{ fontSize: '11.5px', color: '#64748b' }}>{ct.email}</div>}
                        </td>
                        <td>
                          <div className="cust-action-group">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => {
                                setTransferingContact(ct)
                                setTransferTargetCustId('')
                                setTransferReason('')
                              }}
                              title="Chuyển sang công ty khác"
                            >
                              Chuyển Cty
                            </button>
                            <button
                              type="button"
                              className="cust-btn-icon edit"
                              onClick={() => {
                                setEditingContact(ct)
                                setContactForm({
                                  customer_id: ct.customer_id,
                                  full_name: ct.full_name,
                                  title: ct.title,
                                  email: ct.email,
                                  phone: ct.phone,
                                  buying_role: ct.buying_role,
                                  is_primary: ct.is_primary,
                                  notes: ct.notes || '',
                                })
                                setIsContactModalOpen(true)
                              }}
                            >
                              <IconEdit />
                            </button>
                            <button
                              type="button"
                              className="cust-btn-icon delete"
                              onClick={() => {
                                if (window.confirm(`Xóa người liên hệ "${ct.full_name}"?`)) {
                                  customerService.deleteContact(ct.id)
                                  showToast('Đã xóa người liên hệ!')
                                  loadCustomers()
                                }
                              }}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: CẢNH BÁO & GỘP TRÙNG (S3-04) ── */}
      {activeTab === 'MERGE' && (
        <div className="customer-table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#0f172a' }}>
              Phát hiện trùng lặp & Hợp nhất khách hàng
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Hệ thống tự động quét trùng theo Mã số thuế, tên công ty và website. Trưởng nhóm có thể so sánh cạnh nhau và gộp giữ nguyên toàn bộ lịch sử.
            </p>
          </div>

          {duplicateGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#059669', fontSize: '15px' }}>
                Tuyệt vời! Không phát hiện bản ghi khách hàng nào bị trùng lặp trên hệ thống.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {duplicateGroups.map((grp) => (
                <div key={grp.id} style={{ border: '1px solid #fed7aa', background: '#fffbeb', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ color: '#b45309', fontSize: '14px' }}>
                      Phát hiện {grp.customers.length} bản ghi nghi vấn trùng ({grp.match_field_value})
                    </strong>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedMergeGroup(grp)
                        setPrimaryMergeId(grp.customers[0].id)
                      }}
                    >
                      So sánh & Hợp nhất
                    </button>
                  </div>

                  <div className="dup-compare-grid">
                    {grp.customers.map((c) => (
                      <div key={c.id} className="dup-card">
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>
                          {c.name} ({c.code})
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>Mã số thuế: {c.tax_code || 'Chưa có'}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>Website: {c.website || 'Chưa có'}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>Người phụ trách: {c.owner_name} ({c.team_name})</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: CSKH & CỜ RỦI RO RỜI BỎ ── */}
      {activeTab === 'SUPPORT' && (
        <div className="customer-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                Cảnh báo rủi ro
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setTicketForm({
                  customer_id: allCustomers[0]?.id || '',
                  title: '',
                  priority: 'HIGH',
                  assignee_id: user?.id ?? 1,
                  description: '',
                })
                setIsTicketModalOpen(true)
              }}
            >
              <IconPlus />
              <span>Ghi nhận Yêu cầu hỗ trợ</span>
            </button>
          </div>

          <div className="customer-table-responsive">
            <table className="enterprise-customer-table cust-tickets-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Tiêu đề yêu cầu</th>
                  <th>Mức ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Người xử lý</th>
                  <th>Thời gian tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      Chưa có yêu cầu hỗ trợ nào.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.customer_name}</strong>
                      </td>
                      <td>
                        <div>{t.title}</div>
                        {t.description && <div style={{ fontSize: '11.5px', color: '#64748b' }}>{t.description}</div>}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: t.priority === 'URGENT' ? '#fee2e2' : t.priority === 'HIGH' ? '#ffedd5' : '#f1f5f9',
                          color: t.priority === 'URGENT' ? '#dc2626' : t.priority === 'HIGH' ? '#c2410c' : '#475569',
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          background: t.status === 'RESOLVED' ? '#ecfdf5' : '#eff6ff',
                          color: t.status === 'RESOLVED' ? '#059669' : '#1d4ed8',
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.assignee_name}</td>
                      <td>{new Date(t.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="cust-action-group">
                          {t.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#059669' }}
                              onClick={() => {
                                customerService.updateTicketStatus(t.id, 'RESOLVED')
                                showToast('Đã giải quyết yêu cầu hỗ trợ!')
                                loadCustomers()
                              }}
                            >
                              Xong
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: CHĂM SÓC ĐỊNH KỲ ── */}
      {activeTab === 'PERIODIC' && (
        <div className="customer-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                Danh sách khách hàng cần chăm sóc định kỳ
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Liệt kê các khách chưa tương tác trong N ngày, sắp xếp theo giá trị hợp đồng giảm dần.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#475569' }}>Ngưỡng chưa tương tác:</label>
              <select
                className="customer-filter-select"
                value={periodicCareDays}
                onChange={(e) => setPeriodicCareDays(Number(e.target.value))}
              >
                <option value={15}>15 ngày</option>
                <option value={30}>30 ngày (Chuẩn)</option>
                <option value={60}>60 ngày</option>
                <option value={90}>90 ngày</option>
              </select>
            </div>
          </div>

          <div className="customer-table-responsive">
            <table className="enterprise-customer-table cust-periodic-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Chưa tương tác</th>
                  <th>Giá trị hợp đồng</th>
                  <th>Người phụ trách</th>
                  <th style={{ textAlign: 'right' }}>Đánh dấu đã liên hệ</th>
                </tr>
              </thead>
              <tbody>
                {periodicCareList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#059669', fontWeight: 600 }}>
                      Rất tốt! Không có khách hàng nào bị bỏ quên quá {periodicCareDays} ngày.
                    </td>
                  </tr>
                ) : (
                  periodicCareList.map((item) => (
                    <tr key={item.customer.id}>
                      <td>
                        <div className="periodic-cust-cell">
                          <span className="periodic-cust-name">{item.customer.name}</span>
                          <span className="cust-code-tag">{item.customer.code}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cust-days-pill">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{item.days_without_interaction} ngày</span>
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>
                          {item.contract_value.toLocaleString('vi-VN')} đ
                        </strong>
                      </td>
                      <td>
                        <div className="periodic-owner-cell">
                          <div className="periodic-avatar">
                            {(item.customer.owner_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span>{item.customer.owner_name || 'Chưa phân bổ'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cust-action-group" style={{ justifyContent: 'flex-end' }}>
                          {item.is_contacted_today ? (
                            <span className="cust-contacted-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Đã liên hệ hôm nay</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary cust-call-btn"
                              onClick={() => {
                                customerService.addActivity({
                                  customer_id: item.customer.id,
                                  type: 'CALL',
                                  title: 'Cuộc gọi chăm sóc định kỳ',
                                  description: 'Hỏi thăm tình hình sử dụng dịch vụ và gia hạn hợp đồng.',
                                  performed_by_name: user?.full_name ?? 'Tôi',
                                })
                                item.is_contacted_today = true
                                showToast(`Đã đánh dấu liên hệ thành công cho "${item.customer.name}"!`)
                                setPeriodicCareList([...periodicCareList])
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              <span>Đánh dấu đã gọi</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

        </>
      )}

      {/* ── MODAL THÊM / SỬA KHÁCH HÀNG (S3-01) ── */}
      {isModalOpen && (
        <div className="cust-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="cust-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>{editingCustomer ? 'Chỉnh sửa Hồ sơ Khách hàng' : 'Thêm mới Khách hàng Doanh nghiệp'}</h3>
              <button
                type="button"
                className="cust-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="cust-modal-body">
                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Tên công ty / Doanh nghiệp <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`cust-form-input ${formErrors.name ? 'has-error' : ''}`}
                      placeholder="VD: Công ty Cổ phần Công Nghệ Alpha"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                    />
                    {formErrors.name && <span className="cust-form-error">{formErrors.name}</span>}
                  </div>

                  <div className="cust-form-group">
                    <label>Mã số thuế</label>
                    <input
                      type="text"
                      className={`cust-form-input ${formErrors.tax_code ? 'has-error' : ''}`}
                      placeholder="VD: 0102345678 (Duy nhất)"
                      value={formData.tax_code}
                      onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                    />
                    {formErrors.tax_code ? (
                      <span className="cust-form-error">{formErrors.tax_code}</span>
                    ) : (
                      <span className="cust-form-hint">Mã số thuế nếu có thì phải là duy nhất trên hệ thống</span>
                    )}
                  </div>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Ngành nghề</label>
                    <select
                      className="cust-form-select"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cust-form-group">
                    <label>Quy mô</label>
                    <select
                      className="cust-form-select"
                      value={formData.company_size}
                      onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                    >
                      {companySizes.map((sz) => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Website</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="cust-form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="024 3768 9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Trạng thái</label>
                    <select
                      className="cust-form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    >
                      <option value="POTENTIAL">Tiềm năng</option>
                      <option value="IN_TRANSACTION">Đang giao dịch</option>
                      <option value="ACTIVE_CUSTOMER">Khách hàng</option>
                      <option value="STOPPED">Ngừng hợp tác</option>
                    </select>
                  </div>

                  <div className="cust-form-group">
                    <label>Người sở hữu</label>
                    <select
                      className="cust-form-select"
                      value={formData.owner_id}
                      onChange={(e) => setFormData({ ...formData, owner_id: Number(e.target.value) })}
                      disabled={user?.role === 'STAFF' || user?.role === 'USER'}
                    >
                      {teamMembers.length > 0 ? (
                        teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.team_name})
                          </option>
                        ))
                      ) : (
                        <option value={user?.id ?? 1}>{user?.full_name ?? 'Tôi'}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Thuộc công ty mẹ / Tập đoàn (nếu là cty con)</label>
                    <select
                      className="cust-form-select"
                      value={formData.parent_id || ''}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    >
                      <option value="">-- Doanh nghiệp độc lập (Không có công ty mẹ) --</option>
                      {customerService.getAvailableParentCompanies(editingCustomer?.id).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code} - {c.industry})
                        </option>
                      ))}
                    </select>
                    <span className="cust-form-hint">Khai báo quan hệ công ty mẹ để gộp doanh số vào tập đoàn (S3-05)</span>
                  </div>
                </div>
              </div>

              <div className="cust-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL NGƯỜI LIÊN HỆ (S3-02) ── */}
      {isContactModalOpen && (
        <div className="cust-modal-backdrop" onClick={() => setIsContactModalOpen(false)}>
          <div className="cust-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>{editingContact ? 'Chỉnh sửa Người liên hệ' : 'Thêm Người liên hệ mới'}</h3>
              <button type="button" className="cust-modal-close-btn" onClick={() => setIsContactModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveContact}>
              <div className="cust-modal-body">
                <div className="cust-form-group">
                  <label>Khách hàng Doanh nghiệp</label>
                  <select
                    className="cust-form-select"
                    value={contactForm.customer_id}
                    onChange={(e) => setContactForm({ ...contactForm, customer_id: e.target.value })}
                  >
                    {allCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Họ và tên <span className="required">*</span></label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="Nguyễn Văn A"
                      value={contactForm.full_name}
                      onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="cust-form-group">
                    <label>Chức danh</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="Giám đốc CNTT / Kế toán trưởng..."
                      value={contactForm.title}
                      onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="0912 345 678"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="cust-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="cust-form-input"
                      placeholder="contact@company.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Vai trò trong quyết định mua</label>
                    <select
                      className="cust-form-select"
                      value={contactForm.buying_role}
                      onChange={(e) => setContactForm({ ...contactForm, buying_role: e.target.value as BuyingRole })}
                    >
                      <option value="DECISION_MAKER">Người quyết định (Ký duyệt)</option>
                      <option value="INFLUENCER">Người ảnh hưởng (Đề xuất)</option>
                      <option value="END_USER">Người dùng cuối (Sử dụng trực tiếp)</option>
                      <option value="BLOCKER">Người cản trở (Có thể phản đối)</option>
                    </select>
                  </div>

                  <div className="cust-form-group" style={{ justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                      <input
                        type="checkbox"
                        checked={contactForm.is_primary}
                        onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                      />
                      <span>Đánh dấu là Đầu mối liên hệ chính</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="cust-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsContactModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu người liên hệ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CHUYỂN NGƯỜI LIÊN HỆ SANG CÔNG TY KHÁC ── */}
      {transferingContact && (
        <div className="cust-modal-backdrop" onClick={() => setTransferingContact(null)}>
          <div className="cust-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>Chuyển Người liên hệ sang Khách hàng mới</h3>
              <button type="button" className="cust-modal-close-btn" onClick={() => setTransferingContact(null)}>&times;</button>
            </div>
            <div className="cust-modal-body">
              <p style={{ margin: 0, fontSize: '13.5px', color: '#334155' }}>
                Chuyển nhân sự <strong>{transferingContact.full_name}</strong> từ công ty <em>{transferingContact.customer_name}</em> sang pháp nhân mới. Toàn bộ lịch sử sẽ được bảo lưu.
              </p>

              <div className="cust-form-group">
                <label>Chọn công ty khách hàng tiếp nhận</label>
                <select
                  className="cust-form-select"
                  value={transferTargetCustId}
                  onChange={(e) => setTransferTargetCustId(e.target.value)}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {allCustomers
                    .filter((c) => c.id !== transferingContact.customer_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="cust-form-group">
                <label>Lý do chuyển công tác</label>
                <input
                  type="text"
                  className="cust-form-input"
                  placeholder="VD: Thay đổi công tác sang vị trí Giám đốc Vận hành tại tập đoàn mới"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </div>
            </div>
            <div className="cust-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setTransferingContact(null)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleExecuteTransferContact} disabled={!transferTargetCustId}>
                Xác nhận chuyển giao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SO SÁNH & GỘP TRÙNG ── */}
      {selectedMergeGroup && (
        <div className="cust-modal-backdrop" onClick={() => setSelectedMergeGroup(null)}>
          <div className="c360-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>So sánh & Gộp Khách hàng Trùng lặp</h3>
              <button type="button" className="cust-modal-close-btn" onClick={() => setSelectedMergeGroup(null)}>&times;</button>
            </div>
            <div className="cust-modal-body">
              <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                Chọn một hồ sơ làm bản ghi chính để giữ lại. Toàn bộ người liên hệ, cơ hội và lịch sử hoạt động từ bản ghi còn lại sẽ được tự động gom về hồ sơ chính.
              </p>

              <div className="dup-compare-grid">
                {selectedMergeGroup.customers.map((c) => (
                  <div
                    key={c.id}
                    className={`dup-card ${primaryMergeId === c.id ? 'primary' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPrimaryMergeId(c.id)}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input
                        type="radio"
                        name="primaryMergeChoice"
                        checked={primaryMergeId === c.id}
                        onChange={() => setPrimaryMergeId(c.id)}
                      />
                      <strong style={{ color: primaryMergeId === c.id ? '#1d4ed8' : '#0f172a' }}>
                        {c.name} {primaryMergeId === c.id && '(Bản ghi chính giữ lại)'}
                      </strong>
                    </label>
                    <div style={{ fontSize: '12px', color: '#475569' }}>Mã: {c.code}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>Mã số thuế: {c.tax_code || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>Website: {c.website || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>Người phụ trách: {c.owner_name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="cust-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedMergeGroup(null)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleExecuteMerge}>
                Hợp nhất vào bản ghi chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GẮN CÔNG TY MẸ ── */}
      {parentModalCustomer && (() => {
        const currentRel = customerService.getParentRelation(parentModalCustomer.id)
        const availableParents = customerService.getAvailableParentCompanies(parentModalCustomer.id)
        return (
          <div className="cust-modal-backdrop" onClick={() => setParentModalCustomer(null)}>
            <div className="cust-modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
              <div className="cust-modal-header">
                <h3>Khai báo Công ty Mẹ - Con</h3>
                <button type="button" className="cust-modal-close-btn" onClick={() => setParentModalCustomer(null)}>&times;</button>
              </div>
              <div className="cust-modal-body">
                <p style={{ margin: 0, fontSize: '13.5px', color: '#334155' }}>
                  Doanh nghiệp: <strong>{parentModalCustomer.name}</strong> ({parentModalCustomer.code})
                </p>

                {currentRel ? (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                      Đang là công ty con của: {currentRel.parent_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                      Thiết lập từ: {new Date(currentRel.established_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px', color: '#64748b' }}>
                    Hiện là doanh nghiệp độc lập (chưa trực thuộc công ty mẹ nào).
                  </div>
                )}

                <div className="cust-form-group" style={{ marginTop: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Chọn công ty mẹ / Tập đoàn quản lý</label>
                  <select
                    className="cust-form-select"
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                  >
                    <option value="">-- Chọn công ty mẹ --</option>
                    {availableParents.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code} - {c.industry})
                      </option>
                    ))}
                  </select>
                  <span className="cust-form-hint">Hệ thống tự động loại trừ các công ty con thuộc nhánh để chống lặp vòng phân cấp</span>
                </div>
              </div>
              <div className="cust-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {currentRel && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fff5f5' }}
                      onClick={handleRemoveParentCompany}
                    >
                      Gỡ khỏi tập đoàn
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setParentModalCustomer(null)}>Hủy</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveParentCompany}
                    disabled={!selectedParentId || selectedParentId === currentRel?.parent_id}
                  >
                    {currentRel ? 'Đổi công ty mẹ' : 'Lưu liên kết'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── MODAL XEM TRƯỚC NHẬP EXCEL ── */}
      {importPreview && (
        <div className="cust-modal-backdrop" onClick={() => { setImportPreview(null); setImportSearchQuery(''); setImportStatusFilter('ALL'); }}>
          <div className="c360-modal-content" style={{ maxWidth: '880px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>Xem trước & Báo lỗi Nhập file Excel</h3>
              <button type="button" className="cust-modal-close-btn" onClick={() => { setImportPreview(null); setImportSearchQuery(''); setImportStatusFilter('ALL'); }}>&times;</button>
            </div>
            <div className="cust-modal-body">
              <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                Hệ thống kiểm tra từng dòng, phát hiện và cảnh báo các bản ghi bị trùng mã số thuế trước khi ghi vào CSDL.
              </p>

              {/* Thanh Tìm kiếm & Lọc dữ liệu import */}
              <div className="import-modal-controls-bar">
                <div className="import-stats-pills">
                  <span className="import-stat-badge total">
                    Tổng: {importPreview.length} dòng
                  </span>
                  <span className="import-stat-badge valid">
                    Hợp lệ: {importPreview.filter((i) => !i.isDuplicate).length} dòng
                  </span>
                  <span className="import-stat-badge duplicate">
                    Trùng mã số thuế: {importPreview.filter((i) => i.isDuplicate).length} dòng
                  </span>
                </div>

                <div className="import-controls-right">
                  <div className="import-search-box">
                    <input
                      type="text"
                      className="import-search-input"
                      placeholder="Tìm theo tên công ty, MST, ngành..."
                      value={importSearchQuery}
                      onChange={(e) => setImportSearchQuery(e.target.value)}
                    />
                    {importSearchQuery && (
                      <button
                        type="button"
                        className="import-search-clear"
                        onClick={() => setImportSearchQuery('')}
                        title="Xóa tìm kiếm"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="import-filter-pills">
                    <button
                      type="button"
                      className={`import-filter-btn ${importStatusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setImportStatusFilter('ALL')}
                    >
                      Tất cả ({importPreview.length})
                    </button>
                    <button
                      type="button"
                      className={`import-filter-btn ${importStatusFilter === 'VALID' ? 'active' : ''}`}
                      onClick={() => setImportStatusFilter('VALID')}
                    >
                      Hợp lệ ({importPreview.filter((i) => !i.isDuplicate).length})
                    </button>
                    <button
                      type="button"
                      className={`import-filter-btn ${importStatusFilter === 'DUPLICATE' ? 'active' : ''}`}
                      onClick={() => setImportStatusFilter('DUPLICATE')}
                    >
                      Trùng lặp ({importPreview.filter((i) => i.isDuplicate).length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="customer-table-responsive" style={{ maxHeight: '340px' }}>
                <table className="enterprise-customer-table cust-import-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Dòng</th>
                      <th>Tên công ty</th>
                      <th>Mã số thuế</th>
                      <th>Ngành nghề</th>
                      <th>Trạng thái kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredImportRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                            Không tìm thấy bản ghi nào phù hợp
                          </div>
                          <div style={{ fontSize: '12.5px' }}>
                            Vui lòng thử lại với từ khóa tìm kiếm hoặc điều kiện lọc khác.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredImportRows.map((item) => (
                        <tr key={item.row}>
                          <td style={{ textAlign: 'center' }}>{item.row}</td>
                          <td><strong>{item.name}</strong></td>
                          <td><code>{item.tax_code}</code></td>
                          <td>{item.industry}</td>
                          <td>
                            {item.isDuplicate ? (
                              <span style={{ color: '#dc2626', fontWeight: 600, background: '#fef2f2', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                Bị trùng mã số thuế (Sẽ bỏ qua)
                              </span>
                            ) : (
                              <span style={{ color: '#059669', fontWeight: 600, background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                Hợp lệ (Sẵn sàng tạo)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="cust-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setImportPreview(null); setImportSearchQuery(''); setImportStatusFilter('ALL'); }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={importPreview.filter((i) => !i.isDuplicate).length === 0}
              >
                Xác nhận Nhập dữ liệu ({importPreview.filter((i) => !i.isDuplicate).length} hợp lệ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL YÊU CẦU CSKH ── */}
      {isTicketModalOpen && (
        <div className="cust-modal-backdrop" onClick={() => setIsTicketModalOpen(false)}>
          <div className="cust-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>Ghi nhận Yêu cầu Hỗ trợ Sau bán</h3>
              <button type="button" className="cust-modal-close-btn" onClick={() => setIsTicketModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="cust-modal-body">
                <div className="cust-form-group">
                  <label>Khách hàng cần hỗ trợ</label>
                  <select
                    className="cust-form-select"
                    value={ticketForm.customer_id}
                    onChange={(e) => setTicketForm({ ...ticketForm, customer_id: e.target.value })}
                  >
                    {allCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="cust-form-group">
                  <label>Tiêu đề yêu cầu <span className="required">*</span></label>
                  <input
                    type="text"
                    className="cust-form-input"
                    placeholder="VD: Không xuất được hóa đơn điện tử..."
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Mức độ ưu tiên</label>
                    <select
                      className="cust-form-select"
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    >
                      <option value="LOW">Thấp (Low)</option>
                      <option value="MEDIUM">Trung bình (Medium)</option>
                      <option value="HIGH">Cao (High)</option>
                      <option value="URGENT">Khẩn cấp (Urgent)</option>
                    </select>
                  </div>

                  <div className="cust-form-group">
                    <label>Chuyên viên xử lý</label>
                    <select
                      className="cust-form-select"
                      value={ticketForm.assignee_id}
                      onChange={(e) => setTicketForm({ ...ticketForm, assignee_id: Number(e.target.value) })}
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cust-form-group">
                  <label>Mô tả chi tiết vấn đề</label>
                  <textarea
                    rows={3}
                    className="cust-form-textarea"
                    placeholder="Nội dung khách hàng phản hồi..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="cust-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsTicketModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Ghi nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA KHÁCH HÀNG ── */}
      {deletingCustomer && (
        <div className="cust-modal-backdrop" onClick={() => setDeletingCustomer(null)}>
          <div className="cust-modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>Xác nhận xóa khách hàng</h3>
              <button type="button" className="cust-modal-close-btn" onClick={() => setDeletingCustomer(null)}>&times;</button>
            </div>
            <div className="cust-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
                Bạn có chắc chắn muốn xóa hồ sơ khách hàng <strong>{deletingCustomer.name}</strong> ({deletingCustomer.code}) không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="cust-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeletingCustomer(null)}>Hủy</button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleConfirmDelete}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast && (
        <div className={`cust-toast ${toast.isError ? 'error' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
