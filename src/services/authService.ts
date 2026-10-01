import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../types/auth.ts'

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:8000'

/**
 * Helper to parse backend error responses safely
 */
async function parseErrorResponse(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') {
      return data.detail
    }
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg
    }
    if (data.message && typeof data.message === 'string') {
      return data.message
    }
  } catch {
    // If response body is not JSON, use defaultMessage
  }
  return defaultMessage
}

/**
 * Gửi yêu cầu quên mật khẩu đến API
 * POST /auth/forgot-password
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const payload: ForgotPasswordRequest = {
    email: email.trim(),
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL})`)
  }

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(
      response,
      response.status === 404
        ? 'Email không tồn tại trong hệ thống'
        : 'Yêu cầu quên mật khẩu không thành công. Vui lòng thử lại.'
    )
    throw new Error(errorMsg)
  }

  const data = (await response.json()) as ForgotPasswordResponse
  return data
}

/**
 * Đặt lại mật khẩu mới với token
 * POST /auth/reset-password
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const payload: ResetPasswordRequest = {
    token: token.trim(),
    new_password: newPassword,
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL})`)
  }

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(
      response,
      'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn hoặc không hợp lệ.'
    )
    throw new Error(errorMsg)
  }

  const data = (await response.json()) as ResetPasswordResponse
  return data
}

/**
 * Đổi mật khẩu người dùng
 * POST /auth/change-password
 * Headers: Authorization: Bearer <token>
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  token?: string | null
): Promise<ChangePasswordResponse> {
  const authToken =
    token ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')

  if (!authToken) {
    const error = new Error('Chưa đăng nhập hoặc thiếu token xác thực. Vui lòng đăng nhập lại.')
    ;(error as Error & { status?: number }).status = 401
    throw error
  }

  const payload: ChangePasswordRequest = {
    current_password: currentPassword,
    new_password: newPassword,
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.trim()}`,
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL})`)
  }

  if (response.status === 401) {
    const errorMsg = await parseErrorResponse(
      response,
      'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
    )
    const error = new Error(errorMsg)
    ;(error as Error & { status?: number }).status = 401
    throw error
  }

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(
      response,
      'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.'
    )
    throw new Error(errorMsg)
  }

  const data = (await response.json()) as ChangePasswordResponse
  return data
}
