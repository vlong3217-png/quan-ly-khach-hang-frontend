import type { MenuItem } from '../../types/menu.ts'
import { useRoleMenu } from '../../hooks/useRoleMenu.ts'
import './Sidebar.css'

/* ──────────── Inline SVG Icons ──────────── */
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)

const IconCustomers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconReports = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
)

const IconTeams = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)


const IconCrmLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    {/* Người dùng trung tâm */}
    <circle cx="12" cy="7" r="3.2" />
    <path d="M6.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
    {/* Khách hàng / thành viên kết nối bên trái */}
    <circle cx="4.5" cy="9.5" r="2.2" />
    <path d="M2 18.5c0-2 1.5-3.5 3.5-3.5" />
    {/* Khách hàng / thành viên kết nối bên phải */}
    <circle cx="19.5" cy="9.5" r="2.2" />
    <path d="M22 18.5c0-2-1.5-3.5-3.5-3.5" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconPackage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

const IconPipeline = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
)

const IconCategories = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
  </svg>
)

const IconWinLoss = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const IconCustomFields = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
)

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
)

// Map icon theo id của menu item
function getMenuIcon(id: string) {
  switch (id) {
    case 'menu-dashboard':
      return <IconDashboard />
    case 'menu-customers':
      return <IconCustomers />
    case 'menu-lead-forms':
      return <IconFileText />
    case 'menu-products':
      return <IconPackage />
    case 'menu-pipeline':
      return <IconPipeline />
    case 'menu-categories':
      return <IconCategories />
    case 'menu-win-loss':
      return <IconWinLoss />
    case 'menu-custom-fields':
      return <IconCustomFields />
    case 'menu-reports':
      return <IconReports />
    case 'menu-teams':
      return <IconTeams />
    case 'menu-settings':
      return <IconSettings />
    case 'menu-users':
      return <IconUsers />
    default:
      return <IconDashboard />
  }
}

export interface SidebarProps {
  /** ID của menu item hiện đang được chọn */
  activeMenuId: string
  /** Callback kích hoạt khi người dùng click chọn menu */
  onSelectMenu: (item: MenuItem) => void
  /** Trạng thái thu gọn sidebar trên màn hình nhỏ */
  isCollapsed?: boolean
}

/**
 * Component Sidebar hiển thị hệ thống Menu phân quyền theo Role.
 *
 * Tính năng chính (User Story S1-06):
 * 1. Nhận thông tin Role (ADMIN, MANAGER, USER) từ AuthContext (session).
 * 2. Lọc bỏ hoàn toàn các menu không thuộc quyền hạn của user:
 *    - USER: Chỉ thấy Bảng điều khiển và Quản lý khách hàng.
 *    - MANAGER: Thấy thêm Quản lý Đội nhóm, Pipeline, v.v.
 *    - ADMIN: Thấy toàn bộ, bao gồm menu Cấu hình hệ thống.
 * 3. Hỗ trợ nhóm menu (MenuGroup) và menu phân cấp (Submenu đa tầng).
 * 4. Xử lý an toàn khi chưa đăng nhập hoặc không có role.
 */
export function Sidebar({
  activeMenuId,
  onSelectMenu,
  isCollapsed = false,
}: SidebarProps) {
  const { user, role, isAuthenticated, menuGroups } = useRoleMenu()

  // Trường hợp chưa đăng nhập hoặc chưa có thông tin role
  if (!isAuthenticated || !user || !role) {
    return (
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Menu điều hướng">
        <div className="sidebar-empty-state">
          <p>Chưa xác định thông tin đăng nhập hoặc vai trò người dùng.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      id="main-sidebar"
      aria-label="Menu điều hướng hệ thống theo quyền"
    >
      {/* ── 1. Sidebar Header / Brand ── */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">
            <IconCrmLogo />
          </div>
          <div className="sidebar-brand-info">
            <span className="sidebar-brand-name">Quản lý khách hàng</span>
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Menu Groups ── */}
      <nav className="sidebar-nav" role="navigation">
        {menuGroups.map((group) => (
          <div key={group.id} className="menu-group" id={`menu-group-${group.id}`}>
            <div className="menu-group-title" title={group.description}>
              {group.title}
            </div>
            <ul className="menu-list">
              {group.items.map((item) => {
                const isActive = activeMenuId === item.id

                return (
                  <li
                    key={item.id}
                    className={`menu-item-wrapper ${isActive ? 'active' : ''}`}
                    id={`menu-item-wrapper-${item.id}`}
                  >
                    {/* Item chính */}
                    <button
                      type="button"
                      className={`menu-item-btn ${isActive ? 'is-active' : ''}`}
                      id={item.id}
                      onClick={() => onSelectMenu(item)}
                      aria-current={isActive ? 'page' : undefined}
                      title={item.description ?? item.title}
                    >
                      <span className="menu-item-icon">{getMenuIcon(item.id)}</span>
                      <span className="menu-item-text">{item.title}</span>

                      {/* Badge nếu có */}
                      {item.badge && (
                        <span
                          className={`menu-item-badge badge-${item.badgeVariant ?? 'primary'}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>


    </aside>
  )
}

export default Sidebar
