import type {
  UserAccount,
  UserListResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatus,
  UserRole,
  RoleInfoResponse,
  TeamInfoResponse,
  TeamOption,
  AssignmentResponse,
} from '../types/user.ts'
import { API_BASE_URL } from './authService.ts'

/* ──────────── System Constants (S1-09) ──────────── */
export const SYSTEM_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'ADMIN', label: 'Quản trị viên (Admin)', description: 'Toàn quyền quản trị hệ thống' },
  { value: 'MANAGER', label: 'Quản lý (Manager)', description: 'Quản lý đội nhóm và khách hàng' },
  { value: 'USER', label: 'Nhân viên (User)', description: 'Xem và xử lý khách hàng được phân công' },
]

export const SYSTEM_TEAMS: TeamOption[] = [
  { id: 1, name: 'Team A' },
  { id: 2, name: 'Team B' },
  { id: 3, name: 'Team Kinh Doanh' },
  { id: 4, name: 'Team Hỗ Trợ Kỹ Thuật' },
]

/* ──────────── Mock Data ──────────── */
const MOCK_USERS: UserAccount[] = [
  {
    id: 1,
    full_name: 'Nguyễn Văn An',
    email: 'admin@company.com',
    phone: '0901234567',
    role: 'ADMIN',
    team: 'Team A',
    team_id: 1,
    status: 'active',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 2,
    full_name: 'Trần Thị Bình',
    email: 'binh.tran@company.com',
    phone: '0912345678',
    role: 'MANAGER',
    team: 'Team A',
    team_id: 1,
    status: 'active',
    created_at: '2025-02-10T09:30:00Z',
  },
  {
    id: 3,
    full_name: 'Lê Hoàng Cường',
    email: 'cuong.le@company.com',
    phone: '0923456789',
    role: 'USER',
    team: 'Team B',
    team_id: 2,
    status: 'active',
    created_at: '2025-03-05T10:15:00Z',
  },
  {
    id: 4,
    full_name: 'Phạm Minh Duy',
    email: 'duy.pham@company.com',
    role: 'USER',
    team: 'Team A',
    team_id: 1,
    status: 'inactive',
    created_at: '2025-03-20T14:00:00Z',
  },
  {
    id: 5,
    full_name: 'Hoàng Thị Em',
    email: 'em.hoang@company.com',
    phone: '0945678901',
    role: 'USER',
    team: 'Team B',
    team_id: 2,
    status: 'active',
    created_at: '2025-04-01T08:45:00Z',
  },
  {
    id: 6,
    full_name: 'Võ Đức Phúc',
    email: 'phuc.vo@company.com',
    phone: '0956789012',
    role: 'MANAGER',
    team: 'Team B',
    team_id: 2,
    status: 'locked',
    created_at: '2025-04-15T11:20:00Z',
  },
  {
    id: 7,
    full_name: 'Đặng Thùy Giang',
    email: 'giang.dang@company.com',
    phone: '0967890123',
    role: 'USER',
    team: 'Team Kinh Doanh',
    team_id: 3,
    status: 'active',
    created_at: '2025-05-10T09:00:00Z',
  },
  {
    id: 8,
    full_name: 'Bùi Quốc Hùng',
    email: 'hung.bui@company.com',
    phone: '0978901234',
    role: 'USER',
    team: 'Team Hỗ Trợ Kỹ Thuật',
    team_id: 4,
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
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(3000),
    })
    // Endpoint /users/me của S1-09 backend tồn tại (kể cả 401/403)
    _useRealApi = res.status !== 404
  } catch {
    _useRealApi = false
  }
  return _useRealApi
}

/* ──────────── API Functions (Users) ──────────── */

