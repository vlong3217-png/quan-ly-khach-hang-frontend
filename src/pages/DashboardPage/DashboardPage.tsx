import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { usePermission } from '../../hooks/usePermission.ts'
import { useRoleMenu } from '../../hooks/useRoleMenu.ts'
import { PermissionGate } from '../../components/PermissionGate.tsx'
import Sidebar from '../../components/Sidebar/Sidebar.tsx'
import {
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  PERMISSION_LABELS,
  SCOPE_LABELS,
} from '../../constants/permissions.ts'
import { APP_MENU_GROUPS } from '../../constants/menuConfig.ts'
import { flattenMenuItems } from '../../utils/menuUtils.ts'
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

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
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

const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

/* ──────────── Component ──────────── */
function DashboardPage() {
  const { user, logout } = useAuth()
  const { scope, hasPermission, filterScopedData } = usePermission()
  const { canAccessMenuId, allowedMenuItems } = useRoleMenu()
  const navigate = useNavigate()
  const location = useLocation()

  // State quản lý menu đang chọn và trạng thái đóng mở của Sidebar
  const [activeMenuId, setActiveMenuId] = useState<string>('menu-dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Đồng bộ activeMenuId theo URL pathname khi truy cập trực tiếp hoặc chuyển route
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/dashboard/settings')) {
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

  // Danh sách khách hàng mẫu minh họa lọc theo scope
  const rawCustomers: CustomerItem[] = useMemo(() => {
    const currentUserId = user?.id ?? 1
    return [
      {
        id: 1,
        code: 'KH-001',
        name: 'Công ty Cổ phần Công Nghệ Alpha',
        phone: '0901 234 567',
        company: 'Alpha Tech Corp',
        owner_id: currentUserId,
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
    ]
  }, [user])

  // Lọc dữ liệu khách hàng theo scope
  const scopedCustomers = useMemo(() => {
    return filterScopedData(rawCustomers, {
      getOwnerId: (c) => c.owner_id,
      getTeamId: (c) => c.team_id,
    })
  }, [rawCustomers, filterScopedData])

  // Toàn bộ các quyền trong hệ thống để đối chiếu
  const allSystemPermissions = Object.values(PERMISSIONS)

  // Danh sách phẳng tất cả menu trong hệ thống để đối chiếu phân quyền trực quan
  const allSystemMenuItems = useMemo(() => {
    const list: MenuItem[] = []
    for (const group of APP_MENU_GROUPS) {
      list.push(...flattenMenuItems(group.items))
    }
    return list
  }, [])

  // Xử lý click chọn menu trên Sidebar
  const handleSelectMenu = (item: MenuItem) => {
    setActiveMenuId(item.id)
    if (item.path) {
      navigate(item.path)
    }
    if (item.path && item.path.includes('action=create')) {
      showNotice('Mở hộp thoại tạo khách hàng mới')
    } else if (item.path && item.path.includes('action=export')) {
      showNotice('Đã xuất báo cáo khách hàng thành công!')
    }
  }

  // Xác định view chính hiển thị dựa theo menu đang chọn
  const isDashboardView = activeMenuId === 'menu-dashboard'
  const isCustomerView =
    activeMenuId === 'menu-customers' ||
    activeMenuId.startsWith('menu-customers-')
  const isReportView =
    activeMenuId === 'menu-reports' ||
    activeMenuId.startsWith('menu-reports-')
  const isTeamView =
    activeMenuId === 'menu-teams' ||
    activeMenuId.startsWith('menu-teams-')
  const isSettingView =
    activeMenuId === 'menu-settings' ||
    activeMenuId.startsWith('menu-settings-')

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
              <div className="dashboard-brand">
                <div className="dashboard-brand-icon" aria-hidden="true">
                  <IconShield />
                </div>
                <span className="dashboard-brand-text">Quản lý khách hàng</span>
              </div>
            </div>

            <div className="dashboard-user-area">
              <div className="dashboard-user-info">
                <div className="dashboard-user-avatar">
                  <IconUser />
                </div>
                <div className="dashboard-user-details">
                  <span className="dashboard-user-name">{user?.full_name ?? 'Người dùng'}</span>
                  <span className="dashboard-user-role">
                    {user?.role ? ROLE_LABELS[user.role] ?? user.role : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="dashboard-change-pwd-btn"
                onClick={() => navigate('/change-password')}
                id="dashboard-change-pwd-btn"
                title="Đổi mật khẩu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
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

              {/* BẢNG ĐỐI CHIẾU MENU THEO QUYỀN (S1-06) */}
              <section className="dashboard-section menu-rbac-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Hệ thống Menu phân quyền theo Role (S1-06)</h2>
                    <p className="section-desc">
                      Bảng đối chiếu danh mục menu/chức năng được phép hiển thị trên thanh điều hướng Sidebar
                      theo vai trò <strong>{user?.role}</strong> hiện tại.
                    </p>
                  </div>
                  <div className="menu-count-badge">
                    Hiển thị <strong>{allowedMenuItems.length}</strong> / {allSystemMenuItems.length} menu item
                  </div>
                </div>

                <div className="menu-rbac-table-container">
                  <table className="menu-rbac-table">
                    <thead>
                      <tr>
                        <th>Tên Menu / Chức năng</th>
                        <th>Đường dẫn</th>
                        <th>Vai trò cho phép</th>
                        <th>Quyền chi tiết</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái hiển thị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSystemMenuItems.map((item) => {
                        const isGranted = canAccessMenuId(item.id)
                        const allowedRolesStr = item.roles ? item.roles.join(', ') : 'Tất cả'
                        const permStr = item.permissions ? item.permissions.join(', ') : '—'

                        return (
                          <tr
                            key={item.id}
                            className={`menu-row ${isGranted ? 'row-granted' : 'row-hidden'}`}
                            id={`rbac-row-${item.id}`}
                          >
                            <td>
                              <div className="menu-row-info">
                                <span className="menu-row-title">{item.title}</span>
                                {item.badge && (
                                  <span className={`menu-row-tag badge-${item.badgeVariant ?? 'primary'}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <code className="path-code">{item.path}</code>
                            </td>
                            <td>
                              <span className="roles-pill-list">{allowedRolesStr}</span>
                            </td>
                            <td>
                              <span className="perm-code-text">{permStr}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isGranted ? (
                                <span className="status-badge status-visible" title="Hiển thị trên Sidebar">
                                  <IconCheckCircle />
                                  <span>Hiển thị trên Menu</span>
                                </span>
                              ) : (
                                <span className="status-badge status-hidden" title="Không có quyền - Bị ẩn hoàn toàn">
                                  <IconEyeOff />
                                  <span>Bị ẩn (Không có quyền)</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Ma trận quyền hạn S1-05 */}
              <section className="dashboard-section permission-section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Ma trận quyền hạn chi tiết (S1-05)</h2>
                    <p className="section-desc">
                      Danh sách các quyền hành động chi tiết áp dụng cho vai trò <strong>{user?.role}</strong>.
                    </p>
                  </div>
                </div>

                <div className="permissions-matrix-grid">
                  {allSystemPermissions.map((perm) => {
                    const granted = hasPermission(perm)
                    return (
                      <div
                        key={perm}
                        className={`permission-chip ${granted ? 'granted' : 'denied'}`}
                        title={granted ? 'Quyền đã được cấp' : 'Không có quyền này'}
                      >
                        <span className="chip-icon">
                          {granted ? <IconCheckCircle /> : <IconLock />}
                        </span>
                        <div className="chip-content">
                          <span className="chip-code">{perm}</span>
                          <span className="chip-desc">{PERMISSION_LABELS[perm]}</span>
                        </div>
                      </div>
                    )
                  })}
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
                  <p className="section-desc">
                    Lọc dữ liệu khách hàng theo phạm vi: <strong>MY</strong> (bản thân),{' '}
                    <strong>TEAM</strong> (đội nhóm), <strong>ALL</strong> (toàn hệ thống).
                  </p>
                </div>

                <div className="scope-actions-group">
                  <PermissionGate
                    permission={PERMISSIONS.CUSTOMER_EXPORT}
                    fallback={null}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => showNotice('Đã xuất báo cáo khách hàng thành công!')}
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
                      onClick={() => showNotice('Mở hộp thoại tạo khách hàng mới')}
                      id="btn-create-customer"
                    >
                      <IconPlus />
                      <span>Thêm khách hàng</span>
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {/* Status strip */}
              <div className="scope-status-strip">
                <span className="scope-status-text">
                  Phạm vi hiện tại: <strong className="scope-tag">{scope}</strong> — Hiển thị{' '}
                  <strong>{scopedCustomers.length}</strong> / {rawCustomers.length} khách hàng
                </span>
                <span className="scope-note">
                  {scope === 'MY' && 'Chỉ hiển thị các khách hàng do chính bạn phụ trách.'}
                  {scope === 'TEAM' && 'Hiển thị khách hàng của bạn và đồng nghiệp trong Đội Kinh Doanh 1.'}
                  {scope === 'ALL' && 'Hiển thị toàn bộ khách hàng từ tất cả phòng ban/đội nhóm.'}
                </span>
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
                      scopedCustomers.map((cust) => (
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
                                onClick={() => showNotice(`Chỉnh sửa khách hàng ${cust.code}`)}
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
                                onClick={() => showNotice(`Xóa khách hàng ${cust.code}`)}
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
              </div>
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
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Danh sách phòng ban & Đội nhóm kinh doanh</h2>
                    <p className="section-desc">
                      Quản lý cơ cấu nhân sự, phân bổ khách hàng mục tiêu cho từng thành viên.
                    </p>
                  </div>
                </div>

                <div className="teams-grid">
                  <div className="team-card">
                    <div className="team-card-header">
                      <h3>Đội Kinh Doanh 1</h3>
                      <span className="team-status-tag">Đang hoạt động</span>
                    </div>
                    <p className="team-desc">Phụ trách thị trường miền Bắc và khách hàng doanh nghiệp</p>
                    <ul className="team-meta-list">
                      <li>Trưởng nhóm: <strong>Nguyễn Văn Tuấn</strong></li>
                      <li>Quy mô: <strong>5 nhân viên</strong></li>
                      <li>Phạm vi dữ liệu: <strong>TEAM</strong></li>
                    </ul>
                  </div>

                  <div className="team-card">
                    <div className="team-card-header">
                      <h3>Đội Kinh Doanh 2</h3>
                      <span className="team-status-tag">Đang hoạt động</span>
                    </div>
                    <p className="team-desc">Phụ trách thị trường miền Nam và khách hàng bán lẻ</p>
                    <ul className="team-meta-list">
                      <li>Trưởng nhóm: <strong>Trần Thị Mai</strong></li>
                      <li>Quy mô: <strong>4 nhân viên</strong></li>
                      <li>Phạm vi dữ liệu: <strong>TEAM</strong></li>
                    </ul>
                  </div>
                </div>
              </section>
            </PermissionGate>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 5: CẤU HÌNH HỆ THỐNG (SETTINGS - ADMIN ONLY)
              ───────────────────────────────────────────────────────────── */}
          {isSettingView && (
            <PermissionGate
              permission={PERMISSIONS.SYSTEM_SETTINGS}
              fallback={
                <div className="access-denied-card" id="forbidden-settings-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Cấu hình hệ thống (Mã lỗi 403)</h3>
                  <p>Menu này chỉ dành riêng cho Quản trị viên cao nhất (ADMIN).</p>
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
                    <h2 className="section-title">Cấu hình hệ thống & Quản trị phân quyền (ADMIN)</h2>
                    <p className="section-desc">
                      Quản trị người dùng, phân bổ vai trò và theo dõi nhật ký hoạt động toàn hệ thống.
                    </p>
                  </div>
                </div>

                <div className="settings-cards-grid">
                  <div className="setting-card">
                    <h4>Phân quyền & Vai trò (RBAC)</h4>
                    <p>Thiết lập danh sách quyền hạn cho từng nhóm ADMIN, MANAGER, USER.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => showNotice('Mở cấu hình ma trận phân quyền')}
                    >
                      Cấu hình vai trò
                    </button>
                  </div>
                  <div className="setting-card">
                    <h4>Chính sách bảo mật & Session</h4>
                    <p>Thời hạn token JWT, giới hạn phiên đăng nhập và xác thực hai bước (2FA).</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => showNotice('Mở cài đặt chính sách an ninh')}
                    >
                      Thiết lập bảo mật
                    </button>
                  </div>
                  <div className="setting-card">
                    <h4>Nhật ký hoạt động hệ thống (Audit Logs)</h4>
                    <p>Ghi lại lịch sử đăng nhập, thay đổi dữ liệu khách hàng và truy cập API.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => showNotice('Mở danh sách nhật ký kiểm toán')}
                    >
                      Xem Audit Log
                    </button>
                  </div>
                </div>
              </section>
            </PermissionGate>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
