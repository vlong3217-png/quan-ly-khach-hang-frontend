/* ──────────── Auth Types ──────────── */

export type Role = 'ADMIN' | 'MANAGER' | 'USER' | (string & {})
export type DataScope = 'MY' | 'TEAM' | 'ALL'

export type Permission =
  | 'CUSTOMER_VIEW'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_EDIT'
  | 'CUSTOMER_DELETE'
  | 'CUSTOMER_EXPORT'
  | 'REPORT_VIEW'
  | 'SYSTEM_SETTINGS'

/** User info returned from the API (matches backend UserResponse, extended with scope/team) */
export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  team_id?: number | string
  team_name?: string
  data_scope?: DataScope
  permissions?: Permission[]
}

/** Login request payload (matches backend LoginRequest) */
export interface LoginRequest {
  email?: string
  username?: string
  account?: string
  password: string
}

/** Login response from the API (matches backend LoginResponse) */
export interface LoginResponse {
  success: boolean
  access_token: string
  token_type: string
  user: User
}

/** Shape of the auth state stored in context */
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
