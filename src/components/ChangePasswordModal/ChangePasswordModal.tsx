import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { changePassword } from '../../services/authService.ts'
import { validateChangePassword, type ChangePasswordFormErrors } from '../../pages/ChangePasswordPage/ChangePasswordPage.tsx'
import './ChangePasswordModal.css'

/* ──────────── Inline Icons ──────────── */
const IconShieldLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="1" />
    <path d="M11 14h2" />
  </svg>
)

const IconLock = () => (
  <svg className="modal-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconKey = () => (
  <svg className="modal-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const { token, logout, user } = useAuth()

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

  if (!isOpen) return null

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

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrors({})
    setGeneralError(null)
    setSuccessMessage(null)
    setIsSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
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
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      const err = error as Error & { status?: number }
      const message =
        err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.'

      if (err?.status === 401) {
        setGeneralError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.')
        setTimeout(() => {
          logout()
          window.location.href = '/login'
        }, 1800)
        return
      }

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
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="change-pwd-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pwd-modal-title"
      >
        <button
          type="button"
          className="modal-close-icon-btn"
          onClick={handleClose}
          title="Đóng"
        >
          ✕
        </button>

        {/* Header */}
        <div className="change-pwd-modal-header">
          <div className="change-pwd-modal-logo">
            <IconShieldLock />
          </div>
          <h2 id="change-pwd-modal-title">Đổi mật khẩu</h2>
          <p className="change-pwd-modal-subtitle">
            Cập nhật mật khẩu bảo vệ tài khoản {user?.email ? `(${user.email})` : ''}
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="pwd-modal-banner pwd-modal-banner--error" role="alert">
            <IconAlertCircle />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="pwd-modal-banner pwd-modal-banner--success" role="status">
            <IconCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="pwd-modal-success-state">
            <div className="pwd-modal-success-box">
              <p>Mật khẩu của bạn đã được cập nhật an toàn trong hệ thống.</p>
            </div>
            <div className="pwd-modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClose}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Hoàn tất & Đóng
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsSuccess(false)
                  setSuccessMessage(null)
                }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Đổi mật khẩu lần nữa
              </button>
            </div>
          </div>
        ) : (
          <form className="change-pwd-modal-form" onSubmit={handleSubmit} noValidate>
            {/* 1. Mật khẩu hiện tại */}
            <div className="pwd-modal-group">
              <label htmlFor="modal-current-pwd">Mật khẩu hiện tại</label>
              <div className="pwd-modal-input-wrap">
                <IconKey />
                <input
                  id="modal-current-pwd"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  className="pwd-modal-toggle"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <div className="pwd-modal-err-text">
                  <IconAlertCircle />
                  <span>{errors.currentPassword}</span>
                </div>
              )}
            </div>

            {/* 2. Mật khẩu mới */}
            <div className="pwd-modal-group">
              <label htmlFor="modal-new-pwd">Mật khẩu mới</label>
              <div className="pwd-modal-input-wrap">
                <IconLock />
                <input
                  id="modal-new-pwd"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="pwd-modal-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.newPassword && (
                <div className="pwd-modal-err-text">
                  <IconAlertCircle />
                  <span>{errors.newPassword}</span>
                </div>
              )}
            </div>

            {/* 3. Xác nhận mật khẩu mới */}
            <div className="pwd-modal-group">
              <label htmlFor="modal-confirm-pwd">Xác nhận mật khẩu mới</label>
              <div className="pwd-modal-input-wrap">
                <IconLock />
                <input
                  id="modal-confirm-pwd"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="pwd-modal-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="pwd-modal-err-text">
                  <IconAlertCircle />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            <div className="change-pwd-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ChangePasswordModal
