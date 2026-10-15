export type QuotaPeriodType = 'MONTH' | 'QUARTER'

export interface MemberQuota {
  user_id: number
  user_name: string
  role: string
  target_amount: number // VND
  achieved_amount: number // VND
}

export interface TeamQuota {
  id: string
  team_id: number
  team_name: string
  period_type: QuotaPeriodType
  period_code: string // e.g. "2026-10", "2026-Q4", "2026-09"
  period_label: string // e.g. "Tháng 10/2026", "Quý 4/2026"
  target_amount: number // Chỉ tiêu tổng của nhóm
  achieved_amount: number // Tổng doanh số đã chốt
  members: MemberQuota[]
  is_locked: boolean // Tự động khoá nếu kỳ đã qua (S8-03 AC)
  created_at: string
  updated_at: string
}

export interface QuotaAuditLog {
  id: string
  team_quota_id: string
  team_name: string
  period_code: string
  modified_by_id: number
  modified_by_name: string
  modified_at: string
  reason: string // Lý do bắt buộc khi sửa chỉ tiêu đã khoá
  old_target: number
  new_target: number
  details: string
}
