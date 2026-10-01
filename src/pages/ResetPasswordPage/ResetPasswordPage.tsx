import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../services/authService.ts'
import '../LoginPage/LoginPage.css'
import './ResetPasswordPage.css'

/* ──────────── Types & Validation ──────────── */
export interface ResetFormErrors {
  token?: string
  newPassword?: string
  confirmPassword?: string
}

export function validateResetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): ResetFormErrors {
  const errors: ResetFormErrors = {}

  if (!token.trim()) {
    errors.token = 'Vui lòng cung cấp mã token đặt lại mật khẩu.'
  }

  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
  }

  return errors
}

/* ──────────── Inline Icons ──────────── */
const IconShieldCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const IconKey = () => (
  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)

const IconLock = () => (
  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get('token') || ''

  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<ResetFormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Update token if URL search param changes
  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      setToken(urlToken)
    }
  }, [searchParams])

  const handleFieldChange = (
    field: 'token' | 'newPassword' | 'confirmPassword',
    val: string
  ) => {
    if (field === 'token') setToken(val)
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

    const validationErrors = validateResetPassword(token, newPassword, confirmPassword)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setGeneralError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const result = await resetPassword(token, newPassword)
      setSuccessMessage(
        result.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.'
      )
      setIsSuccess(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        {/* Header */}
        <div className="reset-password-header">
          <div className="reset-password-logo" aria-hidden="true">
            <IconShieldCheck />
          </div>
          <h1>Đặt lại mật khẩu</h1>
          <p className="reset-password-subtitle">
            Tạo mật khẩu mới cho tài khoản của bạn để đăng nhập an toàn
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            className="login-error-banner"
            role="alert"
            id="reset-error-banner"
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
            id="reset-success-banner"
          >
            <IconCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {isSuccess ? (
          /* Success Action State */
          <div className="reset-password-actions">
            <Link
              to="/login"
              className="btn-login-now"
              id="reset-login-now-btn"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          /* Form State */
          <form
            className="reset-password-form"
            onSubmit={handleSubmit}
            noValidate
            id="reset-password-form"
          >
            {/* Token */}
            <div className="input-group">
              <label className="input-label" htmlFor="reset-token">
                Mã xác nhận (Token)
              </label>
              <div className="input-wrapper">
                <IconKey />
                <input
                  id="reset-token"
                  className={`input-field ${errors.token ? 'input-field--error' : ''}`}
                  type="text"
                  placeholder="Nhập mã token từ email"
                  value={token}
                  onChange={(e) => handleFieldChange('token', e.target.value)}
                  autoComplete="off"
                  disabled={isLoading}
                  aria-invalid={!!errors.token}
                  aria-describedby={errors.token ? 'reset-token-error' : undefined}
                />
              </div>
              {errors.token && (
                <div
                  className="input-error-text"
                  id="reset-token-error"
                  role="alert"
                >
                  <IconAlertCircle />
                  <span>{errors.token}</span>
                </div>
              )}
            </div>

            {/* New Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="reset-new-password">
                Mật khẩu mới
              </label>
              <div className="input-wrapper">
                <IconLock />
                <input
                  id="reset-new-password"
                  className={`input-field input-field--password ${
                    errors.newPassword ? 'input-field--error' : ''
                  }`}
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!errors.newPassword}
                  aria-describedby={
                    errors.newPassword ? 'reset-new-password-error' : undefined
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
                  id="reset-new-password-error"
                  role="alert"
                >
                  <IconAlertCircle />
                  <span>{errors.newPassword}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="reset-confirm-password">
                Xác nhận mật khẩu mới
              </label>
              <div className="input-wrapper">
                <IconLock />
                <input
                  id="reset-confirm-password"
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
                  disabled={isLoading}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? 'reset-confirm-password-error' : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div
                  className="input-error-text"
                  id="reset-confirm-password-error"
                  role="alert"
                >
                  <IconAlertCircle />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="reset-password-actions">
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
                id="reset-submit-btn"
              >
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    Đang đặt lại mật khẩu...
                  </>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>

              <Link
                to="/login"
                className="back-to-login"
                id="back-to-login-link"
              >
                <IconArrowLeft />
                <span>Quay lại Đăng nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
