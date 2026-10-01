import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../services/authService.ts'
import '../LoginPage/LoginPage.css'
import './ForgotPasswordPage.css'

/* ──────────── Validation Helper ──────────── */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateForgotPassword(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) {
    return 'Vui lòng nhập địa chỉ email.'
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Địa chỉ email không đúng định dạng.'
  }
  return undefined
}

/* ──────────── Inline Icons ──────────── */
const IconMail = () => (
  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
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

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (emailError) {
      setEmailError(undefined)
    }
    if (generalError) {
      setGeneralError(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const err = validateForgotPassword(email)
    if (err) {
      setEmailError(err)
      return
    }

    setEmailError(undefined)
    setGeneralError(null)
    setSuccessMessage(null)
    setResetToken(null)
    setIsLoading(true)

    try {
      const result = await forgotPassword(email)
      setSuccessMessage(
        result.message || 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn'
      )
      if (result.reset_token) {
        setResetToken(result.reset_token)
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* Header */}
        <div className="forgot-password-header">
          <div className="forgot-password-logo" aria-hidden="true">
            <IconKey />
          </div>
          <h1>Quên mật khẩu</h1>
          <p className="forgot-password-subtitle">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            className="login-error-banner"
            role="alert"
            id="forgot-error-banner"
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
            id="forgot-success-banner"
          >
            <IconCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Dev / Test Token Helper Box (when backend returns reset_token) */}
        {resetToken && (
          <div className="dev-token-box" id="dev-token-box">
            <p>Liên kết đặt lại mật khẩu (Token đã được tạo):</p>
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="dev-token-action"
              id="dev-direct-reset-btn"
            >
              Chuyển tới Đặt lại mật khẩu ngay →
            </Link>
          </div>
        )}

        {/* Form */}
        <form
          className="forgot-password-form"
          onSubmit={handleSubmit}
          noValidate
          id="forgot-password-form"
        >
          {/* Email input */}
          <div className="input-group">
            <label className="input-label" htmlFor="forgot-email">
              Địa chỉ Email
            </label>
            <div className="input-wrapper">
              <IconMail />
              <input
                id="forgot-email"
                className={`input-field ${emailError ? 'input-field--error' : ''}`}
                type="email"
                placeholder="Nhập địa chỉ email của bạn"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'forgot-email-error' : undefined}
              />
            </div>
            {emailError && (
              <div
                className="input-error-text"
                id="forgot-email-error"
                role="alert"
              >
                <IconAlertCircle />
                <span>{emailError}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="forgot-password-actions">
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
              id="forgot-submit-btn"
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                'Gửi yêu cầu'
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
      </div>
    </div>
  )
}

export default ForgotPasswordPage
