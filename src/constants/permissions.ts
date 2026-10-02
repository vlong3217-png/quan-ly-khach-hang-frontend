import type { Permission, DataScope, User } from '../types/auth.ts'

/* ──────────── Role Constants ──────────── */
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên (ADMIN)',
  MANAGER: 'Quản lý (MANAGER)',
  USER: 'Nhân viên (USER)',
}

/* ──────────── Permission Constants ──────────── */
export const PERMISSIONS = {
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  CUSTOMER_EDIT: 'CUSTOMER_EDIT',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',
  CUSTOMER_EXPORT: 'CUSTOMER_EXPORT',
  REPORT_VIEW: 'REPORT_VIEW',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
} as const satisfies Record<string, Permission>

export const PERMISSION_LABELS: Record<Permission, string> = {
  CUSTOMER_VIEW: 'Xem danh sách khách hàng',
  CUSTOMER_CREATE: 'Tạo khách hàng mới',
  CUSTOMER_EDIT: 'Chỉnh sửa khách hàng',
  CUSTOMER_DELETE: 'Xóa khách hàng',
  CUSTOMER_EXPORT: 'Xuất dữ liệu khách hàng',
  REPORT_VIEW: 'Xem báo cáo doanh số & thống kê',
  SYSTEM_SETTINGS: 'Cấu hình hệ thống & phân quyền',
}

/* ──────────── Data Scope Constants ──────────── */
export const DATA_SCOPES = {
  MY: 'MY',
  TEAM: 'TEAM',
  ALL: 'ALL',
} as const

export const SCOPE_LABELS: Record<DataScope, string> = {
  MY: 'Cá nhân (Chỉ dữ liệu của chính mình)',
  TEAM: 'Đội nhóm (Dữ liệu của các thành viên cùng nhóm)',
  ALL: 'Toàn hệ thống (Toàn bộ dữ liệu tổ chức)',
}

/* ──────────── Role-to-Permissions Matrix ──────────── */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_EXPORT,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_EXPORT,
    PERMISSIONS.REPORT_VIEW,
  ],
  [ROLES.USER]: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
  ],
}

/* ──────────── Default Scope by Role ──────────── */
export const DEFAULT_ROLE_SCOPE: Record<string, DataScope> = {
  [ROLES.ADMIN]: DATA_SCOPES.ALL,
  [ROLES.MANAGER]: DATA_SCOPES.TEAM,
  [ROLES.USER]: DATA_SCOPES.MY,
}

/* ──────────── Helper Resolvers ──────────── */
/**
 * Lấy danh sách quyền hạn cụ thể của người dùng.
 * Nếu user có mảng `permissions` riêng, ưu tiên sử dụng.
 * Ngược lại, tra cứu từ ma trận quyền theo role.
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user || !user.role) return []
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions
  }
  const normalizedRole = String(user.role).trim().toUpperCase()
  return ROLE_PERMISSIONS[normalizedRole] ?? []
}

/**
 * Lấy phạm vi dữ liệu áp dụng cho người dùng.
 * Nếu user có cấu hình `data_scope` riêng, ưu tiên sử dụng.
 * Ngược lại, lấy phạm vi mặc định theo role (ADMIN -> ALL, MANAGER -> TEAM, USER -> MY).
 */
export function getUserDataScope(user: User | null): DataScope {
  if (!user || !user.role) return DATA_SCOPES.MY
  if (user.data_scope && Object.values(DATA_SCOPES).includes(user.data_scope)) {
    return user.data_scope
  }
  const normalizedRole = String(user.role).trim().toUpperCase()
  return DEFAULT_ROLE_SCOPE[normalizedRole] ?? DATA_SCOPES.MY
}
