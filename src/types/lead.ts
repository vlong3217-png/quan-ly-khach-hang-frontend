export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'CONVERTED'
  | 'JUNK'

export type LeadSource =
  | 'WEB_FORM'
  | 'MANUAL'
  | 'EXCEL_IMPORT'
  | 'FACEBOOK'
  | 'GOOGLE'
  | 'EVENT'
  | 'REFERRAL'
  | 'OTHER'

export type LeadScoreTier = 'HOT' | 'WARM' | 'COLD'

export type LeadSegment =
  | 'ENTERPRISE_VIP'
  | 'HIGH_POTENTIAL'
  | 'NURTURE'
  | 'UNQUALIFIED'
  | 'UNCLASSIFIED'

export interface ScoreReasonItem {
  criterion: string
  points: number
  type: 'ADD' | 'DEDUCT'
  description: string
}

export interface LeadScoreBreakdown {
  demographic_score: number
  engagement_score: number
  source_score: number
  total_score: number
  reasons: ScoreReasonItem[]
}

export interface LeadScoringRule {
  id: string
  name: string
  category: 'DEMOGRAPHIC' | 'ENGAGEMENT' | 'SOURCE'
  condition_label: string
  points: number
  is_active: boolean
}

export interface UpdateLeadScorePayload {
  score: number
  segment?: LeadSegment
  scoring_notes?: string
  is_manually_scored?: boolean
}

export interface LeadConversionPayload {
  lead_id: string
  // Tùy chọn Khách hàng
  create_new_customer: boolean
  customer_id?: string
  customer_name?: string
  contact_name?: string
  contact_position?: string
  contact_phone?: string
  contact_email?: string
  tax_code?: string
  industry?: string
  company_size?: string
  address?: string
  website?: string
  phone?: string
  email?: string

  // Tùy chọn Cơ hội
  create_opportunity: boolean
  opportunity_title?: string
  stage_id?: string
  stage_name?: string
  expected_revenue?: number
  expected_close_date?: string
  win_probability?: number
  owner_id?: number
  owner_name?: string
  notes?: string
}

export interface LeadConversionResult {
  success: boolean
  lead_id: string
  customer?: {
    id: string
    code: string
    name: string
    phone?: string
    email?: string
  }
  opportunity?: {
    id: string
    code: string
    title: string
    expected_revenue: number
    stage_name?: string
    stage_id?: string
    expected_close_date?: string
  }
  message: string
}

export interface Lead {
  id: string
  code: string
  full_name: string
  email: string
  phone: string
  company: string
  industry?: string
  source: LeadSource
  source_detail?: string
  campaign_id?: string
  campaign_name?: string
  status: LeadStatus
  owner_id?: number
  owner_name?: string
  requirement?: string
  notes?: string
  score?: number
  score_tier?: LeadScoreTier
  segment?: LeadSegment
  score_breakdown?: LeadScoreBreakdown
  is_manually_scored?: boolean
  scoring_notes?: string
  last_scored_at?: string
  converted_customer_id?: string
  converted_customer_name?: string
  converted_customer_code?: string
  converted_opportunity_id?: string
  converted_opportunity_title?: string
  converted_opportunity_code?: string
  converted_at?: string
  // ── S4-07: Phân bổ & Ràng buộc SLA phản hồi ──
  assignment_status?: LeadAssignmentStatus
  assigned_at?: string
  sla_hours?: number
  sla_deadline?: string
  sla_status?: LeadSlaStatus
  rejection_reason?: string
  rejected_at?: string
  accepted_at?: string
  created_at: string
  updated_at: string
}

export type LeadAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'UNASSIGNED'
export type LeadSlaStatus = 'ON_TIME' | 'WARNING' | 'OVERDUE'

export interface AcceptLeadPayload {
  lead_id: string
  owner_id?: number
  owner_name?: string
  note?: string
}

export interface RejectLeadPayload {
  lead_id: string
  reason: string
  notes?: string
}

export interface ReassignLeadPayload {
  lead_id: string
  new_owner_id: number
  new_owner_name: string
  sla_hours?: number
}

export interface CreateLeadPayload {
  full_name: string
  email: string
  phone: string
  company?: string
  industry?: string
  source?: LeadSource
  source_detail?: string
  campaign_id?: string
  status?: LeadStatus
  owner_id?: number
  assignment_status?: LeadAssignmentStatus
  sla_hours?: number
  requirement?: string
  notes?: string
}

export interface UpdateLeadPayload {
  full_name?: string
  email?: string
  phone?: string
  company?: string
  industry?: string
  source?: LeadSource
  source_detail?: string
  campaign_id?: string
  status?: LeadStatus
  owner_id?: number
  owner_name?: string
  assignment_status?: LeadAssignmentStatus
  assigned_at?: string
  sla_hours?: number
  sla_deadline?: string
  sla_status?: LeadSlaStatus
  rejection_reason?: string
  rejected_at?: string
  accepted_at?: string
  requirement?: string
  notes?: string
}

export interface ExcelLeadRow {
  row_index: number
  full_name: string
  email: string
  phone: string
  company: string
  industry: string
  source: string
  requirement: string
  is_valid: boolean
  errors: string[]
  is_duplicate?: boolean
}

export interface ImportLeadResult {
  total_rows: number
  success_count: number
  error_count: number
  duplicate_count: number
  imported_leads: Lead[]
  errors: { row: number; name: string; error: string }[]
}

/* ──────────── User Story S4-06 & S4-07: Lịch sử tương tác với Lead ──────────── */
export type LeadInteractionType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'NOTE'
  | 'STATUS_CHANGE'
  | 'SCORE_UPDATE'
  | 'SYSTEM'
  | 'SLA_ASSIGNMENT'
  | 'SLA_ALERT'

export interface LeadInteraction {
  id: string
  lead_id: string
  type: LeadInteractionType
  title: string
  content?: string
  outcome?: string
  performed_by_id?: number
  performed_by_name: string
  performed_at: string
  next_action?: string
  next_action_due?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface CreateLeadInteractionPayload {
  lead_id: string
  type: LeadInteractionType
  title: string
  content?: string
  outcome?: string
  performed_by_id?: number
  performed_by_name?: string
  performed_at?: string
  next_action?: string
  next_action_due?: string
}

/* ──────────── User Story S4-09: Bộ lọc & Bộ lọc lưu sẵn cho Lead ──────────── */
export type FollowUpTiming = 'TODAY' | 'OVERDUE' | 'THIS_WEEK' | 'ALL'

export interface SavedLeadFilter {
  id: string
  name: string
  icon?: string
  search?: string
  status?: string
  source?: string
  sla_status?: string
  assignment_status?: string
  score_tier?: string
  follow_up_timing?: FollowUpTiming
  only_my_leads?: boolean
  is_preset?: boolean
}


