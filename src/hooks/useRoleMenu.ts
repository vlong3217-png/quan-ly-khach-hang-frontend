import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { MenuGroup, MenuItem } from '../types/menu.ts'
import { APP_MENU_GROUPS } from '../constants/menuConfig.ts'
import {
  filterMenuGroupsByRole,
  flattenMenuItems,
  findMenuItemById,
} from '../utils/menuUtils.ts'

/**
 * Hook quản lý danh sách menu được phép hiển thị dựa trên thông tin role & permissions
 * của user hiện đang đăng nhập (lấy từ AuthContext).
 *
 * Xử lý an toàn:
 * - Khi chưa đăng nhập hoặc user = null: trả về danh sách menu rỗng ([]), không gây lỗi crash giao diện.
 * - Khi chuyển đổi vai trò (ADMIN <-> MANAGER <-> USER): tự động cập nhật danh sách menu tương ứng.
 */
export function useRoleMenu(customGroups: MenuGroup[] = APP_MENU_GROUPS) {
  const { user, isAuthenticated } = useAuth()

  // Lọc các nhóm menu theo role của user hiện tại
  const menuGroups = useMemo<MenuGroup[]>(() => {
    if (!isAuthenticated || !user || !user.role) {
      return []
    }
    return filterMenuGroupsByRole(customGroups, user)
  }, [user, isAuthenticated, customGroups])

  // Danh sách phẳng tất cả menu items mà user có quyền truy cập
  const allowedMenuItems = useMemo<MenuItem[]>(() => {
    if (menuGroups.length === 0) return []
    const flat: MenuItem[] = []
    for (const group of menuGroups) {
      flat.push(...flattenMenuItems(group.items))
    }
    return flat
  }, [menuGroups])

  // Kiểm tra nhanh xem user hiện tại có quyền truy cập vào một menu ID cụ thể không
  const canAccessMenuId = (menuId: string): boolean => {
    return allowedMenuItems.some((item) => item.id === menuId)
  }

  // Lấy chi tiết thông tin một menu item nếu có quyền
  const getMenuItem = (menuId: string): MenuItem | null => {
    return findMenuItemById(menuGroups, menuId)
  }

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated,
    menuGroups,
    allowedMenuItems,
    canAccessMenuId,
    getMenuItem,
  }
}
