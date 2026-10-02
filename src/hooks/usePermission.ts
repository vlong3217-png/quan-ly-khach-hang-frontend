import { useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { Role, Permission, DataScope } from '../types/auth.ts'
import {
  getUserPermissions,
  getUserDataScope,
} from '../constants/permissions.ts'
import {
  canAccessItem,
  filterByScope,
  type ScopeFilterOptions,
} from '../utils/dataScope.ts'

import {
  checkUserRole,
  checkUserPermission,
} from '../utils/permissionUtils.ts'

export { checkUserRole, checkUserPermission }

/* ──────────── React Hook ──────────── */
export function usePermission() {
  const { user, isAuthenticated } = useAuth()

  const role = useMemo<Role | null>(() => {
    return user ? user.role : null
  }, [user])

  const permissions = useMemo<Permission[]>(() => {
    return getUserPermissions(user)
  }, [user])

  const scope = useMemo<DataScope>(() => {
    return getUserDataScope(user)
  }, [user])

  const hasRole = useCallback(
    (targetRoles: Role | Role[]): boolean => {
      if (!isAuthenticated) return false
      return checkUserRole(user, targetRoles)
    },
    [user, isAuthenticated]
  )

  const hasPermission = useCallback(
    (targetPermission: Permission | Permission[], requireAll: boolean = false): boolean => {
      if (!isAuthenticated) return false
      return checkUserPermission(user, targetPermission, requireAll)
    },
    [user, isAuthenticated]
  )

  const canAccess = useCallback(
    <T>(item: T, options?: ScopeFilterOptions<T>): boolean => {
      if (!isAuthenticated) return false
      return canAccessItem(item, user, options)
    },
    [user, isAuthenticated]
  )

  const filterScopedData = useCallback(
    <T>(items: T[], options?: ScopeFilterOptions<T>): T[] => {
      if (!isAuthenticated) return []
      return filterByScope(items, user, options)
    },
    [user, isAuthenticated]
  )

  return {
    user,
    isAuthenticated,
    role,
    permissions,
    scope,
    hasRole,
    hasPermission,
    canAccess,
    filterScopedData,
  }
}
