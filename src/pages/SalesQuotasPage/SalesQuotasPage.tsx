import Button from '../../components/ui/Button.tsx'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import type {
  TeamQuota,
  QuotaAuditLog,
  QuotaPeriodType,
  MemberQuota,
} from '../../types/salesQuota.ts'
import { salesQuotaService } from '../../services/salesQuotaService.ts'
import { getAvailableTeams, getUsers } from '../../services/userService.ts'
import type { UserAccount } from '../../types/user.ts'
import './SalesQuotasPage.css'

export default function SalesQuotasPage() {
  const { user } = useAuth()
  const [quotas, setQuotas] = useState<TeamQuota[]>([])
  const [auditLogs, setAuditLogs] = useState<QuotaAuditLog[]>([])
  const [selectedPeriodCode, setSelectedPeriodCode] = useState<string>('2026-10')
  const [periodType, setPeriodType] = useState<QuotaPeriodType>('MONTH')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)

  // Edit Modal Form State
  const [editingQuotaId, setEditingQuotaId] = useState<string | null>(null)
  const [formTeamId, setFormTeamId] = useState<number>(1)
  const [formTeamName, setFormTeamName] = useState<string>('')
  const [formPeriodType, setFormPeriodType] = useState<QuotaPeriodType>('MONTH')
  const [formPeriodCode, setFormPeriodCode] = useState<string>('2026-10')
  const [formPeriodLabel, setFormPeriodLabel] = useState<string>('Tháng 10/2026')
  const [formTargetAmount, setFormTargetAmount] = useState<number>(0)
  const [formMembers, setFormMembers] = useState<MemberQuota[]>([])
  const [formIsLocked, setFormIsLocked] = useState<boolean>(false)
  const [auditReason, setAuditReason] = useState<string>('')

  const [allUsers, setAllUsers] = useState<UserAccount[]>([])
  const [availableTeams, setAvailableTeams] = useState<string[]>([])

  const isSalesRep = user?.role === 'USER'
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'DIRECTOR'

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = async () => {
    const list = salesQuotaService.getQuotasForUser({
      id: user?.id,
      role: user?.role,
      full_name: user?.full_name,
    })
    setQuotas(list)
    setAuditLogs(salesQuotaService.getAuditLogs())

    // Nạp danh sách team động và danh sách tài khoản
    const teams = getAvailableTeams()
    setAvailableTeams(teams)
    try {
      const res = await getUsers()
      if (res?.users) {
        setAllUsers(res.users)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      loadData()
    }
    window.addEventListener('crm-quotas-updated', handleUpdate)
    return () => {
      window.removeEventListener('crm-quotas-updated', handleUpdate)
    }
  }, [user?.id, user?.role, user?.full_name])

  // Lấy danh sách thành viên thuộc team được chọn (hoặc tất cả nếu không phân nhóm)
  const getMembersForTeam = (teamName: string, existingMembers: MemberQuota[] = []): MemberQuota[] => {
    const existingMap = new Map(existingMembers.map((m) => [m.user_id, m]))
    const matchedUsers = allUsers.filter(
      (u) => !teamName || (u.team && u.team.trim().toLowerCase() === teamName.trim().toLowerCase())
    )

    // Nếu có nhân viên trong team này
    if (matchedUsers.length > 0) {
      return matchedUsers.map((u) => {
        const ex = existingMap.get(u.id)
        return {
          user_id: u.id,
          user_name: u.full_name,
          role: u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'MANAGER' ? 'Trưởng nhóm' : 'Nhân viên kinh doanh',
          target_amount: ex ? ex.target_amount : 0,
          achieved_amount: ex ? ex.achieved_amount : 0,
        }
      })
    }

    // Nếu không khớp nhân viên nào, giữ lại danh sách cũ hoặc trả về rỗng
    return existingMembers
  }

  // Khi người dùng đổi đội nhóm trong modal
  const handleTeamChange = (teamName: string) => {
    setFormTeamName(teamName)
    // Tự sinh ID số tương ứng cho team
    const tIndex = availableTeams.indexOf(teamName)
    const tId = tIndex >= 0 ? tIndex + 1 : Date.now() % 10000
    setFormTeamId(tId)

    // Tự động tải danh sách thành viên thực tế của team đó
    const members = getMembersForTeam(teamName, formMembers)
    setFormMembers(members)
    // Tự động cộng tổng chỉ tiêu của các thành viên
    const sum = members.reduce((acc, m) => acc + (Number(m.target_amount) || 0), 0)
    setFormTargetAmount(sum)
  }

  // Open Edit Modal for a Team Quota
  const handleOpenEdit = (q: TeamQuota) => {
    setEditingQuotaId(q.id)
    setFormTeamId(q.team_id)
    setFormTeamName(q.team_name)
    setFormPeriodType(q.period_type)
    setFormPeriodCode(q.period_code)
    setFormPeriodLabel(q.period_label)
    setFormTargetAmount(q.target_amount)
    
    // Nếu quota đã có members thì dùng, đồng thời bổ sung thêm các thành viên mới tạo trong team nếu có
    const currentTeamMembers = getMembersForTeam(q.team_name, q.members)
    setFormMembers(currentTeamMembers.length > 0 ? currentTeamMembers : JSON.parse(JSON.stringify(q.members)))
    setFormIsLocked(q.is_locked)
    setAuditReason('')
    setIsEditModalOpen(true)
  }

  // Open Create New Quota
  const handleOpenCreate = () => {
    const defaultTeam = availableTeams[0] || 'Đội Sales Doanh nghiệp'
    const defaultMembers = getMembersForTeam(defaultTeam)

    setEditingQuotaId(null)
    setFormTeamId(1)
    setFormTeamName(defaultTeam)
    setFormPeriodType(periodType)
    setFormPeriodCode(selectedPeriodCode)
    setFormPeriodLabel(
      selectedPeriodCode === '2026-10'
        ? 'Tháng 10/2026'
        : selectedPeriodCode === '2026-Q4'
        ? 'Quý 4/2026'
        : selectedPeriodCode
    )
    setFormMembers(defaultMembers)
    setFormTargetAmount(defaultMembers.reduce((acc, m) => acc + (Number(m.target_amount) || 0), 0))
    setFormIsLocked(false)
    setAuditReason('')
    setIsEditModalOpen(true)
  }

  // Handle member target change inside modal
  const handleMemberTargetChange = (userId: number, val: number) => {
    setFormMembers((prev) => {
      const updated = prev.map((m) => (m.user_id === userId ? { ...m, target_amount: val } : m))
      return updated
    })
  }

  // Auto-balance team target to sum of members
  const handleAutoBalance = () => {
    const sum = formMembers.reduce((acc, m) => acc + (Number(m.target_amount) || 0), 0)
    setFormTargetAmount(sum)
  }

  // Save Quota
  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const validation = salesQuotaService.validateTeamSum(formTargetAmount, formMembers)
    if (!validation.isValid) {
      const confirmSave = window.confirm(
        `${validation.warningMessage}\n\nBạn có muốn tiếp tục lưu dù có sự chênh lệch này không?`
      )
      if (!confirmSave) return
    }

    try {
      salesQuotaService.saveQuota(
        {
          id: editingQuotaId || undefined,
          team_id: formTeamId,
          team_name: formTeamName,
          period_type: formPeriodType,
          period_code: formPeriodCode,
          period_label: formPeriodLabel,
          target_amount: formTargetAmount,
          members: formMembers,
          is_locked: formIsLocked,
        },
        {
          id: user?.id || 1,
          name: user?.full_name || 'Quản trị viên',
        },
        auditReason
      )

      loadData()
      setIsEditModalOpen(false)
      showToast('Đã lưu chỉ tiêu doanh số thành công!')
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  // Filter quotas by selected period
  const filteredQuotas = quotas.filter((q) => q.period_code === selectedPeriodCode)

  // Personal user stats (for USER role)
  const myQuotaItem = quotas
    .filter((q) => q.period_code === selectedPeriodCode)
    .flatMap((q) => q.members)
    .find(
      (m) =>
        (user?.id && m.user_id === user.id) ||
        (user?.full_name && m.user_name.toLowerCase().includes(user.full_name.toLowerCase()))
    ) || quotas[0]?.members[0]

  const myTarget = myQuotaItem?.target_amount || 0
  const myAchieved = myQuotaItem?.achieved_amount || 0
  const myPct = myTarget > 0 ? Math.min(Math.round((myAchieved / myTarget) * 100), 100) : 0
  const myRemaining = Math.max(0, myTarget - myAchieved)

  // Sum validation for modal
  const modalSumValidation = salesQuotaService.validateTeamSum(formTargetAmount, formMembers)

  return (
    <div className="sales-quotas-page" id="sales-quotas-page">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="action-notice-toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="quotas-header">
        <div>
          <h1><span>Chỉ tiêu doanh số & Kế hoạch bán hàng</span></h1>
        </div>
        {isManagerOrAdmin && (
          <div className="quotas-header-actions">
            <Button type="button" variant="primary" id="btn-create-quota" onClick={handleOpenCreate}>Đặt chỉ tiêu mới</Button>
            <Button type="button" variant="secondary" id="btn-view-quota-audit" onClick={() => setIsAuditModalOpen(true)}>Nhật ký điều chỉnh ({auditLogs.length})</Button>
          </div>
        )}
      </div>

      {/* Filter Bar: Period Selection */}
      <div className="quotas-filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>KỲ ĐÁNH GIÁ:</span>
          <div className="period-pill-group">
            <button
              type="button"
              className={`period-pill-btn ${selectedPeriodCode === '2026-10' ? 'active' : ''}`}
              onClick={() => {
                setSelectedPeriodCode('2026-10')
                setPeriodType('MONTH')
              }}
            >
              <span>Tháng 10/2026</span>
              <span className="period-lock-tag">Hiện tại (Mở)</span>
            </button>
            <button
              type="button"
              className={`period-pill-btn ${selectedPeriodCode === '2026-Q4' ? 'active' : ''}`}
              onClick={() => {
                setSelectedPeriodCode('2026-Q4')
                setPeriodType('QUARTER')
              }}
            >
              <span>Quý 4/2026</span>
              <span className="period-lock-tag">Hiện tại (Mở)</span>
            </button>
            <button
              type="button"
              className={`period-pill-btn ${selectedPeriodCode === '2026-09' ? 'active' : ''}`}
              onClick={() => {
                setSelectedPeriodCode('2026-09')
                setPeriodType('MONTH')
              }}
            >
              <span>Tháng 09/2026</span>
              <span className="period-lock-tag">Đã khoá</span>
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
          Đang xem với vai trò:{' '}
          <strong style={{ color: '#1e293b' }}>
            {user?.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : user?.role === 'MANAGER' ? 'Trưởng nhóm (MANAGER)' : 'Nhân viên kinh doanh (USER)'}
          </strong>
        </div>
      </div>

      {/* VIEW DÀNH CHO NHÂN VIÊN KINH DOANH (USER ROLE): CHỈ XEM CHỈ TIÊU CỦA CHÍNH MÌNH */}
      {isSalesRep && (
        <div className="personal-quota-hero" id="personal-quota-hero">
          <div className="hero-top">
            <div>
              <h2 className="hero-title">Chỉ tiêu cá nhân của bạn - {selectedPeriodCode === '2026-10' ? 'Tháng 10/2026' : selectedPeriodCode === '2026-Q4' ? 'Quý 4/2026' : 'Tháng 09/2026'}</h2>
              <p className="hero-subtitle">
                Đại diện: <strong>{user?.full_name || 'Bạn'}</strong> • Chỉ tiêu được bảo mật độc quyền theo quy định hệ thống.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{myPct}%</span>
              <div style={{ fontSize: '0.8rem', color: '#bfdbfe' }}>Tỷ lệ hoàn thành cam kết</div>
            </div>
          </div>

          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <span className="hero-stat-label">Chỉ tiêu cam kết</span>
              <span className="hero-stat-value">{myTarget.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-label">Doanh số thực tế đã chốt</span>
              <span className="hero-stat-value" style={{ color: '#86efac' }}>
                {myAchieved.toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-label">Còn thiếu để đạt mốc</span>
              <span className="hero-stat-value" style={{ color: '#fed7aa' }}>
                {myRemaining.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          <div className="hero-progress-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span>Tiến độ thực hiện</span>
              <span>
                {myAchieved.toLocaleString('vi-VN')} / {myTarget.toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="hero-progress-bar-bg">
              <div className="hero-progress-bar-fill" style={{ width: `${myPct}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DÀNH CHO QUẢN LÝ / GIÁM ĐỐC (ADMIN / MANAGER ROLE): XEM VÀ KHAI BÁO CẢ ĐỘI NHÓM */}
      {isManagerOrAdmin && (
        <div className="team-quotas-list" id="team-quotas-container">
          {filteredQuotas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#64748b' }}>
              Chưa có dữ liệu chỉ tiêu cho kỳ {selectedPeriodCode}. Nhấp "+ Đặt chỉ tiêu mới" để khởi tạo.
            </div>
          ) : (
            filteredQuotas.map((t) => {
              const validation = salesQuotaService.validateTeamSum(t.target_amount, t.members)
              const teamPct = t.target_amount > 0 ? Math.min(Math.round((t.achieved_amount / t.target_amount) * 100), 100) : 0

              return (
                <div key={t.id} className="team-quota-card" id={`team-quota-card-${t.id}`}>
                  {/* Card Header */}
                  <div className="team-card-header">
                    <div className="team-card-title-group">
                      <h3 className="team-card-title">{t.team_name}</h3>
                      <span className={`lock-badge ${t.is_locked ? 'locked' : 'unlocked'}`}>
                        {t.is_locked ? 'Đã khoá (Kỳ đã kết thúc)' : 'Đang mở'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => handleOpenEdit(t)}
                      >
                        {t.is_locked ? 'Sửa (Yêu cầu lý do)' : 'Điều chỉnh chỉ tiêu'}
                      </button>
                    </div>
                  </div>

                  {/* Top Summary Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CHỈ TIÊU TỔNG CỦA NHÓM</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
                        {t.target_amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>THỰC TẾ ĐÃ CHỐT</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                        {t.achieved_amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TIẾN ĐỘ HOÀN THÀNH</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                        {teamPct}%
                      </div>
                    </div>
                  </div>

                  {/* S8-03 AC: Cảnh báo nếu chỉ tiêu nhóm lệch tổng thành viên */}
                  {!validation.isValid ? (
                    <div className="sum-warning-box">
                      <span>{validation.warningMessage}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="sum-ok-box">
                        Chỉ tiêu nhóm hoàn toàn cân bằng với tổng chỉ tiêu các thành viên ({validation.sumMembers.toLocaleString('vi-VN')} ₫)
                      </span>
                    </div>
                  )}

                  {/* Members Quota Table */}
                  <table className="quota-table">
                    <thead>
                      <tr>
                        <th>Thành viên phụ trách</th>
                        <th style={{ width: 140 }}>Vai trò</th>
                        <th style={{ width: 200, textAlign: 'right' }}>Chỉ tiêu cá nhân (₫)</th>
                        <th style={{ width: 180, textAlign: 'right' }}>Đã đạt (₫)</th>
                        <th style={{ width: 180, textAlign: 'right' }}>Tiến độ (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.members.map((m) => {
                        const mPct = m.target_amount > 0 ? Math.min(Math.round((m.achieved_amount / m.target_amount) * 100), 100) : 0
                        return (
                          <tr key={m.user_id}>
                            <td>
                              <strong style={{ color: '#1e293b' }}>{m.user_name}</strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                                {m.role}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              {m.target_amount.toLocaleString('vi-VN')} ₫
                            </td>
                            <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                              {m.achieved_amount.toLocaleString('vi-VN')} ₫
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontWeight: 700, color: mPct >= 80 ? '#15803d' : '#2563eb' }}>
                                  {mPct}%
                                </span>
                                <div className="progress-mini-bar">
                                  <div
                                    className="progress-mini-fill"
                                    style={{
                                      width: `${mPct}%`,
                                      background: mPct >= 80 ? '#10b981' : '#3b82f6',
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MODAL 1: KHAI BÁO / ĐIỀU CHỈNH CHỈ TIÊU */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>{editingQuotaId ? 'Điều chỉnh chỉ tiêu doanh số' : 'Khai báo chỉ tiêu doanh số mới'}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuota}>
              <div className="modal-body-custom">
                {/* Locked Period Warning */}
                {formIsLocked && (
                  <div className="locked-audit-alert">
                    <strong>KỲ ĐÃ KHOÁ THEO QUY ĐỊNH HỆ THỐNG:</strong>
                    <div>
                      Kỳ {formPeriodLabel} đã kết thúc. Theo tiêu chí chấp nhận (S8-03 AC), mọi điều chỉnh đối với chỉ tiêu đã khoá
                      bắt buộc phải có lý do giải trình rõ ràng và sẽ được ghi vào nhật ký kiểm toán không thể xóa.
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14 }}>
                  <div className="form-group-custom">
                    <label>Đội nhóm áp dụng:</label>
                    <select
                      className="form-select-custom"
                      value={formTeamName}
                      onChange={(e) => handleTeamChange(e.target.value)}
                    >
                      {availableTeams.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Loại kỳ:</label>
                    <select
                      className="form-select-custom"
                      value={formPeriodType}
                      onChange={(e) => setFormPeriodType(e.target.value as QuotaPeriodType)}
                    >
                      <option value="MONTH">Theo Tháng</option>
                      <option value="QUARTER">Theo Quý</option>
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Kỳ đánh giá:</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={formPeriodLabel}
                      onChange={(e) => setFormPeriodLabel(e.target.value)}
                      placeholder="Tháng 10/2026..."
                      required
                    />
                  </div>
                </div>

                {/* Team Target Input */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group-custom">
                    <label>Chỉ tiêu của toàn nhóm (VNĐ) (*):</label>
                    <input
                      type="number"
                      step="1000000"
                      min="0"
                      className="form-input-custom"
                      value={formTargetAmount}
                      onChange={(e) => setFormTargetAmount(Number(e.target.value))}
                      required
                      style={{ fontSize: '1.1rem', fontWeight: 700 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAutoBalance}
                      style={{ marginTop: 22, height: 42, fontSize: '0.85rem' }}
                    >
                      Tự động tính nhóm = Tổng thành viên ({modalSumValidation.sumMembers.toLocaleString('vi-VN')} ₫)
                    </button>
                  </div>
                </div>

                {/* Live Sum Check Alert in Modal */}
                {!modalSumValidation.isValid ? (
                  <div className="sum-warning-box">
                    <span>{modalSumValidation.warningMessage}</span>
                  </div>
                ) : (
                  <div className="sum-ok-box">
                    Chỉ tiêu nhóm ({formTargetAmount.toLocaleString('vi-VN')} ₫) hoàn toàn bằng tổng thành viên.
                  </div>
                )}

                {/* Member Inputs */}
                <div className="section-box">
                  <div className="section-title">
                    <span>Phân bổ chỉ tiêu chi tiết cho từng thành viên:</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>
                      ({formMembers.length} nhân sự thuộc {formTeamName || 'nhóm'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {formMembers.length === 0 ? (
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                        Đội nhóm này hiện chưa có nhân viên nào được gán ở tab <strong>Quản lý tài khoản</strong>.<br />
                        Bạn có thể nhập trực tiếp <em>Chỉ tiêu của toàn nhóm</em> ở mục trên.
                      </div>
                    ) : (
                      formMembers.map((m) => (
                        <div key={m.user_id} className="member-target-row">
                          <div>
                            <strong>{m.user_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Vai trò: {m.role}</div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Chỉ tiêu cá nhân:</div>
                          <div>
                            <input
                              type="number"
                              step="1000000"
                              min="0"
                              className="form-input-custom"
                              value={m.target_amount}
                              onChange={(e) => handleMemberTargetChange(m.user_id, Number(e.target.value))}
                              required
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit Reason if locked */}
                {formIsLocked && (
                  <div className="form-group-custom">
                    <label style={{ color: '#b91c1c', fontWeight: 700 }}>
                      Lý do giải trình điều chỉnh chỉ tiêu đã khoá (*) (S8-03 AC):
                    </label>
                    <textarea
                      rows={3}
                      className="form-textarea-custom"
                      placeholder="Nhập lý do điều chỉnh chỉ tiêu của kỳ đã kết thúc (Bắt buộc)..."
                      value={auditReason}
                      onChange={(e) => setAuditReason(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-save-quota-submit"
                >
                  {editingQuotaId ? 'Cập nhật chỉ tiêu' : 'Khai báo chỉ tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NHẬT KÝ KIỂM TOÁN ĐIỀU CHỈNH CHỈ TIÊU ĐÃ QUA KỲ */}
      {isAuditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuditModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Nhật ký kiểm toán điều chỉnh chỉ tiêu (Audit Log - S8-03)</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsAuditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body-custom">
              <table className="quota-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Thời gian</th>
                    <th style={{ width: 150 }}>Người sửa</th>
                    <th style={{ width: 160 }}>Đội nhóm & Kỳ</th>
                    <th>Lý do giải trình bắt buộc</th>
                    <th style={{ width: 180, textAlign: 'right' }}>Mức điều chỉnh</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                        Chưa có lượt điều chỉnh chỉ tiêu kỳ đã khoá nào.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(log.modified_at).toLocaleString('vi-VN')}
                        </td>
                        <td>
                          <strong>{log.modified_by_name}</strong>
                        </td>
                        <td>
                          <div>{log.team_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kỳ: {log.period_code}</div>
                        </td>
                        <td>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{log.reason}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                            {log.details}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'line-through' }}>
                            {log.old_target.toLocaleString('vi-VN')} ₫
                          </div>
                          <div style={{ fontWeight: 700, color: '#2563eb' }}>
                            ➔ {log.new_target.toLocaleString('vi-VN')} ₫
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAuditModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
