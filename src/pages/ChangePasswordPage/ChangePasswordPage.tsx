import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { changePassword } from '../../services/authService.ts'
import '../LoginPage/LoginPage.css'
import './ChangePasswordPage.css'

/* ──────────── Types & Validation ──────────── */
export interface ChangePasswordFormErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function validateChangePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): ChangePasswordFormErrors {
  const errors: ChangePasswordFormErrors = {}

  if (!currentPassword || !currentPassword.trim()) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
  }

  if (!newPassword || !newPassword.trim()) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
  } else if (newPassword.trim().length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
  }

  if (!confirmPassword || !confirmPassword.trim()) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
  }

  return errors
}

/* ──────────── Inline Icons ──────────── */
const IconShieldLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="1" />
    <path d="M11 14h2" />
  </svg>
)

const IconLock = () => (
  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconKey = () => (
  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

/* ──────────── Component ──────────── */
function ChangePasswordPage() {
  const { token, logout, user } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<ChangePasswordFormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthExpired, setIsAuthExpired] = useState(false)

  const handleFieldChange = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    val: string
  ) => {
    if (field === 'currentPassword') setCurrentPassword(val)
    if (field === 'newPassword') setNewPassword(val)
    if (field === 'confirmPassword') setConfirmPassword(val)

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (generalError) {
      setGeneralError(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 1. Validate form fields
    const validationErrors = validateChangePassword(
      currentPassword,
      newPassword,
      confirmPassword
    )

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setGeneralError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const result = await changePassword(currentPassword, newPassword, token)
      setSuccessMessage(result.message || 'Đổi mật khẩu thành công!')
      setIsSuccess(true)
      // Reset form fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const err = error as Error & { status?: number }
      const message =
        err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.'

      if (err?.status === 401) {
        setIsAuthExpired(true)
        setGeneralError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.')
        // Clean session on token expiry
        setTimeout(() => {
          logout()
          navigate('/login', { replace: true })
        }, 2000)
        return
      }

      // Check if error specifically pertains to current password
      if (
        message.toLowerCase().includes('mật khẩu hiện tại không chính xác') ||
        message.toLowerCase().includes('mật khẩu hiện tại')
      ) {
        setErrors((prev) => ({
          ...prev,
          currentPassword: 'Mật khẩu hiện tại không chính xác.',
        }))
      }

      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        {/* Header */}
        <div className="change-password-header">
          <div className="change-password-logo" aria-hidden="true">
            <IconShieldLock />
          </div>
          <h1>Đổi mật khẩu</h1>
          <p className="change-password-subtitle">
            Cập nhật mật khẩu bảo vệ tài khoản {user?.email ? `(${user.email})` : ''}
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            className="login-error-banner"
            role="alert"
            id="change-password-error-banner"
          >
            <IconAlertCircle />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div
            className="login-success-banner"
            role="status"
            id="change-password-success-banner"
          >
            <IconCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {isSuccess ? (
          /* Success state actions */
          <div className="change-password-actions">
            <div className="change-password-success-box">
              <p>Mật khẩu của bạn đã được cập nhật an toàn trong hệ thống.</p>
            </div>
            <Link
              to="/dashboard"
              className="btn-back-dashboard"
              id="success-back-dashboard-btn"
            >
              Về bảng điều khiển (Dashboard)
            </Link>
            <button
              type="button"
              className="btn-change-again"
              onClick={() => {
                setIsSuccess(false)
                setSuccessMessage(null)
              }}
            >
              Đổi mật khẩu lần nữa
            </button>
          </div>
        ) : (
          /* Form state */
          <form
            className="change-password-form"
            onSubmit={handleSubmit}
            noValidate
            id="change-password-form"
          >
            {/* 1. Current Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="current-password">
                Mật khẩu hiện tại
              </label>
              <div className="input-wrapper">
                <IconKey />
                <input
                  id="current-password"
                  name="current_password"
                  className={`input-field input-field--password ${
                    errors.currentPassword ? 'input-field--error' : ''
                  }`}
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) =>
                    handleFieldChange('currentPassword', e.target.value)
                  }
                  autoComplete="current-password"
                  disabled={isLoading || isAuthExpired}
                  aria-invalid={!!errors.currentPassword}
                  aria-describedby={
                    errors.currentPassword
                      ? 'current-password-error'
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={
                    showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                  }
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <div
                  className="input-error-text"
                  id="current-password-error"
                  role="alert"
                >
                  <IconAlertCircle />
                  <span>{errors.currentPassword}</span>
                </div>
              )}
            </div>

            {/* 2. New Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="new-password">
                Mật khẩu mới
              </label>
              <div className="input-wrapper">
                <IconLock />
                <input
                  id="new-password"
                  name="new_password"
                  className={`input-field input-field--password ${
                    errors.newPassword ? 'input-field--error' : ''
                  }`}
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading || isAuthExpired}
                  aria-invalid={!!errors.newPassword}
                  aria-describedby={
                    errors.newPassword ? 'new-password-error' : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.newPassword && (
                <div
                  className="input-error-text"
                  id="new-password-error"
                  role="alert"
                >
                  <IconAlertCircle />
                  <span>{errors.newPassword}</span>
                </div>
              )}
            </div>

            {/* 3. Confirm New Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="confirm-password">
                Xác nhận mật khẩu mới
              </label>
              <div className="input-wrapper">
                <IconLock />
                <input
                  id="confirm-password"
                  name="confirm_password"
                  className={`input-field input-field--password ${
                    errors.confirmPassword ? 'input-field--error' : ''
                  }`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) =>
                    handleFieldChange('confirmPassword', e.target.value)
                  }
                  autoComplete="new-password"
                  disabled={isLoading || isAuthExpired}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? 'confirm-password-error'
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div
                  className="input-error-text"
                  id="confirm-password-error"
                  role="alert"
                >
                  <IconAlertCircle />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="change-password-actions">
              <button
                type="submit"
                className="login-button"
                disabled={isLoading || isAuthExpired}
                id="change-password-submit-btn"
              >
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>

              <Link
                to="/dashboard"
                className="back-to-dashboard"
                id="back-to-dashboard-link"
              >
                <IconArrowLeft />
                <span>Quay lại Trang chủ</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ChangePasswordPage
