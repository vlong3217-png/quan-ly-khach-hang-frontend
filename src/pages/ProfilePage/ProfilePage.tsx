import { useState, useEffect, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { getProfile, updateProfile } from '../../services/profileService.ts'
import { validateFullName, validateVietnamesePhone } from '../../utils/phoneValidation.ts'
import {
  validateAvatarFile,
  readFileAsDataUrl,
  saveAvatarToStorage,
  removeAvatarFromStorage,
} from '../../services/avatarService.ts'
import { AvatarCropModal } from '../../components/AvatarCropModal/AvatarCropModal.tsx'
import { ROLE_LABELS } from '../../constants/permissions.ts'
import type { UserProfile, ProfileFormErrors } from '../../types/profile.ts'
import './ProfilePage.css'

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="3.2" />
    <path d="M6.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
    <circle cx="4.5" cy="9.5" r="2.2" />
    <path d="M2 18.5c0-2 1.5-3.5 3.5-3.5" />
    <circle cx="19.5" cy="9.5" r="2.2" />
    <path d="M22 18.5c0-2-1.5-3.5-3.5-3.5" />
  </svg>
)

const IconCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
)

const IconUploadMini = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconTrashMini = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconClipboardList = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconSave = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function ProfilePage() {
  const { user, logout, updateCurrentUser } = useAuth()
  const navigate = useNavigate()

  // Dữ liệu hồ sơ
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Form State cho các trường cho phép chỉnh sửa (Họ tên, SĐT, Chữ ký email)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [signature, setSignature] = useState('')

  // Trạng thái thao tác form
  const [errors, setErrors] = useState<ProfileFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Avatar State (User Story S2-03)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [cropModalImageSrc, setCropModalImageSrc] = useState('')
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  // Xử lý chọn file ảnh từ máy tính (Validate JPG/PNG, <= 2MB)
  const handleAvatarFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)
    const check = validateAvatarFile(file)
    if (!check.isValid) {
      setAvatarError(check.error || 'File ảnh không hợp lệ.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsProcessingAvatar(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCropModalImageSrc(dataUrl)
      setIsCropModalOpen(true)
    } catch (err) {
      const error = err as Error
      setAvatarError(error.message || 'Không thể đọc file ảnh. Vui lòng thử lại.')
    } finally {
      setIsProcessingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Xử lý lưu avatar sau khi crop thành công
  const handleSaveCroppedAvatar = async (croppedDataUrl: string, thumbnailDataUrl: string) => {
    setIsSavingAvatar(true)
    setAvatarError(null)
    try {
      const currentUserId = profile?.id || user?.id || 1
      saveAvatarToStorage(currentUserId, croppedDataUrl, thumbnailDataUrl)

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar: croppedDataUrl,
              thumbnail: thumbnailDataUrl,
            }
          : null
      )

      updateCurrentUser({
        avatar: croppedDataUrl,
        thumbnail: thumbnailDataUrl,
      })

      setIsCropModalOpen(false)
      setSuccessNotice('Cập nhật ảnh đại diện thành công!')
      setTimeout(() => {
        setSuccessNotice(null)
      }, 4000)
    } catch {
      setAvatarError('Lỗi khi lưu ảnh đại diện. Vui lòng thử lại.')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  // Xử lý gỡ ảnh đại diện (quay về avatar mặc định theo chữ cái)
  const handleRemoveAvatar = () => {
    const currentUserId = profile?.id || user?.id || 1
    removeAvatarFromStorage(currentUserId)

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            avatar: undefined,
            thumbnail: undefined,
          }
        : null
    )

    updateCurrentUser({
      avatar: undefined,
      thumbnail: undefined,
    })

    setSuccessNotice('Đã gỡ ảnh đại diện.')
    setTimeout(() => {
      setSuccessNotice(null)
    }, 3000)
  }

  // 1. Tải thông tin hồ sơ người dùng
  const loadProfileData = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const data = await getProfile()
      setProfile(data)
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setSignature(data.email_signature || '')
    } catch (err: unknown) {
      const error = err as Error
      setFetchError(error.message || 'Không thể tải thông tin hồ sơ.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  // Đăng xuất
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Xử lý thay đổi trường Họ tên
  const handleFullNameChange = (val: string) => {
    setFullName(val)
    if (errors.full_name) {
      const check = validateFullName(val)
      setErrors((prev) => ({
        ...prev,
        full_name: check.isValid ? undefined : check.error,
      }))
    }
    if (serverError) setServerError(null)
  }

  // Xử lý thay đổi trường Số điện thoại
  const handlePhoneChange = (val: string) => {
    setPhone(val)
    if (errors.phone) {
      const check = validateVietnamesePhone(val, false)
      setErrors((prev) => ({
        ...prev,
        phone: check.isValid ? undefined : check.error,
      }))
    }
    if (serverError) setServerError(null)
  }

  // Xử lý thay đổi trường Chữ ký email
  const handleSignatureChange = (val: string) => {
    setSignature(val)
    if (serverError) setServerError(null)
  }

  // Validate form trước khi submit
  const validateForm = (): boolean => {
    const nextErrors: ProfileFormErrors = {}

    // 1. Validate Họ và tên
    const nameCheck = validateFullName(fullName)
    if (!nameCheck.isValid) {
      nextErrors.full_name = nameCheck.error
    }

    // 2. Validate Số điện thoại Việt Nam
    const phoneCheck = validateVietnamesePhone(phone, false)
    if (!phoneCheck.isValid) {
      nextErrors.phone = phoneCheck.error
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Xử lý submit lưu hồ sơ
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Chặn nếu đang lưu hoặc đang tải
    if (isSaving || isLoading) return

    // Kiểm tra dữ liệu đầu vào
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setServerError(null)
    setSuccessNotice(null)

    try {
      const res = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email_signature: signature,
      })

      // Cập nhật state nội bộ
      if (res.user) {
        setProfile(res.user)
      } else {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                full_name: fullName.trim(),
                phone: phone.trim() || undefined,
                email_signature: signature,
              }
            : null
        )
      }

      // Đồng bộ thông tin người dùng lên AuthContext (cập nhật tên hiển thị ở header toàn app)
      updateCurrentUser({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email_signature: signature,
      })

      setSuccessNotice(res.message || 'Cập nhật hồ sơ cá nhân thành công!')

      // Tự động ẩn thông báo sau 4 giây
      setTimeout(() => {
        setSuccessNotice(null)
      }, 4000)
    } catch (err: unknown) {
      const error = err as Error
      setServerError(error.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  // Khôi phục lại dữ liệu ban đầu
  const handleReset = () => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setSignature(profile.email_signature || '')
      setErrors({})
      setServerError(null)
    }
  }

  // Kiểm tra xem dữ liệu có thay đổi so với dữ liệu gốc không
  const hasChanges =
    profile !== null &&
    (fullName.trim() !== (profile.full_name || '').trim() ||
      phone.trim() !== (profile.phone || '').trim() ||
      signature !== (profile.email_signature || ''))

  const roleName = profile?.role ? ROLE_LABELS[profile.role] ?? profile.role : (user?.role ? ROLE_LABELS[user.role] ?? user.role : 'Nhân viên')
  const teamName = profile?.team_name || profile?.team || user?.team_name || 'Đội Kinh Doanh 1'
  const emailDisplay = profile?.email || user?.email || '—'

  return (
    <div className="profile-page-wrapper">
      {/* ── Header Navbar chung ── */}
      <header className="profile-header">
        <div className="profile-header-inner">
          <div className="profile-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="profile-brand-icon" aria-hidden="true">
              <IconShield />
            </div>
            <span className="profile-brand-text">Quản lý khách hàng</span>
          </div>

          <div className="profile-header-user-area">
            <div className="profile-header-user-info">
              <div className="profile-header-avatar" id="profile-header-avatar-display">
                {profile?.avatar || user?.avatar ? (
                  <img
                    src={profile?.avatar || user?.avatar}
                    alt={user?.full_name || 'Ảnh đại diện'}
                    className="profile-header-avatar-img"
                  />
                ) : (
                  getInitials(user?.full_name || 'Người dùng')
                )}
              </div>
              <div className="profile-header-details">
                <span className="profile-header-name">{user?.full_name ?? 'Người dùng'}</span>
                <span className="profile-header-role">
                  {user?.role ? ROLE_LABELS[user.role] ?? user.role : ''}
                </span>
              </div>
            </div>

            {user?.role?.toUpperCase() === 'ADMIN' && (
              <>
                <button
                  type="button"
                  className="profile-nav-btn"
                  onClick={() => navigate('/admin/audit-logs')}
                  title="Xem nhật ký thay đổi dữ liệu nhạy cảm"
                  id="header-audit-logs-btn"
                >
                  <IconClipboardList />
                  <span>Nhật ký thay đổi</span>
                </button>
                <button
                  type="button"
                  className="profile-nav-btn"
                  onClick={() => navigate('/admin/users')}
                  title="Quản lý tài khoản"
                  id="header-admin-users-btn"
                >
                  <IconUser />
                  <span>Tài khoản</span>
                </button>
                <button
                  type="button"
                  className="profile-nav-btn"
                  onClick={() => navigate('/import-users')}
                  title="Nhập dữ liệu người dùng từ Excel"
                  id="header-import-users-btn"
                >
                  <IconDownload />
                  <span>Nhập Excel</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="profile-nav-btn"
              onClick={() => navigate('/change-password')}
              title="Đổi mật khẩu"
              id="header-change-password-btn"
            >
              <IconKey />
              <span>Đổi mật khẩu</span>
            </button>

            <button
              type="button"
              className="profile-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất"
              id="header-logout-btn"
            >
              <IconLogout />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="profile-main-container">
        {/* Nút quay lại Dashboard */}
        <button
          className="profile-back-link"
          onClick={() => navigate('/dashboard')}
          type="button"
          id="profile-back-dashboard-btn"
        >
          <IconArrowLeft />
          <span>Quay lại Dashboard</span>
        </button>

        {/* Tiêu đề trang */}
        <div className="profile-title-bar">
          <div className="profile-title-left">
            <div className="profile-title-icon" aria-hidden="true">
              <IconUser />
            </div>
            <div>
              <h1 className="profile-main-title">Hồ sơ cá nhân</h1>
              <p className="profile-subtitle">
                Xem và quản lý thông tin tài khoản của bạn. Chữ ký email sẽ được tự động gắn vào báo giá gửi khách hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Toast thông báo thành công */}
        {successNotice && (
          <div className="profile-alert profile-alert-success" role="status" id="profile-success-alert">
            <IconCheckCircle />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Toast thông báo lỗi hệ thống / API */}
        {serverError && (
          <div className="profile-alert profile-alert-error" role="alert" id="profile-error-alert">
            <IconAlertCircle />
            <span>{serverError}</span>
          </div>
        )}

        {/* Trạng thái tải dữ liệu hồ sơ */}
        {isLoading ? (
          <div className="profile-loading-state" id="profile-loading-indicator">
            <div className="profile-spinner" aria-hidden="true" />
            <p>Đang tải thông tin hồ sơ của bạn...</p>
          </div>
        ) : fetchError ? (
          /* Trạng thái lỗi tải dữ liệu hồ sơ */
          <div className="profile-error-card" id="profile-load-error-card">
            <IconAlertCircle />
            <h3>Không thể tải thông tin hồ sơ</h3>
            <p>{fetchError}</p>
            <button
              type="button"
              className="profile-btn profile-btn-primary"
              onClick={loadProfileData}
              id="profile-retry-btn"
            >
              <IconRefresh />
              <span>Thử lại</span>
            </button>
          </div>
        ) : (
          /* Giao diện chính: Cột trái (Tổng quan) + Cột phải (Form chỉnh sửa & Chữ ký) */
          <div className="profile-grid">
            {/* ── CỘT TRÁI: THẺ TỔNG QUAN TÀI KHOẢN ── */}
            <aside className="profile-overview-card">
              <div className="profile-avatar-wrapper">
                {/* Input chọn file ẩn */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFileSelect}
                  id="profile-avatar-file-input"
                />

                {/* Vùng avatar có badge camera tương tác */}
                <div
                  className="profile-avatar-container"
                  onClick={() => fileInputRef.current?.click()}
                  title="Nhấp để tải lên hoặc đổi ảnh đại diện"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  aria-label="Tải lên hoặc thay đổi ảnh đại diện"
                  id="profile-avatar-clickable-area"
                >
                  <div className="profile-avatar-circle" id="profile-avatar-display">
                    {profile?.avatar || user?.avatar ? (
                      <img
                        src={profile?.avatar || user?.avatar}
                        alt={fullName || 'Ảnh đại diện'}
                        className="profile-avatar-img"
                        id="profile-avatar-img"
                      />
                    ) : (
                      getInitials(fullName || 'Người dùng')
                    )}
                  </div>
                  <div className="profile-avatar-badge" title="Tải ảnh lên" aria-hidden="true">
                    <IconCamera />
                  </div>
                </div>

                {/* Loading state khi đang đọc file ảnh */}
                {isProcessingAvatar && (
                  <div className="profile-avatar-loading-spinner" id="avatar-processing-spinner">
                    <span className="profile-avatar-mini-spinner" aria-hidden="true" />
                    <span>Đang xử lý file ảnh...</span>
                  </div>
                )}

                {/* Thông báo lỗi validation ảnh */}
                {avatarError && (
                  <div className="profile-avatar-error-inline" role="alert" id="avatar-validation-error">
                    <IconAlertCircle />
                    <span>{avatarError}</span>
                  </div>
                )}

                {/* Nút hành động cho Avatar */}
                <div className="profile-avatar-actions">
                  <div className="profile-avatar-btn-row">
                    <button
                      type="button"
                      className="profile-avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingAvatar || isSavingAvatar}
                      id="profile-upload-avatar-btn"
                    >
                      <IconUploadMini />
                      <span>{profile?.avatar || user?.avatar ? 'Đổi ảnh' : 'Tải ảnh lên'}</span>
                    </button>
                    {(profile?.avatar || user?.avatar) && (
                      <button
                        type="button"
                        className="profile-avatar-remove-btn"
                        onClick={handleRemoveAvatar}
                        disabled={isProcessingAvatar || isSavingAvatar}
                        title="Gỡ ảnh đại diện"
                        id="profile-remove-avatar-btn"
                      >
                        <IconTrashMini />
                        <span>Gỡ ảnh</span>
                      </button>
                    )}
                  </div>
                  <span className="profile-avatar-hint">
                    JPG, PNG • Tối đa 2MB • Cắt vuông 1:1
                  </span>
                </div>

                <h2 className="profile-card-name" id="profile-card-fullname">{fullName || 'Người dùng'}</h2>
                <span className="profile-card-email" id="profile-card-email-display">{emailDisplay}</span>
              </div>

              <div className="profile-overview-meta">
                <div className="profile-meta-item">
                  <span className="meta-label">Vai trò:</span>
                  <span className="profile-role-badge" id="profile-overview-role">{roleName}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Đội nhóm:</span>
                  <span className="profile-team-badge" id="profile-overview-team">{teamName}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Số điện thoại:</span>
                  <span className="meta-value" id="profile-overview-phone">{phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Trạng thái:</span>
                  <span className="profile-status-badge active" id="profile-overview-status">
                    <span className="status-dot" /> Đang hoạt động
                  </span>
                </div>
              </div>

              <div className="profile-lock-notice">
                <div className="lock-icon-wrap" aria-hidden="true">
                  <IconLock />
                </div>
                <div className="lock-notice-content">
                  <strong>Thông tin bảo vệ hệ thống:</strong>
                  <p>
                    Email, Vai trò và Đội nhóm được quản lý tập trung bởi Quản trị viên và không thể tự chỉnh sửa.
                  </p>
                </div>
              </div>
            </aside>

            {/* ── CỘT PHẢI: FORM CHỈNH SỬA HỒ SƠ & CHỮ KÝ EMAIL ── */}
            <section className="profile-form-section">
              <form onSubmit={handleSubmit} noValidate id="profile-form">
                {/* 1. KHỐI THÔNG TIN CÁ NHÂN (CHỈNH SỬA ĐƯỢC) */}
                <div className="profile-card">
                  <div className="profile-card-header">
                    <h3 className="profile-card-title">Thông tin cá nhân được phép chỉnh sửa</h3>
                    <p className="profile-card-subtitle">
                      Cập nhật thông tin liên hệ của bạn để thông tin trên báo giá luôn chính xác.
                    </p>
                  </div>

                  <div className="profile-form-body">
                    {/* Trường Họ và tên (Bắt buộc, cho phép sửa) */}
                    <div className="profile-form-group">
                      <label className="profile-form-label" htmlFor="profile-full-name">
                        Họ và tên <span className="required-star">*</span>
                      </label>
                      <input
                        id="profile-full-name"
                        type="text"
                        className={`profile-form-input ${errors.full_name ? 'input-error' : ''}`}
                        placeholder="Nhập họ và tên đầy đủ..."
                        value={fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        disabled={isSaving}
                        autoComplete="name"
                      />
                      {errors.full_name && (
                        <span className="profile-field-error" id="profile-fullname-error">
                          {errors.full_name}
                        </span>
                      )}
                    </div>

                    {/* Trường Số điện thoại Việt Nam (Cho phép sửa, kiểm tra định dạng VN) */}
                    <div className="profile-form-group">
                      <label className="profile-form-label" htmlFor="profile-phone">
                        Số điện thoại (Việt Nam)
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        className={`profile-form-input ${errors.phone ? 'input-error' : ''}`}
                        placeholder="Ví dụ: 0901234567 hoặc +84901234567"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        disabled={isSaving}
                        autoComplete="tel"
                      />
                      <span className="profile-field-hint">
                        Định dạng số điện thoại Việt Nam (ví dụ: 0901234567, 0381234567 hoặc +84901234567). Bỏ trống nếu không sử dụng.
                      </span>
                      {errors.phone && (
                        <span className="profile-field-error" id="profile-phone-error">
                          {errors.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. KHỐI THÔNG TIN HỆ THỐNG (CHỈ ĐỌC / KHÓA CHỈNH SỬA) */}
                <div className="profile-card profile-card-readonly">
                  <div className="profile-card-header">
                    <div className="readonly-title-row">
                      <h3 className="profile-card-title">Thông tin tài khoản hệ thống (Chỉ đọc)</h3>
                      <span className="readonly-badge" id="profile-readonly-badge">
                        <IconLock /> Không thể tự sửa
                      </span>
                    </div>
                    <p className="profile-card-subtitle">
                      Các trường Email, Đội nhóm và Vai trò chỉ được phép thay đổi bởi Quản trị viên hệ thống.
                    </p>
                  </div>

                  <div className="profile-form-body readonly-grid">
                    {/* Trường Email (Chỉ đọc) */}
                    <div className="profile-form-group">
                      <label className="profile-form-label" htmlFor="profile-email">
                        Địa chỉ Email
                      </label>
                      <div className="input-lock-wrapper">
                        <input
                          id="profile-email"
                          type="email"
                          className="profile-form-input input-readonly"
                          value={emailDisplay}
                          disabled
                          readOnly
                          title="Email được quản lý bởi hệ thống, không thể chỉnh sửa"
                        />
                        <span className="input-lock-icon" aria-hidden="true">
                          <IconLock />
                        </span>
                      </div>
                    </div>

                    {/* Trường Đội nhóm (Chỉ đọc) */}
                    <div className="profile-form-group">
                      <label className="profile-form-label" htmlFor="profile-team">
                        Đội nhóm (Team)
                      </label>
                      <div className="input-lock-wrapper">
                        <input
                          id="profile-team"
                          type="text"
                          className="profile-form-input input-readonly"
                          value={teamName}
                          disabled
                          readOnly
                          title="Đội nhóm do người quản trị phân bổ, không thể chỉnh sửa"
                        />
                        <span className="input-lock-icon" aria-hidden="true">
                          <IconLock />
                        </span>
                      </div>
                    </div>

                    {/* Trường Vai trò (Chỉ đọc) */}
                    <div className="profile-form-group">
                      <label className="profile-form-label" htmlFor="profile-role">
                        Vai trò hệ thống (Role)
                      </label>
                      <div className="input-lock-wrapper">
                        <input
                          id="profile-role"
                          type="text"
                          className="profile-form-input input-readonly"
                          value={roleName}
                          disabled
                          readOnly
                          title="Vai trò được chỉ định bởi Quản trị viên, không thể chỉnh sửa"
                        />
                        <span className="input-lock-icon" aria-hidden="true">
                          <IconLock />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. KHỐI CHỮ KÝ EMAIL (S2-02 CORE) */}
                <div className="profile-card">
                  <div className="profile-card-header">
                    <div className="signature-header-row">
                      <div>
                        <h3 className="profile-card-title">Chữ ký email khi gửi báo giá</h3>
                        <p className="profile-card-subtitle">
                          Chữ ký này sẽ được tự động đính kèm vào phần cuối mỗi email gửi báo giá và thông báo cho khách hàng.
                        </p>
                      </div>
                      <span className="signature-badge">
                        <IconFileText /> Báo giá khách hàng
                      </span>
                    </div>
                  </div>

                  <div className="profile-form-body">
                    <div className="profile-form-group">
                      <label className="profile-form-label" htmlFor="profile-email-signature">
                        Nội dung chữ ký email
                      </label>
                      <textarea
                        id="profile-email-signature"
                        rows={6}
                        className="profile-form-textarea"
                        placeholder="Ví dụ:&#10;Trân trọng,&#10;Nguyễn Văn An&#10;Chuyên viên Kinh doanh - Đội Kinh Doanh 1&#10;SĐT: 0901 234 567 | Email: an.nguyen@company.com"
                        value={signature}
                        onChange={(e) => handleSignatureChange(e.target.value)}
                        disabled={isSaving}
                      />
                      <span className="profile-field-hint">
                        Hỗ trợ xuống dòng, thông tin liên lạc, chức danh và địa chỉ công ty.
                      </span>
                    </div>

                    {/* Khung Xem trước chữ ký email thực tế */}
                    <div className="signature-preview-box" id="profile-signature-preview">
                      <div className="preview-header">
                        <IconFileText />
                        <span>Xem trước giao diện chữ ký trong email báo giá:</span>
                      </div>
                      <div className="preview-content">
                        <div className="preview-mock-email-body">
                          <span className="mock-email-text">
                            [... Kính gửi Quý khách hàng, đính kèm theo đây là bảng báo giá chi tiết sản phẩm / dịch vụ ...]
                          </span>
                        </div>
                        <div className="preview-signature-divider" />
                        <div className="preview-signature-text" id="profile-signature-preview-text">
                          {signature.trim() ? (
                            signature.split('\n').map((line, idx) => (
                              <p key={idx} className="signature-line">
                                {line || '\u00A0'}
                              </p>
                            ))
                          ) : (
                            <span className="preview-empty-hint">
                              (Chưa có chữ ký email. Vui lòng nhập nội dung chữ ký ở ô bên trên.)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. THANH HÀNH ĐỘNG NÚT LƯU & HỦY */}
                <div className="profile-actions-bar">
                  <div className="actions-info">
                    {hasChanges ? (
                      <span className="changes-indicator changed" id="profile-changes-status">
                        ● Có thay đổi chưa lưu
                      </span>
                    ) : (
                      <span className="changes-indicator unchanged" id="profile-changes-status">
                        ✓ Thông tin đã được lưu mới nhất
                      </span>
                    )}
                  </div>

                  <div className="actions-buttons-group">
                    <button
                      type="button"
                      className="profile-btn profile-btn-secondary"
                      onClick={handleReset}
                      disabled={isSaving || !hasChanges}
                      id="profile-reset-btn"
                    >
                      Khôi phục
                    </button>

                    <button
                      type="submit"
                      className="profile-btn profile-btn-primary"
                      disabled={isSaving}
                      id="profile-submit-btn"
                    >
                      {isSaving ? (
                        <>
                          <span className="btn-spinner" aria-hidden="true" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <IconSave />
                          <span>Lưu thay đổi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

      {/* ── Modal Cắt Ảnh Đại Diện Tỷ Lệ 1:1 (User Story S2-03) ── */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        initialImageSrc={cropModalImageSrc}
        onClose={() => {
          setIsCropModalOpen(false)
          setCropModalImageSrc('')
          setAvatarError(null)
        }}
        onSave={handleSaveCroppedAvatar}
        isSaving={isSavingAvatar}
      />
    </div>
  )
}

export default ProfilePage
