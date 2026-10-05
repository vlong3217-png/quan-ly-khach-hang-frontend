import type {
  UserAccount,
  UserListResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatus,
  UserRole,
  UserStatusResponse,
  DataHandoverResponse,
  HandoverItem,
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
    is_active: true,
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
    is_active: true,
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
    is_active: true,
    created_at: '2025-03-05T10:15:00Z',
  },
  {
    id: 4,
    full_name: 'Phạm Minh Duy',
    email: 'duy.pham@company.com',
    role: 'STAFF',
    team: 'Kinh doanh',
    status: 'inactive',
    is_active: false,
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
    is_active: true,
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
    is_active: false,
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
    is_active: true,
    created_at: '2025-05-10T09:00:00Z',
  },
  {
    id: 8,
    full_name: 'Bùi Quốc Hùng',
    email: 'hung.bui@company.com',
    role: 'STAFF',
    team: 'Kinh doanh',
    status: 'active',
    is_active: true,
    created_at: '2025-06-01T13:30:00Z',
  },
]

// Mock dữ liệu phụ trách của từng user (cho tính năng bàn giao dữ liệu S1-10)
let mockAssignedItems: Array<{ id: number; name: string; type: string; owner_id: number }> = [
  { id: 1, name: 'Công ty TNHH Ánh Dương', type: 'customer', owner_id: 3 },
  { id: 2, name: 'Tập đoàn Công nghệ Sao Mai', type: 'customer', owner_id: 3 },
  { id: 3, name: 'Doanh nghiệp Tư nhân Hoàng Gia', type: 'customer', owner_id: 2 },
  { id: 4, name: 'Công ty Cổ phần Đại Phát', type: 'customer', owner_id: 5 },
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
    // Kiểm tra endpoint backend S1-10 /users
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(3000),
    })
    _useRealApi = res.status !== 404
  } catch {
    _useRealApi = false
  }
  return _useRealApi
}

/* ──────────── API Functions ──────────── */

/**
 * Lấy danh sách người dùng
 * Hỗ trợ GET /users (S1-10 backend) hoặc GET /admin/users (Legacy)
 */
