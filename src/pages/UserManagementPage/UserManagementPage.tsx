import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import {
  getUsers,
  createUser,
  updateUser,
  getAvailableTeams,
  updateUserStatus,
  getUserAssignedData,
} from '../../services/userService.ts'
import type {
  UserAccount,
  UserRole,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
  HandoverItem,
} from '../../types/user.ts'
import './UserManagementPage.css'

/* ──────────── Inline SVG Icons ──────────── */
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
)

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconUnlock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
)

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)

const IconAlertTriangle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

const IconUserX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="17" x2="22" y1="11" y2="11" />
  </svg>
)

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)

/* ──────────── Helpers ──────────── */
const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Nhân viên',
  USER: 'Nhân viên',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Đang hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Đã khóa',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

/* ──────────── Form validation ──────────── */
interface FormErrors {
  full_name?: string
  email?: string
  phone?: string
  password?: string
  role?: string
}

function validateForm(
  data: {
    full_name: string
    email: string
    phone: string
    password: string
    role: string
  },
  isEdit: boolean
): FormErrors {
  const errors: FormErrors = {}

  if (!data.full_name.trim()) {
    errors.full_name = 'Họ tên không được để trống.'
  } else if (data.full_name.trim().length < 2) {
    errors.full_name = 'Họ tên phải có ít nhất 2 ký tự.'
  }

  if (!data.email.trim()) {
    errors.email = 'Email không được để trống.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Email không đúng định dạng.'
  }

  if (data.phone && !/^(0|\+84)\d{9,10}$/.test(data.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Số điện thoại không hợp lệ.'
  }

  if (!isEdit && !data.password) {
    errors.password = 'Mật khẩu không được để trống.'
  } else if (!isEdit && data.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
  }

  if (!data.role) {
    errors.role = 'Vui lòng chọn vai trò.'
  }

  return errors
}

/* ──────────── Toast ──────────── */
interface Toast {
  message: string
  type: 'success' | 'error'
}

/* ──────────── Component ──────────── */
function UserManagementPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Data
  const [users, setUsers] = useState<UserAccount[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('')
  const [filterTeam, setFilterTeam] = useState('')
  const [teams, setTeams] = useState<string[]>([])

  // Pagination (S1-08: Mặc định 20 dòng / trang)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // S1-10: Lock & Unlock Account States
  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<UserAccount | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // S1-10: Data Handover States (Bàn giao dữ liệu khi khóa tài khoản)
  const [handoverEnabled, setHandoverEnabled] = useState(false)
  const [handoverUserId, setHandoverUserId] = useState<string>('')
  const [userAssignedItems, setUserAssignedItems] = useState<HandoverItem[]>([])
  const [loadingAssignedItems, setLoadingAssignedItems] = useState(false)

  // Form
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '' as string,
    team: '',
    password: '',
    status: 'active' as string,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Toast
  const [toast, setToast] = useState<Toast | null>(null)
  const [toastFading, setToastFading] = useState(false)

  /* --- Show toast --- */
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setToastFading(false)
    setTimeout(() => {
      setToastFading(true)
      setTimeout(() => setToast(null), 300)
    }, 3500)
  }, [])

  /* --- Fetch users --- */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getUsers({
        search: search || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined,
        team: filterTeam || undefined,
      })
      setUsers(res.users)
      setTotal(res.total)
      setTeams(getAvailableTeams())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }, [search, filterRole, filterStatus, filterTeam])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  /* --- Search debounce --- */
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  /* --- Open create modal --- */
  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      team: '',
      password: '',
      status: 'active',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  /* --- Open edit modal --- */
  const openEditModal = (u: UserAccount) => {
    setEditingUser(u)
    setFormData({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      team: u.team || '',
      password: '',
      status: u.status,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  /* --- Close create/edit modal --- */
  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingUser(null)
    setFormErrors({})
  }

  /* ──────────── S1-10: Lock & Unlock Action Handlers ──────────── */

  /* Mở modal xác nhận khóa tài khoản */
  const openLockModal = async (u: UserAccount) => {
    // Yêu cầu 12: Không cho phép Admin tự khóa tài khoản của chính mình
    if (user && user.id === u.id) {
      showToast('Bạn không thể tự khóa tài khoản của chính mình.', 'error')
      return
    }

    setTargetUser(u)
    setLockModalOpen(true)
    setActionError(null)
    setHandoverEnabled(false)
    setHandoverUserId('')
    setLoadingAssignedItems(true)

    try {
      const items = await getUserAssignedData(u.id)
      setUserAssignedItems(items)
      // Nếu user có dữ liệu phụ trách, tự động kích hoạt gợi ý bàn giao
      if (items.length > 0) {
        setHandoverEnabled(true)
      }
    } catch {
      setUserAssignedItems([])
    } finally {
      setLoadingAssignedItems(false)
    }
  }

  /* Đóng modal khóa tài khoản */
  const closeLockModal = () => {
    if (actionLoading) return
    setLockModalOpen(false)
    setTargetUser(null)
    setActionError(null)
    setHandoverEnabled(false)
    setHandoverUserId('')
    setUserAssignedItems([])
  }

  /* Thực hiện khóa tài khoản */
  const handleConfirmLock = async () => {
    if (!targetUser) return

    // Kiểm tra bàn giao dữ liệu nếu bật tùy chọn bàn giao
    let handoverTargetId: number | null = null
    if (handoverEnabled && userAssignedItems.length > 0) {
      if (!handoverUserId) {
        setActionError('Vui lòng chọn nhân viên tiếp nhận bàn giao dữ liệu.')
        return
      }
      handoverTargetId = Number(handoverUserId)
      if (handoverTargetId === targetUser.id) {
        setActionError('Không thể bàn giao dữ liệu cho chính tài khoản đang bị khóa.')
        return
      }
    }

    setActionLoading(true)
    setActionError(null)

    try {
      const response = await updateUserStatus(targetUser.id, 'LOCKED', handoverTargetId)
      showToast(response.message || `Đã khóa tài khoản "${targetUser.full_name}" thành công!`, 'success')
      closeLockModal()
      fetchUsers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi khóa tài khoản.'
      setActionError(msg)
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  /* Mở modal xác nhận mở khóa tài khoản */
  const openUnlockModal = (u: UserAccount) => {
    setTargetUser(u)
    setUnlockModalOpen(true)
    setActionError(null)
  }

  /* Đóng modal mở khóa tài khoản */
  const closeUnlockModal = () => {
    if (actionLoading) return
    setUnlockModalOpen(false)
    setTargetUser(null)
    setActionError(null)
  }

  /* Thực hiện mở khóa tài khoản */
  const handleConfirmUnlock = async () => {
    if (!targetUser) return

    setActionLoading(true)
    setActionError(null)

    try {
      const response = await updateUserStatus(targetUser.id, 'ACTIVE')
      showToast(response.message || `Đã mở khóa tài khoản "${targetUser.full_name}" thành công!`, 'success')
      closeUnlockModal()
      fetchUsers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi mở khóa tài khoản.'
      setActionError(msg)
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  /* --- Handle form submit --- */
  const handleSubmit = async () => {
    const errors = validateForm(formData, !!editingUser)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)

    try {
      if (editingUser) {
        // Update
        const payload: UpdateUserRequest = {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role as UserRole,
          team: formData.team.trim() || undefined,
          status: formData.status as UserStatus,
        }
        await updateUser(editingUser.id, payload)
        showToast('Cập nhật tài khoản thành công!', 'success')
      } else {
        // Create
        const payload: CreateUserRequest = {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role as UserRole,
          team: formData.team.trim() || undefined,
          password: formData.password,
        }
        await createUser(payload)
        showToast('Tạo tài khoản thành công!', 'success')
      }
      closeModal()
      fetchUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* --- Logout --- */
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  /* ──────────── Render ──────────── */
  return (
    <div className="user-mgmt-page">
      {/* ── Header (reuse dashboard header style) ── */}
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
              className="dashboard-change-pwd-btn"
              onClick={() => navigate('/change-password')}
              title="Đổi mật khẩu"
            >
              <IconKey />
              <span>Đổi mật khẩu</span>
            </button>
            <button
              type="button"
              className="dashboard-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <IconLogout />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="user-mgmt-main">
        {/* Back link */}
        <button
          className="user-mgmt-back-link"
          onClick={() => navigate('/dashboard')}
          type="button"
        >
          <IconArrowLeft />
          Quay lại Dashboard
        </button>

        {/* Title bar */}
        <div className="user-mgmt-title-bar">
          <h1>
            <IconUsers />
            Quản lý tài khoản
            <span className="user-mgmt-title-count">{total}</span>
          </h1>
          <button
            type="button"
            className="user-mgmt-add-btn"
            onClick={openCreateModal}
            id="user-mgmt-add-btn"
          >
            <IconPlus />
            Thêm tài khoản
          </button>
        </div>

        {/* Filters */}
        <div className="user-mgmt-filters">
          <div className="user-mgmt-search-wrap">
            <IconSearch />
            <input
              type="text"
              className="user-mgmt-search-input"
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              id="user-mgmt-search"
            />
          </div>
          <select
            className="user-mgmt-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
            id="user-mgmt-filter-role"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Nhân viên</option>
          </select>
          <select
            className="user-mgmt-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UserStatus | '')}
            id="user-mgmt-filter-status"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="locked">Đã khoá</option>
          </select>
          {teams.length > 0 && (
            <select
              className="user-mgmt-filter-select"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              id="user-mgmt-filter-team"
            >
              <option value="">Tất cả nhóm</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Table card */}
        <div className="user-mgmt-table-card">
          {loading ? (
            <div className="user-mgmt-loading">
              <div className="user-mgmt-spinner" />
              <span className="user-mgmt-loading-text">Đang tải danh sách...</span>
            </div>
          ) : error ? (
            <div className="user-mgmt-error">
              <IconAlertCircle />
              <span className="user-mgmt-error-text">{error}</span>
              <button
                type="button"
                className="user-mgmt-retry-btn"
                onClick={fetchUsers}
              >
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="user-mgmt-empty">
              <IconUserX />
              <span className="user-mgmt-empty-title">Không tìm thấy tài khoản</span>
              <span className="user-mgmt-empty-desc">
                {search || filterRole || filterStatus || filterTeam
                  ? 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.'
                  : 'Hãy thêm tài khoản đầu tiên.'}
              </span>
            </div>
          ) : (
            <div className="user-mgmt-table-wrap">
              <table className="user-mgmt-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò</th>
                    <th>Nhóm</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-mgmt-name-cell">
                            <div
                              className={`user-mgmt-avatar avatar-${u.role.toLowerCase()}`}
                            >
                              {getInitials(u.full_name)}
                            </div>
                            <span className="user-mgmt-name-text">{u.full_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="user-mgmt-email">{u.email}</span>
                        </td>
                        <td>
                          <span className="user-mgmt-phone">{u.phone || '—'}</span>
                        </td>
                        <td>
                          <span
                            className={`user-mgmt-role-badge role-${u.role.toLowerCase()}`}
                          >
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td>
                          <span className="user-mgmt-team">{u.team || '—'}</span>
                        </td>
                        <td>
                          <span
                            className={`user-mgmt-status-badge status-${u.status}`}
                          >
                            <span className="user-mgmt-status-dot" />
                            {STATUS_LABELS[u.status] || u.status}
                          </span>
                        </td>
                        <td>
                          <div className="user-mgmt-actions">
                            {/* S1-10: Nút Khóa / Mở khóa tài khoản */}
                            {u.status === 'locked' ? (
                              <button
                                type="button"
                                className="user-mgmt-action-btn btn-unlock"
                                onClick={() => openUnlockModal(u)}
                                title="Mở khóa tài khoản này"
                                id={`user-mgmt-unlock-${u.id}`}
                              >
                                <IconUnlock />
                                <span>Mở khóa</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`user-mgmt-action-btn btn-lock ${user?.id === u.id ? 'btn-disabled' : ''}`}
                                onClick={() => openLockModal(u)}
                                disabled={user?.id === u.id}
                                title={
                                  user?.id === u.id
                                    ? 'Không thể tự khóa tài khoản của chính mình'
                                    : 'Khóa tài khoản này'
                                }
                                id={`user-mgmt-lock-${u.id}`}
                              >
                                <IconLock />
                                <span>Khóa</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="user-mgmt-edit-btn"
                              onClick={() => openEditModal(u)}
                              title="Chỉnh sửa tài khoản"
                              id={`user-mgmt-edit-${u.id}`}
                            >
                              <IconEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Thanh phân trang Pagination (S1-08) */}
              {users.length > 0 && (
                <div className="user-mgmt-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                  <span>
                    Hiển thị {Math.min((currentPage - 1) * pageSize + 1, users.length)} - {Math.min(currentPage * pageSize, users.length)} trên tổng số {users.length} tài khoản (Mặc định {pageSize} dòng/trang)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      Trang trước
                    </button>
                    <span style={{ padding: '6px 12px', fontWeight: 600, color: '#1e293b' }}>
                      Trang {currentPage} / {Math.ceil(users.length / pageSize) || 1}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= Math.ceil(users.length / pageSize)}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: currentPage >= Math.ceil(users.length / pageSize) ? 'not-allowed' : 'pointer', opacity: currentPage >= Math.ceil(users.length / pageSize) ? 0.5 : 1 }}
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Modal: Create / Edit ── */}
      {modalOpen && (
        <div
          className="user-mgmt-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="user-mgmt-modal" role="dialog" aria-modal="true">
            <div className="user-mgmt-modal-header">
              <h2>{editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h2>
              <button
                type="button"
                className="user-mgmt-modal-close"
                onClick={closeModal}
                title="Đóng"
              >
                <IconX />
              </button>
            </div>

            <div className="user-mgmt-modal-body">
              {/* Họ tên */}
              <div className="user-mgmt-form-group">
                <label className="user-mgmt-form-label" htmlFor="form-full-name">
                  Họ tên<span className="user-mgmt-form-required">*</span>
                </label>
                <input
                  type="text"
                  id="form-full-name"
                  className={`user-mgmt-form-input ${formErrors.full_name ? 'input-error' : ''}`}
                  placeholder="Nhập họ tên đầy đủ"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
                {formErrors.full_name && (
                  <span className="user-mgmt-form-error">{formErrors.full_name}</span>
                )}
              </div>

              {/* Email */}
              <div className="user-mgmt-form-group">
                <label className="user-mgmt-form-label" htmlFor="form-email">
                  Email<span className="user-mgmt-form-required">*</span>
                </label>
                <input
                  type="email"
                  id="form-email"
                  className={`user-mgmt-form-input ${formErrors.email ? 'input-error' : ''}`}
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                />
                {formErrors.email && (
                  <span className="user-mgmt-form-error">{formErrors.email}</span>
                )}
              </div>

              {/* Phone + Role */}
              <div className="user-mgmt-form-row">
                <div className="user-mgmt-form-group">
                  <label className="user-mgmt-form-label" htmlFor="form-phone">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="form-phone"
                    className={`user-mgmt-form-input ${formErrors.phone ? 'input-error' : ''}`}
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                  {formErrors.phone && (
                    <span className="user-mgmt-form-error">{formErrors.phone}</span>
                  )}
                </div>

                <div className="user-mgmt-form-group">
                  <label className="user-mgmt-form-label" htmlFor="form-role">
                    Vai trò<span className="user-mgmt-form-required">*</span>
                  </label>
                  <select
                    id="form-role"
                    className={`user-mgmt-form-select ${formErrors.role ? 'input-error' : ''}`}
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, role: e.target.value }))
                    }
                  >
                    <option value="">-- Chọn vai trò --</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Nhân viên</option>
                  </select>
                  {formErrors.role && (
                    <span className="user-mgmt-form-error">{formErrors.role}</span>
                  )}
                </div>
              </div>

              {/* Team */}
              <div className="user-mgmt-form-group">
                <label className="user-mgmt-form-label" htmlFor="form-team">
                  Nhóm / Team
                </label>
                <input
                  type="text"
                  id="form-team"
                  className="user-mgmt-form-input"
                  placeholder="VD: Kinh doanh, Kỹ thuật, Hỗ trợ..."
                  value={formData.team}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, team: e.target.value }))
                  }
                />
              </div>

              {/* Password (only when creating) */}
              {!editingUser && (
                <div className="user-mgmt-form-group">
                  <label className="user-mgmt-form-label" htmlFor="form-password">
                    Mật khẩu<span className="user-mgmt-form-required">*</span>
                  </label>
                  <input
                    type="password"
                    id="form-password"
                    className={`user-mgmt-form-input ${formErrors.password ? 'input-error' : ''}`}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, password: e.target.value }))
                    }
                  />
                  {formErrors.password && (
                    <span className="user-mgmt-form-error">{formErrors.password}</span>
                  )}
                </div>
              )}

              {/* Status (only when editing) */}
              {editingUser && (
                <div className="user-mgmt-form-group">
                  <label className="user-mgmt-form-label" htmlFor="form-status">
                    Trạng thái
                  </label>
                  <select
                    id="form-status"
                    className="user-mgmt-form-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="locked">Đã khoá</option>
                  </select>
                </div>
              )}
            </div>

            <div className="user-mgmt-modal-footer">
              <button
                type="button"
                className="user-mgmt-modal-cancel"
                onClick={closeModal}
                disabled={submitting}
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                className="user-mgmt-modal-submit"
                onClick={handleSubmit}
                disabled={submitting}
                id="user-mgmt-submit-btn"
              >
                {submitting
                  ? 'Đang xử lý...'
                  : editingUser
                    ? 'Lưu thay đổi'
                    : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── S1-10 Modal: Xác nhận Khóa tài khoản & Bàn giao dữ liệu ── */}
      {lockModalOpen && targetUser && (
        <div
          className="user-mgmt-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLockModal()
          }}
          id="lock-modal-overlay"
        >
          <div className="user-mgmt-modal lock-confirm-modal" role="dialog" aria-modal="true">
            <div className="user-mgmt-modal-header lock-modal-header">
              <div className="lock-modal-header-icon" aria-hidden="true">
                <IconAlertTriangle />
              </div>
              <div className="lock-modal-header-title">
                <h2>Xác nhận khóa tài khoản</h2>
                <p>Thao tác này sẽ vô hiệu hóa quyền truy cập hệ thống của người dùng.</p>
              </div>
              <button
                type="button"
                className="user-mgmt-modal-close"
                onClick={closeLockModal}
                disabled={actionLoading}
                title="Đóng modal"
                id="lock-modal-close-btn"
              >
                <IconX />
              </button>
            </div>

            <div className="user-mgmt-modal-body">
              {/* Alert error nếu có lỗi */}
              {actionError && (
                <div className="user-mgmt-alert-error" role="alert" id="lock-modal-error">
                  <IconAlertCircle />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Thông tin tài khoản bị khóa */}
              <div className="lock-user-preview">
                <div className={`user-mgmt-avatar avatar-${targetUser.role.toLowerCase()}`}>
                  {getInitials(targetUser.full_name)}
                </div>
                <div className="lock-user-preview-details">
                  <span className="lock-user-name">{targetUser.full_name}</span>
                  <span className="lock-user-email">{targetUser.email}</span>
                  <span className="lock-user-role-badge">
                    {ROLE_LABELS[targetUser.role] || targetUser.role} {targetUser.team ? `• ${targetUser.team}` : ''}
                  </span>
                </div>
              </div>

              {/* Cảnh báo hậu quả khi khóa */}
              <div className="lock-warning-card">
                <p>
                  <strong>Lưu ý:</strong> Sau khi khóa, tài khoản này sẽ không thể đăng nhập vào hệ thống. Các phiên làm việc hiện tại sẽ bị vô hiệu hóa.
                </p>
              </div>

              {/* S1-10 Chức năng Bàn giao dữ liệu (Data Handover) */}
              <div className="lock-handover-section">
                <div className="lock-handover-header">
                  <label className="lock-handover-toggle-label">
                    <input
                      type="checkbox"
                      checked={handoverEnabled}
                      onChange={(e) => setHandoverEnabled(e.target.checked)}
                      disabled={actionLoading}
                      id="handover-toggle-checkbox"
                    />
                    <span className="lock-handover-toggle-text">
                      Bàn giao dữ liệu của tài khoản này sang nhân viên khác
                    </span>
                  </label>
                </div>

                {loadingAssignedItems ? (
                  <div className="lock-handover-loading">
                    <div className="user-mgmt-spinner" />
                    <span>Đang kiểm tra dữ liệu phụ trách của tài khoản...</span>
                  </div>
                ) : userAssignedItems.length > 0 ? (
                  <div className="lock-assigned-items-summary">
                    <span className="lock-assigned-count-badge">
                      Tài khoản đang phụ trách {userAssignedItems.length} khách hàng / dữ liệu:
                    </span>
                    <ul className="lock-assigned-items-list">
                      {userAssignedItems.map((item) => (
                        <li key={item.id}>
                          <span className="assigned-item-dot" />
                          <span className="assigned-item-name">{item.name}</span>
                          <span className="assigned-item-type">({item.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="lock-no-assigned-items">
                    Tài khoản hiện không phụ trách khách hàng nào. Bạn vẫn có thể chọn người tiếp nhận nếu muốn.
                  </p>
                )}

                {/* Dropdown chọn người tiếp nhận bàn giao */}
                {handoverEnabled && (
                  <div className="lock-handover-select-group">
                    <label className="user-mgmt-form-label" htmlFor="handover-user-select">
                      Chọn người nhận bàn giao<span className="user-mgmt-form-required">*</span>
                    </label>
                    <select
                      id="handover-user-select"
                      className="user-mgmt-form-select"
                      value={handoverUserId}
                      onChange={(e) => {
                        setHandoverUserId(e.target.value)
                        setActionError(null)
                      }}
                      disabled={actionLoading}
                    >
                      <option value="">-- Chọn nhân viên tiếp nhận bàn giao --</option>
                      {users
                        .filter(
                          (u) =>
                            u.id !== targetUser.id &&
                            u.status === 'active' &&
                            u.is_active !== false
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.email}) - {ROLE_LABELS[u.role] || u.role}
                          </option>
                        ))}
                    </select>
                    <span className="lock-handover-hint">
                      Tất cả khách hàng và tác vụ liên quan sẽ được tự động chuyển quyền phụ trách sang nhân viên được chọn.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="user-mgmt-modal-footer">
              <button
                type="button"
                className="user-mgmt-modal-cancel"
                onClick={closeLockModal}
                disabled={actionLoading}
                id="lock-modal-cancel-btn"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="user-mgmt-modal-submit lock-confirm-btn"
                onClick={handleConfirmLock}
                disabled={actionLoading}
                id="lock-modal-confirm-btn"
              >
                {actionLoading ? (
                  <>
                    <span className="user-mgmt-btn-spinner" />
                    <span>Đang khóa tài khoản...</span>
                  </>
                ) : (
                  <>
                    <IconLock />
                    <span>Xác nhận Khóa tài khoản</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── S1-10 Modal: Xác nhận Mở khóa tài khoản ── */}
      {unlockModalOpen && targetUser && (
        <div
          className="user-mgmt-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeUnlockModal()
          }}
          id="unlock-modal-overlay"
        >
          <div className="user-mgmt-modal unlock-confirm-modal" role="dialog" aria-modal="true">
            <div className="user-mgmt-modal-header unlock-modal-header">
              <div className="unlock-modal-header-icon" aria-hidden="true">
                <IconUnlock />
              </div>
              <div className="unlock-modal-header-title">
                <h2>Xác nhận mở khóa tài khoản</h2>
                <p>Khôi phục quyền truy cập hệ thống cho người dùng này.</p>
              </div>
              <button
                type="button"
                className="user-mgmt-modal-close"
                onClick={closeUnlockModal}
                disabled={actionLoading}
                title="Đóng modal"
                id="unlock-modal-close-btn"
              >
                <IconX />
              </button>
            </div>

            <div className="user-mgmt-modal-body">
              {actionError && (
                <div className="user-mgmt-alert-error" role="alert" id="unlock-modal-error">
                  <IconAlertCircle />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="lock-user-preview">
                <div className={`user-mgmt-avatar avatar-${targetUser.role.toLowerCase()}`}>
                  {getInitials(targetUser.full_name)}
                </div>
                <div className="lock-user-preview-details">
                  <span className="lock-user-name">{targetUser.full_name}</span>
                  <span className="lock-user-email">{targetUser.email}</span>
                  <span className="lock-user-status-text status-locked">
                    Trạng thái hiện tại: <strong>Đã khóa</strong>
                  </span>
                </div>
              </div>

              <div className="unlock-notice-card">
                <p>
                  Khi mở khóa, tài khoản <strong>{targetUser.full_name}</strong> sẽ được phép đăng nhập lại và tiếp tục sử dụng hệ thống bình thường.
                </p>
              </div>
            </div>

            <div className="user-mgmt-modal-footer">
              <button
                type="button"
                className="user-mgmt-modal-cancel"
                onClick={closeUnlockModal}
                disabled={actionLoading}
                id="unlock-modal-cancel-btn"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="user-mgmt-modal-submit unlock-confirm-btn"
                onClick={handleConfirmUnlock}
                disabled={actionLoading}
                id="unlock-modal-confirm-btn"
              >
                {actionLoading ? (
                  <>
                    <span className="user-mgmt-btn-spinner" />
                    <span>Đang mở khóa...</span>
                  </>
                ) : (
                  <>
                    <IconUnlock />
                    <span>Xác nhận Mở khóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`user-mgmt-toast toast-${toast.type} ${toastFading ? 'toast-out' : ''}`}
        >
          {toast.type === 'success' ? <IconCheck /> : <IconAlertCircle />}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default UserManagementPage
