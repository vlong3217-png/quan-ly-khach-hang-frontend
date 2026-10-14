/* ──────────── Audit Log Service (S2-04) ──────────── */
import type {
  AuditLogEntry,
  AuditLogFilterParams,
  AuditLogResponse,
  BackendAuditLogItem,
  BackendAuditLogResponse,
} from '../types/auditLog.ts'
import { API_BASE_URL } from './authService.ts'

/**
 * Lấy token xác thực từ storage
 */
function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

/**
 * Lấy danh sách nhật ký thay đổi thật từ Backend API MySQL
 * Endpoint: GET /api/v1/audit-logs
 * Header: Authorization: Bearer <token>
 */
export async function getAuditLogs(
  filters: AuditLogFilterParams = {}
): Promise<AuditLogResponse> {
  const {
    user_id,
    entity_type = '',
    from_date = '',
    to_date = '',
    search_keyword = '',
    page = 1,
    pageSize,
    limit,
  } = filters

  const actualLimit = limit || pageSize || 10
  const token = getAuthToken()

  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('limit', String(actualLimit))

  if (entity_type && entity_type !== 'ALL') {
    params.append('entity_type', entity_type)
  }
  if (user_id) {
    params.append('user_id', String(user_id))
  }
  if (from_date) {
    params.append('from_date', from_date)
  }
  if (to_date) {
    params.append('to_date', to_date)
  }
  if (search_keyword && search_keyword.trim()) {
    params.append('search', search_keyword.trim())
  }

  const endpointUrl = `${API_BASE_URL}/api/v1/audit-logs?${params.toString()}`

  const response = await fetch(endpointUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    let errorDetail = 'Không thể tải nhật ký thay đổi từ hệ thống.'
    try {
      const errJson = await response.json()
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail
      } else if (typeof errJson.message === 'string') {
        errorDetail = errJson.message
      }
    } catch {
      // response không phải JSON
    }
    throw new Error(errorDetail)
  }

  const json: BackendAuditLogResponse = await response.json()

  const items: BackendAuditLogItem[] = Array.isArray(json.items)
    ? json.items
    : Array.isArray((json as any).data)
    ? (json as any).data
    : []

  const mappedLogs: AuditLogEntry[] = items.map((item) => ({
    id: item.id,
    performer_id: item.user_id,
    performer_name: item.user_name || 'Người dùng',
    performer_role: 'ADMIN',
    timestamp: item.timestamp,
    entity_type: item.entity_type,
    entity_id: String(item.entity_id ?? ''),
    field_name: item.field_name,
    action: item.action,
    old_value: item.old_value !== null && item.old_value !== undefined ? String(item.old_value) : '—',
    new_value: item.new_value !== null && item.new_value !== undefined ? String(item.new_value) : '—',
    reason: item.field_name ? `Thay đổi trường ${item.field_name}` : undefined,
    ip_address: item.ip_address,
  }))

  const total = json.total ?? mappedLogs.length
  const totalPages = json.total_pages ?? Math.max(1, Math.ceil(total / actualLimit))

  return {
    success: true,
    data: mappedLogs,
    total,
    page: json.page ?? page,
    pageSize: json.limit ?? actualLimit,
    totalPages,
  }
}

/**
 * Định dạng thời gian theo phong cách Việt Nam: DD/MM/YYYY HH:mm
 */
export function formatAuditDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const pad = (n: number) => n.toString().padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear()
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    const seconds = pad(date.getSeconds())
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  } catch {
    return dateString
  }
}

/**
 * Chuẩn hóa hiển thị Loại đối tượng sang Tiếng Việt
 */
export function formatAuditEntity(entityType: string): string {
  if (!entityType) return '—'
  const upper = entityType.trim().toUpperCase()
  const map: Record<string, string> = {
    ROLE: 'Vai trò',
    USER_ROLE: 'Vai trò người dùng',
    USER: 'Người dùng',
    DISCOUNT: 'Chiết khấu',
    TARGET: 'Chỉ tiêu',
    DATA_OWNERSHIP: 'Quyền sở hữu dữ liệu',
    OWNERSHIP: 'Quyền sở hữu dữ liệu',
    CUSTOMER: 'Khách hàng',
    CONTACT: 'Người liên hệ',
    DEAL: 'Cơ hội bán hàng',
    PRODUCT: 'Sản phẩm',
    SYSTEM: 'Hệ thống',
  }
  return map[upper] || entityType
}

/**
 * Chuẩn hóa hiển thị Hành động sang Tiếng Việt
 */
export function formatAuditAction(action: string): string {
  if (!action) return '—'
  const upper = action.trim().toUpperCase()
  const map: Record<string, string> = {
    UPDATE: 'Cập nhật',
    UPDATE_USER: 'Cập nhật người dùng',
    UPDATE_ROLE: 'Cập nhật vai trò',
    ASSIGN_ROLE: 'Gán vai trò',
    ASSIGN: 'Gán quyền',
    CHANGE: 'Thay đổi',
    CREATE: 'Tạo mới',
    CREATE_USER: 'Tạo người dùng',
    DELETE: 'Xóa',
    DELETE_USER: 'Xóa người dùng',
    LOCK_USER: 'Khóa tài khoản',
    UNLOCK_USER: 'Mở khóa tài khoản',
    LOCK: 'Khóa',
    UNLOCK: 'Mở khóa',
    TRANSFER_OWNER: 'Chuyển quyền sở hữu',
    UPDATE_DISCOUNT: 'Cập nhật chiết khấu',
    UPDATE_TARGET: 'Cập nhật chỉ tiêu',
  }
  return map[upper] || action
}

/**
 * Chuẩn hóa hiển thị Giá trị trước / sau sang Tiếng Việt
 */
export function formatAuditValue(val: string): string {
  if (!val || val === '—' || val === '-' || val === 'null' || val === 'undefined') return '—'
  const trimmed = val.trim()
  const upper = trimmed.toUpperCase()
  const map: Record<string, string> = {
    USER: 'Nhân viên (USER)',
    STAFF: 'Nhân viên',
    MANAGER: 'Quản lý (MANAGER)',
    ADMIN: 'Quản trị viên (ADMIN)',
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    LOCKED: 'Đã khóa',
    TRUE: 'Đúng',
    FALSE: 'Sai',
  }
  return map[upper] || val
}
