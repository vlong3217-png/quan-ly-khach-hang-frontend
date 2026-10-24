import { useState, useEffect, useRef } from 'react'
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
import CustomerManagementPage from '../CustomerManagementPage/CustomerManagementPage.tsx'
import LeadFormsPage from '../LeadFormsPage/LeadFormsPage.tsx'
import CampaignsPage from '../CampaignsPage/CampaignsPage.tsx'
import EmailMarketingPage from '../EmailMarketingPage/EmailMarketingPage.tsx'
import OpportunitiesPage from '../OpportunitiesPage/OpportunitiesPage.tsx'
import CalendarPage from '../CalendarPage/CalendarPage.tsx'
import ContractsPage from '../ContractsPage/ContractsPage.tsx'
import AuditLogPage from '../AuditLogPage/AuditLogPage.tsx'
import WorkflowAutomationPage from '../WorkflowAutomationPage/WorkflowAutomationPage.tsx'
import SalesQuotasPage from '../SalesQuotasPage/SalesQuotasPage.tsx'
import PipelineFunnelPage from '../PipelineFunnelPage/PipelineFunnelPage.tsx'
import RevenueForecastPage from '../RevenueForecastPage/RevenueForecastPage.tsx'
import TeamProductivityReportPage from '../TeamProductivityReportPage/TeamProductivityReportPage.tsx'
import SalesLeaderboardPage from '../SalesLeaderboardPage/SalesLeaderboardPage.tsx'
import MarketingRoiReportPage from '../MarketingRoiReportPage/MarketingRoiReportPage.tsx'
import RepActivityAuditPage from '../RepActivityAuditPage/RepActivityAuditPage.tsx'
import TaskSlaAlerts from '../../components/TaskSlaAlerts/TaskSlaAlerts.tsx'
import ExecutiveDashboard from '../../components/ExecutiveDashboard/ExecutiveDashboard.tsx'
import QuickCallMobileModal from '../../components/QuickCallMobile/QuickCallMobileModal.tsx'
import NotificationBell from '../../components/NotificationBell/NotificationBell.tsx'
import GlobalSearch from '../../components/GlobalSearch/GlobalSearch.tsx'
import {
  ROLES,
  PERMISSIONS,
  SCOPE_LABELS,
} from '../../constants/permissions.ts'
import type { MenuItem } from '../../types/menu.ts'
import './DashboardPage.css'

