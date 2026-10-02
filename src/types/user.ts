/* ──────────── User Management Types (S1-08) ──────────── */

/** Trạng thái tài khoản */
export type UserStatus = 'active' | 'inactive' | 'locked'

/** Vai trò người dùng */
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF'

/** Thông tin đầy đủ của một tài khoản người dùng */
export interface UserAccount {
  id: number
  full_name: string
  email: string
  phone?: string
  role: UserRole
  team?: string
  status: UserStatus
  created_at: string
  updated_at?: string
}

/** Payload tạo tài khoản mới */
export interface CreateUserRequest {
  full_name: string
  email: string
  phone?: string
  role: UserRole
  team?: string
  password: string
}

/** Payload cập nhật tài khoản */
export interface UpdateUserRequest {
  full_name?: string
  email?: string
  phone?: string
  role?: UserRole
  team?: string
  status?: UserStatus
}

/** Response chung cho các thao tác user */
export interface UserResponse {
  success: boolean
  message: string
  user?: UserAccount
}

/** Response danh sách user */
export interface UserListResponse {
  success: boolean
  users: UserAccount[]
  total: number
}
