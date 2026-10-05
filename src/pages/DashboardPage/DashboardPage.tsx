import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { usePermission } from '../../hooks/usePermission.ts'
import { PermissionGate } from '../../components/PermissionGate.tsx'
import Sidebar from '../../components/Sidebar/Sidebar.tsx'
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal.tsx'
import UserManagementPage from '../UserManagementPage/UserManagementPage.tsx'
import ProductsPage from '../ProductsPage/ProductsPage.tsx'
import OrganizationPage from '../OrganizationPage/OrganizationPage.tsx'
import CategoriesPage from '../CategoriesPage/CategoriesPage.tsx'
import CustomFieldsPage from '../CustomFieldsPage/CustomFieldsPage.tsx'
import PipelineStagesPage from '../PipelineStagesPage/PipelineStagesPage.tsx'
import WinLossCompetitorsPage from '../WinLossCompetitorsPage/WinLossCompetitorsPage.tsx'
import {
  ROLES,
  PERMISSIONS,
  SCOPE_LABELS,
} from '../../constants/permissions.ts'
import type { MenuItem } from '../../types/menu.ts'
import './DashboardPage.css'

/* ──────────── Mock Data for Customer Data Scope Demonstration ──────────── */
interface CustomerItem {
  id: number
  code: string
  name: string
  phone: string
  company: string
  owner_id: number
  owner_name: string
  team_id: number
  team_name: string
}

/* ──────────── Inline SVG Icons ──────────── */
const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)



const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)


