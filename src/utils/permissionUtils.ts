import type { Role, Permission, User } from '../types/auth.ts'
import { getUserPermissions } from '../constants/permissions.ts'

/**
 * Kiểm tra xem user có vai trò phù hợp hay không (hàm thuần túy, có thể dùng ngoài React).
 */
export function checkUserRole(user: User | null, targetRoles: Role | Role[]): boolean {
  if (!user || !user.role) return false
  const userRole = String(user.role).trim().toUpperCase()
  const rolesList = Array.isArray(targetRoles) ? targetRoles : [targetRoles]
  return rolesList.some((r) => String(r).trim().toUpperCase() === userRole)
}

/**
 * Kiểm tra xem user có quyền hạn cụ thể hay không (hàm thuần túy, có thể dùng ngoài React).
 * @param requireAll Nếu true, yêu cầu phải có TẤT CẢ các quyền trong mảng; mặc định false (chỉ cần ít nhất 1).
 */
export function checkUserPermission(
  user: User | null,
  targetPermission: Permission | Permission[],
  requireAll: boolean = false
): boolean {
  if (!user) return false
  const userPermissions = getUserPermissions(user)

  if (Array.isArray(targetPermission)) {
    if (targetPermission.length === 0) return true
    if (requireAll) {
      return targetPermission.every((perm) => userPermissions.includes(perm))
    }
    return targetPermission.some((perm) => userPermissions.includes(perm))
  }

  return userPermissions.includes(targetPermission)
}
