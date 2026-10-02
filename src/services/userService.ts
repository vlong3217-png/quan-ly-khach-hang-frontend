import type {
  UserAccount,
  UserListResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatus,
  UserRole,
} from '../types/user.ts'
import { API_BASE_URL } from './authService.ts'

/* ──────────── Mock Data ──────────── */
const MOCK_USERS: UserAccount[] = [
  {
    id: 1,
    full_name: 'Nguyễn Văn An',
    email: 'admin@company.com',
    phone: '0901234567',
    role: 'ADMIN',
    team: 'Ban Giám đốc',
    status: 'active',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 2,
    full_name: 'Trần Thị Bình',
    email: 'binh.tran@company.com',
    phone: '0912345678',
    role: 'MANAGER',
    team: 'Kinh doanh',
    status: 'active',
    created_at: '2025-02-10T09:30:00Z',
  },
  {
    id: 3,
    full_name: 'Lê Hoàng Cường',
    email: 'cuong.le@company.com',
    phone: '0923456789',
    role: 'STAFF',
    team: 'Kỹ thuật',
    status: 'active',
    created_at: '2025-03-05T10:15:00Z',
  },
  {
    id: 4,
    full_name: 'Phạm Minh Duy',
    email: 'duy.pham@company.com',
    role: 'STAFF',
    team: 'Kinh doanh',
    status: 'inactive',
    created_at: '2025-03-20T14:00:00Z',
  },
  {
    id: 5,
    full_name: 'Hoàng Thị Em',
    email: 'em.hoang@company.com',
    phone: '0945678901',
    role: 'STAFF',
    team: 'Hỗ trợ',
    status: 'active',
    created_at: '2025-04-01T08:45:00Z',
  },
  {
    id: 6,
    full_name: 'Võ Đức Phúc',
    email: 'phuc.vo@company.com',
    phone: '0956789012',
    role: 'MANAGER',
    team: 'Kỹ thuật',
    status: 'locked',
    created_at: '2025-04-15T11:20:00Z',
  },
  {
    id: 7,
    full_name: 'Đặng Thùy Giang',
    email: 'giang.dang@company.com',
    phone: '0967890123',
    role: 'STAFF',
    team: 'Hỗ trợ',
    status: 'active',
    created_at: '2025-05-10T09:00:00Z',
  },
  {
    id: 8,
    full_name: 'Bùi Quốc Hùng',
    email: 'hung.bui@company.com',
    role: 'STAFF',
    team: 'Kinh doanh',
    status: 'active',
    created_at: '2025-06-01T13:30:00Z',
  },
]

let mockUsers = [...MOCK_USERS]
let nextId = 9

/* ──────────── Helper ──────────── */
function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
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
    // body not JSON
  }
  return defaultMessage
}

/* ──────────── Kiểm tra API backend có sẵn không ──────────── */
let _useRealApi: boolean | null = null

async function shouldUseRealApi(): Promise<boolean> {
  if (_useRealApi !== null) return _useRealApi

  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(3000),
    })
    // Nếu server trả về (kể cả 401/403), nghĩa là endpoint tồn tại
    _useRealApi = res.status !== 404
  } catch {
    _useRealApi = false
  }
  return _useRealApi
}

/* ──────────── API Functions ──────────── */

/**
 * Lấy danh sách người dùng
 * GET /admin/users
 */
export async function getUsers(params?: {
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  team?: string
}): Promise<UserListResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.role) query.set('role', params.role)
    if (params?.status) query.set('status', params.status)
    if (params?.team) query.set('team', params.team)

    const url = `${API_BASE_URL}/admin/users${query.toString() ? '?' + query.toString() : ''}`

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
    } catch {
      throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL})`)
    }

    if (!response.ok) {
      const errorMsg = await parseErrorResponse(response, 'Không thể tải danh sách người dùng.')
      throw new Error(errorMsg)
    }

    return (await response.json()) as UserListResponse
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 400)) // Simulate network delay

  let filtered = [...mockUsers]
  if (params?.search) {
    const s = params.search.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.phone && u.phone.includes(s))
    )
  }
  if (params?.role) {
    filtered = filtered.filter((u) => u.role === params.role)
  }
  if (params?.status) {
    filtered = filtered.filter((u) => u.status === params.status)
  }
  if (params?.team) {
    filtered = filtered.filter((u) => u.team === params.team)
  }

  return { success: true, users: filtered, total: filtered.length }
}

/**
 * Tạo tài khoản mới
 * POST /admin/users
 */
export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
    } catch {
      throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL})`)
    }

    if (!response.ok) {
      const errorMsg = await parseErrorResponse(response, 'Không thể tạo tài khoản.')
      throw new Error(errorMsg)
    }

    return (await response.json()) as UserResponse
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 500))

  // Kiểm tra email trùng
  if (mockUsers.some((u) => u.email === payload.email)) {
    throw new Error('Email đã được sử dụng bởi tài khoản khác.')
  }

  const newUser: UserAccount = {
    id: nextId++,
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    team: payload.team,
    status: 'active',
    created_at: new Date().toISOString(),
  }

  mockUsers = [newUser, ...mockUsers]

  return { success: true, message: 'Tạo tài khoản thành công.', user: newUser }
}

/**
 * Cập nhật tài khoản
 * PUT /admin/users/:id
 */
export async function updateUser(
  userId: number,
  payload: UpdateUserRequest
): Promise<UserResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
    } catch {
      throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL})`)
    }

    if (!response.ok) {
      const errorMsg = await parseErrorResponse(response, 'Không thể cập nhật tài khoản.')
      throw new Error(errorMsg)
    }

    return (await response.json()) as UserResponse
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 400))

  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error('Không tìm thấy tài khoản.')
  }

  // Kiểm tra email trùng
  if (payload.email && payload.email !== mockUsers[idx].email) {
    if (mockUsers.some((u) => u.email === payload.email)) {
      throw new Error('Email đã được sử dụng bởi tài khoản khác.')
    }
  }

  mockUsers[idx] = {
    ...mockUsers[idx],
    ...payload,
    updated_at: new Date().toISOString(),
  }

  return { success: true, message: 'Cập nhật tài khoản thành công.', user: mockUsers[idx] }
}

/**
 * Lấy danh sách team duy nhất (dùng cho bộ lọc)
 */
export function getAvailableTeams(): string[] {
  const teams = new Set<string>()
  mockUsers.forEach((u) => {
    if (u.team) teams.add(u.team)
  })
  return Array.from(teams).sort()
}
