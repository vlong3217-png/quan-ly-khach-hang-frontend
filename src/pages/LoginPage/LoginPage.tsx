import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { API_BASE_URL, forgotPassword } from '../../services/authService.ts'
import type { LoginRequest, LoginResponse } from '../../types/auth.ts'
import LoginBrandPanel from './LoginBrandPanel.tsx'
import './LoginPage.css'
import '../ForgotPasswordPage/ForgotPasswordPage.css'

/* ──────────── Types ──────────── */
interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

/* ──────────── Inline SVG Icons (18–20px, nhỏ gọn) ──────────── */
const IconMail = () => (
  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
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

/* ──────────── Validation helpers ──────────── */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateForm(data: LoginFormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.email.trim()) {
    errors.email = 'Vui lòng nhập email hoặc tên đăng nhập.'
  }

  if (!data.password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  }

  return errors
}

/* ──────────── Component ──────────── */
function LoginPage() {
  const { login: authLogin, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Chế độ màn hình: LOGIN (Đăng nhập) hoặc FORGOT_PASSWORD (Quên mật khẩu)
  const [authMode, setAuthMode] = useState<'LOGIN' | 'FORGOT_PASSWORD'>(() => {
    return searchParams.get('mode') === 'forgot' ? 'FORGOT_PASSWORD' : 'LOGIN'
  })

  // State cho Login Form
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<FormErrors>(() => {
    const expiredNotice = sessionStorage.getItem('session_expired_notice')
    if (expiredNotice) {
      sessionStorage.removeItem('session_expired_notice')
      return { general: expiredNotice }
    }
    return {}
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // State cho Quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotEmailError, setForgotEmailError] = useState<string | undefined>(undefined)
  const [forgotGeneralError, setForgotGeneralError] = useState<string | null>(null)
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null)
  const [isForgotSent, setIsForgotSent] = useState(false)
  const [isForgotLoading, setIsForgotLoading] = useState(false)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem('login_locked_until')
    if (saved) {
      const time = parseInt(saved, 10)
      if (time > Date.now()) return time
      localStorage.removeItem('login_locked_until')
    }
    return null
  })
  const [remainingLockSeconds, setRemainingLockSeconds] = useState(0)

  // Countdown cho khóa tạm 15 phút (S1-01)
  useEffect(() => {
    if (!lockedUntil) {
      setRemainingLockSeconds(0)
      return
    }

    const updateRemaining = () => {
      const diff = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (diff <= 0) {
        setLockedUntil(null)
        setFailedAttempts(0)
        localStorage.removeItem('login_locked_until')
      } else {
        setRemainingLockSeconds(diff)
      }
    }

    updateRemaining()
    const timer = setInterval(updateRemaining, 1000)
    return () => clearInterval(timer)
  }, [lockedUntil])

  const isLockedOut = remainingLockSeconds > 0

  // Warm up Backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/`, { method: 'GET', mode: 'no-cors' }).catch(() => {})
  }, [])

  /* ---- Redirect if already logged in ---- */
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  if (!authLoading && isAuthenticated) {
    return null
  }

  /* ---- Handlers Login ---- */
  const handleChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as keyof FormErrors]
        return next
      })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLockedOut) {
      const minutes = Math.floor(remainingLockSeconds / 60)
      const seconds = remainingLockSeconds % 60
      setErrors({
        general: `Tài khoản tạm thời bị khóa do nhập sai 5 lần liên tiếp. Vui lòng thử lại sau ${minutes} phút ${seconds} giây.`,
      })
      return
    }

    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsLoading(true)
    try {
      const trimmedAccount = formData.email.trim()
      const isEmail = trimmedAccount.includes('@')
      const loginPayload: LoginRequest = {
        email: isEmail ? trimmedAccount : undefined,
        username: !isEmail ? trimmedAccount : undefined,
        account: trimmedAccount,
        password: formData.password,
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      })

      const data = (await response.json()) as LoginResponse & { detail?: string | Array<{ msg: string }> }

      if (!response.ok) {
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)

        if (newAttempts >= 5) {
          const lockTime = Date.now() + 15 * 60 * 1000 // 15 phút
          setLockedUntil(lockTime)
          localStorage.setItem('login_locked_until', lockTime.toString())
          setErrors({
            general:
              'Bạn đã nhập sai thông tin 5 lần liên tiếp. Tài khoản tạm thời bị khóa trong 15 phút.',
          })
          return
        }

        let msg = 'Tài khoản hoặc mật khẩu không chính xác'
        if (typeof data.detail === 'string') {
          msg = data.detail
        } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          msg = data.detail[0].msg
        }
        setErrors({ general: `${msg} (Lần sai: ${newAttempts}/5)` })
        return
      }

      // Success → clear lock & save session
      setFailedAttempts(0)
      setLockedUntil(null)
      localStorage.removeItem('login_locked_until')
      authLogin(data.access_token, data.user, formData.rememberMe)
      navigate('/dashboard', { replace: true })
    } catch {
      setErrors({ general: `Không thể kết nối đến máy chủ Backend (${API_BASE_URL})` })
    } finally {
      setIsLoading(false)
    }
  }

  /* ---- Handlers Quên mật khẩu ---- */
  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const trimmed = forgotEmail.trim()
    if (!trimmed) {
      setForgotEmailError('Vui lòng nhập địa chỉ email.')
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setForgotEmailError('Địa chỉ email không đúng định dạng.')
      return
    }

    setForgotEmailError(undefined)
    setForgotGeneralError(null)
    setForgotSuccessMessage(null)
    setIsForgotLoading(true)

    try {
      const result = await forgotPassword(trimmed)
      setForgotSuccessMessage(
        result.message || 'Mã xác nhận 6 chữ số đã được gửi tới email của bạn.'
      )
      setIsForgotSent(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setForgotGeneralError(message)
    } finally {
      setIsForgotLoading(false)
    }
  }

  const handleSwitchToForgot = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setAuthMode('FORGOT_PASSWORD')
    setForgotEmailError(undefined)
    setForgotGeneralError(null)
    setForgotSuccessMessage(null)
    setIsForgotSent(false)
    // Tự điền email nếu người dùng đã nhập bên login
    if (formData.email.includes('@')) {
      setForgotEmail(formData.email.trim())
    }
  }

  const handleSwitchToLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setAuthMode('LOGIN')
    setErrors({})
  }

  /* ---- Render ---- */
  return (
    <div className="login-page">
      <div className="login-shell">
        <LoginBrandPanel />

        <section className="login-card" aria-labelledby="auth-heading">
          {authMode === 'LOGIN' ? (
            <>
              <div className="login-header">
                <h1 id="auth-heading">Đăng nhập</h1>
                <p className="login-subtitle">Vui lòng đăng nhập để tiếp tục sử dụng hệ thống</p>
              </div>

              {/* General error banner */}
              {errors.general && (
                <div className="login-error-banner" role="alert" id="login-error-banner">
                  <IconAlertCircle />
                  <span>{errors.general}</span>
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                {/* Email / Username */}
                <div className="input-group">
                  <label className="input-label" htmlFor="login-email">
                    Email hoặc Tên đăng nhập
                  </label>
                  <div className="input-wrapper">
                    <IconMail />
                    <input
                      id="login-email"
                      className={`input-field ${errors.email ? 'input-field--error' : ''}`}
                      type="text"
                      placeholder="Nhập email hoặc tên đăng nhập"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      autoComplete="off"
                      disabled={isLoading}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'login-email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <div className="input-error-text" id="login-email-error" role="alert">
                      <IconAlertCircle />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="input-group">
                  <label className="input-label" htmlFor="login-password">
                    Mật khẩu
                  </label>
                  <div className="input-wrapper">
                    <IconLock />
                    <input
                      id="login-password"
                      className={`input-field input-field--password ${errors.password ? 'input-field--error' : ''}`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      autoComplete="off"
                      disabled={isLoading}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'login-password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex={-1}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="input-error-text" id="login-password-error" role="alert">
                      <IconAlertCircle />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                {/* Options row */}
                <div className="form-options">
                  <label className="checkbox-wrapper" htmlFor="login-remember">
                    <input
                      id="login-remember"
                      className="checkbox-input"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleChange('rememberMe', e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="checkbox-custom">
                      <IconCheck />
                    </span>
                    <span className="checkbox-label">Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-password"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                    onClick={handleSwitchToForgot}
                    id="btn-switch-to-forgot"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading || isLockedOut}
                  id="login-submit-btn"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      Đang đăng nhập...
                    </>
                  ) : isLockedOut ? (
                    `Tạm khóa (${Math.floor(remainingLockSeconds / 60)}:${(remainingLockSeconds % 60).toString().padStart(2, '0')})`
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── CHẾ ĐỘ QUÊN MẬT KHẨU TÍCH HỢP TRỰC TIẾP ── */
            <div className="forgot-password-inline-container" style={{ animation: 'cardAppear 0.3s ease both' }}>
              <div className="forgot-password-header" style={{ marginBottom: '22px' }}>
                <div className="forgot-password-logo" aria-hidden="true">
                  <IconKey />
                </div>
                <h1 id="auth-heading">Quên mật khẩu</h1>
                <p className="forgot-password-subtitle">
                  {isForgotSent
                    ? 'Kiểm tra hộp thư email của bạn để lấy mã xác nhận'
                    : 'Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu'}
                </p>
              </div>

              {/* General Error Banner */}
              {forgotGeneralError && (
                <div className="login-error-banner" role="alert" id="forgot-error-banner">
                  <IconAlertCircle />
                  <span>{forgotGeneralError}</span>
                </div>
              )}

              {/* Success Banner */}
              {forgotSuccessMessage && (
                <div className="login-success-banner" role="status" id="forgot-success-banner">
                  <IconCheckCircle />
                  <span>{forgotSuccessMessage}</span>
                </div>
              )}

              {isForgotSent ? (
                <div className="forgot-password-actions" style={{ marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="login-button"
                    id="goto-reset-btn"
                    onClick={() => navigate('/reset-password')}
                    style={{ textAlign: 'center', width: '100%' }}
                  >
                    Nhập mã xác nhận để đặt lại mật khẩu →
                  </button>

                  <button
                    type="button"
                    className="back-to-login"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', justifyContent: 'center' }}
                    onClick={() => {
                      setIsForgotSent(false)
                      setForgotSuccessMessage(null)
                    }}
                  >
                    <span>Gửi lại mã xác nhận khác</span>
                  </button>

                  <button
                    type="button"
                    className="back-to-login"
                    id="back-to-login-btn"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', justifyContent: 'center' }}
                    onClick={handleSwitchToLogin}
                  >
                    <IconArrowLeft />
                    <span>Quay lại Đăng nhập</span>
                  </button>
                </div>
              ) : (
                <form className="forgot-password-form" onSubmit={handleForgotSubmit} noValidate id="forgot-password-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="forgot-email">
                      Địa chỉ Email
                    </label>
                    <div className="input-wrapper">
                      <IconMail />
                      <input
                        id="forgot-email"
                        className={`input-field ${forgotEmailError ? 'input-field--error' : ''}`}
                        type="email"
                        placeholder="Nhập địa chỉ email của bạn"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value)
                          if (forgotEmailError) setForgotEmailError(undefined)
                          if (forgotGeneralError) setForgotGeneralError(null)
                        }}
                        autoComplete="email"
                        disabled={isForgotLoading}
                        aria-invalid={!!forgotEmailError}
                        aria-describedby={forgotEmailError ? 'forgot-email-error' : undefined}
                      />
                    </div>
                    {forgotEmailError && (
                      <div className="input-error-text" id="forgot-email-error" role="alert">
                        <IconAlertCircle />
                        <span>{forgotEmailError}</span>
                      </div>
                    )}
                  </div>

                  <div className="forgot-password-actions" style={{ marginTop: '6px' }}>
                    <button
                      type="submit"
                      className="login-button"
                      disabled={isForgotLoading}
                      id="forgot-submit-btn"
                    >
                      {isForgotLoading ? (
                        <>
                          <span className="spinner" />
                          Đang gửi mã về email...
                        </>
                      ) : (
                        'Gửi yêu cầu'
                      )}
                    </button>

                    <button
                      type="button"
                      className="back-to-login"
                      id="back-to-login-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', justifyContent: 'center' }}
                      onClick={handleSwitchToLogin}
                    >
                      <IconArrowLeft />
                      <span>Quay lại Đăng nhập</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <footer className="login-footer">
            <span>© 2026</span>
            <span>Phiên bản nội bộ</span>
            <span title="Liên hệ quản trị viên hệ thống">Hỗ trợ hệ thống</span>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
