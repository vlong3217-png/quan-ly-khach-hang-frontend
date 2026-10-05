import type { ReactNode } from 'react'
import type { Role, Permission } from './auth.ts'

/**
 * Định nghĩa một mục điều hướng (Menu Item) trong hệ thống
 */
export interface MenuItem {
  /** Định danh duy nhất cho menu item */
  id: string
  /** Tiêu đề hiển thị của menu */
  title: string
  /** Đường dẫn URL hoặc tab định danh */
  path: string
  /** Icon hiển thị (React Node hoặc SVG) */
  icon?: ReactNode
  /** Danh sách vai trò được phép xem menu này (ADMIN, MANAGER, USER) */
  roles?: Role[]
  /** Danh sách quyền chi tiết được phép xem menu này (CUSTOMER_VIEW, REPORT_VIEW...) */
  permissions?: Permission[]
  /** Yêu cầu thỏa mãn toàn bộ quyền trong `permissions` (mặc định false: chỉ cần 1 quyền) */
  requireAllPermissions?: boolean
  /** Nhãn phụ hoặc tag hiển thị bên cạnh menu (VD: 'Mới', 'Admin', 'Quản lý') */
  badge?: string
  /** Kiểu màu của badge */
  badgeVariant?: 'primary' | 'success' | 'warning' | 'info' | 'danger'
  /** Mô tả ngắn về chức năng */
  description?: string
  /** Danh sách menu con (sub-menu) */
  children?: MenuItem[]
  /** Đánh dấu liên kết ngoài nếu có */
  isExternal?: boolean
}

/**
 * Nhóm các menu item theo phân hệ nghiệp vụ
 */
export interface MenuGroup {
  /** Định danh nhóm */
  id: string
  /** Tiêu đề nhóm hiển thị trên Sidebar (VD: 'TỔNG QUAN', 'QUẢN LÝ DỮ LIỆU', 'HỆ THỐNG') */
  title: string
  /** Mô tả nhóm */
  description?: string
  /** Danh sách các menu con thuộc nhóm này */
  items: MenuItem[]
}
