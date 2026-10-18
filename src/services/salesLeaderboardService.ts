import type { LeaderboardEntry, LeaderboardConfig } from '../types/salesLeaderboard.ts'

const STORAGE_KEY_CONFIG = 'crm_leaderboard_config_v1'
const STORAGE_KEY_DATA = 'crm_leaderboard_entries_v2'

const DEFAULT_CONFIG: LeaderboardConfig = {
  is_enabled: true,
  updated_at: '2026-10-01T08:00:00.000Z',
  updated_by: 'Administrator',
}

const INITIAL_ENTRIES: LeaderboardEntry[] = []

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
    try {
      localStorage.removeItem('crm_leaderboard_entries_v1')
    } catch {
      // ignore
    }
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
