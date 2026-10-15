// Types for Contracts & Renewal management (Sprint 7)
import type { QuoteItem } from './quote.ts'

export type ContractStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED' | 'TERMINATED'

export interface Contract {
  id: string
  contract_number: string // Số hợp đồng duy nhất (HD-2025-001)
  quote_id: string
  quote_number: string
  opportunity_id: string
  opportunity_title: string
  customer_id: string
  customer_name: string
  sign_date: string // Ngày ký
  effective_date: string // Ngày hiệu lực
  expiration_date: string // Ngày hết hạn
  payment_terms: string
  total_value: number // VND
  status: ContractStatus
  items: QuoteItem[]
  renewal_opportunity_id?: string // Nếu đã tạo cơ hội gia hạn
  created_at: string
  updated_at: string
}

export interface CreateContractPayload {
  contract_number: string
  quote_id: string
  quote_number: string
  opportunity_id: string
  opportunity_title: string
  customer_id: string
  customer_name: string
  sign_date: string
  effective_date: string
  expiration_date: string
  payment_terms: string
  total_value: number
  items: QuoteItem[]
}
