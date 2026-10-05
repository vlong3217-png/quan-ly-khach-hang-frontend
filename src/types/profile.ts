/* ──────────── User Profile Types (S2-02) ──────────── */

/** Thông tin hồ sơ cá nhân của người dùng */
export interface UserProfile {
  id: number
  email: string
  full_name: string
  phone?: string
  role: string
  team?: string
  team_name?: string
  email_signature?: string
  avatar?: string
  created_at?: string
  updated_at?: string
}

/** Payload cập nhật hồ sơ cá nhân (Chỉ cho phép sửa họ tên, SĐT, chữ ký email) */
export interface UpdateProfileRequest {
  full_name: string
  phone?: string
  email_signature?: string
}

/** Response cập nhật hồ sơ cá nhân */
export interface UpdateProfileResponse {
  success: boolean
  message: string
  user?: UserProfile
}

/** Lỗi validation form hồ sơ */
export interface ProfileFormErrors {
  full_name?: string
  phone?: string
  email_signature?: string
}