/* ──────────── Component ──────────── */
function DashboardPage() {
  const { user, logout } = useAuth()
  const { scope, filterScopedData } = usePermission()
  const navigate = useNavigate()
  const location = useLocation()

  // State quản lý menu đang chọn và trạng thái đóng mở của Sidebar
  const [activeMenuId, setActiveMenuId] = useState<string>('menu-dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Đồng bộ activeMenuId theo URL pathname khi truy cập trực tiếp hoặc chuyển route
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/dashboard/users')) {
      setActiveMenuId('menu-users')
    } else if (path.startsWith('/dashboard/settings')) {
      setActiveMenuId('menu-settings')
    } else if (path.startsWith('/dashboard/reports')) {
      setActiveMenuId('menu-reports')
    } else if (path.startsWith('/dashboard/teams')) {
      setActiveMenuId('menu-teams')
    } else if (path.startsWith('/dashboard/customers')) {
      setActiveMenuId('menu-customers')
    } else if (path === '/dashboard' || path === '/dashboard/') {
      setActiveMenuId('menu-dashboard')
    }
  }, [location.pathname])

  // State cho thông báo tương tác nhanh
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Quản lý danh sách khách hàng trong state để người dùng có thể Thêm, Sửa, Xóa trực tiếp
  const [customerList, setCustomerList] = useState<CustomerItem[]>([
    {
      id: 1,
      code: 'KH-001',
      name: 'Công ty Cổ phần Công Nghệ Alpha',
      phone: '0901 234 567',
      company: 'Alpha Tech Corp',
      owner_id: user?.id ?? 1,
      owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 2,
      code: 'KH-002',
      name: 'Tập đoàn Bất Động Sản Hòa Bình',
      phone: '0912 345 678',
      company: 'Hoa Binh Group',
      owner_id: 99,
      owner_name: 'Nguyễn Văn Tuấn (Đồng nghiệp)',
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 3,
      code: 'KH-003',
      name: 'Hệ thống Bán Lẻ Toàn Cầu Mekong',
      phone: '0988 777 666',
      company: 'Mekong Retail',
      owner_id: 101,
      owner_name: 'Trần Thị Mai (Nhóm khác)',
      team_id: 2,
      team_name: 'Đội Kinh Doanh 2',
    },
    {
      id: 4,
      code: 'KH-004',
      name: 'Tổng Công ty Logistics Sao Vàng',
      phone: '0933 222 111',
      company: 'Golden Star Logistics',
      owner_id: 102,
      owner_name: 'Lê Đình Trọng (Nhóm khác)',
      team_id: 2,
      team_name: 'Đội Kinh Doanh 2',
    },
    {
      id: 5,
      code: 'KH-005',
      name: 'Tập đoàn Nông nghiệp Xanh Việt',
      phone: '0945 111 222',
      company: 'Green Viet Agri',
      owner_id: user?.id ?? 1,
      owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 6,
      code: 'KH-006',
      name: 'Công ty Dược phẩm Hải Đăng',
      phone: '0978 333 444',
      company: 'Hai Dang Pharma',
      owner_id: 99,
      owner_name: 'Nguyễn Văn Tuấn (Đồng nghiệp)',
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 7,
      code: 'KH-007',
      name: 'Công ty TNHH Thời Trang Tân Á',
      phone: '0911 555 666',
      company: 'Tan A Fashion',
      owner_id: user?.id ?? 1,
      owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 8,
      code: 'KH-008',
      name: 'Tập đoàn Năng Lượng Mặt Trời SolarV',
      phone: '0908 888 999',
      company: 'SolarV Energy',
      owner_id: 101,
      owner_name: 'Trần Thị Mai (Nhóm khác)',
      team_id: 2,
      team_name: 'Đội Kinh Doanh 2',
    },
    {
      id: 9,
      code: 'KH-009',
      name: 'Công ty Thực phẩm Sạch An Tâm',
      phone: '0966 222 333',
      company: 'An Tam Food',
      owner_id: user?.id ?? 1,
      owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 10,
      code: 'KH-010',
      name: 'Công ty CP Đầu tư & Xây dựng An Gia',
      phone: '0937 444 555',
      company: 'An Gia Construction',
      owner_id: 99,
      owner_name: 'Nguyễn Văn Tuấn (Đồng nghiệp)',
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
    {
      id: 11,
      code: 'KH-011',
      name: 'Hệ thống Khách sạn & Nghỉ dưỡng Biển Xanh',
      phone: '0989 666 777',
      company: 'Blue Sea Resorts',
      owner_id: 102,
      owner_name: 'Lê Đình Trọng (Nhóm khác)',
      team_id: 2,
      team_name: 'Đội Kinh Doanh 2',
    },
    {
      id: 12,
      code: 'KH-012',
      name: 'Công ty Công nghệ Giáo dục EduNext',
      phone: '0918 999 000',
      company: 'EduNext Corp',
      owner_id: user?.id ?? 1,
      owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    },
  ])

  // Cập nhật tên của chính mình nếu thông tin user thay đổi
  useEffect(() => {
    if (user?.id) {
      setCustomerList((prev) =>
        prev.map((c) =>
          c.owner_id === user.id
            ? { ...c, owner_name: `Bạn (${user.full_name ?? 'Tôi'})` }
            : c
        )
      )
    }
  }, [user])

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerItem | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isChangePwdModalOpen, setIsChangePwdModalOpen] = useState(false)

  // Form states cho thêm mới
  const [createForm, setCreateForm] = useState({
    name: '',
    company: '',
    phone: '',
  })

  // Form states cho chỉnh sửa
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    phone: '',
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const showNotice = (msg: string) => {
    setActionNotice(msg)
    setTimeout(() => {
      setActionNotice(null)
    }, 3500)
  }

  // Phân trang khách hàng phía Frontend
  const [customerPage, setCustomerPage] = useState<number>(1)
  const [customerPageSize, setCustomerPageSize] = useState<number>(5)

  // Lọc dữ liệu khách hàng theo scope
  const scopedCustomers = useMemo(() => {
    return filterScopedData(customerList, {
      getOwnerId: (c) => c.owner_id,
      getTeamId: (c) => c.team_id,
    })
  }, [customerList, filterScopedData])

  // Reset trang về 1 khi số lượng bản ghi hoặc scope thay đổi
  useEffect(() => {
    setCustomerPage(1)
  }, [scopedCustomers.length, scope])

  const totalCustomerPages = Math.max(1, Math.ceil(scopedCustomers.length / customerPageSize))

  // Danh sách khách hàng của trang hiện tại
  const pagedCustomers = useMemo(() => {
    const startIndex = (customerPage - 1) * customerPageSize
    return scopedCustomers.slice(startIndex, startIndex + customerPageSize)
  }, [scopedCustomers, customerPage, customerPageSize])

  // Mở modal thêm khách hàng
  const handleOpenCreateModal = () => {
    setCreateForm({ name: '', company: '', phone: '' })
    setIsCreateModalOpen(true)
  }

  // Submit thêm mới khách hàng
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) return

    const newId = Date.now()
    const nextCode = `KH-${String(customerList.length + 1).padStart(3, '0')}`
    const newCustomer: CustomerItem = {
      id: newId,
      code: nextCode,
      name: createForm.name.trim(),
      company: createForm.company.trim() || 'Chưa cập nhật',
      phone: createForm.phone.trim() || 'Chưa cập nhật',
      owner_id: user?.id ?? 1,
      owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
      team_id: 1,
      team_name: 'Đội Kinh Doanh 1',
    }

    setCustomerList((prev) => [newCustomer, ...prev])
    setIsCreateModalOpen(false)
    showNotice(`Đã thêm thành công khách hàng "${newCustomer.name}" (${newCustomer.code})!`)
  }

  // Mở modal sửa khách hàng
  const handleOpenEditModal = (cust: CustomerItem) => {
    setEditingCustomer(cust)
    setEditForm({
      name: cust.name,
      company: cust.company,
      phone: cust.phone,
    })
  }

  // Submit cập nhật khách hàng
  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer || !editForm.name.trim()) return

    setCustomerList((prev) =>
      prev.map((c) =>
        c.id === editingCustomer.id
          ? {
              ...c,
              name: editForm.name.trim(),
              company: editForm.company.trim() || 'Chưa cập nhật',
              phone: editForm.phone.trim() || 'Chưa cập nhật',
            }
          : c
      )
    )
    showNotice(`Đã cập nhật thông tin khách hàng "${editingCustomer.code}"!`)
    setEditingCustomer(null)
  }

  // Mở modal xác nhận xóa
  const handleOpenDeleteModal = (cust: CustomerItem) => {
    setDeletingCustomer(cust)
  }

  // Submit xóa khách hàng
  const handleConfirmDelete = () => {
    if (!deletingCustomer) return
    const targetCode = deletingCustomer.code
    setCustomerList((prev) => prev.filter((c) => c.id !== deletingCustomer.id))
    setDeletingCustomer(null)
    showNotice(`Đã xóa khách hàng "${targetCode}" thành công!`)
  }

  // Xuất file CSV / Excel thực tế
  const handleExecuteExport = (format: 'csv' | 'xlsx') => {
    const headers = ['Mã KH', 'Tên khách hàng', 'Công ty', 'Số điện thoại', 'Người phụ trách', 'Đội nhóm']
    const rows = scopedCustomers.map((c) => [
      c.code,
      `"${c.name}"`,
      `"${c.company}"`,
      c.phone,
      `"${c.owner_name}"`,
      `"${c.team_name}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `danh_sach_khach_hang_${scope.toLowerCase()}.${format === 'csv' ? 'csv' : 'csv'}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsExportModalOpen(false)
    showNotice(`Đã xuất thành công tệp danh sách khách hàng (${scopedCustomers.length} bản ghi)!`)
  }

  // Xử lý click chọn menu trên Sidebar
  const handleSelectMenu = (item: MenuItem) => {
    setActiveMenuId(item.id)
    if (item.path) {
      navigate(item.path)
    }
    if (item.path && item.path.includes('action=create')) {
      handleOpenCreateModal()
    } else if (item.path && item.path.includes('action=export')) {
      setIsExportModalOpen(true)
    }
  }

  // Xác định view chính hiển thị dựa theo menu đang chọn
  const isDashboardView = activeMenuId === 'menu-dashboard'
  const isCustomerView =
    activeMenuId === 'menu-customers' ||
    activeMenuId.startsWith('menu-customers-')
  const isProductView =
    activeMenuId === 'menu-products' ||
    activeMenuId.startsWith('menu-products-')
  const isPipelineView =
    activeMenuId === 'menu-pipeline' ||
    activeMenuId.startsWith('menu-pipeline-')
  const isCategoryView =
    activeMenuId === 'menu-categories' ||
    activeMenuId.startsWith('menu-categories-')
  const isWinLossView =
    activeMenuId === 'menu-win-loss' ||
    activeMenuId.startsWith('menu-win-loss-')
  const isCustomFieldView =
    activeMenuId === 'menu-custom-fields' ||
    activeMenuId.startsWith('menu-custom-fields-')
  const isReportView =
    activeMenuId === 'menu-reports' ||
    activeMenuId.startsWith('menu-reports-')
  const isTeamView =
    activeMenuId === 'menu-teams' ||
    activeMenuId.startsWith('menu-teams-')
  const isSettingView =
    activeMenuId === 'menu-settings' ||
    activeMenuId.startsWith('menu-settings-')
  const isUserView =
    activeMenuId === 'menu-users' ||
    activeMenuId.startsWith('menu-users-')

  return (
    <div className="dashboard-layout">
      {/* ── 1. SIDEBAR PHÂN QUYỀN THEO ROLE (User Story S1-06) ── */}
      <Sidebar
        activeMenuId={activeMenuId}
        onSelectMenu={handleSelectMenu}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* ── 2. WORKSPACE CONTENT AREA ── */}
      <div className="dashboard-content-area">
        {/* Header / Navbar */}
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <div className="dashboard-header-left">
              <button
                type="button"
                className="sidebar-toggle-btn"
                id="sidebar-toggle-btn"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                aria-label="Thu gọn hoặc mở rộng menu"
              >
                <IconMenu />
              </button>
            </div>

            <div className="dashboard-user-area">
              <div
                className="dashboard-user-info"
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer' }}
                title="Xem hồ sơ cá nhân"
              >
                <div className="dashboard-user-avatar" style={{ overflow: 'hidden' }}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <IconUser />
                  )}
                </div>
                <div className="dashboard-user-details">
                  <span className="dashboard-user-name">{user?.full_name ?? 'Người dùng'}</span>
                </div>
              </div>
              <button
                type="button"
                className="dashboard-change-pwd-btn"
                onClick={() => setIsChangePwdModalOpen(true)}
                id="dashboard-change-pwd-btn"
                title="Đổi mật khẩu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginRight: '8px',
                }}
              >
                <span>Đổi mật khẩu</span>
              </button>
              <button
                type="button"
                className="dashboard-logout-btn"
                onClick={handleLogout}
                id="logout-btn"
                title="Đăng xuất"
              >
                <IconLogout />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Toast thông báo tương tác */}
          {actionNotice && (
            <div className="action-notice-toast" role="status">
              <IconCheckCircle />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 1: TỔNG QUAN (DASHBOARD)
              ───────────────────────────────────────────────────────────── */}
          {isDashboardView && (
            <>
              {/* Welcome Card */}
              <div className="dashboard-welcome-card">
                <h1>Chào mừng, {user?.full_name ?? 'Người dùng'}!</h1>
                <p>Bạn đã đăng nhập thành công vào hệ thống quản lý khách hàng.</p>
                <div className="dashboard-info-grid">
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-label">Email</span>
                    <span className="dashboard-info-value">{user?.email ?? '—'}</span>
                  </div>
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-label">Vai trò hiện tại</span>
                    <span className="dashboard-info-value role-badge" data-role={user?.role}>
                      {user?.role ?? '—'}
                    </span>
                  </div>
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-label">Phạm vi dữ liệu (Scope)</span>
                    <span className="dashboard-info-value scope-badge" data-scope={scope}>
                      {scope} — {SCOPE_LABELS[scope]?.split('(')[0]?.trim()}
                    </span>
                  </div>
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-label">Đội nhóm (Team)</span>
                    <span className="dashboard-info-value">{user?.team_name ?? 'Chưa phân nhóm'}</span>
                  </div>
                </div>
              </div>

              {/* Thống kê nhanh chỉ số hoạt động kinh doanh */}
              <section className="dashboard-section kpi-overview-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Chỉ số hoạt động kinh doanh</h2>
                    <p className="section-desc">
                      Tổng hợp hiệu suất làm việc và tiến độ khách hàng trong kỳ hiện tại.
                    </p>
                  </div>
                </div>

                <div className="kpi-cards-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Khách hàng được giao</span>
                    <span className="kpi-value">{scopedCustomers.length}</span>
                    <span className="kpi-trend positive">Trong phạm vi {scope}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Hợp đồng hoàn tất</span>
                    <span className="kpi-value">46</span>
                    <span className="kpi-trend positive">+12.0% so với tháng trước</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Tỷ lệ tương tác thành công</span>
                    <span className="kpi-value">72.4%</span>
                    <span className="kpi-trend positive">+5.1% so với mục tiêu</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Doanh số ghi nhận</span>
                    <span className="kpi-value">2.48 tỷ</span>
                    <span className="kpi-trend positive">+24.8% tăng trưởng</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 2: QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
              ───────────────────────────────────────────────────────────── */}
          {(isCustomerView || isDashboardView) && (
            <section className="dashboard-section data-scope-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Danh sách khách hàng theo phạm vi dữ liệu</h2>
                </div>

                <div className="scope-actions-group">
                  <PermissionGate
                    permission={PERMISSIONS.CUSTOMER_EXPORT}
                    fallback={null}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsExportModalOpen(true)}
                      id="btn-export-customers"
                    >
                      <IconDownload />
                      <span>Xuất dữ liệu</span>
                    </button>
                  </PermissionGate>

                  <PermissionGate
                    permission={PERMISSIONS.CUSTOMER_CREATE}
                    fallback={null}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleOpenCreateModal}
                      id="btn-create-customer"
                    >
                      <IconPlus />
                      <span>Thêm khách hàng</span>
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {/* Customer table */}
              <div className="customer-table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Mã KH</th>
                      <th>Tên khách hàng</th>
                      <th>Công ty</th>
                      <th>Số điện thoại</th>
                      <th>Người phụ trách</th>
                      <th>Đội nhóm</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-row">
                          Không có khách hàng nào trong phạm vi dữ liệu của bạn.
                        </td>
                      </tr>
                    ) : (
                      pagedCustomers.map((cust) => (
                        <tr key={cust.id}>
                          <td className="code-cell">{cust.code}</td>
                          <td className="name-cell">{cust.name}</td>
                          <td>{cust.company}</td>
                          <td>{cust.phone}</td>
                          <td>
                            <span
                              className={`owner-badge ${
                                cust.owner_id === user?.id ? 'owner-self' : ''
                              }`}
                            >
                              {cust.owner_name}
                            </span>
                          </td>
                          <td>
                            <span className="team-badge">{cust.team_name}</span>
                          </td>
                          <td className="actions-cell">
                            <PermissionGate
                              permission={PERMISSIONS.CUSTOMER_EDIT}
                              renderDisabled={true}
                              disabledReason="Bạn không có quyền chỉnh sửa khách hàng này"
                            >
                              <button
                                type="button"
                                className="action-icon-btn edit-btn"
                                title="Chỉnh sửa"
                                onClick={() => handleOpenEditModal(cust)}
                              >
                                <IconEdit />
                              </button>
                            </PermissionGate>

                            <PermissionGate
                              permission={PERMISSIONS.CUSTOMER_DELETE}
                              fallback={null}
                            >
                              <button
                                type="button"
                                className="action-icon-btn delete-btn"
                                title="Xóa khách hàng"
                                onClick={() => handleOpenDeleteModal(cust)}
                              >
                                <IconTrash />
                              </button>
                            </PermissionGate>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {scopedCustomers.length > 0 && (
                  <div className="customer-pagination">
                    <div className="customer-pagination-info">
                      <span>
                        Hiển thị <strong>{Math.min((customerPage - 1) * customerPageSize + 1, scopedCustomers.length)}</strong> - <strong>{Math.min(customerPage * customerPageSize, scopedCustomers.length)}</strong> trên tổng số <strong>{scopedCustomers.length}</strong> khách hàng
                      </span>
                      <div className="customer-pagination-size">
                        <label htmlFor="customer-page-size-select">Hiển thị:</label>
                        <select
                          id="customer-page-size-select"
                          value={customerPageSize}
                          onChange={(e) => setCustomerPageSize(Number(e.target.value))}
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
                        disabled={customerPage === 1}
                        onClick={() => setCustomerPage((p) => Math.max(p - 1, 1))}
                        className="customer-page-btn nav-btn"
                        title="Trang trước"
                      >
                        Trước
                      </button>

                      <div className="customer-page-numbers">
                        {Array.from({ length: totalCustomerPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            className={`customer-page-btn number-btn ${
                              pageNum === customerPage ? 'active' : ''
                            }`}
                            onClick={() => setCustomerPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={customerPage >= totalCustomerPages}
                        onClick={() => setCustomerPage((p) => Math.min(p + 1, totalCustomerPages))}
                        className="customer-page-btn nav-btn"
                        title="Trang sau"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: SẢN PHẨM & BẢNG GIÁ NIÊM YẾT (S2-05)
              ───────────────────────────────────────────────────────────── */}
          {isProductView && (
            <section className="dashboard-section products-section">
              <ProductsPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 3: BÁO CÁO & THỐNG KÊ (REPORTS - ADMIN & MANAGER ONLY)
              ───────────────────────────────────────────────────────────── */}
          {isReportView && (
            <PermissionGate
              permission={PERMISSIONS.REPORT_VIEW}
              fallback={
                <div className="access-denied-card" id="forbidden-reports-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Báo cáo & Thống kê (Mã lỗi 403)</h3>
                  <p>Menu này chỉ dành cho vai trò Quản lý (MANAGER) hoặc Quản trị viên (ADMIN).</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/reports' } })}
                    >
                      Mở trang lỗi 403
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveMenuId('menu-dashboard')
                        navigate('/dashboard')
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              }
            >
              <section className="dashboard-section reports-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Báo cáo & Thống kê kinh doanh</h2>
                    <p className="section-desc">
                      Phân tích số liệu khách hàng, tỷ lệ chuyển đổi và doanh số định kỳ.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => showNotice('Đang tạo file xuất thống kê PDF/Excel...')}
                  >
                    <IconDownload />
                    <span>Xuất báo cáo tổng hợp</span>
                  </button>
                </div>

                <div className="kpi-cards-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Tổng khách hàng mới</span>
                    <span className="kpi-value">128</span>
                    <span className="kpi-trend positive">+18.5% so với tháng trước</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Hợp đồng hoàn tất</span>
                    <span className="kpi-value">46</span>
                    <span className="kpi-trend positive">+12.0%</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Tỷ lệ tương tác thành công</span>
                    <span className="kpi-value">72.4%</span>
                    <span className="kpi-trend positive">+5.1%</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Doanh số ghi nhận</span>
                    <span className="kpi-value">2.48 tỷ</span>
                    <span className="kpi-trend positive">+24.8%</span>
                  </div>
                </div>
              </section>
            </PermissionGate>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 4: QUẢN LÝ ĐỘI NHÓM (TEAMS - ADMIN & MANAGER ONLY)
              ───────────────────────────────────────────────────────────── */}
          {isTeamView && (
            <PermissionGate
              role={[ROLES.ADMIN, ROLES.MANAGER]}
              fallback={
                <div className="access-denied-card" id="forbidden-teams-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Quản lý Đội nhóm (Mã lỗi 403)</h3>
                  <p>Chức năng này chỉ hiển thị và cho phép với vai trò MANAGER hoặc ADMIN.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/teams' } })}
                    >
                      Mở trang lỗi 403
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveMenuId('menu-dashboard')
                        navigate('/dashboard')
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              }
            >
              <section className="dashboard-section teams-section">
                <OrganizationPage />
              </section>
            </PermissionGate>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: GIAI ĐOẠN PIPELINE & XÁC SUẤT THẮNG (S2-09)
              ───────────────────────────────────────────────────────────── */}
          {isPipelineView && (
            <section className="dashboard-section pipeline-section">
              <PipelineStagesPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: DANH MỤC BÁN HÀNG DÙNG CHUNG (S2-07)
              ───────────────────────────────────────────────────────────── */}
          {isCategoryView && (
            <section className="dashboard-section categories-section">
              <CategoriesPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: LÝ DO THẮNG / THUA & ĐỐI THỦ (S2-10)
              ───────────────────────────────────────────────────────────── */}
          {isWinLossView && (
            <section className="dashboard-section win-loss-section">
              <WinLossCompetitorsPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: TRƯỜNG TUỲ CHỈNH - CUSTOM FIELDS (S2-08)
              ───────────────────────────────────────────────────────────── */}
          {isCustomFieldView && (
            <PermissionGate
              role={[ROLES.ADMIN]}
              permission={PERMISSIONS.SYSTEM_SETTINGS}
              fallback={
                <div className="access-denied-card" id="forbidden-cf-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Trường tuỳ chỉnh (Mã lỗi 403)</h3>
                  <p>Cấu hình trường tuỳ chỉnh dành riêng cho Quản trị viên (ADMIN).</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/custom-fields' } })}
                    >
                      Mở trang lỗi 403
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveMenuId('menu-dashboard')
                        navigate('/dashboard')
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              }
            >
              <section className="dashboard-section custom-fields-section">
                <CustomFieldsPage />
              </section>
            </PermissionGate>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 5: CẤU HÌNH HỆ THỐNG & AUDIT LOGS (ADMIN ONLY)
              ───────────────────────────────────────────────────────────── */}
          {isSettingView && (
            <PermissionGate
              role={[ROLES.ADMIN]}
              permission={PERMISSIONS.SYSTEM_SETTINGS}
              fallback={
                <div className="access-denied-card" id="forbidden-settings-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Cấu hình hệ thống (Mã lỗi 403)</h3>
                  <p>Khu vực này chỉ dành riêng cho Quản trị viên cao nhất (ADMIN).</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/settings' } })}
                    >
                      Mở trang lỗi 403
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveMenuId('menu-dashboard')
                        navigate('/dashboard')
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              }
            >
              <section className="dashboard-section settings-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Nhật ký & Cấu hình hệ thống (ADMIN)</h2>
                    <p className="section-desc">
                      Quản trị người dùng, phân bổ vai trò và theo dõi nhật ký hoạt động toàn hệ thống.
                    </p>
                  </div>
                </div>

                <div className="settings-cards-grid">
                  <div className="setting-card">
                    <h4>Nhật ký hoạt động hệ thống (Audit Logs)</h4>
                    <p>Ghi lại lịch sử đăng nhập, thay đổi dữ liệu khách hàng và truy cập API.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/admin/audit-logs')}
                    >
                      Xem Audit Log
                    </button>
                  </div>
                </div>
              </section>
            </PermissionGate>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 6: QUẢN LÝ TÀI KHOẢN (USER MANAGEMENT - ADMIN ONLY)
              ───────────────────────────────────────────────────────────── */}
          {isUserView && (
            <PermissionGate
              role={[ROLES.ADMIN]}
              permission={PERMISSIONS.SYSTEM_SETTINGS}
              fallback={
                <div className="access-denied-card" id="forbidden-users-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Quản lý tài khoản (Mã lỗi 403)</h3>
                  <p>Chức năng này chỉ dành riêng cho Quản trị viên cao nhất (ADMIN).</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/users' } })}
                    >
                      Mở trang lỗi 403
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveMenuId('menu-dashboard')
                        navigate('/dashboard')
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              }
            >
              <section className="dashboard-section user-management-section">
                <UserManagementPage embedded={true} />
              </section>
            </PermissionGate>
          )}
        </main>
      </div>

      {/* ── MODAL 1: THÊM KHÁCH HÀNG MỚI ── */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconPlus /> Thêm khách hàng mới
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCustomerSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="create-cust-name">Tên khách hàng / Tổ chức *</label>
                  <input
                    id="create-cust-name"
                    type="text"
                    required
                    placeholder="VD: Công ty TNHH Giải pháp Đổi mới"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="create-cust-company">Tên thương hiệu / Công ty viết tắt</label>
                  <input
                    id="create-cust-company"
                    type="text"
                    placeholder="VD: Innovate Solutions"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="create-cust-phone">Số điện thoại liên hệ</label>
                  <input
                    id="create-cust-phone"
                    type="tel"
                    placeholder="VD: 0987 654 321"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CHỈNH SỬA KHÁCH HÀNG ── */}
      {editingCustomer && (
        <div className="modal-overlay" onClick={() => setEditingCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconEdit /> Chỉnh sửa khách hàng ({editingCustomer.code})
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingCustomer(null)}
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditCustomerSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="edit-cust-name">Tên khách hàng / Tổ chức *</label>
                  <input
                    id="edit-cust-name"
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-cust-company">Tên thương hiệu / Công ty viết tắt</label>
                  <input
                    id="edit-cust-company"
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-cust-phone">Số điện thoại liên hệ</label>
                  <input
                    id="edit-cust-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingCustomer(null)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Cập nhật thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: XÁC NHẬN XÓA KHÁCH HÀNG ── */}
      {deletingCustomer && (
        <div className="modal-overlay" onClick={() => setDeletingCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#dc2626' }}>
                <IconTrash /> Xác nhận xóa khách hàng
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeletingCustomer(null)}
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-delete-warning">
                Bạn có chắc chắn muốn xóa hồ sơ khách hàng này khỏi danh sách? Thao tác này không thể hoàn tác.
              </p>
              <div className="modal-delete-target">
                <div><strong>Mã:</strong> {deletingCustomer.code}</div>
                <div><strong>Tên:</strong> {deletingCustomer.name}</div>
                <div><strong>Công ty:</strong> {deletingCustomer.company}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingCustomer(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: XUẤT DỮ LIỆU EXCEL / CSV ── */}
      {isExportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconDownload /> Xuất dữ liệu khách hàng
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsExportModalOpen(false)}
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                Hệ thống sẽ tổng hợp danh sách khách hàng đang được lọc theo phạm vi <strong>{scope}</strong> (gồm <strong>{scopedCustomers.length}</strong> khách hàng) và tải xuống trực tiếp về thiết bị của bạn.
              </p>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div>• Định dạng: CSV hỗ trợ UTF-8 (mở bằng Excel không lỗi font)</div>
                <div>• Quyền phân phạm vi: {scope} ({scopedCustomers.length} dòng dữ liệu)</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsExportModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleExecuteExport('csv')}
              >
                <IconDownload /> Tải xuống file CSV/Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: ĐỔI MẬT KHẨU (POP-UP TRỰC TIẾP TRÊN TRANG CHỦ) ── */}
      <ChangePasswordModal
        isOpen={isChangePwdModalOpen}
        onClose={() => setIsChangePwdModalOpen(false)}
        onSuccess={() => {
          showNotice('Đổi mật khẩu thành công! Tài khoản của bạn đã được cập nhật.')
        }}
      />
    </div>
  )
}

export default DashboardPage
