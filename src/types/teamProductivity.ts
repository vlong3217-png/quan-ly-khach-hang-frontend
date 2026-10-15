export interface MemberWeeklyActivity {
  week_number: number // 1, 2, 3, 4
  week_label: string // 'Tuần 1 (01/10 - 07/10)'
  calls: number
  meetings: number
  quotes_sent: number
  total_activities: number
}

export interface MemberProductivity {
  user_id: number
  user_name: string
  team_id: number
  team_name: string
  role: string
  avatar_url?: string
  total_calls: number
  total_meetings: number
  total_quotes_sent: number
  total_activities: number
  // Lead SLA Metrics
  leads_assigned: number
  leads_responded_in_sla: number
  leads_overdue_sla: number
  sla_compliance_rate: number // 0 - 100%
  avg_response_time_hours: number // e.g. 1.5 hours
  weekly_activities: MemberWeeklyActivity[]
}

export interface LeadSlaDetail {
  id: string
  lead_name: string
  company: string
  assigned_to_id: number
  assigned_to_name: string
  created_at: string
  first_responded_at?: string
  sla_limit_hours: number // default 24h
  actual_duration_hours?: number
  is_within_sla: boolean
  status: 'IN_SLA' | 'OVERDUE' | 'PENDING'
}

export interface ProductivityFilter {
  period_code: string // '2026-10' or '2026-Q4'
  team_id?: number | 'ALL'
  user_id?: number | 'ALL'
  week?: number | 'ALL'
  search_keyword?: string
}

export interface ProductivitySummary {
  total_calls: number
  total_meetings: number
  total_quotes_sent: number
  total_activities: number
  total_leads_assigned: number
  total_leads_in_sla: number
  overall_sla_rate: number
  overall_avg_response_hours: number
}