/* ──────────── Inline SVG Icons ──────────── */
const IconPhoneCall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

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
const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)
const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
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
  const { scope } = usePermission()
  const navigate = useNavigate()
  const location = useLocation()

  // State quản lý menu đang chọn và trạng thái đóng mở của Sidebar
  const [activeMenuId, setActiveMenuId] = useState<string>('menu-dashboard')
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(isMobileViewport)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)')
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches)
      setIsSidebarCollapsed(event.matches)
    }

    mobileQuery.addEventListener('change', handleViewportChange)
    return () => mobileQuery.removeEventListener('change', handleViewportChange)
  }, [])

  // Đặt tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = 'Hệ thống quản lý khách hàng'
  }, [])

  // Đồng bộ activeMenuId theo URL pathname khi truy cập trực tiếp hoặc chuyển route
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/dashboard/users')) {
      setActiveMenuId('menu-users')
    } else if (path.startsWith('/dashboard/audit-logs')) {
      setActiveMenuId('menu-audit-logs')
    } else if (path.startsWith('/dashboard/settings')) {
      setActiveMenuId('menu-settings')
    } else if (path.startsWith('/dashboard/reports')) {
      setActiveMenuId('menu-reports')
    } else if (path.startsWith('/dashboard/teams')) {
      setActiveMenuId('menu-teams')
    } else if (path.startsWith('/dashboard/lead-forms') || path.startsWith('/dashboard/leads')) {
      setActiveMenuId('menu-lead-forms')
    } else if (path.startsWith('/dashboard/campaigns')) {
      setActiveMenuId('menu-campaigns')
    } else if (path.startsWith('/dashboard/email-marketing')) {
      setActiveMenuId('menu-email-marketing')
    } else if (path.startsWith('/dashboard/opportunities')) {
      setActiveMenuId('menu-opportunities')
    } else if (path.startsWith('/dashboard/calendar')) {
      setActiveMenuId('menu-calendar')
    } else if (path.startsWith('/dashboard/contracts')) {
      setActiveMenuId('menu-contracts')
    } else if (path.startsWith('/dashboard/automation')) {
      setActiveMenuId('menu-automation')
    } else if (path.startsWith('/dashboard/quotas')) {
      setActiveMenuId('menu-quotas')
    } else if (path.startsWith('/dashboard/pipeline-funnel')) {
      setActiveMenuId('menu-pipeline-funnel')
    } else if (path.startsWith('/dashboard/forecast')) {
      setActiveMenuId('menu-forecast')
    } else if (path.startsWith('/dashboard/team-productivity')) {
      setActiveMenuId('menu-team-productivity')
    } else if (path.startsWith('/dashboard/leaderboard')) {
      setActiveMenuId('menu-sales-leaderboard')
    } else if (path.startsWith('/dashboard/marketing-roi')) {
      setActiveMenuId('menu-marketing-roi')
    } else if (path.startsWith('/dashboard/rep-activity-audit')) {
      setActiveMenuId('menu-rep-activity-audit')
    } else if (path.startsWith('/dashboard/customers')) {
      setActiveMenuId('menu-customers')
    } else if (path === '/dashboard' || path === '/dashboard/') {
      setActiveMenuId('menu-dashboard')
    }
  }, [location.pathname])

  // State cho thông báo tương tác nhanh
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [isChangePwdModalOpen, setIsChangePwdModalOpen] = useState(false)
  const [isQuickCallModalOpen, setIsQuickCallModalOpen] = useState(false)
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const avatarDropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown avatar khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false)
      }
    }
    if (isAvatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAvatarMenuOpen])

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

  // Xử lý click chọn menu trên Sidebar
  const handleSelectMenu = (item: MenuItem) => {
    setActiveMenuId(item.id)
    if (isMobileViewport) setIsSidebarCollapsed(true)
    if (item.path) {
      navigate(item.path)
    }
  }

  // Xác định view chính hiển thị dựa theo menu đang chọn
  const isDashboardView = activeMenuId === 'menu-dashboard'
  const isCustomerView =
    activeMenuId === 'menu-customers' ||
    activeMenuId.startsWith('menu-customers-')
  const isLeadFormView =
    activeMenuId === 'menu-lead-forms' ||
    activeMenuId.startsWith('menu-lead-forms-') ||
    activeMenuId === 'menu-leads'
  const isCampaignView =
    activeMenuId === 'menu-campaigns' ||
    activeMenuId.startsWith('menu-campaigns-')
  const isEmailMarketingView =
    activeMenuId === 'menu-email-marketing' ||
    activeMenuId.startsWith('menu-email-marketing-')
  const isOpportunityView =
    activeMenuId === 'menu-opportunities' ||
    activeMenuId.startsWith('menu-opportunities-')
  const isCalendarView =
    activeMenuId === 'menu-calendar' ||
    activeMenuId.startsWith('menu-calendar-')
  const isContractsView =
    activeMenuId === 'menu-contracts' ||
    activeMenuId.startsWith('menu-contracts-')
  const isProductView =
    activeMenuId === 'menu-products' ||
    activeMenuId.startsWith('menu-products-')
  const isPipelineView =
    activeMenuId === 'menu-pipeline'
  const isAutomationView =
    activeMenuId === 'menu-automation' ||
    activeMenuId.startsWith('menu-automation-')
  const isCategoryView =
    activeMenuId === 'menu-categories' ||
    activeMenuId.startsWith('menu-categories-')
  const isWinLossView =
    activeMenuId === 'menu-win-loss' ||
    activeMenuId.startsWith('menu-win-loss-')
  const isCustomFieldView =
    activeMenuId === 'menu-custom-fields' ||
    activeMenuId.startsWith('menu-custom-fields-')
  const isTeamView =
    activeMenuId === 'menu-teams' ||
    activeMenuId.startsWith('menu-teams-')
  const isQuotaView =
    activeMenuId === 'menu-quotas' ||
    activeMenuId.startsWith('menu-quotas-')
  const isPipelineFunnelView =
    activeMenuId === 'menu-pipeline-funnel'
  const isForecastView =
    activeMenuId === 'menu-forecast' ||
    activeMenuId.startsWith('menu-forecast-')
  const isTeamProductivityView =
    activeMenuId === 'menu-team-productivity' ||
    activeMenuId.startsWith('menu-team-productivity-')
  const isLeaderboardView =
    activeMenuId === 'menu-sales-leaderboard' ||
    activeMenuId.startsWith('menu-sales-leaderboard-')
  const isMarketingRoiView =
    activeMenuId === 'menu-marketing-roi' ||
    activeMenuId.startsWith('menu-marketing-roi-')
  const isRepActivityAuditView =
    activeMenuId === 'menu-rep-activity-audit' ||
    activeMenuId.startsWith('menu-rep-activity-audit-')
  const isSettingView =
    activeMenuId === 'menu-settings' ||
    activeMenuId.startsWith('menu-settings-')
  const isAuditLogView =
    activeMenuId === 'menu-audit-logs' ||
    activeMenuId.startsWith('menu-audit-logs-')
  const isUserView =
    activeMenuId === 'menu-users' ||
    activeMenuId.startsWith('menu-users-')

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ── 1. SIDEBAR PHÂN QUYỀN THEO ROLE (User Story S1-06) ── */}
      <Sidebar
        activeMenuId={activeMenuId}
        onSelectMenu={handleSelectMenu}
        isCollapsed={isSidebarCollapsed}
      />
      {!isSidebarCollapsed && (
        <button
          type="button"
          className="sidebar-mobile-backdrop"
          aria-label="Đóng menu điều hướng"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

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
                aria-expanded={!isSidebarCollapsed}
                aria-controls="main-sidebar"
              >
                <IconMenu />
              </button>

              {/* Ô TÌM KIẾM TOÀN CỤC (GLOBAL SEARCH) */}
              <GlobalSearch />
            </div>

            <div className="dashboard-user-area">
              {/* Nút Ghi cuộc gọi nhanh trực tiếp trên Header */}
              <button
                type="button"
                className="dashboard-quick-call-btn"
                onClick={() => setIsQuickCallModalOpen(true)}
                title="Ghi nhanh cuộc gọi khách hàng"
                id="btn-header-quick-call"
              >
                <IconPhoneCall />
                <span className="quick-call-btn-text">Ghi cuộc gọi</span>
              </button>

              {/* Chuông thông báo có số đếm */}
              <NotificationBell />

              {/* AVATAR DROPDOWN MENU GOM HỒ SƠ / ĐỔI MẬT KHẨU / ĐĂNG XUẤT */}
              <div className="dashboard-avatar-menu-wrapper" ref={avatarDropdownRef}>
                <button
                  type="button"
                  className="dashboard-avatar-btn"
                  id="dashboard-user-avatar-trigger"
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  aria-expanded={isAvatarMenuOpen}
                  aria-haspopup="true"
                  title="Tài khoản cá nhân"
                >
                  <div className="dashboard-user-avatar">
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
                  <span className="dashboard-user-name-text">{user?.full_name?.split(' ').pop() || 'Tài khoản'}</span>
                  <span className={`dashboard-avatar-chevron ${isAvatarMenuOpen ? 'is-open' : ''}`}>
                    <IconChevronDown />
                  </span>
                </button>

                {/* Popover Dropdown Menu */}
                {isAvatarMenuOpen && (
                  <div className="dashboard-avatar-dropdown" role="menu" aria-orientation="vertical">
                    <div className="avatar-dropdown-header">
                      <span className="dropdown-user-fullname">{user?.full_name || 'Người dùng'}</span>
                      <span className="dropdown-user-email">{user?.email || '—'}</span>
                      <div className="dropdown-role-badge" data-role={user?.role}>
                        {user?.role || 'USER'}
                      </div>
                    </div>

                    <div className="avatar-dropdown-divider" />

                    <div className="avatar-dropdown-items">
                      <button
                        type="button"
                        className="avatar-dropdown-item"
                        onClick={() => {
                          setIsAvatarMenuOpen(false)
                          navigate('/profile')
                        }}
                        role="menuitem"
                      >
                        <IconUser />
                        <span>Hồ sơ cá nhân</span>
                      </button>

                      <button
                        type="button"
                        className="avatar-dropdown-item"
                        onClick={() => {
                          setIsAvatarMenuOpen(false)
                          setIsChangePwdModalOpen(true)
                        }}
                        id="avatar-menu-change-pwd-btn"
                        role="menuitem"
                      >
                        <IconKey />
                        <span>Đổi mật khẩu</span>
                      </button>
                    </div>

                    <div className="avatar-dropdown-divider" />

                    <button
                      type="button"
                      className="avatar-dropdown-item item-danger"
                      onClick={() => {
                        setIsAvatarMenuOpen(false)
                        handleLogout()
                      }}
                      id="avatar-menu-logout-btn"
                      role="menuitem"
                    >
                      <IconLogout />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
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
                    <span className="dashboard-info-label">Phạm vi dữ liệu</span>
                    <span className="dashboard-info-value scope-badge" data-scope={scope}>
                      {SCOPE_LABELS[scope]?.split('(')[0]?.trim() || 'Toàn hệ thống'}
                    </span>
                  </div>
                  <div className="dashboard-info-item">
                    <span className="dashboard-info-label">Đội nhóm</span>
                    <span className="dashboard-info-value">{user?.team_name ?? 'Chưa phân nhóm'}</span>
                  </div>
                </div>
              </div>

              {/* Task SLA & Overdue Alerts (S6-09) */}
              <TaskSlaAlerts
                onNavigateToCalendar={() => navigate('/dashboard/calendar')}
                onNavigateToOpportunities={() => navigate('/dashboard/opportunities')}
              />

              {/* Role-based Executive Dashboard (S8-04) */}
              <ExecutiveDashboard />
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: QUẢN LÝ KHÁCH HÀNG DOANH NGHIỆP (S3-01)
              ───────────────────────────────────────────────────────────── */}
          {isCustomerView && (
            <section className="dashboard-section customers-section">
              <CustomerManagementPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: BIỂU MẪU & THU THẬP LEAD (S4-01)
              ───────────────────────────────────────────────────────────── */}
          {isLeadFormView && (
            <section className="dashboard-section lead-forms-section">
              <LeadFormsPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: CHIẾN DỊCH MARKETING & THEO DÕI LEAD (S4-03)
              ───────────────────────────────────────────────────────────── */}
          {isCampaignView && (
            <section className="dashboard-section campaigns-section">
              <CampaignsPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: TIẾP THỊ EMAIL & MẪU THƯ (S8-01)
              ───────────────────────────────────────────────────────────── */}
          {isEmailMarketingView && (
            <section className="dashboard-section email-marketing-section">
              <EmailMarketingPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: CƠ HỘI BÁN HÀNG & LỊCH SỬ HOẠT ĐỘNG (S5-03, S5-04)
              ───────────────────────────────────────────────────────────── */}
          {isOpportunityView && (
            <section className="dashboard-section opportunities-section">
              <OpportunitiesPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: LỊCH LÀM VIỆC & BỐ TRÍ GẶP MẶT (S6-07)
              ───────────────────────────────────────────────────────────── */}
          {isCalendarView && (
            <section className="dashboard-section calendar-section">
              <CalendarPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: HỢP ĐỒNG & THEO DÕI GIA HẠN (S7-07)
              ───────────────────────────────────────────────────────────── */}
          {isContractsView && (
            <section className="dashboard-section contracts-section">
              <ContractsPage />
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
              VIEW: CHỈ TIÊU DOANH SỐ (S8-03)
              ───────────────────────────────────────────────────────────── */}
          {isQuotaView && (
            <section className="dashboard-section quotas-section">
              <SalesQuotasPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: PHỄU BÁN HÀNG & CHUYỂN ĐỔI (S8-05)
              ───────────────────────────────────────────────────────────── */}
          {isPipelineFunnelView && (
            <section className="dashboard-section pipeline-funnel-section">
              <PipelineFunnelPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: DỰ BÁO DOANH THU & THẮNG/THUA (S8-06)
              ───────────────────────────────────────────────────────────── */}
          {isForecastView && (
            <section className="dashboard-section forecast-section">
              <RevenueForecastPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: NĂNG SUẤT & HOẠT ĐỘNG ĐỘI NGŨ (S8-07)
              ───────────────────────────────────────────────────────────── */}
          {isTeamProductivityView && (
            <section className="dashboard-section team-productivity-section">
              <TeamProductivityReportPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: BẢNG XẾP HẠNG DOANH SỐ ĐỘI NHÓM (S8-08)
              ───────────────────────────────────────────────────────────── */}
          {isLeaderboardView && (
            <section className="dashboard-section leaderboard-section">
              <SalesLeaderboardPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: BÁO CÁO ROI NGUỒN LEAD & CHIẾN DỊCH (S8-09)
              ───────────────────────────────────────────────────────────── */}
          {isMarketingRoiView && (
            <section className="dashboard-section marketing-roi-section">
              <MarketingRoiReportPage />
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW: NHẬT KÝ & KHỐI LƯỢNG CÔNG VIỆC SALES (S8-11)
              ───────────────────────────────────────────────────────────── */}
          {isRepActivityAuditView && (
            <section className="dashboard-section rep-activity-audit-section">
              <RepActivityAuditPage />
            </section>
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
                  <p>Chức năng này chỉ hiển thị và cho phép với vai trò Quản lý hoặc Quản trị viên.</p>
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
              VIEW: TỰ ĐỘNG HOÁ QUY TRÌNH (S7-09)
              ───────────────────────────────────────────────────────────── */}
          {isAutomationView && (
            <PermissionGate
              role={[ROLES.ADMIN, ROLES.MANAGER]}
              fallback={
                <div className="access-denied-card" id="forbidden-automation-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Tự động hoá quy trình (Mã lỗi 403)</h3>
                  <p>Chức năng thiết lập quy tắc tự động khi-thì chỉ dành cho Quản lý hoặc Quản trị viên.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/automation' } })}
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
              <section className="dashboard-section automation-section">
                <WorkflowAutomationPage />
              </section>
            </PermissionGate>
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
              VIEW 5: NHẬT KÝ HỆ THỐNG & AUDIT LOGS (ADMIN ONLY)
              ───────────────────────────────────────────────────────────── */}
          {(isSettingView || isAuditLogView) && (
            <PermissionGate
              role={[ROLES.ADMIN]}
              permission={PERMISSIONS.SYSTEM_SETTINGS}
              fallback={
                <div className="access-denied-card" id="forbidden-audit-logs-card">
                  <IconLock />
                  <h3>Không có quyền truy cập Nhật ký hệ thống (Mã lỗi 403)</h3>
                  <p>Truy vết nhật ký thay đổi chỉ dành riêng cho Quản trị viên cao nhất (ADMIN).</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/forbidden', { state: { from: '/dashboard/audit-logs' } })}
                    >
                      Mở trang lỗi 403
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveMenuId('menu-settings')
                        navigate('/dashboard')
                      }}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              }
            >
              <section className="dashboard-section audit-logs-section">
                <AuditLogPage embeddedMode={true} />
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

      {/* ── MODAL ĐỔI MẬT KHẨU (POP-UP TRỰC TIẾP TRÊN TRANG CHỦ) ── */}
      <ChangePasswordModal
        isOpen={isChangePwdModalOpen}
        onClose={() => setIsChangePwdModalOpen(false)}
        onSuccess={() => {
          showNotice('Đổi mật khẩu thành công! Tài khoản của bạn đã được cập nhật.')
        }}
      />

      {/* ── MODAL GHI NHANH CUỘC GỌI (S6-10) ── */}
      <QuickCallMobileModal
        isOpen={isQuickCallModalOpen}
        onClose={() => setIsQuickCallModalOpen(false)}
        onSuccess={(msg) => showNotice(msg)}
      />
    </div>
  )
}

export default DashboardPage
