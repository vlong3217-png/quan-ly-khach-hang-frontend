import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { ROLE_LABELS } from '../../constants/permissions.ts'
import './ForbiddenPage.css'

/* ──────────── Inline SVG Icons ──────────── */
const IconShieldAlert = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="forbidden-hero-icon"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const IconHome = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconUser = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconLock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

interface ForbiddenLocationState {
  from?: string
  reason?: 'role' | 'permission' | string
  requiredRoles?: string[]
  requiredPermission?: string | string[]
  message?: string
}

/**
 * Trang thông báo lỗi 403 - Không có quyền truy cập (User Story S1-07).
 *
 * Tính năng chính:
 * 1. Hiển thị thông báo không đủ quyền truy cập kèm mã lỗi chuẩn 403.
 * 2. Cung cấp nút "Quay lại" (quay về trang trước) và "Về trang chủ" (/dashboard).
 * 3. Hiển thị thông tin phiên người dùng hiện tại (Email, vai trò hiện có)
 *    và chi tiết trang bị từ chối nếu có.
 * 4. Giao diện trực quan, chuyên nghiệp, đồng bộ với phong cách chung của dự án.
 */
export default function ForbiddenPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const state = (location.state as ForbiddenLocationState) || {}
  const targetPath = state.from || ''
  const currentRole = user?.role || 'USER'
  const roleDisplay = ROLE_LABELS[currentRole] ?? currentRole

  const handleGoBack = () => {
    // Nếu có lịch sử duyệt trang, quay lại trang trước; nếu không thì về dashboard
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleGoHome = () => {
    navigate('/dashboard', { replace: true })
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="forbidden-page" id="forbidden-page-container">
      <div className="forbidden-card" role="main" aria-labelledby="forbidden-title">
        {/* Header Icon & Error Code */}
        <div className="forbidden-header">
          <div className="forbidden-icon-wrapper">
            <IconShieldAlert />
          </div>
          <div className="forbidden-status-badge" id="forbidden-status-code">
            <IconLock />
            <span>MÃ LỖI 403 • FORBIDDEN</span>
          </div>
          <h1 className="forbidden-title" id="forbidden-title">
            Không có quyền truy cập
          </h1>
          <p className="forbidden-subtitle">
            Tài khoản của bạn không được phân quyền để truy cập trang hoặc chức năng này.
          </p>
        </div>

        {/* User Context & Request Details Box */}
        <div className="forbidden-details-box" id="forbidden-details-box">
          <div className="detail-row">
            <span className="detail-label">
              <IconUser />
              <span>Tài khoản hiện tại:</span>
            </span>
            <span className="detail-value" id="forbidden-user-email">
              {user?.full_name ? `${user.full_name} (${user.email})` : (user?.email ?? 'Chưa xác định')}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              <IconLock />
              <span>Vai trò hiện tại:</span>
            </span>
            <span
              className="detail-value role-badge-pill"
              data-role={currentRole}
              id="forbidden-user-role"
            >
              {roleDisplay}
            </span>
          </div>

          {targetPath && (
            <div className="detail-row">
              <span className="detail-label">Đường dẫn yêu cầu:</span>
              <code className="detail-path-code" id="forbidden-target-path">
                {targetPath}
              </code>
            </div>
          )}

          <div className="detail-hint">
            <strong>Gợi ý:</strong> Nếu bạn cần quyền truy cập vào chức năng này để phục vụ công việc,
            vui lòng liên hệ với <strong>Quản trị viên (ADMIN)</strong> của hệ thống để được hỗ trợ phân quyền.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="forbidden-actions">
          <button
            type="button"
            className="btn btn-secondary btn-forbidden"
            id="btn-forbidden-back"
            onClick={handleGoBack}
          >
            <IconArrowLeft />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-forbidden"
            id="btn-forbidden-home"
            onClick={handleGoHome}
          >
            <IconHome />
            <span>Về trang chủ</span>
          </button>
        </div>

        {/* Alternative Action */}
        <div className="forbidden-footer-links">
          <button
            type="button"
            className="link-btn-logout"
            id="btn-forbidden-switch-account"
            onClick={handleLogout}
          >
            Đăng nhập bằng tài khoản khác
          </button>
        </div>
      </div>
    </div>
  )
}
