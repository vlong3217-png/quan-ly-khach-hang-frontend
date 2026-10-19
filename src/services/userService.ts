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

/* ──────────── LocalStorage Persistence Cache ──────────── */
const STORAGE_USERS_KEY = 'crm_users_cache'
const STORAGE_ASSIGNED_KEY = 'crm_users_assigned_cache'

function getInitialUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return [
    {
      id: 1,
      full_name: 'Quản trị viên',
      email: 'vlong3217@gmail.com',
      phone: '0901234567',
      role: 'ADMIN',
      team: 'Ban Giám đốc',
      status: 'active',
      is_active: true,
      created_at: '2025-01-15T08:00:00Z',
    },
  ]
}

function saveUsersToStorage(users: UserAccount[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
  } catch {
    // ignore
  }
}

let mockUsers: UserAccount[] = getInitialUsers()
let mockAssignedItems: Array<{ id: number; name: string; type: string; owner_id: number }> = []

try {
  const rawAssigned = localStorage.getItem(STORAGE_ASSIGNED_KEY)
  if (rawAssigned) {
    mockAssignedItems = JSON.parse(rawAssigned)
  }
} catch {
  // ignore
}

export function getMockUsers(): UserAccount[] {
  return [...mockUsers]
}

let nextId = Math.max(10, ...mockUsers.map((u) => u.id + 1))

/* ──────────── Helpers ──────────── */
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

/* ──────────── API Functions ──────────── */

/**
 * Lấy danh sách người dùng
 * Gọi trực tiếp API backend /users. Nếu timeout (Render cold start) hoặc mất mạng, fallback sang localStorage cache.
 */
export async function getUsers(params?: {
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  team?: string
  page?: number
  limit?: number
}): Promise<UserListResponse> {
  try {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    if (params?.role) query.set('role', params.role)
    if (params?.status === 'active') query.set('is_active', 'true')
    if (params?.status === 'locked' || params?.status === 'inactive') query.set('is_active', 'false')

    const res = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(30000), // Cho phép đến 30s khi Render cold start
    })

    if (res.ok) {
      const data = await res.json()
      const rawList: any[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : data.users || []

      const mappedUsers: UserAccount[] = rawList.map((u) => {
        let userStatus: UserStatus = 'active'
        if (u.status) {
          userStatus =
            u.status.toLowerCase() === 'locked'
              ? 'locked'
              : u.is_active === false
              ? 'inactive'
              : 'active'
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

      // Cập nhật và lưu vào storage cache
      mockUsers = mappedUsers
      saveUsersToStorage(mappedUsers)

      const total = typeof data.total === 'number' ? data.total : mappedUsers.length
      return {
        success: true,
        users: mappedUsers,
        total,
        page: data.page ?? params?.page ?? 1,
        limit: data.limit ?? params?.limit ?? 10,
        total_pages:
          data.total_pages ??
          Math.max(1, Math.ceil(total / (data.limit || params?.limit || 10))),
      }
    }
  } catch (err) {
    console.warn('Backend /users request failed or timed out, using local storage cache:', err)
  }

  // ── Fallback sang Cache LocalStorage ──
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
 * Gửi lên POST /users, đồng thời lưu ngay vào cache localStorage
 */
export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const roleNormalized = payload.role === 'STAFF' ? 'USER' : payload.role || 'USER'
  const backendBody = {
    email: payload.email.trim(),
    full_name: payload.full_name.trim(),
    password: payload.password,
    role: roleNormalized,
    username: payload.email.trim().split('@')[0],
    is_active: true,
  }

  let createdUser: UserAccount | null = null

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendBody),
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      const u = await response.json()
      createdUser = {
        id: u.id,
        full_name: u.full_name || payload.full_name,
        email: u.email || payload.email,
        phone: payload.phone,
        role: (u.role?.toUpperCase() || payload.role) as UserRole,
        team: payload.team,
        status: u.is_active ? 'active' : 'locked',
        is_active: u.is_active !== undefined ? u.is_active : true,
        created_at: u.created_at || new Date().toISOString(),
      }
    } else {
      const errData = await response.json().catch(() => null)
      if (errData?.detail) {
        const errorMsg = Array.isArray(errData.detail)
          ? errData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          : String(errData.detail)
        throw new Error(errorMsg)
      }
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('fetch') && !err.message.includes('timeout')) {
      throw err
    }
    console.warn('Network error creating user on backend, saving locally:', err)
  }

  // Nếu backend thành công hoặc nếu offline:
  if (!createdUser) {
    if (mockUsers.some((u) => u.email === payload.email)) {
      throw new Error('Email đã được sử dụng bởi tài khoản khác.')
    }
    createdUser = {
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
  }

  mockUsers = [createdUser, ...mockUsers.filter((u) => u.id !== createdUser!.id && u.email !== createdUser!.email)]
  saveUsersToStorage(mockUsers)

  return { success: true, message: 'Tạo tài khoản thành công.', user: createdUser }
}

/**
 * Cập nhật tài khoản
 * PUT /users/:id
 */