/**
 * Lấy danh sách người dùng
 * Thử GET /users (Backend S1-09/S1-08) hoặc GET /admin/users (Legacy)
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
      // 1. Thử endpoint /users
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        const data = await res.json()
        const rawUsers: any[] = data.users || (Array.isArray(data) ? data : [])
        const mappedUsers: UserAccount[] = rawUsers.map((u) => {
          const teamObj = SYSTEM_TEAMS.find((t) => t.id === u.team_id)
          return {
            id: u.id,
            full_name: u.full_name || u.username || u.email,
            email: u.email,
            phone: u.phone,
            role: (u.role?.toUpperCase() || 'USER') as UserRole,
            team_id: u.team_id ?? null,
            team: teamObj ? teamObj.name : u.team_id ? `Team ${u.team_id}` : undefined,
            status: (u.is_active === false ? 'inactive' : 'active') as UserStatus,
            created_at: u.created_at || new Date().toISOString(),
          }
        })

        let filtered = mappedUsers
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
        if (params?.team) {
          filtered = filtered.filter((u) => u.team === params.team)
        }

        return { success: true, users: filtered, total: filtered.length }
      }
    } catch {
      // Fallback
    }

    // 2. Thử endpoint legacy /admin/users
    try {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.role) query.set('role', params.role)
      if (params?.status) query.set('status', params.status)
      if (params?.team) query.set('team', params.team)

      const res = await fetch(
        `${API_BASE_URL}/admin/users${query.toString() ? '?' + query.toString() : ''}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      )
      if (res.ok) {
        return (await res.json()) as UserListResponse
      }
    } catch {
      // Fallback to mock
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 300))

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
      if (response.ok) {
        return (await response.json()) as UserResponse
      }
    } catch {
      // Fallback
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 400))

  if (mockUsers.some((u) => u.email === payload.email)) {
    throw new Error('Email đã được sử dụng bởi tài khoản khác.')
  }

  const teamObj = SYSTEM_TEAMS.find((t) => t.name === payload.team)

  const newUser: UserAccount = {
    id: nextId++,
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    team: payload.team,
    team_id: teamObj ? teamObj.id : null,
    status: 'active',
    created_at: new Date().toISOString(),
  }

  mockUsers = [newUser, ...mockUsers]

  return { success: true, message: 'Tạo tài khoản thành công.', user: newUser }
}

/**
 * Cập nhật tài khoản (Legacy/S1-08)
 */
export async function updateUser(
  userId: number,
  payload: UpdateUserRequest
): Promise<UserResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        return (await response.json()) as UserResponse
      }
    } catch {
      // Fallback
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 350))

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
    updated_at: new Date().toISOString(),
  }

  return { success: true, message: 'Cập nhật tài khoản thành công.', user: mockUsers[idx] }
}

/* ──────────── S1-09: Role & Team Assignment API Functions ──────────── */

/**
 * 1. Xem Role hiện tại của user (ADMIN only)
 * GET /users/:id/role
 */
export async function getUserRole(userId: number): Promise<RoleInfoResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        return (await response.json()) as RoleInfoResponse
      }

      const errorMsg = await parseErrorResponse(response, 'Không thể tải thông tin Role của người dùng.')
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) throw err
      // If network fails, proceed with mock fallback
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 250))
  const u = mockUsers.find((user) => user.id === userId)
  if (!u) {
    throw new Error(`Không tìm thấy người dùng với ID ${userId}`)
  }

  return {
    user_id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
  }
}

/**
 * 2. Gán hoặc thay đổi Role của user (ADMIN only)
 * PUT /users/:id/role
 * Body: { role: string }
 */
export async function assignUserRole(userId: number, role: string): Promise<RoleInfoResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        const data = (await response.json()) as RoleInfoResponse
        // Đồng bộ local mock state
        const idx = mockUsers.findIndex((u) => u.id === userId)
        if (idx !== -1) {
          mockUsers[idx] = { ...mockUsers[idx], role: data.role as UserRole }
        }
        return data
      }

      const errorMsg = await parseErrorResponse(response, 'Không thể cập nhật Role.')
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) throw err
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 350))
  const validRoles = ['ADMIN', 'MANAGER', 'USER', 'STAFF']
  if (!validRoles.includes(role.toUpperCase())) {
    throw new Error(`Role '${role}' không hợp lệ. Các role hợp lệ: ADMIN, MANAGER, USER`)
  }

  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error(`Không tìm thấy người dùng với ID ${userId}`)
  }

  mockUsers[idx] = {
    ...mockUsers[idx],
    role: role.toUpperCase() as UserRole,
    updated_at: new Date().toISOString(),
  }

  return {
    user_id: mockUsers[idx].id,
    email: mockUsers[idx].email,
    full_name: mockUsers[idx].full_name,
    role: mockUsers[idx].role,
  }
}

/**
 * 3. Xem Team hiện tại của user (ADMIN only)
 * GET /users/:id/team
 */
