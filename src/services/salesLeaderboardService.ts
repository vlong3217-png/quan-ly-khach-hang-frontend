import type { LeaderboardEntry, LeaderboardConfig } from '../types/salesLeaderboard.ts'

const STORAGE_KEY_CONFIG = 'crm_leaderboard_config_v1'
const STORAGE_KEY_DATA = 'crm_leaderboard_entries_v1'

const DEFAULT_CONFIG: LeaderboardConfig = {
  is_enabled: true,
  updated_at: '2026-10-01T08:00:00.000Z',
  updated_by: 'Administrator',
}

const INITIAL_ENTRIES: LeaderboardEntry[] = [
  // Team 1
  {
    rank: 1,
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    role: 'Chuyên viên Kinh doanh Senior',
    closed_revenue: 520000000,
    personal_quota: 500000000,
    achievement_rate: 104.0,
    won_deals_count: 8,
    badge: 'OVER_100',
  },
  {
    rank: 2,
    user_id: 2,
    user_name: 'Trần Thị B',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    role: 'Chuyên viên Kinh doanh',
    closed_revenue: 440000000,
    personal_quota: 450000000,
    achievement_rate: 97.8,
    won_deals_count: 6,
    badge: 'NORMAL',
  },
  {
    rank: 3,
    user_id: 3,
    user_name: 'Lê Văn C',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    role: 'Chuyên viên Kinh doanh',
    closed_revenue: 290000000,
    personal_quota: 400000000,
    achievement_rate: 72.5,
    won_deals_count: 4,
    badge: 'NORMAL',
  },
  // Team 2
  {
    rank: 1,
    user_id: 4,
    user_name: 'Phạm Thị D',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    role: 'Account Executive Senior',
    closed_revenue: 1250000000,
    personal_quota: 1000000000,
    achievement_rate: 125.0,
    won_deals_count: 5,
    badge: 'OVER_100',
  },
  {
    rank: 2,
    user_id: 5,
    user_name: 'Hoàng Văn E',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    role: 'Account Executive',
    closed_revenue: 850000000,
    personal_quota: 900000000,
    achievement_rate: 94.4,
    won_deals_count: 4,
    badge: 'NORMAL',
  },
]

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

  getLeaderboard(
    userRole: string,
    userTeamId: number = 1,
    selectedTeamId?: number | 'ALL'
  ): { is_enabled: boolean; entries: LeaderboardEntry[]; is_restricted_to_team: boolean } {
    const config = this.getConfig()
    const raw = localStorage.getItem(STORAGE_KEY_DATA)
    const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : INITIAL_ENTRIES
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(INITIAL_ENTRIES))
    }

    let filtered = [...list]
    const isUser = userRole.toUpperCase() === 'USER'

    // Isolation: If role is USER, they only see members of their own team
    if (isUser) {
      filtered = filtered.filter((e) => e.team_id === userTeamId)
    } else if (selectedTeamId && selectedTeamId !== 'ALL') {
      filtered = filtered.filter((e) => e.team_id === Number(selectedTeamId))
    }

    // Sort descending by closed revenue
    filtered.sort((a, b) => b.closed_revenue - a.closed_revenue)

    // Re-rank 1..N and assign podium badges
    const ranked = filtered.map((entry, index) => {
      const rank = index + 1
      let badge: LeaderboardEntry['badge'] = 'NORMAL'
      if (rank === 1) badge = 'TOP_1'
      else if (rank === 2) badge = 'TOP_2'
      else if (rank === 3) badge = 'TOP_3'
      else if (entry.achievement_rate >= 100) badge = 'OVER_100'

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
