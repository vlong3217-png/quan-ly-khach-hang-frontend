import { useState } from 'react'
import type { MenuItem } from '../../types/menu.ts'
import { useRoleMenu } from '../../hooks/useRoleMenu.ts'
import './Sidebar.css'

/* ──────────── SVG Icons chuyên biệt không trùng lặp ──────────── */

// 1. Tổng quan
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)

// 2. Khách hàng
const IconCustomers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

// 3. Khách hàng tiềm năng (Leads)
const IconLeadForms = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
)

// 4. Cơ hội bán hàng (Opportunity - Biểu tượng Kim cương/Mục tiêu giá trị)
const IconOpportunity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M11 3 8 9l4 12 4-12-3-6" />
    <path d="M2 9h20" />
  </svg>
)

// 5. Hợp đồng & Gia hạn
const IconContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
  </svg>
)

// 6. Lịch làm việc
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

// 7. Chiến dịch Marketing (Megaphone)
const IconCampaign = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
)

// 8. Email Marketing
const IconEmail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

// 9. Báo cáo ROI Marketing (Biểu đồ phân tích tài chính ROI)
const IconMarketingRoi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 6v2" />
    <path d="M12 16v2" />
  </svg>
)

// 10. Chỉ tiêu doanh số (Quotas - Hồng tâm Dartboard)
const IconQuotaTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

// 11. Phễu bán hàng (Funnel - Hình cái phễu rõ nét)
const IconFunnel = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

// 12. Dự báo doanh thu (Forecast - Biểu đồ dự phóng tăng trưởng)
const IconForecast = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

// 13. Bảng xếp hạng doanh số (Leaderboard - Cúp vô địch Trophy)
const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z" />
  </svg>
)

// 14. Năng suất & Hoạt động (Biểu đồ cột)
const IconProductivity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
)

// 15. Nhật ký công việc (Audit Log Activity)
const IconActivityAudit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

// 16. Giai đoạn Pipeline (Kanban columns)
const IconPipelineStages = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="5" height="16" rx="1" />
    <rect x="10" y="4" width="5" height="11" rx="1" />
    <rect x="17" y="4" width="5" height="14" rx="1" />
  </svg>
)

// 17. Trường tùy chỉnh
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

// 18. Danh mục bán hàng (Categories / Tags)
const IconCategories = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
  </svg>
)

// 19. Sản phẩm & Bảng giá
const IconPackage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

// 20. Tự động hoá quy trình (Workflow Automation)
const IconWorkflow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="15" width="6" height="6" rx="1" />
    <path d="M6 9v3a3 3 0 0 0 3 3h6" />
    <polyline points="12 12 15 15 12 18" />
  </svg>
)

// 21. Quản lý tài khoản người dùng
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

// 22. Quản lý Đội nhóm phòng ban
const IconTeams = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

// 23. Nhật ký hệ thống (Audit Logs)
const IconAuditLogs = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

// Icon Chevron mũi tên đóng/mở nhóm
const IconChevronDown = () => (
  <svg className="menu-group-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
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
      return <IconLeadForms />
    case 'menu-opportunities':
      return <IconOpportunity />
    case 'menu-contracts':
      return <IconContract />
    case 'menu-calendar':
      return <IconCalendar />
    case 'menu-campaigns':
      return <IconCampaign />
    case 'menu-email-marketing':
      return <IconEmail />
    case 'menu-marketing-roi':
      return <IconMarketingRoi />
    case 'menu-quotas':
      return <IconQuotaTarget />
    case 'menu-pipeline-funnel':
      return <IconFunnel />
    case 'menu-forecast':
      return <IconForecast />
    case 'menu-sales-leaderboard':
      return <IconTrophy />
    case 'menu-team-productivity':
      return <IconProductivity />
    case 'menu-rep-activity-audit':
      return <IconActivityAudit />
    case 'menu-pipeline':
      return <IconPipelineStages />
    case 'menu-custom-fields':
      return <IconCustomFields />
    case 'menu-categories':
      return <IconCategories />
    case 'menu-products':
      return <IconPackage />
    case 'menu-automation':
      return <IconWorkflow />
    case 'menu-users':
      return <IconUsers />
    case 'menu-teams':
      return <IconTeams />
    case 'menu-settings':
    case 'menu-audit-logs':
      return <IconAuditLogs />
    default:
      return <IconDashboard />
  }
}

export interface SidebarProps {
  activeMenuId: string
  onSelectMenu: (item: MenuItem) => void
  isCollapsed?: boolean
}

export function Sidebar({
  activeMenuId,
  onSelectMenu,
  isCollapsed = false,
}: SidebarProps) {
  const { user, role, isAuthenticated, menuGroups } = useRoleMenu()

  // State quản lý việc thu gọn / mở rộng từng nhóm menu (mặc định mở tất cả)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

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
      {/* ── 1. Sidebar Header với LOGO MỚI & THƯƠNG HIỆU N5 CRM ── */}
      <div className="sidebar-header">
        <div className="sidebar-brand" title="N5 CRM - Hệ thống Quản trị Khách hàng">
          <div className="sidebar-brand-icon-wrapper" aria-hidden="true">
            <img
              src="/logo.png"
              alt="N5 CRM Logo"
              className="sidebar-brand-logo-img"
              onError={(e) => {
                // Fallback nếu ảnh không nạp được
                const target = e.currentTarget
                target.style.display = 'none'
              }}
            />
          </div>
          <div className="sidebar-brand-info">
            <div className="sidebar-brand-name-row">
              <span className="sidebar-brand-name">N5 CRM</span>
              <span className="sidebar-brand-badge">2026</span>
            </div>
            <span className="sidebar-brand-sub">Quản trị khách hàng</span>
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Menu Groups (4 Nhóm chuẩn, hỗ trợ thu gọn) ── */}
      <nav className="sidebar-nav" role="navigation">
        {menuGroups.map((group) => {
          const isGroupCollapsed = !!collapsedGroups[group.id]

          return (
            <div
              key={group.id}
              className={`menu-group ${isGroupCollapsed ? 'is-collapsed' : ''}`}
              id={`menu-group-${group.id}`}
            >
              <button
                type="button"
                className="menu-group-header-btn"
                onClick={() => toggleGroup(group.id)}
                title={`${isGroupCollapsed ? 'Mở rộng' : 'Thu gọn'} nhóm ${group.title}`}
                aria-expanded={!isGroupCollapsed}
              >
                <span className="menu-group-title">{group.title}</span>
                <span className="menu-group-chevron-wrap">
                  <IconChevronDown />
                </span>
              </button>

              {!isGroupCollapsed && (
                <ul className="menu-list">
                  {group.items.map((item) => {
                    const isActive = activeMenuId === item.id

                    return (
                      <li
                        key={item.id}
                        className={`menu-item-wrapper ${isActive ? 'active' : ''}`}
                        id={`menu-item-wrapper-${item.id}`}
                      >
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
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
