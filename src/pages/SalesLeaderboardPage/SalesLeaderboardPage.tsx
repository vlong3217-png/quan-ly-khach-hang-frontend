import { useState, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { ROLES } from '../../constants/permissions.ts'
import { salesLeaderboardService } from '../../services/salesLeaderboardService.ts'
import { organizationService } from '../../services/organizationService.ts'
import StandardPagination from '../../components/StandardPagination/StandardPagination.tsx'
import './SalesLeaderboardPage.css'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Card from '../../components/ui/Card.tsx'

export default function SalesLeaderboardPage() {
  const { user } = useAuth()
  const userRole = (user?.role || ROLES.USER).toUpperCase()
  const isAdmin = userRole === ROLES.ADMIN
  const isUser = userRole === ROLES.USER

  const availableTeams = useMemo(() => organizationService.getAllTeams(), [])
  // Default team for sales rep
  const defaultUserTeamId = useMemo(() => {
    const userTeam = (user?.team_name || (user as any)?.team || '').trim().toLowerCase()
    const found = availableTeams.find((t) => t.name.toLowerCase() === userTeam)
    return found ? found.id : 1
  }, [user, availableTeams])

  const [selectedTeamId, setSelectedTeamId] = useState<number | 'ALL'>(isUser ? defaultUserTeamId : 'ALL')
  const [config, setConfig] = useState(() => salesLeaderboardService.getConfig())
  const [notice, setNotice] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { is_enabled, entries, is_restricted_to_team } = useMemo(() => {
    return salesLeaderboardService.getLeaderboard(
      userRole,
      defaultUserTeamId,
      isUser ? defaultUserTeamId : selectedTeamId
    )
  }, [userRole, selectedTeamId, config.is_enabled, isUser])

  const paginatedEntries = useMemo(() => {
    return entries.slice((page - 1) * pageSize, page * pageSize)
  }, [entries, page, pageSize])

  const handleToggleConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return
    const newEnabled = e.target.checked
    const updated = salesLeaderboardService.updateConfig(newEnabled, user?.full_name || 'Administrator')
    setConfig(updated)
    setNotice(newEnabled ? 'Đã bật tính năng Bảng xếp hạng doanh số.' : 'Đã tắt tính năng Bảng xếp hạng doanh số toàn hệ thống.')
    setTimeout(() => setNotice(null), 3500)
  }

  // Top 3 for podium
  const top1 = entries[0]
  const top2 = entries[1]
  const top3 = entries[2]

  return (
    <div className="leaderboard-page" id="sales-leaderboard-page">
      {/* ── 1. HEADER & CONFIG TOGGLE ── */}
      <PageHeader
        title="Bảng Xếp Hạng Doanh Số Đội Nhóm"
        className="leaderboard-header"
        actions={
          isAdmin ? (
            <div className="admin-config-box" title="Cấu hình hệ thống dành riêng cho Administrator">
              <label className="switch-label">
                <input
                  type="checkbox"
                  className="switch-input"
                  id="toggle-leaderboard-feature"
                  checked={config.is_enabled}
                  onChange={handleToggleConfig}
                />
                <span>{config.is_enabled ? 'Tính năng đang BẬT' : 'Tính năng đang TẮT'}</span>
              </label>
            </div>
          ) : null
        }
      />

      {notice && (
        <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          {notice}
        </div>
      )}

      {/* ── 2. FEATURE DISABLED VIEW (IF TOGGLED OFF) ── */}
      {!is_enabled && !isAdmin && (
        <div className="feature-disabled-card">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h3>Bảng xếp hạng đang tạm ẩn</h3>
          <p>
            Chức năng Bảng xếp hạng doanh số hiện đang được tạm dừng theo cấu hình của Quản trị viên hệ thống. Vui lòng liên hệ Admin để biết thêm chi tiết.
          </p>
        </div>
      )}

      {(!is_enabled && isAdmin) && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem' }}>
          <strong>Lưu ý cho Quản trị viên:</strong> Bạn đang tắt tính năng này. Nhân viên và Trưởng nhóm hiện không thể nhìn thấy bảng xếp hạng. Bạn có thể bật lại bất cứ lúc nào bằng nút gạt phía trên.
        </div>
      )}

      {/* ── 3. PRIVACY BANNER FOR USER ROLE ── */}
      {is_enabled && is_restricted_to_team && (
        <div className="privacy-badge-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            <strong>Bảo mật riêng tư:</strong> Bạn đang đăng nhập với vai trò Nhân viên ({user?.full_name || 'Sales Rep'}). Hệ thống chỉ hiển thị xếp hạng trong nội bộ nhóm của bạn (Đội Kinh Doanh 1).
          </span>
        </div>
      )}

      {/* ── 4. FILTER BAR (ADMIN & MANAGER ONLY) ── */}
      {is_enabled && !is_restricted_to_team && (
        <div style={{ display: 'flex', gap: '1rem', background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Lọc theo Đội nhóm:</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
          >
            <option value="ALL">Toàn công ty (Tất cả đội nhóm)</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 5. PODIUM TOP 3 ── */}
      {is_enabled && entries.length >= 3 && (
        <div className="podium-container">
          {/* Top 2 */}
          {top2 && (
            <div className="podium-step">
              <div className="podium-avatar-wrap">
                <div className="podium-avatar avatar-silver">
                  {top2.user_name.split(' ').slice(-1)[0][0]}
                </div>
                <div className="podium-rank-medal medal-silver">2</div>
              </div>
              <span className="podium-name">{top2.user_name}</span>
              <span className="podium-team">{top2.team_name}</span>
              <div className="podium-box box-second">
                <span className="podium-revenue">{(top2.closed_revenue / 1000000).toLocaleString('vi-VN')} tr</span>
                <span className="podium-rate">Đạt {top2.achievement_rate}%</span>
              </div>
            </div>
          )}

          {/* Top 1 */}
          {top1 && (
            <div className="podium-step">
              <div className="podium-avatar-wrap">
                <div className="podium-avatar avatar-gold">
                  TOP 1
                </div>
                <div className="podium-rank-medal medal-gold">1</div>
              </div>
              <span className="podium-name">{top1.user_name}</span>
              <span className="podium-team">{top1.team_name}</span>
              <div className="podium-box box-first">
                <span className="podium-revenue">{(top1.closed_revenue / 1000000).toLocaleString('vi-VN')} tr</span>
                <span className="podium-rate">Đạt {top1.achievement_rate}%</span>
              </div>
            </div>
          )}

          {/* Top 3 */}
          {top3 && (
            <div className="podium-step">
              <div className="podium-avatar-wrap">
                <div className="podium-avatar avatar-bronze">
                  {top3.user_name.split(' ').slice(-1)[0][0]}
                </div>
                <div className="podium-rank-medal medal-bronze">3</div>
              </div>
              <span className="podium-name">{top3.user_name}</span>
              <span className="podium-team">{top3.team_name}</span>
              <div className="podium-box box-third">
                <span className="podium-revenue">{(top3.closed_revenue / 1000000).toLocaleString('vi-VN')} tr</span>
                <span className="podium-rate">Đạt {top3.achievement_rate}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. DETAILED RANKING TABLE ── */}
      {is_enabled && (
        <Card className="leaderboard-table-card">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Hạng</th>
                <th>Thành viên</th>
                <th>Đội nhóm</th>
                <th>Số deal chốt</th>
                <th>Doanh số đã chốt</th>
                <th>Chỉ tiêu cá nhân</th>
                <th style={{ width: '220px' }}>Tiến độ chỉ tiêu</th>
                <th>Danh hiệu</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                    Chưa có dữ liệu xếp hạng doanh số cho kỳ này
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => {
                  const isCompleted = entry.achievement_rate >= 100
                  const progressWidth = Math.min(entry.achievement_rate, 100)

                  return (
                    <tr key={entry.user_id}>
                      <td style={{ textAlign: 'center' }}>
                        {entry.rank === 1 && <strong style={{ color: '#d97706' }}>#1</strong>}
                        {entry.rank === 2 && <strong style={{ color: '#64748b' }}>#2</strong>}
                        {entry.rank === 3 && <strong style={{ color: '#b45309' }}>#3</strong>}
                        {entry.rank > 3 && <strong style={{ color: '#64748b' }}>#{entry.rank}</strong>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                            {entry.user_name.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{entry.user_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{entry.role}</div>
                          </div>
                        </div>
                      </td>
                      <td>{entry.team_name}</td>
                      <td><strong>{entry.won_deals_count} hợp đồng</strong></td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.9375rem' }}>
                          {entry.closed_revenue.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>
                      <td>{entry.personal_quota.toLocaleString('vi-VN')} ₫</td>
                      <td>
                        <div className="progress-container">
                          <div className="progress-header">
                            <span>{entry.achievement_rate}%</span>
                            <span>{isCompleted ? 'Hoàn thành' : 'Đang thực hiện'}</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className={`progress-bar-fill ${isCompleted ? 'completed' : 'normal'}`}
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {isCompleted ? (
                          <span className="badge-achievement over">
                            Vượt chỉ tiêu
                          </span>
                        ) : (
                          <span className="badge-achievement sub">
                            Tiếp tục nỗ lực
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <StandardPagination
            page={page}
            pageSize={pageSize}
            total={entries.length}
            label="thành viên"
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </Card>
      )}
    </div>
  )
}
