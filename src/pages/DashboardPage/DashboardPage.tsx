import { useAuth } from '../../contexts/AuthContext.tsx'
import { useNavigate } from 'react-router-dom'
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

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
)

/* ──────────── Component ──────────── */
function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page">
      {/* ── Header / Navbar ── */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon" aria-hidden="true">
              <IconShield />
            </div>
            <span className="dashboard-brand-text">Quản lý khách hàng</span>
          </div>

          <div className="dashboard-user-area">
            <div className="dashboard-user-info">
              <div className="dashboard-user-avatar">
                <IconUser />
              </div>
              <div className="dashboard-user-details">
                <span className="dashboard-user-name">{user?.full_name ?? 'Người dùng'}</span>
                <span className="dashboard-user-role">{user?.role ?? ''}</span>
              </div>
            </div>
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

      {/* ── Main content ── */}
      <main className="dashboard-main">
        <div className="dashboard-welcome-card">
          <h1>Chào mừng, {user?.full_name ?? 'Người dùng'}!</h1>
          <p>Bạn đã đăng nhập thành công vào hệ thống quản lý khách hàng.</p>
          <div className="dashboard-info-grid">
            <div className="dashboard-info-item">
              <span className="dashboard-info-label">Email</span>
              <span className="dashboard-info-value">{user?.email ?? '—'}</span>
            </div>
            <div className="dashboard-info-item">
              <span className="dashboard-info-label">Vai trò</span>
              <span className="dashboard-info-value">{user?.role ?? '—'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
