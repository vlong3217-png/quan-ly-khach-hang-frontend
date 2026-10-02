/* ──────────── User Management Types (S1-08) ──────────── */

/** Trạng thái tài khoản */
export type UserStatus = 'active' | 'inactive' | 'locked'

/** Vai trò người dùng (Hỗ trợ cả ADMIN, MANAGER, USER theo backend S1-09 và STAFF theo legacy frontend) */
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'STAFF'

/** Thông tin đầy đủ của một tài khoản người dùng */
export interface UserAccount {
  id: number
  full_name: string
  email: string
  phone?: string
  role: UserRole
  team?: string
  team_id?: number | null
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

/* ──────────── S1-09 Role & Team Types ──────────── */

/** Thông tin team trong hệ thống */
export interface TeamOption {
  id: number
  name: string
}

/** Thông tin Role trả về từ GET /users/:id/role */
export interface RoleInfoResponse {
  user_id: number
  email: string
  full_name: string
  role: string
}

/** Thông tin Team trả về từ GET /users/:id/team */
export interface TeamInfoResponse {
  user_id: number
  email: string
  full_name: string
  team_id: number | null
  team_name?: string | null
}

/** Payload cập nhật Role (PUT /users/:id/role) */
export interface UpdateRoleRequest {
  role: string
}

/** Payload cập nhật Team (PUT /users/:id/team) */
export interface UpdateTeamRequest {
  team_id: number | null
}

/** Payload cập nhật Role & Team kết hợp (PUT /users/:id/assign) */
export interface UpdateAssignmentRequest {
  role?: string
  team_id?: number | null
}

/** Response sau khi cập nhật phân quyền Role & Team */
export interface AssignmentResponse {
  success: boolean
  message: string
  user?: UserAccount
  roleInfo?: RoleInfoResponse
  teamInfo?: TeamInfoResponse
}
