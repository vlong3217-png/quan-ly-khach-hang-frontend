// Types for Quotes and Pricing management (Sprint 7)

export type QuoteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'

export type DiscountType = 'PERCENT' | 'AMOUNT'

export interface QuoteItem {
  id: string
  product_id?: string
  product_name: string
  product_code?: string
  unit: string
  unit_price: number
  quantity: number
  discount_type: DiscountType
  discount_value: number
  line_discount_amount: number
  floor_price?: number // Giá sàn sản phẩm
  vat_rate: number // Thuế GTGT % (VD 0, 8, 10)
  line_total: number // Thành tiền sau CK và VAT
}

export interface QuoteApprovalHistory {
  id: string
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'AUTO_APPROVED'
  performed_by_id?: number
  performed_by_name: string
  performed_by_role: string
  comments?: string
  timestamp: string
}

export interface Quote {
  id: string
  quote_number: string // VD: BG-2025-001
  version: number // Phiên bản (1, 2, 3...)
  is_active_version: boolean
  parent_quote_id?: string // ID báo giá gốc nếu là revision
  opportunity_id: string
  opportunity_title: string
  customer_id: string
  customer_name: string
  customer_contact_name?: string
  customer_contact_email?: string
  customer_contact_phone?: string
  created_by_id?: number
  created_by_name: string
  status: QuoteStatus
  items: QuoteItem[]

  // Financial calculations
  subtotal: number // Tổng tiền trước chiết khấu
  total_line_discount: number
  overall_discount_type?: DiscountType
  overall_discount_value?: number
  total_discount_amount: number // Tổng chiết khấu toàn bộ
  discount_percentage: number // % Chiết khấu tổng trên toàn báo giá
  vat_amount: number
  grand_total: number // Tổng giá trị thanh toán

  // Terms & Validity (S7-01)
  valid_until: string // YYYY-MM-DD
  payment_terms: string
  delivery_terms: string
  notes?: string

  // Approval status (S7-02)
  requires_approval: boolean
  approval_level?: 'NONE' | 'MANAGER' | 'DIRECTOR'
  approval_reason?: string
  approval_history: QuoteApprovalHistory[]

  // Online Customer Acceptance link (S7-06)
  access_token: string
  customer_feedback?: string
  customer_decided_at?: string

  // Contract conversion (S7-04)
  is_converted_to_contract: boolean
  contract_id?: string
  contract_number?: string

  created_at: string
  updated_at: string
}

export interface CreateQuotePayload {
  opportunity_id: string
  opportunity_title: string
  customer_id: string
  customer_name: string
  customer_contact_name?: string
  customer_contact_email?: string
  customer_contact_phone?: string
  items: QuoteItem[]
  overall_discount_type?: DiscountType
  overall_discount_value?: number
  valid_until: string
  payment_terms: string
  delivery_terms: string
  notes?: string
  is_draft?: boolean
}
