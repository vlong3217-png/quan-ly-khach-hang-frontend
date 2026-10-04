/* ──────────── Audit Log Types (S2-04) ──────────── */

/** Loại đối tượng nhạy cảm được theo dõi thay đổi */
export type AuditEntityType =
  | 'DISCOUNT'      // Chiết khấu khách hàng / đơn hàng
  | 'TARGET'        // Chỉ tiêu doanh số (KPI/Quota)
  | 'OWNERSHIP'     // Quyền sở hữu dữ liệu khách hàng
  | 'USER_ROLE'     // Vai trò người dùng trong hệ thống

/** Hành động thay đổi */
export type AuditAction =
  | 'UPDATE'        // Cập nhật
  | 'CHANGE'        // Thay đổi
  | 'CREATE'        // Tạo mới
  | 'DELETE'        // Xóa

/** Nhãn hiển thị tiếng Việt cho loại đối tượng */
export const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  DISCOUNT: 'Chiết khấu',
  TARGET: 'Chỉ tiêu',
  OWNERSHIP: 'Quyền sở hữu dữ liệu',
  USER_ROLE: 'Vai trò người dùng',
}

/** Nhãn hiển thị tiếng Việt cho hành động */
export const ACTION_LABELS: Record<AuditAction, string> = {
  UPDATE: 'Cập nhật',
  CHANGE: 'Thay đổi',
  CREATE: 'Tạo mới',
  DELETE: 'Xóa',
}

/** Bản ghi nhật ký thay đổi dữ liệu nhạy cảm */
export interface AuditLogEntry {
  id: number | string
  performer_id: number
  performer_name: string
  performer_email?: string
  performer_role: string
  timestamp: string // ISO 8601 string (ví dụ: '2026-10-02T09:15:00Z')
  entity_type: AuditEntityType
  entity_id: string
  entity_name?: string
  action: AuditAction
  old_value: string
  new_value: string
  reason?: string
}

/** Tham số bộ lọc nhật ký */
export interface AuditLogFilterParams {
  performer_name?: string
  entity_type?: AuditEntityType | 'ALL' | ''
  from_date?: string // YYYY-MM-DD
  to_date?: string   // YYYY-MM-DD
  search_keyword?: string
  page?: number
  pageSize?: number
}

/** Kết quả trả về từ API / Service nhật ký */
export interface AuditLogResponse {
  success: boolean
  data: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  message?: string
}