export async function getUsers(params?: {
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  team?: string
}): Promise<UserListResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.role) query.set('role', params.role)
      if (params?.status === 'active') query.set('is_active', 'true')
      if (params?.status === 'locked' || params?.status === 'inactive') query.set('is_active', 'false')

      const res = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        const data = await res.json()
        const rawList: any[] = Array.isArray(data) ? data : data.users || []
        const mappedUsers: UserAccount[] = rawList.map((u) => {
          let userStatus: UserStatus = 'active'
          if (u.status) {
            userStatus = u.status.toLowerCase() === 'locked' ? 'locked' : (u.is_active === false ? 'inactive' : 'active')
          } else if (u.is_active === false) {
            userStatus = 'locked'
          }
          return {
            id: u.id,
            full_name: u.full_name || u.username || u.email,
            email: u.email,
            phone: u.phone,
            role: (u.role?.toUpperCase() || 'STAFF') as UserRole,
            team: u.team,
            status: userStatus,
            is_active: u.is_active,
            created_at: u.created_at || new Date().toISOString(),
          }
        })
        return { success: true, users: mappedUsers, total: mappedUsers.length }
      }
    } catch {
      // Fallback
    }

    try {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.role) query.set('role', params.role)
      if (params?.status) query.set('status', params.status)
      if (params?.team) query.set('team', params.team)

      const url = `${API_BASE_URL}/admin/users${query.toString() ? '?' + query.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        return (await response.json()) as UserListResponse
      }
    } catch {
      // Fallback to mock
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 200))

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
 * POST /admin/users hoặc POST /users
 */
export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    const roleNormalized = payload.role === 'STAFF' ? 'USER' : (payload.role || 'USER')
    const backendBody = {
      email: payload.email.trim(),
      full_name: payload.full_name.trim(),
      password: payload.password,
      role: roleNormalized,
      username: payload.email.trim().split('@')[0],
      is_active: true,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendBody),
      })

      if (response.ok) {
        const u = await response.json()
        return {
          success: true,
          message: 'Tạo tài khoản thành công.',
          user: {
            ...u,
            phone: payload.phone,
            team: payload.team,
            status: u.is_active ? 'active' : 'locked',
            created_at: u.created_at || new Date().toISOString(),
          },
        }
      }

      // Nếu backend trả về lỗi (400, 422, etc.), trích xuất thông báo chi tiết
      const errData = await response.json().catch(() => null)
      if (errData?.detail) {
        const errorMsg = Array.isArray(errData.detail)
          ? errData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          : String(errData.detail)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) {
        throw err
      }
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 300))

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
    is_active: true,
    created_at: new Date().toISOString(),
  }

  mockUsers = [newUser, ...mockUsers]

  return { success: true, message: 'Tạo tài khoản thành công.', user: newUser }
}

/**
 * Cập nhật tài khoản
 * PUT /admin/users/:id hoặc PUT /users/:id
 */
export async function updateUser(
  userId: number,
  payload: UpdateUserRequest
): Promise<UserResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    const updateBody: any = {}
    if (payload.full_name) updateBody.full_name = payload.full_name.trim()
    if (payload.email) updateBody.email = payload.email.trim()
    if (payload.role) updateBody.role = payload.role === 'STAFF' ? 'USER' : payload.role
    if (payload.status) updateBody.is_active = payload.status === 'active'

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateBody),
      })
      if (response.ok) {
        const u = await response.json()
        return {
          success: true,
          message: 'Cập nhật tài khoản thành công.',
          user: {
            ...u,
            phone: payload.phone,
            team: payload.team,
            status: u.status?.toLowerCase() === 'locked' ? 'locked' : (u.is_active ? 'active' : 'inactive'),
          },
        }
      }

      const errData = await response.json().catch(() => null)
      if (errData?.detail) {
        const errorMsg = Array.isArray(errData.detail)
          ? errData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          : String(errData.detail)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) {
        throw err
      }
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 300))

  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error('Không tìm thấy tài khoản.')
  }

  if (payload.email && payload.email !== mockUsers[idx].email) {
    if (mockUsers.some((u) => u.email === payload.email)) {
      throw new Error('Email đã được sử dụng bởi tài khoản khác.')
    }
  }

  mockUsers[idx] = {
    ...mockUsers[idx],
    ...payload,
    is_active: payload.status ? payload.status === 'active' : mockUsers[idx].is_active,
    updated_at: new Date().toISOString(),
  }

  return { success: true, message: 'Cập nhật tài khoản thành công.', user: mockUsers[idx] }
}

/* ──────────── S1-10: Khóa / Mở khóa tài khoản & Bàn giao dữ liệu ──────────── */

/**
 * Lấy danh sách các dữ liệu đang do user phụ trách (khách hàng)
 */
export async function getUserAssignedData(userId: number): Promise<HandoverItem[]> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      // Nếu backend có endpoint riêng hoặc mock
      const res = await fetch(`${API_BASE_URL}/users/${userId}/assigned-data`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        return (await res.json()) as HandoverItem[]
      }
    } catch {
      // Fallback to mock
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 150))
  return mockAssignedItems.filter((item) => item.owner_id === userId)
}

/**
 * Cập nhật trạng thái tài khoản (Khóa hoặc Mở khóa)
 * PATCH /users/:id/status
 * Body: { status: "ACTIVE" | "LOCKED", handover_to_user_id?: number | null }
 */
export async function updateUserStatus(
  userId: number,
  status: 'ACTIVE' | 'LOCKED',
  handoverToUserId?: number | null
): Promise<UserStatusResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status,
          handover_to_user_id: handoverToUserId || null,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as UserStatusResponse
        // Đồng bộ mock cache
        const idx = mockUsers.findIndex((u) => u.id === userId)
        if (idx !== -1) {
          mockUsers[idx].status = status === 'LOCKED' ? 'locked' : 'active'
          mockUsers[idx].is_active = status === 'ACTIVE'
        }
        return data
      }

      const errorMsg = await parseErrorResponse(
        response,
        status === 'LOCKED' ? 'Không thể khóa tài khoản.' : 'Không thể mở khóa tài khoản.'
      )
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) {
        throw err
      }
      // Fallback sang mock nếu server lỗi mạng
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 350))

  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error(`Không tìm thấy tài khoản người dùng với id ${userId}`)
  }

  let handoverResult: DataHandoverResponse | null = null

  if (status === 'LOCKED') {
    mockUsers[idx].status = 'locked'
    mockUsers[idx].is_active = false

    // Thực hiện bàn giao nếu có chỉ định người nhận
    if (handoverToUserId) {
      const targetUser = mockUsers.find((u) => u.id === handoverToUserId)
      if (!targetUser) {
        throw new Error(`Không tìm thấy người nhận bàn giao với id ${handoverToUserId}`)
      }
      if (targetUser.id === userId) {
        throw new Error('Không thể bàn giao dữ liệu cho chính tài khoản này')
      }
      if (targetUser.status === 'locked' || targetUser.is_active === false) {
        throw new Error('Không thể bàn giao dữ liệu cho tài khoản đang bị khóa')
      }

      const transferred: HandoverItem[] = []
      mockAssignedItems.forEach((item) => {
        if (item.owner_id === userId) {
          item.owner_id = handoverToUserId
          transferred.push({ id: item.id, type: item.type, name: item.name })
        }
      })

      handoverResult = {
        success: true,
        message: `Bàn giao thành công ${transferred.length} mục dữ liệu từ user #${userId} sang user #${handoverToUserId}`,
        source_user_id: userId,
        target_user_id: handoverToUserId,
        transferred_items_count: transferred.length,
        transferred_items: transferred,
      }
    }

    return {
      id: mockUsers[idx].id,
      email: mockUsers[idx].email,
      full_name: mockUsers[idx].full_name,
      role: mockUsers[idx].role,
      is_active: false,
      status: 'LOCKED',
      message: `Đã khóa tài khoản thành công cho user #${userId}${
        handoverToUserId ? ` và bàn giao dữ liệu sang user #${handoverToUserId}` : ''
      }`,
      handover: handoverResult,
    }
  } else {
    // Mở khóa (ACTIVE)
    mockUsers[idx].status = 'active'
    mockUsers[idx].is_active = true

    return {
      id: mockUsers[idx].id,
      email: mockUsers[idx].email,
      full_name: mockUsers[idx].full_name,
      role: mockUsers[idx].role,
      is_active: true,
      status: 'ACTIVE',
      message: `Đã mở khóa tài khoản thành công cho user #${userId}`,
      handover: null,
    }
  }
}

