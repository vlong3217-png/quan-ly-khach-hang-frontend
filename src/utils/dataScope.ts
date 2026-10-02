import type { User, DataScope } from '../types/auth.ts'
import { DATA_SCOPES, getUserDataScope } from '../constants/permissions.ts'

export interface ScopeFilterOptions<T> {
  /** Hàm trích xuất ID người phụ trách/sở hữu bản ghi */
  getOwnerId?: (item: T) => number | string | undefined
  /** Hàm trích xuất ID đội nhóm của bản ghi */
  getTeamId?: (item: T) => number | string | undefined
  /** Phạm vi dữ liệu ghi đè (nếu muốn thử nghiệm hoặc người dùng chọn phạm vi hẹp hơn) */
  overrideScope?: DataScope
}

/**
 * Trích xuất ID người sở hữu từ bản ghi một cách an toàn.
 * Hỗ trợ các trường thông dụng: owner_id, created_by, assigned_to, user_id, userId, ownerId.
 */
function extractOwnerId<T>(item: T, customExtractor?: (item: T) => number | string | undefined): string | null {
  if (customExtractor) {
    const val = customExtractor(item)
    return val !== undefined && val !== null ? String(val) : null
  }

  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>
    const candidate =
      record.owner_id ??
      record.created_by ??
      record.assigned_to ??
      record.user_id ??
      record.userId ??
      record.ownerId

    if (candidate !== undefined && candidate !== null) {
      return String(candidate)
    }
  }

  return null
}

/**
 * Trích xuất ID đội nhóm từ bản ghi một cách an toàn.
 * Hỗ trợ các trường thông dụng: team_id, department_id, teamId, departmentId.
 */
function extractTeamId<T>(item: T, customExtractor?: (item: T) => number | string | undefined): string | null {
  if (customExtractor) {
    const val = customExtractor(item)
    return val !== undefined && val !== null ? String(val) : null
  }

  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>
    const candidate =
      record.team_id ??
      record.department_id ??
      record.teamId ??
      record.departmentId

    if (candidate !== undefined && candidate !== null) {
      return String(candidate)
    }
  }

  return null
}

/**
 * Kiểm tra xem người dùng hiện tại có quyền truy cập vào một bản ghi cụ thể theo phạm vi dữ liệu hay không.
 *
 * Quy tắc:
 * - ALL: Toàn quyền truy cập mọi bản ghi.
 * - TEAM: Được truy cập nếu bản ghi thuộc cùng đội nhóm (team_id), hoặc nếu bản ghi là của chính mình.
 * - MY: Chỉ được truy cập nếu bản ghi do chính người dùng phụ trách/tạo ra (owner_id).
 */
export function canAccessItem<T>(
  item: T,
  user: User | null,
  options?: ScopeFilterOptions<T>
): boolean {
  if (!user) return false

  const scope = options?.overrideScope ?? getUserDataScope(user)

  // 1. Toàn quyền xem mọi dữ liệu
  if (scope === DATA_SCOPES.ALL) {
    return true
  }

  const userIdStr = String(user.id)
  const itemOwnerId = extractOwnerId(item, options?.getOwnerId)

  // 2. Phạm vi đội nhóm (TEAM)
  if (scope === DATA_SCOPES.TEAM) {
    const itemTeamId = extractTeamId(item, options?.getTeamId)
    const userTeamId = user.team_id !== undefined && user.team_id !== null ? String(user.team_id) : null

    // Nếu cùng đội nhóm -> cho phép
    if (userTeamId && itemTeamId && userTeamId === itemTeamId) {
      return true
    }

    // Nếu bản ghi là của chính người dùng phụ trách -> luôn cho phép
    if (itemOwnerId && itemOwnerId === userIdStr) {
      return true
    }

    return false
  }

  // 3. Phạm vi cá nhân (MY)
  if (scope === DATA_SCOPES.MY) {
    return Boolean(itemOwnerId && itemOwnerId === userIdStr)
  }

  return false
}

/**
 * Lọc danh sách dữ liệu theo phạm vi dữ liệu của người dùng.
 *
 * @param items Danh sách bản ghi cần lọc
 * @param user Thông tin người dùng hiện tại
 * @param options Tùy chọn trích xuất ownerId / teamId hoặc overrideScope
 * @returns Mảng bản ghi thỏa mãn phạm vi hiển thị
 */
export function filterByScope<T>(
  items: T[],
  user: User | null,
  options?: ScopeFilterOptions<T>
): T[] {
  if (!user || !Array.isArray(items)) {
    return []
  }

  return items.filter((item) => canAccessItem(item, user, options))
}
