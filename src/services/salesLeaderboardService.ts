import type { LeaderboardEntry, LeaderboardConfig } from '../types/salesLeaderboard.ts'
import { getStoredOpportunities } from './opportunityService.ts'
import { getMockUsers } from './userService.ts'
import { salesQuotaService } from './salesQuotaService.ts'
import { organizationService } from './organizationService.ts'

const STORAGE_KEY_CONFIG = 'crm_leaderboard_config_v1'

const DEFAULT_CONFIG: LeaderboardConfig = {
  is_enabled: true,
  updated_at: '2026-10-01T08:00:00.000Z',
  updated_by: 'Administrator',
}

export const salesLeaderboardService = {
  getConfig(): LeaderboardConfig {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG))
      return DEFAULT_CONFIG
    }
    return JSON.parse(raw)
  },

  updateConfig(is_enabled: boolean, updated_by: string): LeaderboardConfig {
    const config: LeaderboardConfig = {
      is_enabled,
      updated_at: new Date().toISOString(),
      updated_by,
    }
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
    return config
  },

  /**
   * Tính toán dữ liệu Bảng xếp hạng doanh số động từ:
   * 1. Danh sách người dùng hệ thống (`userService`)
   * 2. Chỉ tiêu doanh số (`salesQuotaService`)
   * 3. Cơ hội bán hàng đã chốt thành công (`opportunityService` - stage 'WON' hoặc win_probability=100)
   */
  getLeaderboard(
    userRole: string,
    userTeamId: number = 1,
    selectedTeamId?: number | 'ALL'
  ): { is_enabled: boolean; entries: LeaderboardEntry[]; is_restricted_to_team: boolean } {
    const config = this.getConfig()

    const users = getMockUsers()
    const allOpps = getStoredOpportunities()
    const allQuotas = salesQuotaService.getAllQuotas()

    // 1. Lọc cơ hội đã thắng (WON)
    const wonOpps = allOpps.filter((opp) => {
      const sId = String(opp.stage_id || '').toLowerCase()
      const sName = String(opp.stage_name || '').toLowerCase()
      return sId.includes('won') || sId === 'stage-6' || sName.includes('thành công') || opp.win_probability === 100
    })

    // 2. Gom doanh thu chốt và số hợp đồng theo user
    const wonMapByUser = new Map<number, { revenue: number; count: number }>()
    for (const opp of wonOpps) {
      const ownerId = opp.owner_id ? Number(opp.owner_id) : 1
      const current = wonMapByUser.get(ownerId) || { revenue: 0, count: 0 }
      current.revenue += Number(opp.expected_revenue) || 0
      current.count += 1
      wonMapByUser.set(ownerId, current)
    }

    // 3. Gom chỉ tiêu cá nhân từ salesQuotaService
    const quotaMapByUser = new Map<number, number>()
    for (const q of allQuotas) {
      if (Array.isArray(q.members)) {
        for (const m of q.members) {
          const uId = Number(m.user_id)
          const target = Number(m.target_amount) || 0
          quotaMapByUser.set(uId, (quotaMapByUser.get(uId) || 0) + target)
        }
      }
    }

    // 4. Tạo danh sách entry từ users
    const allTeams = organizationService.getAllTeams()
    const teamNameToIdMap = new Map<string, number>()
    allTeams.forEach((t) => {
      teamNameToIdMap.set(t.name.trim().toLowerCase(), t.id)
    })

    const generatedEntries: LeaderboardEntry[] = users.map((u, idx) => {
      const uId = Number(u.id)
      const wonData = wonMapByUser.get(uId) || { revenue: 0, count: 0 }
      const quota = quotaMapByUser.get(uId) || 50000000 // Mặc định 50M nếu chưa giao chỉ tiêu

      const teamName = (u.team || 'Đội Kinh Doanh 1').trim()
      const teamId = teamNameToIdMap.get(teamName.toLowerCase()) || 1

      const achievementRate = quota > 0 ? Number(((wonData.revenue / quota) * 100).toFixed(1)) : 0

      return {
        rank: idx + 1,
        user_id: uId,
        user_name: u.full_name || u.email,
        team_id: teamId,
        team_name: teamName,
        role: u.role || 'STAFF',
        closed_revenue: wonData.revenue,
        personal_quota: quota,
        achievement_rate: achievementRate,
        won_deals_count: wonData.count,
        badge: 'NORMAL',
      }
    })

    let filtered = [...generatedEntries]
    const isUser = userRole.toUpperCase() === 'USER'

    // Isolation: If role is USER, they only see members of their own team
    if (isUser) {
      filtered = filtered.filter((e) => e.team_id === userTeamId)
    } else if (selectedTeamId && selectedTeamId !== 'ALL') {
      filtered = filtered.filter((e) => e.team_id === Number(selectedTeamId))
    }

    // Sort descending by closed revenue, then by achievement rate
    filtered.sort((a, b) => {
      if (b.closed_revenue !== a.closed_revenue) {
        return b.closed_revenue - a.closed_revenue
      }
      return b.achievement_rate - a.achievement_rate
    })

    // Re-rank 1..N and assign podium badges
    const ranked = filtered.map((entry, index) => {
      const rank = index + 1
      let badge: LeaderboardEntry['badge'] = 'NORMAL'
      if (entry.closed_revenue > 0) {
        if (rank === 1) badge = 'TOP_1'
        else if (rank === 2) badge = 'TOP_2'
        else if (rank === 3) badge = 'TOP_3'
      }
      if (entry.achievement_rate >= 100) badge = 'OVER_100'

      return {
        ...entry,
        rank,
        badge,
      }
    })

    return {
      is_enabled: config.is_enabled,
      entries: ranked,
      is_restricted_to_team: isUser,
    }
  },
}
