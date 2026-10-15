/* ──────────── User Story S6-04: Đính kèm tài liệu vào cơ hội ──────────── */
export type AttachmentCategory =
  | 'Hồ sơ thầu'
  | 'Biên bản họp'
  | 'Báo giá & Hợp đồng'
  | 'Yêu cầu kỹ thuật (RFP)'
  | 'Tài liệu khác'

export interface OpportunityAttachment {
  id: string
  opportunity_id: string
  file_name: string
  file_size: number // In bytes (max 20MB = 20 * 1024 * 1024)
  file_type: string
  file_url?: string
  category: AttachmentCategory
  notes?: string
  uploaded_by_id: number
  uploaded_by_name: string
  uploaded_at: string
}

export interface UploadAttachmentPayload {
  opportunity_id: string
  file_name: string
  file_size: number
  file_type: string
  category: AttachmentCategory
  notes?: string
  uploaded_by_id: number
  uploaded_by_name: string
}
