export type RepActivityType =
  | 'CALL'
  | 'MEETING'
  | 'EMAIL'
  | 'QUOTE'
  | 'NOTE'
  | 'STAGE_CHANGE'
  | 'TASK'

export interface RepActivityItem {
  id: string
  timestamp: string
  user_id: number
  user_name: string
  user_role: string
  team_id: number
  team_name: string
  activity_type: RepActivityType
  target_type: 'OPPORTUNITY' | 'CUSTOMER' | 'LEAD'
  target_name: string
  title: string
  content: string
  duration_minutes?: number
}

export interface RepWorkloadSummary {
  user_id: number
  user_name: string
  team_name: string
  role: string
  total_activities: number
  calls_count: number
  meetings_count: number
  emails_count: number
  quotes_count: number
  notes_and_others: number
  workload_level: 'HIGH' | 'NORMAL' | 'LOW'
  workload_share_percentage: number // % tỷ trọng so với cả đội
}

export interface RepActivityFilter {
  period_preset: 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'
  start_date?: string
  end_date?: string
  activity_type: RepActivityType | 'ALL'
  user_id: number | 'ALL'
  team_id?: number | 'ALL'
  search_keyword?: string
}
