import React, { type ReactNode, type ReactElement } from 'react'
import type { Role, Permission } from '../types/auth.ts'
import { usePermission } from '../hooks/usePermission.ts'

export interface PermissionGateProps {
  /** Quyền hoặc danh sách quyền cần có */
  permission?: Permission | Permission[]
  /** Vai trò hoặc danh sách vai trò cho phép */
  role?: Role | Role[]
  /** Yêu cầu thỏa mãn tất cả quyền trong mảng (mặc định false: chỉ cần 1) */
  requireAll?: boolean
  /** Giao diện thay thế khi không đủ quyền (mặc định không render gì) */
  fallback?: ReactNode
  /**
   * Nếu true, thay vì ẩn phần tử, phần tử con sẽ được giữ lại nhưng chuyển sang trạng thái disabled
   * (áp dụng cho button/input) kèm theo tooltip giải thích lý do không có quyền.
   */
  renderDisabled?: boolean
  /** Lý do hiển thị tooltip khi phần tử bị vô hiệu hóa */
  disabledReason?: string
  /** Nội dung cần bảo vệ theo quyền */
  children: ReactNode
}

/**
 * Component kiểm soát hiển thị hoặc vô hiệu hóa các phần tử UI (nút bấm, khối dữ liệu...)
 * dựa trên Role và Permission của người dùng hiện tại.
 */
export function PermissionGate({
  permission,
  role,
  requireAll = false,
  fallback = null,
  renderDisabled = false,
  disabledReason = 'Bạn không có quyền thực hiện chức năng này',
  children,
}: PermissionGateProps) {
  const { isAuthenticated, hasRole, hasPermission } = usePermission()

  // Chưa đăng nhập -> không có quyền
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Kiểm tra vai trò (Role) nếu được chỉ định
  if (role && !hasRole(role)) {
    return handleNoPermission()
  }

  // Kiểm tra quyền hạn (Permission) nếu được chỉ định
  if (permission && !hasPermission(permission, requireAll)) {
    return handleNoPermission()
  }

  // Thỏa mãn mọi điều kiện -> render nội dung bình thường
  return <>{children}</>

  function handleNoPermission() {
    if (renderDisabled && React.isValidElement(children)) {
      const child = children as ReactElement<{
        disabled?: boolean
        'aria-disabled'?: boolean
        title?: string
        className?: string
        style?: React.CSSProperties
        onClick?: (e: React.MouseEvent) => void
      }>

      return React.cloneElement(child, {
        disabled: true,
        'aria-disabled': true,
        title: disabledReason,
        className: `${child.props.className ?? ''} permission-disabled`.trim(),
        style: {
          ...child.props.style,
          cursor: 'not-allowed',
          opacity: 0.55,
          pointerEvents: 'auto',
        },
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        },
      })
    }

    return <>{fallback}</>
  }
}

export default PermissionGate
