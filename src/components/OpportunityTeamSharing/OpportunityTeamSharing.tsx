import { useState, useEffect } from 'react'
import type { Opportunity, OpportunitySharedMember } from '../../types/opportunity.ts'
import type { UserAccount } from '../../types/user.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import { userService } from '../../services/userService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityTeamSharing.css'

interface OpportunityTeamSharingProps {
  opportunity: Opportunity
  onOpportunityUpdated: (updated: Opportunity) => void
  onOpenReassignModal: () => void
}

export default function OpportunityTeamSharing({
  opportunity,
  onOpportunityUpdated,
  onOpenReassignModal,
}: OpportunityTeamSharingProps) {
  const { user } = useAuth()
  const [usersList, setUsersList] = useState<UserAccount[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('Đồng phụ trách')
  const [submitting, setSubmitting] = useState(false)

  // Kiểm tra quyền hạn của user hiện tại
  const isOwner = user?.id && opportunity.owner_id === Number(user.id)
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isSharedMember = opportunity.shared_members?.some(
    (m) => user?.id && m.user_id === Number(user.id)
  )
  const canManageTeam = isOwner || isManagerOrAdmin
  const canReassignOwner = isOwner || isManagerOrAdmin

  useEffect(() => {
    setLoadingUsers(true)
    userService
      .getUsers()
      .then((res) => {
        if (res && res.users) {
          setUsersList(res.users)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [])

  // Lọc ra những nhân sự chưa có trong deal
  const existingUserIds = new Set([
    opportunity.owner_id,
    ...(opportunity.shared_members || []).map((m) => m.user_id),
  ])
  const availableUsers = usersList.filter((u) => !existingUserIds.has(u.id))

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    const targetUser = usersList.find((u) => u.id === Number(selectedUserId))
    if (!targetUser) return

    setSubmitting(true)
    try {
      const newMember: OpportunitySharedMember = {
        id: `sm-${Date.now()}`,
        user_id: targetUser.id,
        user_name: targetUser.full_name,
        user_email: targetUser.email,
        role_in_deal: selectedRole,
        can_log_activity: true,
        can_reassign_owner: false,
        added_by_name: user?.full_name || 'Người dùng',
        added_at: new Date().toISOString(),
      }

      const updatedMembers = [...(opportunity.shared_members || []), newMember]
      const updatedOpp = await opportunityService.updateOpportunity(opportunity.id, {
        shared_members: updatedMembers,
      })

      // Ghi nhận hoạt động vào timeline
      try {
        const { opportunityActivityService } = await import('../../services/opportunityActivityService.ts')
        await opportunityActivityService.createActivity({
          opportunity_id: opportunity.id,
          type: 'SYSTEM',
          title: `Chia sẻ cơ hội cho ${targetUser.full_name}`,
          content: `${user?.full_name || 'Quản trị viên'} đã thêm ${targetUser.full_name} vào đội ngũ theo dõi thương vụ với vai trò "${selectedRole}".`,
          performed_by_id: user?.id ? Number(user.id) : undefined,
          performed_by_name: user?.full_name || 'Người dùng',
        })
      } catch {}

      onOpportunityUpdated(updatedOpp)
      setIsAddMemberOpen(false)
      setSelectedUserId('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (member: OpportunitySharedMember) => {
    if (!confirm(`Bạn có chắc muốn gỡ ${member.user_name} khỏi cơ hội này?`)) return

    const updatedMembers = (opportunity.shared_members || []).filter((m) => m.id !== member.id)
    const updatedOpp = await opportunityService.updateOpportunity(opportunity.id, {
      shared_members: updatedMembers,
    })

    try {
      const { opportunityActivityService } = await import('../../services/opportunityActivityService.ts')
      await opportunityActivityService.createActivity({
        opportunity_id: opportunity.id,
        type: 'SYSTEM',
        title: `Gỡ thành viên ${member.user_name}`,
        content: `${user?.full_name || 'Quản trị viên'} đã gỡ ${member.user_name} khỏi danh sách cùng tham gia cơ hội.`,
        performed_by_id: user?.id ? Number(user.id) : undefined,
        performed_by_name: user?.full_name || 'Người dùng',
      })
    } catch {}

    onOpportunityUpdated(updatedOpp)
  }

  return (
    <div className="opportunity-team-sharing-container" id="s6-03-team-sharing">
      {/* Thông báo quyền hạn nếu là thành viên được chia sẻ */}
      {isSharedMember && !isOwner && !isManagerOrAdmin && (
        <div className="team-role-notice">
          <span className="notice-icon">ℹ️</span>
          <div className="notice-body">
            <strong>Bạn đang tham gia cơ hội với tư cách: Thành viên phối hợp</strong>
            <p>
              Bạn có toàn quyền ghi nhận lịch sử tương tác, cuộc gọi, cuộc gặp và công việc. Bạn không có quyền thay đổi chủ sở hữu chính của cơ hội này.
            </p>
          </div>
        </div>
      )}

      {/* Thẻ Người chịu trách nhiệm chính (Deal Owner) */}
      <div className="team-section-card primary-owner-card">
        <div className="section-card-header">
          <div className="header-badge-title">
            <span className="badge-crown">⭐</span>
            <div>
              <h4 className="section-title">Chủ sở hữu cơ hội (Primary Owner)</h4>
              <span className="section-subtitle">Chịu trách nhiệm chính về tiến độ và kết quả chốt thương vụ</span>
            </div>
          </div>
          {canReassignOwner ? (
            <button
              type="button"
              className="btn btn-outline-primary btn-reassign-owner"
              onClick={onOpenReassignModal}
              title="Bàn giao cơ hội cho nhân viên khác"
            >
              🔄 Chuyển giao quyền sở hữu
            </button>
          ) : (
            <span className="badge-locked" title="Chỉ Chủ sở hữu chính hoặc Quản lý mới có quyền bàn giao">
              🔒 Không có quyền chuyển giao
            </span>
          )}
        </div>

        <div className="owner-profile-row">
          <div className="owner-avatar">
            {opportunity.owner_name ? opportunity.owner_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="owner-meta">
            <div className="owner-name-line">
              <span className="owner-name">{opportunity.owner_name}</span>
              <span className="badge-role">Người phụ trách chính</span>
            </div>
            <span className="owner-team">Đội ngũ: {opportunity.team_name || 'Đội Kinh Doanh 1'}</span>
          </div>
        </div>
      </div>

      {/* Thẻ Thành viên cùng tham gia (Co-owners & Collaborators) */}
      <div className="team-section-card collaborators-card">
        <div className="section-card-header">
          <div>
            <h4 className="section-title">
              👥 Thành viên cùng theo dõi & phối hợp (S6-03)
            </h4>
            <span className="section-subtitle">
              Cả đội cùng vào hỗ trợ thương vụ, ghi nhận hoạt động nhưng không làm mất người chịu trách nhiệm chính
            </span>
          </div>
          {canManageTeam && (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-add-member"
              onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
            >
              {isAddMemberOpen ? '✕ Đóng form' : '+ Thêm thành viên'}
            </button>
          )}
        </div>

        {/* Form thêm thành viên */}
        {isAddMemberOpen && (
          <form className="add-member-form" onSubmit={handleAddMember}>
            <div className="form-grid">
              <div className="form-group">
                <label>Chọn nhân viên *</label>
                <select
                  required
                  className="form-control"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={loadingUsers || submitting}
                >
                  <option value="">-- Chọn nhân viên tham gia --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.team || u.role}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vai trò trong thương vụ *</label>
                <select
                  className="form-control"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Đồng phụ trách">🤝 Đồng phụ trách (Co-owner)</option>
                  <option value="Chuyên gia kỹ thuật / Pre-sales">🛠️ Chuyên gia kỹ thuật / Pre-sales</option>
                  <option value="Hỗ trợ báo giá & Đấu thầu">📄 Hỗ trợ báo giá & Đấu thầu</option>
                  <option value="Thành viên theo dõi">👀 Thành viên theo dõi (Viewer)</option>
                </select>
              </div>
            </div>

            <div className="form-footer">
              <div className="permissions-hint">
                ✓ Được phép: Xem thương vụ, ghi nhận cuộc gọi, họp, email & công việc.
                <br />
                ✗ Bị chặn: Không được phép thay đổi người sở hữu chính.
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!selectedUserId || submitting}
                >
                  {submitting ? 'Đang thêm...' : 'Xác nhận thêm'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Danh sách thành viên */}
        {(!opportunity.shared_members || opportunity.shared_members.length === 0) ? (
          <div className="empty-collaborators">
            <span className="empty-icon">🤝</span>
            <p>Chưa có thành viên phối hợp nào được thêm vào thương vụ này.</p>
            {canManageTeam && (
              <span className="empty-hint">
                Bấm "+ Thêm thành viên" để mời kỹ thuật Pre-sales, chuyên viên giải pháp hoặc đồng nghiệp cùng tham gia.
              </span>
            )}
          </div>
        ) : (
          <div className="collaborators-list">
            {opportunity.shared_members.map((member) => (
              <div key={member.id} className="collaborator-item">
                <div className="collab-avatar">
                  {member.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="collab-info">
                  <div className="collab-name-row">
                    <strong className="collab-name">{member.user_name}</strong>
                    <span className="collab-role-badge">{member.role_in_deal}</span>
                  </div>
                  <div className="collab-meta">
                    {member.user_email && <span className="collab-email">{member.user_email} · </span>}
                    <span className="collab-added">
                      Được thêm bởi {member.added_by_name} vào {new Date(member.added_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="collab-rights">
                    <span className="right-allowed">✓ Ghi hoạt động & lịch sử</span>
                    <span className="right-denied">✕ Không đổi chủ sở hữu</span>
                  </div>
                </div>
                {canManageTeam && (
                  <button
                    type="button"
                    className="btn-remove-collab"
                    title="Gỡ thành viên khỏi cơ hội"
                    onClick={() => handleRemoveMember(member)}
                  >
                    ✕ Gỡ
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