export async function updateUser(
  userId: number,
  payload: UpdateUserRequest
): Promise<UserResponse> {
  const updateBody: any = {}
  if (payload.full_name) updateBody.full_name = payload.full_name.trim()
  if (payload.email) updateBody.email = payload.email.trim()
  if (payload.role) updateBody.role = payload.role === 'STAFF' ? 'USER' : payload.role
  if (payload.status) updateBody.is_active = payload.status === 'active'

  let updatedUser: UserAccount | null = null

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateBody),
      signal: AbortSignal.timeout(30000),
    })
    if (response.ok) {
      const u = await response.json()
      updatedUser = {
        id: u.id,
        full_name: u.full_name || payload.full_name || '',
        email: u.email || payload.email || '',
        phone: payload.phone,
        role: (u.role?.toUpperCase() || payload.role || 'USER') as UserRole,
        team: payload.team,
        status: u.status?.toLowerCase() === 'locked' ? 'locked' : u.is_active ? 'active' : 'inactive',
        is_active: u.is_active,
        created_at: u.created_at || new Date().toISOString(),
      }
    }
  } catch (err) {
    console.warn('Backend update failed, updating locally:', err)
  }

  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx !== -1) {
    mockUsers[idx] = {
      ...mockUsers[idx],
      ...payload,
      is_active: payload.status ? payload.status === 'active' : mockUsers[idx].is_active,
      updated_at: new Date().toISOString(),
    }
    saveUsersToStorage(mockUsers)
    return { success: true, message: 'Cập nhật tài khoản thành công.', user: mockUsers[idx] }
  }

  return { success: true, message: 'Cập nhật tài khoản thành công.', user: updatedUser || (mockUsers[0] as UserAccount) }
}

/* ──────────── S1-10: Khóa / Mở khóa tài khoản & Bàn giao dữ liệu ──────────── */

/**
 * Lấy danh sách các dữ liệu đang do user phụ trách (khách hàng)
 */
export async function getUserAssignedData(userId: number): Promise<HandoverItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/assigned-data`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) {
      return (await res.json()) as HandoverItem[]
    }
  } catch {
    // Fallback to local
  }

  return mockAssignedItems.filter((item) => item.owner_id === userId)
}

/**
 * Cập nhật trạng thái tài khoản (Khóa hoặc Mở khóa)
 * PATCH /users/:id/status
 */
export async function updateUserStatus(
  userId: number,
  status: 'ACTIVE' | 'LOCKED',
  handoverToUserId?: number | null
): Promise<UserStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        handover_to_user_id: handoverToUserId || null,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      const data = (await response.json()) as UserStatusResponse
      const idx = mockUsers.findIndex((u) => u.id === userId)
      if (idx !== -1) {
        mockUsers[idx].status = status === 'LOCKED' ? 'locked' : 'active'
        mockUsers[idx].is_active = status === 'ACTIVE'
        saveUsersToStorage(mockUsers)
      }
      return data
    }

    const errorMsg = await parseErrorResponse(
      response,
      status === 'LOCKED' ? 'Không thể khóa tài khoản.' : 'Không thể mở khóa tài khoản.'
    )
    throw new Error(errorMsg)
  } catch (err) {
    if (err instanceof Error && !err.message.includes('fetch') && !err.message.includes('timeout')) {
      throw err
    }
  }

  // ── Local Fallback ──
  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error(`Không tìm thấy tài khoản người dùng với id ${userId}`)
  }

  let handoverResult: DataHandoverResponse | null = null

  if (status === 'LOCKED') {
    mockUsers[idx].status = 'locked'
    mockUsers[idx].is_active = false

    if (handoverToUserId) {
      const targetUser = mockUsers.find((u) => u.id === handoverToUserId)
      if (!targetUser) throw new Error(`Không tìm thấy người nhận bàn giao với id ${handoverToUserId}`)
      if (targetUser.id === userId) throw new Error('Không thể bàn giao dữ liệu cho chính tài khoản này')
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
      localStorage.setItem(STORAGE_ASSIGNED_KEY, JSON.stringify(mockAssignedItems))

      handoverResult = {
        success: true,
        message: `Bàn giao thành công ${transferred.length} mục dữ liệu từ user #${userId} sang user #${handoverToUserId}`,
        source_user_id: userId,
        target_user_id: handoverToUserId,
        transferred_items_count: transferred.length,
        transferred_items: transferred,
      }
    }

    saveUsersToStorage(mockUsers)

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
    mockUsers[idx].status = 'active'
    mockUsers[idx].is_active = true
    saveUsersToStorage(mockUsers)

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
  try {
    const response = await fetch(`${API_BASE_URL}/users/${sourceUserId}/handover`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_user_id: targetUserId }),
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      return (await response.json()) as DataHandoverResponse
    }

    const errorMsg = await parseErrorResponse(response, 'Bàn giao dữ liệu không thành công.')
    throw new Error(errorMsg)
  } catch (err) {
    if (err instanceof Error && !err.message.includes('fetch') && !err.message.includes('timeout')) throw err
  }

  const sourceUser = mockUsers.find((u) => u.id === sourceUserId)
  if (!sourceUser) throw new Error(`Không tìm thấy tài khoản nguồn #${sourceUserId}`)

  const targetUser = mockUsers.find((u) => u.id === targetUserId)
  if (!targetUser) throw new Error(`Không tìm thấy tài khoản nhận #${targetUserId}`)

  if (targetUserId === sourceUserId) throw new Error('Không thể bàn giao dữ liệu cho chính tài khoản này')
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
  localStorage.setItem(STORAGE_ASSIGNED_KEY, JSON.stringify(mockAssignedItems))

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

export const userService = {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getUserAssignedData,
  handoverUserData,
  getAvailableTeams,
}