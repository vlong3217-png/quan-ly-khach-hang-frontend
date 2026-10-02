import type { User } from '../types/auth.ts'
import type { MenuItem, MenuGroup } from '../types/menu.ts'
import { checkUserRole, checkUserPermission } from './permissionUtils.ts'

/**
 * Kiểm tra xem một MenuItem có được phép hiển thị cho người dùng hiện tại hay không.
 *
 * Quy tắc phân quyền:
 * 1. Nếu người dùng chưa đăng nhập hoặc không có thông tin role (user = null hoặc role rỗng) -> KHÔNG HIỂN THỊ (trả về false).
 * 2. Nếu MenuItem có khai báo `roles`: Role của user bắt buộc phải nằm trong danh sách được phép.
 * 3. Nếu MenuItem có khai báo `permissions`: User bắt buộc phải có quyền hạn tương ứng
 *    (hỗ trợ kiểm tra 1 quyền hoặc tất cả quyền qua `requireAllPermissions`).
 * 4. Nếu MenuItem không yêu cầu roles/permissions cụ thể: Chỉ cần user hợp lệ là được phép truy cập.
 */
export function canAccessMenuItem(item: MenuItem, user: User | null): boolean {
  if (!user || !user.role) {
    return false
  }

  // 1. Kiểm tra ràng buộc Role nếu item có chỉ định
  if (Array.isArray(item.roles) && item.roles.length > 0) {
    const hasAllowedRole = checkUserRole(user, item.roles)
    if (!hasAllowedRole) {
      return false
    }
  }

  // 2. Kiểm tra ràng buộc Permission nếu item có chỉ định
  if (Array.isArray(item.permissions) && item.permissions.length > 0) {
    const hasRequiredPerm = checkUserPermission(
      user,
      item.permissions,
      item.requireAllPermissions ?? false
    )
    if (!hasRequiredPerm) {
      return false
    }
  }

  return true
}

/**
 * Lọc danh sách menu items theo quyền của user đang đăng nhập.
 * Hỗ trợ lọc đệ quy cả các submenu con (`children`).
 *
 * @param items Danh sách menu gốc
 * @param user Thông tin người dùng hiện tại
 * @returns Danh sách menu đã được lọc sạch các mục không có quyền
 */
export function filterMenuItemsByRole(
  items: MenuItem[],
  user: User | null
): MenuItem[] {
  if (!user || !user.role || !Array.isArray(items)) {
    return []
  }

  return items
    .filter((item) => canAccessMenuItem(item, user))
    .map((item) => {
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        const filteredChildren = filterMenuItemsByRole(item.children, user)
        return {
          ...item,
          children: filteredChildren,
        }
      }
      return item
    })
    .filter((item) => {
      // Nếu item có khai báo children ban đầu nhưng sau khi lọc con thì rỗng và không có path -> ẩn
      if (
        item.children !== undefined &&
        item.children.length === 0 &&
        (!item.path || item.path === '#')
      ) {
        return false
      }
      return true
    })
}

/**
 * Lọc toàn bộ các MenuGroup theo quyền của user.
 * Tự động loại bỏ các nhóm không còn bất kỳ menu item nào khả dụng.
 *
 * @param groups Danh sách các nhóm menu gốc
 * @param user Thông tin người dùng hiện tại
 * @returns Danh sách các nhóm menu đã lọc
 */
export function filterMenuGroupsByRole(
  groups: MenuGroup[],
  user: User | null
): MenuGroup[] {
  if (!user || !user.role || !Array.isArray(groups)) {
    return []
  }

  return groups
    .map((group) => ({
      ...group,
      items: filterMenuItemsByRole(group.items, user),
    }))
    .filter((group) => group.items.length > 0)
}

/**
 * Làm phẳng danh sách menu (bao gồm cả children) để hỗ trợ tìm kiếm và kiểm tra nhanh.
 */
export function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = []
  for (const item of items) {
    result.push(item)
    if (item.children && item.children.length > 0) {
      result.push(...flattenMenuItems(item.children))
    }
  }
  return result
}

/**
 * Tìm kiếm một MenuItem theo ID trong danh sách các MenuGroup
 */
export function findMenuItemById(
  groups: MenuGroup[],
  id: string
): MenuItem | null {
  for (const group of groups) {
    const flat = flattenMenuItems(group.items)
    const found = flat.find((item) => item.id === id)
    if (found) return found
  }
  return null
}
