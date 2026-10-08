import { useState, useEffect } from 'react'
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
import {
  ROLES,
  PERMISSIONS,
  SCOPE_LABELS,
} from '../../constants/permissions.ts'
import type { MenuItem } from '../../types/menu.ts'
import './DashboardPage.css'

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Đặt tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = 'Hệ thống quản lý khách hàng'
  }, [])

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
    } else if (path.startsWith('/dashboard/lead-forms') || path.startsWith('/dashboard/leads')) {
      setActiveMenuId('menu-lead-forms')
    } else if (path.startsWith('/dashboard/customers')) {
      setActiveMenuId('menu-customers')
    } else if (path === '/dashboard' || path === '/dashboard/') {
      setActiveMenuId('menu-dashboard')
    }
  }, [location.pathname])

  // State cho thông báo tương tác nhanh
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [isChangePwdModalOpen, setIsChangePwdModalOpen] = useState(false)

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
                  <span className="dashboard-user-name">Hồ sơ</span>
                </div>
              </div>
              <button
                type="button"
                className="dashboard-change-pwd-btn"
                onClick={() => setIsChangePwdModalOpen(true)}
                id="dashboard-change-pwd-btn"
                title="Đổi mật khẩu"
              >
                <IconKey />
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
              VIEW: SẢN PHẨM & BẢNG GIÁ NIÊM YẾT (S2-05)
              ───────────────────────────────────────────────────────────── */}
          {isProductView && (
            <section className="dashboard-section products-section">
              <ProductsPage />
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
                    <h2 className="section-title">Nhật ký & Cấu hình hệ thống</h2>
                    <p className="section-desc">
                      Quản trị người dùng, phân bổ vai trò và theo dõi nhật ký hoạt động toàn hệ thống.
                    </p>
                  </div>
                </div>

                <div className="settings-cards-grid">
                  <div className="setting-card">
                    <h4>Nhật ký hoạt động hệ thống</h4>
                    <p>Ghi lại lịch sử đăng nhập, thay đổi dữ liệu khách hàng và truy cập API.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/admin/audit-logs')}
                    >
                      Xem nhật ký
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

      {/* ── MODAL ĐỔI MẬT KHẨU (POP-UP TRỰC TIẾP TRÊN TRANG CHỦ) ── */}
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
