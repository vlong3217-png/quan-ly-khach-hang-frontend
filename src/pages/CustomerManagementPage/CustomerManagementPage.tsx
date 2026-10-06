import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { usePermission } from '../../hooks/usePermission.ts'
import { customerService } from '../../services/customerService.ts'
import { categoryService } from '../../services/categoryService.ts'
import { userService } from '../../services/userService.ts'
import type {
  CustomerEnterprise,
  CustomerStatus,
} from '../../types/customer.ts'
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
} from '../../types/customer.ts'
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

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="9" y1="22" x2="9" y2="22.01" />
    <line x1="15" y1="22" x2="15" y2="22.01" />
    <line x1="9" y1="18" x2="9" y2="18.01" />
    <line x1="15" y1="18" x2="15" y2="18.01" />
    <line x1="9" y1="14" x2="9" y2="14.01" />
    <line x1="15" y1="14" x2="15" y2="14.01" />
    <line x1="9" y1="10" x2="9" y2="10.01" />
    <line x1="15" y1="10" x2="15" y2="10.01" />
    <line x1="9" y1="6" x2="9" y2="6.01" />
    <line x1="15" y1="6" x2="15" y2="6.01" />
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

export default function CustomerManagementPage() {
  const { user } = useAuth()
  const { scope, filterScopedData } = usePermission()

  // Danh sách toàn bộ khách hàng và danh sách đã lọc theo scope
  const [allCustomers, setAllCustomers] = useState<CustomerEnterprise[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | ''>('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterCompanySize, setFilterCompanySize] = useState('')

  // Toast thông báo
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  // Danh mục ngành nghề & quy mô từ Master Data
  const [industries, setIndustries] = useState<string[]>([])
  const [companySizes, setCompanySizes] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string; team_name: string }[]>([])

  // Modal Thêm / Sửa khách hàng
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerEnterprise | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerEnterprise | null>(null)

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
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 3500)
  }

  // Load danh mục ngành nghề, quy mô, và danh sách nhân sự phụ trách
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

      // Lấy danh sách users
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

  // Load danh sách khách hàng từ customerService
  const loadCustomers = () => {
    const list = customerService.getCustomers({
      search,
      status: filterStatus,
      industry: filterIndustry,
      company_size: filterCompanySize,
    })
    setAllCustomers(list)
  }

  useEffect(() => {
    loadCustomers()
    setCurrentPage(1)
  }, [search, filterStatus, filterIndustry, filterCompanySize])

  // Lọc theo phạm vi dữ liệu sở hữu (Data Scope Acceptance Criteria:
  // - USER / PERSONAL: Chỉ thấy khách hàng do mình sở hữu (owner_id === user.id)
  // - MANAGER / TEAM: Thấy toàn bộ khách hàng của đội nhóm mình (team_id === user.team_id)
  // - ADMIN / GLOBAL: Thấy toàn bộ khách hàng trên hệ thống
  const scopedCustomers = useMemo(() => {
    return filterScopedData(allCustomers, {
      getOwnerId: (c) => c.owner_id,
      getTeamId: (c) => c.team_id,
    })
  }, [allCustomers, filterScopedData])

  // Thống kê nhanh theo trạng thái từ danh sách scoped
  const stats = useMemo(() => {
    const total = scopedCustomers.length
    const potential = scopedCustomers.filter((c) => c.status === 'POTENTIAL').length
    const inTransaction = scopedCustomers.filter((c) => c.status === 'IN_TRANSACTION').length
    const active = scopedCustomers.filter((c) => c.status === 'ACTIVE_CUSTOMER').length
    const stopped = scopedCustomers.filter((c) => c.status === 'STOPPED').length
    return { total, potential, inTransaction, active, stopped }
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
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Mở modal sửa khách hàng
  const handleOpenEditModal = (cust: CustomerEnterprise) => {
    setEditingCustomer(cust)
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
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên công ty / doanh nghiệp'
    }

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

  // Lưu khách hàng (Create / Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    // Tìm thông tin owner và team
    const assignedUser = teamMembers.find((m) => m.id === Number(formData.owner_id))
    const ownerName = assignedUser ? assignedUser.name : (user?.full_name || 'Người dùng')
    const teamName = assignedUser ? assignedUser.team_name : 'Đội Kinh Doanh 1'
    const teamId = typeof user?.team_id === 'number' ? user.team_id : Number(user?.team_id) || 1

    try {
      if (editingCustomer) {
        customerService.updateCustomer(editingCustomer.id, {
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
        })
        showToast(`Đã cập nhật hồ sơ khách hàng "${formData.name.trim()}" thành công!`)
      } else {
        customerService.createCustomer({
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
        })
        showToast(`Đã thêm thành công khách hàng "${formData.name.trim()}"!`)
      }

      setIsModalOpen(false)
      loadCustomers()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu khách hàng'
      showToast(errMsg, true)
    }
  }

  // Xóa khách hàng
  const handleConfirmDelete = () => {
    if (!deletingCustomer) return
    const success = customerService.deleteCustomer(deletingCustomer.id)
    if (success) {
      showToast(`Đã xóa khách hàng "${deletingCustomer.name}" (${deletingCustomer.code})!`)
      loadCustomers()
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

  return (
    <div className="customer-page" id="customer-management-page">
      {/* ── 1. Page Header ── */}
      <div className="customer-header-bar">
        <div className="customer-header-info">
          <h2>
            Quản lý Hồ sơ Khách hàng Doanh nghiệp
          </h2>
          <p>
            Danh sách khách hàng chuẩn tập trung hóa — Phân quyền theo mô hình dữ liệu sở hữu ({scope}).
          </p>
        </div>

        <div className="customer-header-actions">
          <span className="scope-indicator-pill" title={`Phạm vi dữ liệu: ${scope}`}>
            ● Phạm vi: {scope === 'ALL' ? 'Toàn công ty' : scope === 'TEAM' ? 'Toàn nhóm' : 'Cá nhân phụ trách'}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Xuất file CSV / Excel danh sách khách hàng"
          >
            <IconDownload />
            <span>Xuất Excel</span>
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
      </div>

      {/* ── 3. Filters & Search Bar ── */}
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
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>

        <select
          className="customer-filter-select"
          value={filterCompanySize}
          onChange={(e) => setFilterCompanySize(e.target.value)}
        >
          <option value="">Tất cả quy mô</option>
          {companySizes.map((sz) => (
            <option key={sz} value={sz}>
              {sz}
            </option>
          ))}
        </select>
      </div>

      {/* ── 4. Customer Table ── */}
      <div className="customer-table-card">
        <div className="customer-table-responsive">
          <table className="enterprise-customer-table">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Tên Doanh Nghiệp / Công Ty</th>
                <th>Ngành nghề</th>
                <th>Quy mô</th>
                <th>Liên hệ</th>
                <th>Người sở hữu</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {scopedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="cust-empty-state">
                      <IconBuilding />
                      <p>Không tìm thấy khách hàng nào trong phạm vi dữ liệu của bạn.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedCustomers.map((cust) => {
                  const isMine = cust.owner_id === user?.id
                  const statusColor = CUSTOMER_STATUS_COLORS[cust.status]

                  return (
                    <tr key={cust.id} id={`customer-row-${cust.id}`}>
                      <td>
                        <span className="cust-code-tag">{cust.code}</span>
                      </td>
                      <td>
                        <strong className="cust-company-name">{cust.name}</strong>
                        {cust.tax_code && (
                          <div className="cust-tax-code" title="Mã số thuế doanh nghiệp">
                            MST: <span>{cust.tax_code}</span>
                          </div>
                        )}
                        {cust.website && (
                          <div style={{ fontSize: '11.5px', marginTop: '2px' }}>
                            <a
                              href={cust.website.startsWith('http') ? cust.website : `https://${cust.website}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'none' }}
                            >
                              {cust.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </td>
                      <td>{cust.industry}</td>
                      <td>{cust.company_size}</td>
                      <td>
                        {cust.phone && <div>📞 {cust.phone}</div>}
                        {cust.email && <div style={{ fontSize: '12px', color: '#64748b' }}>✉️ {cust.email}</div>}
                        {!cust.phone && !cust.email && <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td>
                        <div className={`cust-owner-badge ${isMine ? 'is-mine' : ''}`}>
                          {cust.owner_name}
                          {isMine && <span style={{ fontSize: '11px' }}>(Tôi)</span>}
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
                          {CUSTOMER_STATUS_LABELS[cust.status]}
                        </span>
                      </td>
                      <td>
                        <div className="cust-action-group">
                          <button
                            type="button"
                            className="cust-btn-icon edit"
                            onClick={() => handleOpenEditModal(cust)}
                            title="Chỉnh sửa thông tin khách hàng"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="cust-btn-icon delete"
                            onClick={() => setDeletingCustomer(cust)}
                            title="Xóa khách hàng"
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

        {/* Phân trang */}
        {scopedCustomers.length > 0 && (
          <div className="customer-pagination" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
            <div className="customer-pagination-info">
              <span>
                Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, scopedCustomers.length)}</strong> - <strong>{Math.min(currentPage * pageSize, scopedCustomers.length)}</strong> / <strong>{scopedCustomers.length}</strong> khách hàng
              </span>
            </div>

            <div className="customer-pagination-controls" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Modal Thêm / Cập nhật khách hàng (S3-01) ── */}
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
                {/* Tên công ty & Mã số thuế */}
                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>
                      Tên công ty / Doanh nghiệp <span className="required">*</span>
                    </label>
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
                    <label>Mã số thuế (MST)</label>
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

                {/* Ngành nghề & Quy mô */}
                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Ngành nghề kinh doanh</label>
                    <select
                      className="cust-form-select"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cust-form-group">
                    <label>Quy mô doanh nghiệp</label>
                    <select
                      className="cust-form-select"
                      value={formData.company_size}
                      onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                    >
                      {companySizes.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Website & Hotline */}
                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Website doanh nghiệp</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="VD: https://company.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="cust-form-group">
                    <label>Số điện thoại / Hotline</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="VD: 024 3768 9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email & Địa chỉ trụ sở */}
                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Email liên hệ chính</label>
                    <input
                      type="email"
                      className={`cust-form-input ${formErrors.email ? 'has-error' : ''}`}
                      placeholder="VD: contact@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <span className="cust-form-error">{formErrors.email}</span>}
                  </div>

                  <div className="cust-form-group">
                    <label>Địa chỉ văn phòng / Trụ sở</label>
                    <input
                      type="text"
                      className="cust-form-input"
                      placeholder="Số nhà, phố, quận/huyện, tỉnh/thành..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                {/* Trạng thái & Người sở hữu (Phân quyền sở hữu) */}
                <div className="cust-form-row">
                  <div className="cust-form-group">
                    <label>Trạng thái khách hàng</label>
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
                    <label>Người sở hữu / Phụ trách</label>
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
                    {(user?.role === 'STAFF' || user?.role === 'USER') && (
                      <span className="cust-form-hint">Nhân viên tự động là người sở hữu khách hàng do mình tạo</span>
                    )}
                  </div>
                </div>

                {/* Ghi chú mô tả */}
                <div className="cust-form-group">
                  <label>Ghi chú bối cảnh công ty</label>
                  <textarea
                    rows={3}
                    className="cust-form-textarea"
                    placeholder="Nhu cầu chuyển đổi số, lưu ý đặc thù của doanh nghiệp..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="cust-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
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

      {/* ── 6. Modal xác nhận xóa ── */}
      {deletingCustomer && (
        <div className="cust-modal-backdrop" onClick={() => setDeletingCustomer(null)}>
          <div className="cust-modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-header">
              <h3>Xác nhận xóa khách hàng</h3>
              <button
                type="button"
                className="cust-modal-close-btn"
                onClick={() => setDeletingCustomer(null)}
              >
                &times;
              </button>
            </div>
            <div className="cust-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
                Bạn có chắc chắn muốn xóa hồ sơ khách hàng <strong>{deletingCustomer.name}</strong> ({deletingCustomer.code}) không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="cust-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingCustomer(null)}
              >
                Hủy
              </button>
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