/**
 * Bàn giao dữ liệu riêng biệt
 * POST /users/:id/handover
 */
export async function handoverUserData(
  sourceUserId: number,
  targetUserId: number
): Promise<DataHandoverResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${sourceUserId}/handover`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ target_user_id: targetUserId }),
      })

      if (response.ok) {
        return (await response.json()) as DataHandoverResponse
      }

      const errorMsg = await parseErrorResponse(response, 'Bàn giao dữ liệu không thành công.')
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) throw err
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 300))

  const sourceUser = mockUsers.find((u) => u.id === sourceUserId)
  if (!sourceUser) throw new Error(`Không tìm thấy tài khoản nguồn #${sourceUserId}`)

  const targetUser = mockUsers.find((u) => u.id === targetUserId)
  if (!targetUser) throw new Error(`Không tìm thấy tài khoản nhận #${targetUserId}`)

  if (targetUserId === sourceUserId) {
    throw new Error('Không thể bàn giao dữ liệu cho chính tài khoản này')
  }

  if (targetUser.status === 'locked' || targetUser.is_active === false) {
    throw new Error('Không thể bàn giao dữ liệu cho tài khoản đang bị khóa')
  }

  const transferred: HandoverItem[] = []
  mockAssignedItems.forEach((item) => {
    if (item.owner_id === sourceUserId) {
      item.owner_id = targetUserId
      transferred.push({ id: item.id, type: item.type, name: item.name })
    }
  })

  return {
    success: true,
    message: `Bàn giao thành công ${transferred.length} mục dữ liệu từ user #${sourceUserId} sang user #${targetUserId}`,
    source_user_id: sourceUserId,
    target_user_id: targetUserId,
    transferred_items_count: transferred.length,
    transferred_items: transferred,
  }
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
