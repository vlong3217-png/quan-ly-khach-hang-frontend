/**
 * Types cho User Story S2-10: Khai báo danh mục lý do thắng thua và đối thủ
 * - Danh sách lý do thắng và lý do thua khai báo riêng
 * - Danh sách đối thủ cạnh tranh
 * - Đây là dữ liệu bắt buộc khi đóng một cơ hội ở Sprint 5
 */

export type WinLossType = 'WIN_REASON' | 'LOSS_REASON'

export interface WinLossReason {
  id: string
  type: WinLossType // WIN_REASON | LOSS_REASON
  code: string
  name: string
  description?: string
  is_active: boolean
  sort_order: number
}

export interface Competitor {
  id: string
  code: string
  name: string // Tên đối thủ cạnh tranh (VD: Salesforce, HubSpot, MISA AMIS, GetFly...)
  website?: string
  strengths?: string // Điểm mạnh
  weaknesses?: string // Điểm yếu
  price_segment?: 'LOW' | 'MEDIUM' | 'HIGH' // Phân khúc giá
  is_active: boolean
  description?: string
}
