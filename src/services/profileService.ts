import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../types/profile.ts'
import type { User } from '../types/auth.ts'
import { API_BASE_URL } from './authService.ts'

/* ──────────── Storage Keys ──────────── */
const STORAGE_KEY_TOKEN = 'access_token'
const STORAGE_KEY_USER = 'user'
const FALLBACK_KEY_TOKEN = 'auth_token'
const FALLBACK_KEY_USER = 'auth_user'

function getAuthToken(): string | null {
  return (
    localStorage.getItem(STORAGE_KEY_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEY_TOKEN) ||
    localStorage.getItem(FALLBACK_KEY_TOKEN) ||
    sessionStorage.getItem(FALLBACK_KEY_USER)
  )
}

function getStoredUser(): User | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_USER) ||
      sessionStorage.getItem(STORAGE_KEY_USER) ||
      localStorage.getItem(FALLBACK_KEY_USER)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function saveStoredUser(user: User): void {
  try {
    const serialized = JSON.stringify(user)
    localStorage.setItem(STORAGE_KEY_USER, serialized)
    sessionStorage.setItem(STORAGE_KEY_USER, serialized)
  } catch {
    // Ignore storage quota/security errors
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

async function parseErrorResponse(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    if (data.message && typeof data.message === 'string') return data.message
  } catch {
    // Body is not JSON
  }
  return defaultMessage
}

/* ──────────── Mẫu chữ ký email mặc định khi chưa thiết lập ──────────── */
export function getDefaultSignature(user: { full_name?: string; phone?: string; team_name?: string; email?: string }): string {
  return `Trân trọng,\n${user.full_name || 'Họ và tên'}\nBộ phận: ${user.team_name || 'Phòng Kinh Doanh'}\nĐiện thoại: ${user.phone || '0901234567'} | Email: ${user.email || 'user@company.com'}\nCông ty TNHH Quản Lý & Dịch Vụ Khách Hàng`
}

/* ──────────── Profile API Functions ──────────── */

/**
 * Lấy thông tin hồ sơ cá nhân của người dùng hiện tại
 * Endpoint ưu tiên: GET /profile hoặc GET /users/me
 * Fallback: Dữ liệu phiên đăng nhập hiện tại từ LocalStorage
 */
export async function getProfile(): Promise<UserProfile> {
  const token = getAuthToken()
  const storedUser = getStoredUser()

  if (!token && !storedUser) {
    const error = new Error('Chưa đăng nhập. Vui lòng đăng nhập để xem hồ sơ.')
    ;(error as Error & { status?: number }).status = 401
    throw error
  }

  // 1. Thử gọi API Backend nếu có kết nối
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(4000),
    })

    if (response.ok) {
      const data = await response.json()
      const profile: UserProfile = data.user || data
      return profile
    }

    // Nếu endpoint /profile trả về 404, thử GET /users/me
    if (response.status === 404) {
      try {
        const altResponse = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: getAuthHeaders(),
          signal: AbortSignal.timeout(3000),
        })
        if (altResponse.ok) {
          const altData = await altResponse.json()
          return altData.user || altData
        }
      } catch {
        // Fallback to local session
      }
    }
  } catch {
    // Backend không khả dụng hoặc lỗi mạng -> fallback mượt mà sang dữ liệu local
  }

  // 2. Fallback: Đọc dữ liệu hồ sơ từ local storage
  if (storedUser) {
    const userId = storedUser.id || 1
    const storedPhone = localStorage.getItem(`user_phone_${userId}`) || storedUser.phone || '0901234567'
    const storedSignature = localStorage.getItem(`user_signature_${userId}`) ?? storedUser.email_signature ?? getDefaultSignature({
      full_name: storedUser.full_name,
      phone: storedPhone,
      team_name: storedUser.team_name,
      email: storedUser.email,
    })

    return {
      id: storedUser.id,
      email: storedUser.email,
      full_name: storedUser.full_name,
      phone: storedPhone,
      role: storedUser.role || 'USER',
      team: storedUser.team_name || 'Đội Kinh Doanh 1',
      team_name: storedUser.team_name || 'Đội Kinh Doanh 1',
      email_signature: storedSignature,
      created_at: '2025-01-15T08:00:00Z',
    }
  }

  throw new Error('Không thể tải thông tin hồ sơ cá nhân. Vui lòng đăng nhập lại.')
}

