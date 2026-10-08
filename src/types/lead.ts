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
  created_at: string
  updated_at: string
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
