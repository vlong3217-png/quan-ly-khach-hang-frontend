/* ──────────── User Management Types (S1-08) ──────────── */

/** Trạng thái tài khoản: active (hoạt động), inactive (không hoạt động), locked (đã khóa) */
export type UserStatus = 'active' | 'inactive' | 'locked'

/** Vai trò người dùng */
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER'

/** Thông tin đầy đủ của một tài khoản người dùng */
export interface UserAccount {
  id: number
  full_name: string
  email: string
  phone?: string
  role: UserRole
  team?: string
  status: UserStatus
  is_active?: boolean
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

/* ──────────── S1-10 Lock Account & Data Handover Types ──────────── */

/** Payload cập nhật trạng thái khóa/mở khóa (PATCH /users/:id/status) */
export interface UpdateStatusRequest {
  status: 'ACTIVE' | 'LOCKED'
  handover_to_user_id?: number | null
}

/** Mục dữ liệu bàn giao */
export interface HandoverItem {
  id: number
  type: string
  name: string
}

/** Kết quả bàn giao dữ liệu */
export interface DataHandoverResponse {
  success: boolean
  message: string
  source_user_id: number
  target_user_id: number
  transferred_items_count: number
  transferred_items?: HandoverItem[]
}

/** Phản hồi sau khi cập nhật trạng thái khóa/mở khóa */
export interface UserStatusResponse {
  id: number
  email: string
  username?: string | null
  full_name: string
  role: string
  is_active: boolean
  status: string
  message: string
  handover?: DataHandoverResponse | null
}

/** Yêu cầu bàn giao dữ liệu độc lập (POST /users/:id/handover) */
export interface DataHandoverRequest {
  target_user_id: number
}