export async function getUserTeam(userId: number): Promise<TeamInfoResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/team`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        return (await response.json()) as TeamInfoResponse
      }

      const errorMsg = await parseErrorResponse(response, 'Không thể tải thông tin Team của người dùng.')
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) throw err
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 250))
  const u = mockUsers.find((user) => user.id === userId)
  if (!u) {
    throw new Error(`Không tìm thấy người dùng với ID ${userId}`)
  }

  return {
    user_id: u.id,
    email: u.email,
    full_name: u.full_name,
    team_id: u.team_id ?? null,
    team_name: u.team ?? null,
  }
}

/**
 * 4. Gán hoặc thay đổi Team của user (ADMIN only)
 * PUT /users/:id/team
 * Body: { team_id: number | null }
 */
export async function assignUserTeam(userId: number, teamId: number | null): Promise<TeamInfoResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/team`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ team_id: teamId }),
      })

      if (response.ok) {
        const data = (await response.json()) as TeamInfoResponse
        const idx = mockUsers.findIndex((u) => u.id === userId)
        if (idx !== -1) {
          mockUsers[idx] = {
            ...mockUsers[idx],
            team_id: data.team_id,
            team: data.team_name || undefined,
          }
        }
        return data
      }

      const errorMsg = await parseErrorResponse(response, 'Không thể cập nhật Team.')
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) throw err
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 350))
  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error(`Không tìm thấy người dùng với ID ${userId}`)
  }

  let teamName: string | null = null
  if (teamId !== null) {
    const found = SYSTEM_TEAMS.find((t) => t.id === teamId)
    if (!found) {
      throw new Error(`Team ID ${teamId} không tồn tại trong hệ thống`)
    }
    teamName = found.name
  }

  mockUsers[idx] = {
    ...mockUsers[idx],
    team_id: teamId,
    team: teamName || undefined,
    updated_at: new Date().toISOString(),
  }

  return {
    user_id: mockUsers[idx].id,
    email: mockUsers[idx].email,
    full_name: mockUsers[idx].full_name,
    team_id: teamId,
    team_name: teamName,
  }
}

/**
 * 5. Gán hoặc thay đổi đồng thời Role & Team (ADMIN only)
 * PUT /users/:id/assign
 * Body: { role?: string, team_id?: number | null }
 */
export async function assignUserRoleAndTeam(
  userId: number,
  payload: { role?: string; team_id?: number | null }
): Promise<AssignmentResponse> {
  const useReal = await shouldUseRealApi()

  if (useReal) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/assign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const updated = await response.json()
        const teamObj = SYSTEM_TEAMS.find((t) => t.id === updated.team_id)
        const userAccount: UserAccount = {
          id: updated.id,
          full_name: updated.full_name,
          email: updated.email,
          role: updated.role as UserRole,
          team_id: updated.team_id,
          team: teamObj ? teamObj.name : updated.team_id ? `Team ${updated.team_id}` : undefined,
          status: updated.is_active ? 'active' : 'inactive',
          created_at: new Date().toISOString(),
        }

        const idx = mockUsers.findIndex((u) => u.id === userId)
        if (idx !== -1) {
          mockUsers[idx] = { ...mockUsers[idx], ...userAccount }
        }

        return {
          success: true,
          message: 'Cập nhật Role và Team thành công.',
          user: userAccount,
        }
      }

      const errorMsg = await parseErrorResponse(response, 'Cập nhật phân quyền thất bại.')
      throw new Error(errorMsg)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('fetch')) throw err
    }
  }

  // ── Mock ──
  await new Promise((r) => setTimeout(r, 400))
  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) {
    throw new Error(`Không tìm thấy người dùng với ID ${userId}`)
  }

  if (payload.role) {
    const validRoles = ['ADMIN', 'MANAGER', 'USER', 'STAFF']
    if (!validRoles.includes(payload.role.toUpperCase())) {
      throw new Error(`Role '${payload.role}' không hợp lệ. Các role hợp lệ: ADMIN, MANAGER, USER`)
    }
  }

  let teamName = mockUsers[idx].team
  if (payload.team_id !== undefined) {
    if (payload.team_id === null) {
      teamName = undefined
    } else {
      const found = SYSTEM_TEAMS.find((t) => t.id === payload.team_id)
      if (!found) {
        throw new Error(`Team ID ${payload.team_id} không tồn tại trong hệ thống`)
      }
      teamName = found.name
    }
  }

  mockUsers[idx] = {
    ...mockUsers[idx],
    role: payload.role ? (payload.role.toUpperCase() as UserRole) : mockUsers[idx].role,
    team_id: payload.team_id !== undefined ? payload.team_id : mockUsers[idx].team_id,
    team: teamName,
    updated_at: new Date().toISOString(),
  }

  return {
    success: true,
    message: 'Cập nhật Role và Team thành công.',
    user: mockUsers[idx],
  }
}

/**
 * Lấy danh sách team duy nhất (dùng cho bộ lọc và select)
 */
export function getAvailableTeams(): string[] {
  const teams = new Set<string>()
  SYSTEM_TEAMS.forEach((t) => teams.add(t.name))
  mockUsers.forEach((u) => {
    if (u.team) teams.add(u.team)
  })
  return Array.from(teams).sort()
}
