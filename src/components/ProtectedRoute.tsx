import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { Role, Permission } from '../types/auth.ts'
import { checkUserRole, checkUserPermission } from '../utils/permissionUtils.ts'

export interface ProtectedRouteProps {
  children: ReactNode
  /** Danh sách vai trò được phép truy cập route này (ví dụ: [ROLES.ADMIN, ROLES.MANAGER]) */
  roles?: Role | Role[]
  /** Quyền hạn hoặc danh sách quyền hạn yêu cầu để truy cập route này */
  permission?: Permission | Permission[]
  /** Yêu cầu thỏa mãn tất cả các quyền nếu permission là mảng (mặc định false: chỉ cần 1) */
  requireAll?: boolean
  /** Đường dẫn chuyển hướng khi không có quyền (mặc định là '/forbidden') */
  redirectTo?: string
}

/**
 * Route Guard kiểm soát truy cập và bảo vệ phân quyền ở cấp độ Route (User Story S1-07):
 * 1. Nếu chưa đăng nhập: Giữ nguyên cơ chế xác thực hiện tại, chuyển hướng về /login.
 * 2. Nếu đã đăng nhập nhưng không có Role hoặc Permission phù hợp:
 *    - Không hiển thị nội dung của trang được bảo vệ.
 *    - Chuyển hướng người dùng sang trang lỗi Forbidden (/forbidden).
 * 3. Nếu thỏa mãn toàn bộ quyền hạn: Render nội dung trang bình thường.
 */
export default function ProtectedRoute({
  children,
  roles,
  permission,
  requireAll = false,
  redirectTo = '/forbidden',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // Đang kiểm tra token / session từ storage → tránh flash giao diện
    return null
  }

  // 1. Người dùng chưa đăng nhập → chuyển về /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 2. Kiểm tra vai trò (Role): Nếu chỉ định roles mà user không khớp → chuyển đến trang Forbidden
  if (roles && !checkUserRole(user, roles)) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location.pathname,
          reason: 'role',
          requiredRoles: Array.isArray(roles) ? roles : [roles],
        }}
      />
    )
  }

  // 3. Kiểm tra quyền hạn (Permission): Nếu chỉ định permission mà user không có → chuyển đến trang Forbidden
  if (permission && !checkUserPermission(user, permission, requireAll)) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location.pathname,
          reason: 'permission',
          requiredPermission: permission,
        }}
      />
    )
  }

  // Thỏa mãn toàn bộ điều kiện bảo vệ → hiển thị nội dung
  return <>{children}</>
}

export { ProtectedRoute as PermissionRoute }
