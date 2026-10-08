import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import {
  getAuditLogs,
  getDistinctPerformers,
  formatAuditDate,
} from '../../services/auditLogService.ts'
import {
  ENTITY_TYPE_LABELS,
  ACTION_LABELS,
  type AuditLogEntry,
  type AuditEntityType,
} from '../../types/auditLog.ts'
import './AuditLogPage.css'


const IconClipboardList = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
)

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconRotateCcw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
)

const IconRefreshCw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconFilter = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconInbox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)

const IconPercent = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
)

const IconTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'AD'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.trim().substring(0, 2).toUpperCase() || 'AD'
}

export function AuditLogPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Hệ thống quản lý khách hàng'
  }, [])

  // Dữ liệu nhật ký
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Bộ lọc
  const [selectedPerformer, setSelectedPerformer] = useState<string>('ALL')
  const [selectedEntityType, setSelectedEntityType] = useState<AuditEntityType | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Danh sách người thực hiện độc nhất cho bộ lọc dropdown
  const performersList = useMemo(() => getDistinctPerformers(), [])

  // Thống kê nhanh theo từng loại đối tượng
  const stats = useMemo(() => {
    let discounts = 0
    let targets = 0
    let ownerships = 0
    let roles = 0
    if (Array.isArray(logs)) {
      logs.forEach((log) => {
        if (log.entity_type === 'DISCOUNT') discounts++
        else if (log.entity_type === 'TARGET') targets++
        else if (log.entity_type === 'OWNERSHIP') ownerships++
        else if (log.entity_type === 'USER_ROLE') roles++
      })
    }
    return { discounts, targets, ownerships, roles, total: totalRecords }
  }, [logs, totalRecords])

  // Tải dữ liệu nhật ký
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const response = await getAuditLogs({
        performer_name: selectedPerformer !== 'ALL' ? selectedPerformer : undefined,
        entity_type: selectedEntityType !== 'ALL' ? selectedEntityType : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search_keyword: searchKeyword || undefined,
        page: currentPage,
        pageSize,
      })

      if (response.success) {
        setLogs(Array.isArray(response.data) ? response.data : [])
        setTotalRecords(response.total ?? 0)
        setTotalPages(response.totalPages ?? 1)
      } else {
        throw new Error(response.message || 'Không thể tải nhật ký thay đổi.')
      }
    } catch (err) {
      const error = err as Error
      setFetchError(error.message || 'Có lỗi xảy ra khi tải dữ liệu nhật ký.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPerformer, selectedEntityType, fromDate, toDate, searchKeyword, currentPage, pageSize])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Xóa bộ lọc (Reset toàn bộ về mặc định)
  const handleResetFilters = () => {
    setSelectedPerformer('ALL')
    setSelectedEntityType('ALL')
    setFromDate('')
    setToDate('')
    setSearchKeyword('')
    setCurrentPage(1)
  }

  // Đăng xuất
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Kiểm tra có đang áp dụng bộ lọc nào không
  const hasActiveFilters =
    selectedPerformer !== 'ALL' ||
    selectedEntityType !== 'ALL' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(searchKeyword.trim())

  return (
    <div className="audit-log-page">
      {/* ── Header Navbar ── */}
      <header className="audit-log-header">
        <div className="audit-log-header-inner">
          <button
            type="button"
            className="audit-log-back-header-btn"
            onClick={() => navigate('/dashboard')}
            title="Quay lại Dashboard"
            id="audit-back-dashboard-btn"
          >
            <IconArrowLeft />
            <span>Quay lại Dashboard</span>
          </button>

          <div className="audit-log-header-user-area">
            <div className="audit-log-header-user-info">
              <div className="audit-log-header-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.full_name} className="audit-log-header-avatar-img" />
                ) : (
                  getInitials(user?.full_name || 'Admin')
                )}
              </div>

            </div>

            <button
              type="button"
              className="audit-log-nav-btn"
              onClick={() => navigate('/admin/users')}
              title="Quản lý tài khoản"
              id="audit-header-users-btn"
            >
              <IconUsers />
              <span>Tài khoản</span>
            </button>

            <button
              type="button"
              className="audit-log-nav-btn"
              onClick={() => navigate('/profile')}
              title="Hồ sơ cá nhân"
              id="audit-header-profile-btn"
            >
              <span>Hồ sơ</span>
            </button>

            <button
              type="button"
              className="audit-log-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất"
              id="audit-header-logout-btn"
            >
              <IconLogout />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="audit-log-main">
        {/* Tiêu đề trang */}
        <div className="audit-log-title-bar">
          <div className="audit-log-title-left">
            <div className="audit-log-title-icon" aria-hidden="true">
              <IconClipboardList />
            </div>
            <div>
              <h1 className="audit-log-main-title">
                Nhật ký thay đổi
                <span className="audit-log-count-pill" id="audit-total-badge">
                  {totalRecords} bản ghi
                </span>
              </h1>
              <p className="audit-log-subtitle">
                Truy vết toàn diện lịch sử thay đổi trên dữ liệu nhạy cảm: Chiết khấu, Chỉ tiêu doanh số, Quyền sở hữu và Vai trò người dùng.
              </p>
            </div>
          </div>

        </div>

        {/* ── Thống kê nhanh (Quick Stat Cards) ── */}
        <div className="audit-log-stats-grid">
          <div className="audit-stat-card">
            <div className="audit-stat-icon stat-total">
              <IconClipboardList />
            </div>
            <div className="audit-stat-content">
              <span className="audit-stat-value">{stats.total}</span>
              <span className="audit-stat-label">Tổng số bản ghi nhật ký</span>
            </div>
          </div>

          <div className="audit-stat-card">
            <div className="audit-stat-icon stat-discount">
              <IconPercent />
            </div>
            <div className="audit-stat-content">
              <span className="audit-stat-value">{stats.discounts}</span>
              <span className="audit-stat-label">Thay đổi Chiết khấu</span>
            </div>
          </div>

          <div className="audit-stat-card">
            <div className="audit-stat-icon stat-target">
              <IconTarget />
            </div>
            <div className="audit-stat-content">
              <span className="audit-stat-value">{stats.targets}</span>
              <span className="audit-stat-label">Thay đổi Chỉ tiêu (KPI)</span>
            </div>
          </div>

          <div className="audit-stat-card">
            <div className="audit-stat-icon stat-ownership">
              <IconUsers />
            </div>
            <div className="audit-stat-content">
              <span className="audit-stat-value">{stats.ownerships + stats.roles}</span>
              <span className="audit-stat-label">Quyền sở hữu & Vai trò</span>
            </div>
          </div>
        </div>

        {/* ── Khối bộ lọc (Filter Card) ── */}
        <section className="audit-filter-card" aria-label="Bộ lọc nhật ký">
          <div className="audit-filter-header">
            <h3 className="audit-filter-title">
              <IconFilter />
              <span>Bộ lọc tìm kiếm & truy vết</span>
            </h3>

            <div className="audit-filter-actions">
              <button
                type="button"
                className="audit-btn-reset"
                onClick={handleResetFilters}
                disabled={isLoading || !hasActiveFilters}
                id="audit-reset-filter-btn"
                title="Xóa tất cả tiêu chí lọc"
              >
                <IconRotateCcw />
                <span>Xóa bộ lọc</span>
              </button>

              <button
                type="button"
                className="audit-btn-refresh"
                onClick={fetchLogs}
                disabled={isLoading}
                id="audit-refresh-btn"
                title="Tải lại dữ liệu"
              >
                <IconRefreshCw />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          <div className="audit-filter-grid">
            {/* 1. Tìm kiếm theo từ khóa */}
            <div className="audit-filter-group">
              <label className="audit-filter-label" htmlFor="audit-filter-search" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconSearch />
                <span>Tìm kiếm từ khóa</span>
              </label>
              <input
                id="audit-filter-search"
                type="text"
                className="audit-filter-input"
                placeholder="Mã đối tượng, tên khách hàng..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* 2. Lọc theo Người thực hiện */}
            <div className="audit-filter-group">
              <label className="audit-filter-label" htmlFor="audit-filter-performer">
                Người thực hiện
              </label>
              <select
                id="audit-filter-performer"
                className="audit-filter-select"
                value={selectedPerformer}
                onChange={(e) => {
                  setSelectedPerformer(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="ALL">-- Tất cả người dùng --</option>
                {performersList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lọc theo Loại đối tượng */}
            <div className="audit-filter-group">
              <label className="audit-filter-label" htmlFor="audit-filter-entity-type">
                Loại đối tượng
              </label>
              <select
                id="audit-filter-entity-type"
                className="audit-filter-select"
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value as AuditEntityType | 'ALL')
                  setCurrentPage(1)
                }}
              >
                <option value="ALL">-- Tất cả loại đối tượng --</option>
                <option value="DISCOUNT">Chiết khấu (DISCOUNT)</option>
                <option value="TARGET">Chỉ tiêu (TARGET)</option>
                <option value="OWNERSHIP">Quyền sở hữu dữ liệu (OWNERSHIP)</option>
                <option value="USER_ROLE">Vai trò người dùng (USER_ROLE)</option>
              </select>
            </div>

            {/* 4. Khoảng thời gian: Từ ngày */}
            <div className="audit-filter-group">
              <label className="audit-filter-label" htmlFor="audit-filter-from-date">
                Từ ngày
              </label>
              <input
                id="audit-filter-from-date"
                type="date"
                className="audit-filter-input"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* 5. Khoảng thời gian: Đến ngày */}
            <div className="audit-filter-group">
              <label className="audit-filter-label" htmlFor="audit-filter-to-date">
                Đến ngày
              </label>
              <input
                id="audit-filter-to-date"
                type="date"
                className="audit-filter-input"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* Dải thông báo bộ lọc đang áp dụng */}
          {hasActiveFilters && (
            <div className="audit-active-filters-bar" id="audit-active-filters">
              <span>Đang lọc theo:</span>
              {selectedPerformer !== 'ALL' && (
                <span className="audit-filter-chip">Người thực hiện: {selectedPerformer}</span>
              )}
              {selectedEntityType !== 'ALL' && (
                <span className="audit-filter-chip">Loại: {ENTITY_TYPE_LABELS[selectedEntityType]}</span>
              )}
              {fromDate && <span className="audit-filter-chip">Từ: {fromDate}</span>}
              {toDate && <span className="audit-filter-chip">Đến: {toDate}</span>}
              {searchKeyword.trim() && (
                <span className="audit-filter-chip">Từ khóa: &quot;{searchKeyword.trim()}&quot;</span>
              )}
            </div>
          )}
        </section>

        {/* ── Bảng hiển thị Nhật ký thay đổi ── */}
        <section className="audit-table-card">
          {isLoading ? (
            /* 1. Trạng thái Đang tải */
            <div className="audit-state-container" id="audit-loading-state">
              <div className="audit-spinner" aria-hidden="true" />
              <h3 className="audit-state-title">Đang tải nhật ký thay đổi...</h3>
              <p className="audit-state-desc">Hệ thống đang truy xuất lịch sử thay đổi dữ liệu nhạy cảm.</p>
            </div>
          ) : fetchError ? (
            /* 2. Trạng thái Lỗi tải */
            <div className="audit-state-container" id="audit-error-state">
              <div className="audit-error-icon" aria-hidden="true">
                <IconAlertCircle />
              </div>
              <h3 className="audit-state-title">Không thể tải nhật ký thay đổi</h3>
              <p className="audit-state-desc">{fetchError}</p>
              <button
                type="button"
                className="audit-btn-refresh"
                onClick={fetchLogs}
                id="audit-retry-btn"
              >
                <IconRefreshCw />
                <span>Thử lại</span>
              </button>
            </div>
          ) : logs.length === 0 ? (
            /* 3. Trạng thái Không có dữ liệu */
            <div className="audit-state-container" id="audit-empty-state">
              <div className="audit-empty-icon" aria-hidden="true">
                <IconInbox />
              </div>
              <h3 className="audit-state-title">Không có dữ liệu nhật ký phù hợp</h3>
              <p className="audit-state-desc">
                {hasActiveFilters
                  ? 'Không tìm thấy bản ghi nào khớp với điều kiện lọc hiện tại. Hãy thử điều chỉnh hoặc xóa bộ lọc.'
                  : 'Chưa có bản ghi thay đổi dữ liệu nhạy cảm nào được ghi nhận trong hệ thống.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="audit-btn-reset"
                  onClick={handleResetFilters}
                  id="audit-empty-reset-btn"
                >
                  <IconRotateCcw />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          ) : (
            /* 4. Bảng danh sách nhật ký */
            <>
              <div className="audit-table-responsive">
                <table className="audit-table" id="audit-log-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th style={{ width: '150px' }}>Thời điểm</th>
                      <th style={{ width: '180px' }}>Người thực hiện</th>
                      <th style={{ width: '150px' }}>Loại đối tượng</th>
                      <th style={{ width: '190px' }}>Đối tượng (ID / Tên)</th>
                      <th style={{ width: '110px' }}>Hành động</th>
                      <th style={{ width: '260px' }}>Giá trị trước ➔ Giá trị sau</th>
                      <th>Lý do / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => {
                      const rowNumber = (currentPage - 1) * pageSize + idx + 1
                      return (
                        <tr key={log.id} id={`audit-log-row-${log.id}`}>
                          {/* 1. Số thứ tự */}
                          <td style={{ color: '#94a3b8', fontWeight: 600 }}>{rowNumber}</td>

                          {/* 2. Thời điểm thay đổi */}
                          <td className="cell-timestamp">{formatAuditDate(log.timestamp)}</td>

                          {/* 3. Người thực hiện */}
                          <td>
                            <div className="cell-performer">
                              <div className="performer-avatar-mini">
                                {getInitials(log.performer_name)}
                              </div>
                              <span className="performer-name">{log.performer_name}</span>
                            </div>
                          </td>

                          {/* 4. Loại đối tượng */}
                          <td>
                            <span className={`badge-entity badge-entity-${log.entity_type.toLowerCase()}`}>
                              {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                            </span>
                          </td>

                          {/* 5. Đối tượng (ID & Tên) */}
                          <td>
                            <div className="cell-target-entity">
                              <span className="target-id">{log.entity_id}</span>
                              {log.entity_name && (
                                <span className="target-name" title={log.entity_name}>
                                  {log.entity_name}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Hành động */}
                          <td>
                            <span className={`badge-action badge-action-${log.action.toLowerCase()}`}>
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                          </td>

                          {/* 7. So sánh: Giá trị trước -> Giá trị sau */}
                          <td>
                            <div className="value-comparison-wrapper">
                              <span className="value-pill value-pill-old" title="Giá trị trước khi sửa">
                                {log.old_value}
                              </span>
                              <span className="value-arrow" aria-hidden="true">
                                <IconArrowRight />
                              </span>
                              <span className="value-pill value-pill-new" title="Giá trị sau khi sửa">
                                {log.new_value}
                              </span>
                            </div>
                          </td>

                          {/* 8. Lý do / Ghi chú */}
                          <td className="cell-reason" title={log.reason || ''}>
                            {log.reason || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Phân trang (Pagination) ── */}
              <div className="audit-pagination-bar" id="audit-pagination">
                <div className="audit-pagination-info">
                  Hiển thị{' '}
                  <strong>{(currentPage - 1) * pageSize + 1}</strong> –{' '}
                  <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> trong tổng số{' '}
                  <strong>{totalRecords}</strong> bản ghi
                </div>

                <div className="audit-pagination-controls">
                  <select
                    className="audit-page-size-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    aria-label="Số bản ghi trên mỗi trang"
                    id="audit-page-size-select"
                  >
                    <option value={5}>5 bản ghi / trang</option>
                    <option value={10}>10 bản ghi / trang</option>
                    <option value={20}>20 bản ghi / trang</option>
                  </select>

                  <button
                    type="button"
                    className="audit-page-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isLoading}
                    id="audit-prev-page-btn"
                    title="Trang trước"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`audit-page-btn ${p === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                      disabled={isLoading}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="audit-page-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isLoading}
                    id="audit-next-page-btn"
                    title="Trang sau"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default AuditLogPage
