export interface LeadFormFieldConfig {
  id: string
  name: 'full_name' | 'email' | 'phone' | 'company' | 'requirement'
  label: string
  placeholder: string
  required: boolean
  field_type: 'text' | 'email' | 'tel' | 'textarea'
}

export interface LeadForm {
  id: string
  code: string
  name: string
  title: string
  description: string
  submit_button_text: string
  success_message: string
  redirect_url?: string
  is_active: boolean
  submissions_count: number
  campaign_id?: string
  campaign_name?: string
  created_at: string
  updated_at: string
}

export type LeadSubmissionStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'SPAM'

export interface LeadSubmission {
  id: string
  form_id: string
  form_name: string
  full_name: string
  email: string
  phone: string
  company: string
  requirement: string
  ip_address?: string
  status: LeadSubmissionStatus
  created_at: string
}

export interface CreateLeadFormPayload {
  name: string
  title: string
  description?: string
  submit_button_text?: string
  success_message?: string
  redirect_url?: string
  is_active?: boolean
  campaign_id?: string
}

export interface UpdateLeadFormPayload {
  name?: string
  title?: string
  description?: string
  submit_button_text?: string
  success_message?: string
  redirect_url?: string
  is_active?: boolean
  campaign_id?: string
}

export interface SubmitLeadPayload {
  full_name: string
  email: string
  phone: string
  company?: string
  requirement?: string
}
