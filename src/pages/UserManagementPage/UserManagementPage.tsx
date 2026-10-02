import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import {
  getUsers,
  createUser,
  updateUser,
  getAvailableTeams,
  getUserRole,
  getUserTeam,
  assignUserRoleAndTeam,
  SYSTEM_ROLES,
  SYSTEM_TEAMS,
} from '../../services/userService.ts'
import type {
  UserAccount,
  UserRole,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
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

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
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
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  USER: 'Nhân viên',
  STAFF: 'Nhân viên',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Đã khoá',
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

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // S1-09: Role & Team Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignTargetUser, setAssignTargetUser] = useState<UserAccount | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignRole, setAssignRole] = useState<string>('')
  const [assignTeamId, setAssignTeamId] = useState<string>('') // string for <select>, converted to number|null
  const [currentRoleInfo, setCurrentRoleInfo] = useState<{ role: string } | null>(null)
  const [currentTeamInfo, setCurrentTeamInfo] = useState<{ team_id: number | null; team_name?: string | null } | null>(null)

  // Form
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'USER' as string,
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
    }, 3000)
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
      role: 'USER',
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

  /* --- Close modal --- */
  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingUser(null)
    setFormErrors({})
  }

  /* --- S1-09: Open Role & Team Assignment Modal --- */
  const openAssignModal = async (u: UserAccount) => {
    setAssignTargetUser(u)
    setAssignModalOpen(true)
    setAssignLoading(true)
    setAssignError(null)

    // Pre-populate with user row data
    const initialRole = u.role.toUpperCase()
    setAssignRole(initialRole)
    const initialTeamId = u.team_id != null ? String(u.team_id) : ''
    setAssignTeamId(initialTeamId)

    try {
      // Gọi API xem Role và Team hiện tại theo đúng yêu cầu US S1-09
      const [roleData, teamData] = await Promise.all([
        getUserRole(u.id),
        getUserTeam(u.id),
      ])

      setCurrentRoleInfo({ role: roleData.role })
      setCurrentTeamInfo({ team_id: teamData.team_id, team_name: teamData.team_name })
      setAssignRole(roleData.role)
      setAssignTeamId(teamData.team_id != null ? String(teamData.team_id) : '')
    } catch (err) {
      // Fallback lấy theo thông tin đang có trong row
      setCurrentRoleInfo({ role: u.role })
      setCurrentTeamInfo({ team_id: u.team_id ?? null, team_name: u.team })
    } finally {
      setAssignLoading(false)
    }
  }

  /* --- S1-09: Close Role & Team Assignment Modal --- */
  const closeAssignModal = () => {
    if (assignSubmitting) return
    setAssignModalOpen(false)
    setAssignTargetUser(null)
    setAssignError(null)
    setCurrentRoleInfo(null)
    setCurrentTeamInfo(null)
  }

  /* --- S1-09: Handle Role & Team Assignment Submit --- */
  const handleAssignSubmit = async () => {
    if (!assignTargetUser) return

    if (!assignRole) {
      setAssignError('Vui lòng chọn vai trò (Role) cho tài khoản.')
      return
    }

    setAssignSubmitting(true)
    setAssignError(null)

    try {
      const parsedTeamId = assignTeamId === '' ? null : Number(assignTeamId)
      await assignUserRoleAndTeam(assignTargetUser.id, {
        role: assignRole,
        team_id: parsedTeamId,
      })

      showToast(`Gán vai trò và nhóm cho "${assignTargetUser.full_name}" thành công!`, 'success')
      closeAssignModal()
      fetchUsers()
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Có lỗi khi cập nhật phân quyền.')
      showToast(err instanceof Error ? err.message : 'Có lỗi khi cập nhật phân quyền.', 'error')
    } finally {
      setAssignSubmitting(false)
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
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="MANAGER">Quản lý (Manager)</option>
            <option value="USER">Nhân viên (User)</option>
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
                  {users.map((u) => (
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
                          <button
                            type="button"
                            className="user-mgmt-assign-btn"
                            onClick={() => openAssignModal(u)}
                            title="Phân quyền Role & Nhóm (S1-09)"
                            id={`user-mgmt-assign-${u.id}`}
                          >
                            <IconUserCheck />
                            <span>Gán Role/Team</span>
                          </button>
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
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                    <option value="MANAGER">Quản lý (Manager)</option>
                    <option value="USER">Nhân viên (User)</option>
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

      {/* ── S1-09 Modal: Gán Role & Team cho người dùng ── */}
      {assignModalOpen && assignTargetUser && (
        <div
          className="user-mgmt-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAssignModal()
          }}
          id="assign-role-team-modal-overlay"
        >
          <div className="user-mgmt-modal assign-role-modal" role="dialog" aria-modal="true">
            <div className="user-mgmt-modal-header">
              <div className="assign-modal-header-text">
                <h2>Phân quyền Role & Nhóm/Team</h2>
                <p className="assign-modal-subtitle">User Story S1-09 – Dành riêng cho Quản trị viên</p>
              </div>
              <button
                type="button"
                className="user-mgmt-modal-close"
                onClick={closeAssignModal}
                disabled={assignSubmitting}
                title="Đóng modal"
                id="assign-modal-close-btn"
              >
                <IconX />
              </button>
            </div>

            <div className="user-mgmt-modal-body">
              {assignLoading ? (
                <div className="assign-modal-loading">
                  <div className="user-mgmt-spinner" />
                  <span>Đang tải thông tin Role & Team hiện tại...</span>
                </div>
              ) : (
                <>
                  {/* Error banner nếu có lỗi */}
                  {assignError && (
                    <div className="assign-alert-error" role="alert" id="assign-error-banner">
                      <IconAlertCircle />
                      <span>{assignError}</span>
                    </div>
                  )}

                  {/* Thông tin tài khoản được gán */}
                  <div className="assign-user-card">
                    <div className={`user-mgmt-avatar avatar-${assignTargetUser.role.toLowerCase()}`}>
                      {getInitials(assignTargetUser.full_name)}
                    </div>
                    <div className="assign-user-card-details">
                      <span className="assign-user-name">{assignTargetUser.full_name}</span>
                      <span className="assign-user-email">{assignTargetUser.email}</span>
                      <span className="assign-user-id">ID: #{assignTargetUser.id}</span>
                    </div>
                  </div>

                  {/* Hiển thị Role & Team hiện tại */}
                  <div className="assign-current-status-box">
                    <div className="assign-current-item">
                      <span className="assign-current-label">Role hiện tại:</span>
                      <span className={`assign-current-badge role-${(currentRoleInfo?.role || assignTargetUser.role).toLowerCase()}`}>
                        {ROLE_LABELS[(currentRoleInfo?.role as UserRole) || assignTargetUser.role] || (currentRoleInfo?.role || assignTargetUser.role)}
                      </span>
                    </div>
                    <div className="assign-current-item">
                      <span className="assign-current-label">Team hiện tại:</span>
                      <span className="assign-current-team">
                        {currentTeamInfo?.team_name || assignTargetUser.team || 'Chưa gán nhóm'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown chọn Role mới */}
                  <div className="user-mgmt-form-group">
                    <label className="user-mgmt-form-label" htmlFor="assign-select-role">
                      Vai trò (Role)<span className="user-mgmt-form-required">*</span>
                    </label>
                    <select
                      id="assign-select-role"
                      className="user-mgmt-form-select"
                      value={assignRole}
                      onChange={(e) => setAssignRole(e.target.value)}
                      disabled={assignSubmitting}
                    >
                      <option value="">-- Chọn vai trò mới --</option>
                      {SYSTEM_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                    <span className="assign-field-hint">
                      Role quyết định các quyền hạn và phạm vi dữ liệu tài khoản có thể truy cập.
                    </span>
                  </div>

                  {/* Dropdown chọn Team/Nhóm mới */}
                  <div className="user-mgmt-form-group">
                    <label className="user-mgmt-form-label" htmlFor="assign-select-team">
                      Nhóm / Team
                    </label>
                    <select
                      id="assign-select-team"
                      className="user-mgmt-form-select"
                      value={assignTeamId}
                      onChange={(e) => setAssignTeamId(e.target.value)}
                      disabled={assignSubmitting}
                    >
                      <option value="">-- Không phân vào nhóm / Xóa khỏi nhóm --</option>
                      {SYSTEM_TEAMS.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name} (ID: #{t.id})
                        </option>
                      ))}
                    </select>
                    <span className="assign-field-hint">
                      Gán nhóm giúp người dùng nhận dữ liệu khách hàng theo phạm vi TEAM.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="user-mgmt-modal-footer">
              <button
                type="button"
                className="user-mgmt-modal-cancel"
                onClick={closeAssignModal}
                disabled={assignSubmitting}
                id="assign-modal-cancel-btn"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                className="user-mgmt-modal-submit assign-submit-btn"
                onClick={handleAssignSubmit}
                disabled={assignSubmitting || assignLoading}
                id="assign-modal-submit-btn"
              >
                {assignSubmitting ? (
                  <>
                    <span className="assign-btn-spinner" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <IconCheck />
                    <span>Lưu phân quyền</span>
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
