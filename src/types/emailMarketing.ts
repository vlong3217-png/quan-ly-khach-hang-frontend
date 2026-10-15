export type EmailTemplateCategory =
  | 'PROMOTION'
  | 'INTRODUCTION'
  | 'FOLLOWUP'
  | 'CONTRACT'
  | 'GENERAL'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: EmailTemplateCategory
  created_at: string
  updated_at: string
  usage_count: number
}

export type EmailQueueStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED'

export interface EmailQueueItem {
  id: string
  template_id?: string
  template_name?: string
  customer_id: string
  customer_name: string
  contact_name: string
  recipient_email: string
  subject: string
  body: string
  assigned_rep: string
  status: EmailQueueStatus
  queued_at: string
  sent_at?: string
  failed_at?: string
  error_message?: string
  retry_count: number
}

export interface SendEmailPayload {
  template_id?: string
  template_name?: string
  customer_id: string
  customer_name: string
  contact_name: string
  recipient_email: string
  subject: string
  body: string
  assigned_rep: string
}
