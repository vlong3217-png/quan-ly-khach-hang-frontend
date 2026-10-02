import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import type { LoginRequest, LoginResponse } from '../../types/auth.ts'
import './LoginPage.css'

/* ──────────── API Config ──────────── */
const API_BASE_URL = 'http://localhost:8000'

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
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
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

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /* ---- Redirect if already logged in ---- */
  if (!authLoading && isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  /* ---- Handlers ---- */
  const handleChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
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
        let msg = 'Tài khoản hoặc mật khẩu không chính xác'
        if (typeof data.detail === 'string') {
          msg = data.detail
        } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          msg = data.detail[0].msg
        }
        setErrors({ general: msg })
        return
      }

      // Success → save to auth context (never storing password) and navigate
      authLogin(data.access_token, data.user, formData.rememberMe)
      navigate('/dashboard', { replace: true })
    } catch {
      setErrors({ general: `Không thể kết nối đến máy chủ Backend (${API_BASE_URL})` })
    } finally {
      setIsLoading(false)
    }
  }

  /* ---- Render ---- */
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo" aria-hidden="true">
            <IconShield />
          </div>
          <h1>Đăng nhập</h1>
          <p className="login-subtitle">Vui lòng đăng nhập để tiếp tục sử dụng hệ thống</p>
        </div>

        {/* General error banner - chỉ hiển thị khi có lỗi thực sự */}
        {errors.general && (
          <div className="login-error-banner" role="alert" id="login-error-banner">
            <IconAlertCircle />
            <span>{errors.general}</span>
          </div>
        )}



        {/* Form */}
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
            <a href="/forgot-password" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
            id="login-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
