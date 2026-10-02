import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { usePermission } from '../../hooks/usePermission.ts'
import { PermissionGate } from '../../components/PermissionGate.tsx'
import {
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  PERMISSION_LABELS,
  SCOPE_LABELS,
} from '../../constants/permissions.ts'
import './DashboardPage.css'

/* ──────────── Mock Data for Data Scope Demonstration ──────────── */
interface CustomerItem {
  id: number
  code: string
  name: string
  phone: string
  company: string
  owner_id: number
  owner_name: string
  team_id: number
  team_name: string
}

/* ──────────── Inline SVG Icons ──────────── */
const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

/* ──────────── Component ──────────── */
function DashboardPage() {
  const { user, logout, switchRole } = useAuth()
  const { scope, hasPermission, filterScopedData } = usePermission()
  const navigate = useNavigate()

  // State cho thông báo khi thao tác các nút phân quyền
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Danh sách khách hàng mẫu đại diện cho các owner và team khác nhau
  const rawCustomers: CustomerItem[] = useMemo(() => {
    const currentUserId = user?.id ?? 1
    return [
      {
        id: 1,
        code: 'KH-001',
        name: 'Công ty Cổ phần Công Nghệ Alpha',
        phone: '0901 234 567',
        company: 'Alpha Tech Corp',
        owner_id: currentUserId,
        owner_name: `Bạn (${user?.full_name ?? 'Tôi'})`,
        team_id: 1,
        team_name: 'Đội Kinh Doanh 1',
      },
      {
        id: 2,
        code: 'KH-002',
        name: 'Tập đoàn Bất Động Sản Hòa Bình',
        phone: '0912 345 678',
        company: 'Hoa Binh Group',
        owner_id: 99,
        owner_name: 'Nguyễn Văn Tuấn (Đồng nghiệp)',
        team_id: 1,
        team_name: 'Đội Kinh Doanh 1',
      },
      {
        id: 3,
        code: 'KH-003',
        name: 'Hệ thống Bán Lẻ Toàn Cầu Mekong',
        phone: '0988 777 666',
        company: 'Mekong Retail',
        owner_id: 101,
        owner_name: 'Trần Thị Mai (Nhóm khác)',
        team_id: 2,
        team_name: 'Đội Kinh Doanh 2',
      },
      {
        id: 4,
        code: 'KH-004',
        name: 'Tổng Công ty Logistics Sao Vàng',
        phone: '0933 222 111',
        company: 'Golden Star Logistics',
        owner_id: 102,
        owner_name: 'Lê Đình Trọng (Nhóm khác)',
        team_id: 2,
        team_name: 'Đội Kinh Doanh 2',
      },
    ]
  }, [user])

  // Lọc dữ liệu khách hàng theo phạm vi dữ liệu của người dùng hiện tại (MY, TEAM, ALL)
  const scopedCustomers = useMemo(() => {
    return filterScopedData(rawCustomers, {
      getOwnerId: (c) => c.owner_id,
      getTeamId: (c) => c.team_id,
    })
  }, [rawCustomers, filterScopedData])

  const showNotice = (msg: string) => {
    setActionNotice(msg)
    setTimeout(() => {
      setActionNotice(null)
    }, 3500)
  }

  // Toàn bộ các quyền trong hệ thống để đối chiếu
  const allSystemPermissions = Object.values(PERMISSIONS)

  return (
    <div className="dashboard-page">
      {/* ── Header / Navbar ── */}
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
                <span className="dashboard-user-role">
                  {user?.role ? ROLE_LABELS[user.role] ?? user.role : ''}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="dashboard-logout-btn"
              onClick={handleLogout}
              id="logout-btn"
              title="Đăng xuất"
            >
              <IconLogout />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="dashboard-main">
        {/* Banner thông báo tương tác */}
        {actionNotice && (
          <div className="action-notice-toast" role="status">
            <IconCheckCircle />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 1. Welcome Card giữ nguyên cấu trúc chuẩn */}
        <div className="dashboard-welcome-card">
          <h1>Chào mừng, {user?.full_name ?? 'Người dùng'}!</h1>
          <p>Bạn đã đăng nhập thành công vào hệ thống quản lý khách hàng.</p>
          <div className="dashboard-info-grid">
            <div className="dashboard-info-item">
              <span className="dashboard-info-label">Email</span>
              <span className="dashboard-info-value">{user?.email ?? '—'}</span>
            </div>
            <div className="dashboard-info-item">
              <span className="dashboard-info-label">Vai trò hiện tại</span>
              <span className="dashboard-info-value role-badge" data-role={user?.role}>
                {user?.role ?? '—'}
              </span>
            </div>
            <div className="dashboard-info-item">
              <span className="dashboard-info-label">Phạm vi dữ liệu (Scope)</span>
              <span className="dashboard-info-value scope-badge" data-scope={scope}>
                {scope} — {SCOPE_LABELS[scope]?.split('(')[0]?.trim()}
              </span>
            </div>
            <div className="dashboard-info-item">
              <span className="dashboard-info-label">Đội nhóm (Team)</span>
              <span className="dashboard-info-value">{user?.team_name ?? 'Chưa phân nhóm'}</span>
            </div>
          </div>
        </div>

        {/* 2. Khối Phân quyền & Chuyển đổi thử nghiệm Role (Story S1-05) */}
        <section className="dashboard-section permission-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Phân quyền người dùng & Kiểm thử Role (S1-05)</h2>
              <p className="section-desc">
                Kiểm tra quyền hạn thực tế và phạm vi dữ liệu dựa theo vai trò của người dùng trong hệ thống.
              </p>
            </div>

            {/* Role Switcher phục vụ test nhanh các quyền ngay trên giao diện */}
            <div className="role-switcher-box">
              <span className="role-switcher-label">Chuyển vai trò thử nghiệm:</span>
              <div className="role-buttons-group">
                <button
                  type="button"
                  className={`role-btn ${user?.role === ROLES.ADMIN ? 'active' : ''}`}
                  onClick={() => switchRole(ROLES.ADMIN, 'ALL')}
                  id="test-switch-admin"
                >
                  ADMIN (ALL)
                </button>
                <button
                  type="button"
                  className={`role-btn ${user?.role === ROLES.MANAGER ? 'active' : ''}`}
                  onClick={() => switchRole(ROLES.MANAGER, 'TEAM')}
                  id="test-switch-manager"
                >
                  MANAGER (TEAM)
                </button>
                <button
                  type="button"
                  className={`role-btn ${user?.role === ROLES.USER ? 'active' : ''}`}
                  onClick={() => switchRole(ROLES.USER, 'MY')}
                  id="test-switch-user"
                >
                  USER (MY)
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách ma trận quyền thực tế của người dùng */}
          <div className="permissions-matrix-grid">
            {allSystemPermissions.map((perm) => {
              const granted = hasPermission(perm)
              return (
                <div
                  key={perm}
                  className={`permission-chip ${granted ? 'granted' : 'denied'}`}
                  title={granted ? 'Quyền đã được cấp' : 'Không có quyền này'}
                >
                  <span className="chip-icon">
                    {granted ? <IconCheckCircle /> : <IconLock />}
                  </span>
                  <div className="chip-content">
                    <span className="chip-code">{perm}</span>
                    <span className="chip-desc">{PERMISSION_LABELS[perm]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. Khối Minh họa Quản lý Khách hàng theo Phạm vi Dữ liệu (Data Scope) */}
        <section className="dashboard-section data-scope-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Danh sách khách hàng theo phạm vi dữ liệu</h2>
              <p className="section-desc">
                Cơ chế lọc dữ liệu phía Frontend theo scope: <strong>MY</strong> (chỉ bản thân),{' '}
                <strong>TEAM</strong> (cùng đội nhóm), <strong>ALL</strong> (toàn hệ thống).
              </p>
            </div>

            {/* Các nút hành động được bảo vệ bởi PermissionGate */}
            <div className="scope-actions-group">
              <PermissionGate
                permission={PERMISSIONS.CUSTOMER_EXPORT}
                fallback={null}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => showNotice('Đã xuất báo cáo khách hàng thành công!')}
                  id="btn-export-customers"
                >
                  <IconDownload />
                  <span>Xuất dữ liệu</span>
                </button>
              </PermissionGate>

              <PermissionGate
                permission={PERMISSIONS.CUSTOMER_CREATE}
                fallback={null}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => showNotice('Mở hộp thoại tạo khách hàng mới')}
                  id="btn-create-customer"
                >
                  <IconPlus />
                  <span>Thêm khách hàng</span>
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* Dải thông báo trạng thái lọc Scope */}
          <div className="scope-status-strip">
            <span className="scope-status-text">
              Phạm vi hiện tại: <strong className="scope-tag">{scope}</strong> — Hiển thị{' '}
              <strong>{scopedCustomers.length}</strong> / {rawCustomers.length} khách hàng
            </span>
            <span className="scope-note">
              {scope === 'MY' && 'Chỉ hiển thị các khách hàng do chính bạn phụ trách.'}
              {scope === 'TEAM' && 'Hiển thị khách hàng của bạn và đồng nghiệp trong Đội Kinh Doanh 1.'}
              {scope === 'ALL' && 'Hiển thị toàn bộ khách hàng từ tất cả phòng ban/đội nhóm.'}
            </span>
          </div>

          {/* Bảng dữ liệu khách hàng */}
          <div className="customer-table-container">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Mã KH</th>
                  <th>Tên khách hàng</th>
                  <th>Công ty</th>
                  <th>Số điện thoại</th>
                  <th>Người phụ trách</th>
                  <th>Đội nhóm</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {scopedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      Không có khách hàng nào trong phạm vi dữ liệu của bạn.
                    </td>
                  </tr>
                ) : (
                  scopedCustomers.map((cust) => (
                    <tr key={cust.id}>
                      <td className="code-cell">{cust.code}</td>
                      <td className="name-cell">{cust.name}</td>
                      <td>{cust.company}</td>
                      <td>{cust.phone}</td>
                      <td>
                        <span
                          className={`owner-badge ${
                            cust.owner_id === user?.id ? 'owner-self' : ''
                          }`}
                        >
                          {cust.owner_name}
                        </span>
                      </td>
                      <td>
                        <span className="team-badge">{cust.team_name}</span>
                      </td>
                      <td className="actions-cell">
                        {/* Nút Sửa: bọc PermissionGate với renderDisabled */}
                        <PermissionGate
                          permission={PERMISSIONS.CUSTOMER_EDIT}
                          renderDisabled={true}
                          disabledReason="Bạn không có quyền chỉnh sửa khách hàng này"
                        >
                          <button
                            type="button"
                            className="action-icon-btn edit-btn"
                            title="Chỉnh sửa"
                            onClick={() => showNotice(`Chỉnh sửa khách hàng ${cust.code}`)}
                          >
                            <IconEdit />
                          </button>
                        </PermissionGate>

                        {/* Nút Xóa: chỉ ADMIN mới có quyền xóa (CUSTOMER_DELETE) */}
                        <PermissionGate
                          permission={PERMISSIONS.CUSTOMER_DELETE}
                          fallback={null}
                        >
                          <button
                            type="button"
                            className="action-icon-btn delete-btn"
                            title="Xóa khách hàng"
                            onClick={() => showNotice(`Xóa khách hàng ${cust.code}`)}
                          >
                            <IconTrash />
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