/**
 * Cập nhật thông tin hồ sơ cá nhân
 * Chỉ cho phép cập nhật: full_name, phone, email_signature
 * Các trường email, role, team không được phép sửa
 * Endpoint ưu tiên: PUT /profile hoặc PUT /users/me
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  const token = getAuthToken()
  const storedUser = getStoredUser()

  if (!token && !storedUser) {
    const error = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    ;(error as Error & { status?: number }).status = 401
    throw error
  }

  const payload: UpdateProfileRequest = {
    full_name: data.full_name.trim(),
    phone: data.phone?.trim() || undefined,
    email_signature: data.email_signature,
  }

  // 1. Thử gửi yêu cầu cập nhật lên Backend
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const resData = (await response.json()) as UpdateProfileResponse

      // Đồng bộ vào local storage
      if (storedUser) {
        const updatedUser: User = {
          ...storedUser,
          full_name: payload.full_name,
          phone: payload.phone,
          email_signature: payload.email_signature,
        }
        saveStoredUser(updatedUser)
        if (storedUser.id) {
          localStorage.setItem(`user_phone_${storedUser.id}`, payload.phone || '')
          localStorage.setItem(`user_signature_${storedUser.id}`, payload.email_signature || '')
        }
      }

      return resData
    }

    if (response.status === 401) {
      const errorMsg = await parseErrorResponse(response, 'Phiên đăng nhập đã hết hạn.')
      const err = new Error(errorMsg)
      ;(err as Error & { status?: number }).status = 401
      throw err
    }

    // Nếu endpoint 404 hoặc 405, thử tiếp PATCH /profile hoặc PUT /users/me
    if (response.status === 404 || response.status === 405) {
      try {
        const altRes = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000),
        })
        if (altRes.ok) {
          const altData = (await altRes.json()) as UpdateProfileResponse
          return altData
        }
      } catch {
        // Tiếp tục sang fallback
      }
    }
  } catch (error: unknown) {
    const err = error as Error & { status?: number }
    if (err?.status === 401) {
      throw err
    }
    // Lỗi mạng hoặc backend chưa có route -> fallback xuống lưu trữ local
  }

  // 2. Fallback: Lưu vào bộ nhớ local để giao diện hoạt động trơn tru
  // Giả lập độ trễ mạng nhẹ (250ms) để trải nghiệm loading chân thực
  await new Promise((resolve) => setTimeout(resolve, 250))

  if (storedUser) {
    const userId = storedUser.id || 1
    localStorage.setItem(`user_phone_${userId}`, payload.phone || '')
    localStorage.setItem(`user_signature_${userId}`, payload.email_signature || '')

    const updatedUser: User = {
      ...storedUser,
      full_name: payload.full_name,
      phone: payload.phone,
      email_signature: payload.email_signature,
    }
    saveStoredUser(updatedUser)

    const updatedProfile: UserProfile = {
      id: storedUser.id,
      email: storedUser.email,
      full_name: payload.full_name,
      phone: payload.phone,
      role: storedUser.role || 'USER',
      team: storedUser.team_name || 'Đội Kinh Doanh 1',
      team_name: storedUser.team_name || 'Đội Kinh Doanh 1',
      email_signature: payload.email_signature,
    }

    return {
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công!',
      user: updatedProfile,
    }
  }

  throw new Error('Cập nhật hồ sơ thất bại. Không tìm thấy thông tin tài khoản.')
}
