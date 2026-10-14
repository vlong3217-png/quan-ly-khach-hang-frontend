/* ──────────── Audit Log Types (S2-04) ──────────── */

/** Loại đối tượng nhạy cảm được theo dõi thay đổi */
export type AuditEntityType =
  | 'ROLE'
  | 'DISCOUNT'
  | 'TARGET'
  | 'DATA_OWNERSHIP'
  | 'USER'
  | 'USER_ROLE'
  | 'OWNERSHIP'

/** Hành động thay đổi */
export type AuditAction =
  | 'UPDATE'
  | 'CHANGE'
  | 'CREATE'
  | 'DELETE'
  | 'ASSIGN'
  | string

/** Nhãn hiển thị tiếng Việt cho loại đối tượng */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  ROLE: 'Vai trò',
  USER_ROLE: 'Vai trò người dùng',
  DISCOUNT: 'Chiết khấu',
  TARGET: 'Chỉ tiêu',
  DATA_OWNERSHIP: 'Quyền sở hữu dữ liệu',
  OWNERSHIP: 'Quyền sở hữu dữ liệu',
  USER: 'Người dùng',
}

/** Nhãn hiển thị tiếng Việt cho hành động */
export const ACTION_LABELS: Record<string, string> = {
  UPDATE: 'Cập nhật',
  CHANGE: 'Thay đổi',
  CREATE: 'Tạo mới',
  DELETE: 'Xóa',
  ASSIGN: 'Gán quyền',
}

/** Item từ Backend API /api/v1/audit-logs */
export interface BackendAuditLogItem {
  id: number
  user_id: number
  user_name: string
  entity_type: string
  entity_id: string
  action: string
  field_name?: string
  old_value: string | null
  new_value: string | null
  timestamp: string
  ip_address?: string
}

/** Response từ Backend API /api/v1/audit-logs */
export interface BackendAuditLogResponse {
  total: number
  items: BackendAuditLogItem[]
  page: number
  limit: number
  total_pages: number
}

/** Bản ghi nhật ký thay đổi dữ liệu nhạy cảm hiển thị trên UI */
export interface AuditLogEntry {
  id: number | string
  performer_id: number
  performer_name: string
  performer_email?: string
  performer_role?: string
  timestamp: string // ISO 8601 string
  entity_type: AuditEntityType | string
  entity_id: string
  entity_name?: string
  field_name?: string
  action: AuditAction
  old_value: string
  new_value: string
  reason?: string
  ip_address?: string
}

/** Tham số bộ lọc nhật ký */
export interface AuditLogFilterParams {
  user_id?: number | string
  performer_name?: string
  entity_type?: string
  from_date?: string // ISO format hoặc YYYY-MM-DD
  to_date?: string   // ISO format hoặc YYYY-MM-DD
  search_keyword?: string
  page?: number
  limit?: number
  pageSize?: number
}

/** Kết quả trả về từ Service nhật ký cho UI component */
export interface AuditLogResponse {
  success: boolean
  data: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  message?: string
}
