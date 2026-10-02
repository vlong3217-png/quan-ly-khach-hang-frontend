import { useState } from 'react'
import type { MenuItem } from '../../types/menu.ts'
import { useRoleMenu } from '../../hooks/useRoleMenu.ts'
import { ROLE_LABELS } from '../../constants/permissions.ts'
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

const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconShieldLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
)

const IconDot = () => (
  <span className="submenu-dot" aria-hidden="true" />
)

// Map icon theo id của menu item
function getMenuIcon(id: string) {
  switch (id) {
    case 'menu-dashboard':
      return <IconDashboard />
    case 'menu-customers':
      return <IconCustomers />
    case 'menu-reports':
      return <IconReports />
    case 'menu-teams':
      return <IconTeams />
    case 'menu-settings':
      return <IconSettings />
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
  /** Callback bật/tắt thu gọn */
  onToggleCollapse?: () => void
}

/**
 * Component Sidebar hiển thị hệ thống Menu phân quyền theo Role.
 *
 * Tính năng chính (User Story S1-06):
 * 1. Nhận thông tin Role (ADMIN, MANAGER, USER) từ AuthContext (session).
 * 2. Lọc bỏ hoàn toàn các menu không thuộc quyền hạn của user:
 *    - USER: Chỉ thấy Bảng điều khiển và Quản lý khách hàng.
 *    - MANAGER: Thấy thêm Báo cáo & Thống kê, Quản lý Đội nhóm.
 *    - ADMIN: Thấy toàn bộ, bao gồm menu Cấu hình hệ thống.
 * 3. Hỗ trợ nhóm menu (MenuGroup) và menu phân cấp (Submenu đa tầng).
 * 4. Xử lý an toàn khi chưa đăng nhập hoặc không có role.
 */
export function Sidebar({
  activeMenuId,
  onSelectMenu,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { user, role, isAuthenticated, menuGroups } = useRoleMenu()

  // State quản lý việc mở rộng / đóng các submenu (mặc định mở menu cha của item đang chọn)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'menu-customers': true,
    'menu-reports': true,
    'menu-teams': true,
    'menu-settings': true,
  })

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

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
            <IconShieldLogo />
          </div>
          <div className="sidebar-brand-info">
            <span className="sidebar-brand-name">CRM HỆ THỐNG</span>
            <span className="sidebar-brand-sub">Quản lý khách hàng</span>
          </div>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            aria-label="Thu gọn hoặc mở rộng menu"
          >
            <IconChevronDown />
          </button>
        )}
      </div>

      {/* ── 2. User Role Badge Area ── */}
      <div className="sidebar-role-indicator">
        <div className="role-indicator-badge" data-role={role} id="sidebar-role-badge">
          <span className="role-dot" />
          <span className="role-text">{ROLE_LABELS[role] ?? role}</span>
        </div>
        <div className="role-user-name" title={user.email}>
          {user.full_name}
        </div>
      </div>

      {/* ── 3. Navigation Menu Groups ── */}
      <nav className="sidebar-nav" role="navigation">
        {menuGroups.map((group) => (
          <div key={group.id} className="menu-group" id={`menu-group-${group.id}`}>
            <div className="menu-group-title" title={group.description}>
              {group.title}
            </div>
            <ul className="menu-list">
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = !!expandedMenus[item.id]
                const isDirectActive = activeMenuId === item.id
                const isChildActive =
                  hasChildren && item.children!.some((c) => c.id === activeMenuId)
                const isActive = isDirectActive || isChildActive

                return (
                  <li
                    key={item.id}
                    className={`menu-item-wrapper ${hasChildren ? 'has-children' : ''} ${
                      isActive ? 'active' : ''
                    }`}
                    id={`menu-item-wrapper-${item.id}`}
                  >
                    {/* Item chính */}
                    <button
                      type="button"
                      className={`menu-item-btn ${isActive ? 'is-active' : ''}`}
                      id={item.id}
                      onClick={() => {
                        if (hasChildren) {
                          toggleSubmenu(item.id)
                        }
                        onSelectMenu(item)
                      }}
                      aria-expanded={hasChildren ? isExpanded : undefined}
                      aria-current={isDirectActive ? 'page' : undefined}
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

                      {/* Mũi tên expand/collapse nếu có menu con */}
                      {hasChildren && (
                        <span
                          className={`menu-chevron ${isExpanded ? 'rotated' : ''}`}
                          aria-hidden="true"
                        >
                          <IconChevronDown />
                        </span>
                      )}
                    </button>

                    {/* Submenu con nếu có quyền */}
                    {hasChildren && isExpanded && (
                      <ul className="submenu-list" id={`submenu-${item.id}`}>
                        {item.children!.map((child) => {
                          const isSubActive = activeMenuId === child.id

                          return (
                            <li key={child.id} className="submenu-item">
                              <button
                                type="button"
                                className={`submenu-btn ${isSubActive ? 'is-active' : ''}`}
                                id={child.id}
                                onClick={() => onSelectMenu(child)}
                                aria-current={isSubActive ? 'page' : undefined}
                                title={child.description ?? child.title}
                              >
                                <IconDot />
                                <span className="submenu-text">{child.title}</span>
                                {child.badge && (
                                  <span
                                    className={`submenu-badge badge-${
                                      child.badgeVariant ?? 'primary'
                                    }`}
                                  >
                                    {child.badge}
                                  </span>
                                )}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── 4. Sidebar Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <span>Phiên bản 1.0 (S1-06)</span>
          <span className="sidebar-security-tag">Phân quyền RBAC</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
