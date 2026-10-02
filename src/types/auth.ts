/* ──────────── Auth Types ──────────── */

/** User info returned from the API (matches backend UserResponse) */
export interface User {
  id: number
  email: string
  full_name: string
  role: string
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
