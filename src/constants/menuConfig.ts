import type { MenuGroup } from '../types/menu.ts'
import { ROLES, PERMISSIONS } from './permissions.ts'

/**
 * Cấu hình toàn bộ cấu trúc Menu điều hướng của Hệ thống Quản lý Khách hàng.
 *
 * Mỗi menu item được gắn kèm các ràng buộc `roles` hoặc `permissions`:
 * - Nếu không có quyền phù hợp, menu sẽ bị ẩn hoàn toàn (không render trong DOM).
 * - ADMIN: Toàn quyền truy cập tất cả các menu.
 * - MANAGER: Xem Tổng quan, Quản lý khách hàng (kèm xuất dữ liệu), Báo cáo & thống kê, Đội nhóm. Ẩn menu Cấu hình hệ thống.
 * - USER: Xem Tổng quan, Quản lý khách hàng (xem/thêm mới). Ẩn menu Báo cáo, Đội nhóm, Cấu hình hệ thống, và ẩn chức năng Xuất dữ liệu.
 */
export const APP_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'group-core',
    title: 'TỔNG QUAN & LÀM VIỆC',
    description: 'Bảng điều khiển và danh mục khách hàng trọng tâm',
    items: [
      {
        id: 'menu-dashboard',
        title: 'Bảng điều khiển',
        path: '/dashboard',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Tổng quan chỉ số hoạt động, chào mừng và thông tin tài khoản',
      },
      {
        id: 'menu-customers',
        title: 'Quản lý khách hàng',
        path: '/dashboard/customers',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        permissions: [PERMISSIONS.CUSTOMER_VIEW],
        description: 'Tra cứu, lọc dữ liệu và quản lý hồ sơ khách hàng',
        children: [
          {
            id: 'menu-customers-list',
            title: 'Danh sách khách hàng',
            path: '/dashboard/customers',
            roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
            permissions: [PERMISSIONS.CUSTOMER_VIEW],
            description: 'Xem danh sách khách hàng theo phạm vi dữ liệu được cấp',
          },
          {
            id: 'menu-customers-create',
            title: 'Thêm mới khách hàng',
            path: '/dashboard/customers?action=create',
            roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
            permissions: [PERMISSIONS.CUSTOMER_CREATE],
            badge: 'Mới',
            badgeVariant: 'primary',
            description: 'Tạo hồ sơ thông tin khách hàng mới',
          },
          {
            id: 'menu-customers-export',
            title: 'Xuất dữ liệu Excel/CSV',
            path: '/dashboard/customers?action=export',
            roles: [ROLES.ADMIN, ROLES.MANAGER],
            permissions: [PERMISSIONS.CUSTOMER_EXPORT],
            badge: 'Quản lý',
            badgeVariant: 'info',
            description: 'Xuất báo cáo danh sách khách hàng ra định dạng file',
          },
        ],
      },
    ],
  },
  {
    id: 'group-management',
    title: 'NGHIỆP VỤ & QUẢN LÝ',
    description: 'Báo cáo thống kê số liệu và quản lý tổ chức',
    items: [
      {
        id: 'menu-reports',
        title: 'Báo cáo & Thống kê',
        path: '/dashboard/reports',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        permissions: [PERMISSIONS.REPORT_VIEW],
        description: 'Xem báo cáo doanh số, chuyển đổi và thống kê dữ liệu',
        children: [
          {
            id: 'menu-reports-sales',
            title: 'Báo cáo doanh số',
            path: '/dashboard/reports/sales',
            roles: [ROLES.ADMIN, ROLES.MANAGER],
            permissions: [PERMISSIONS.REPORT_VIEW],
          },
          {
            id: 'menu-reports-performance',
            title: 'Hiệu suất đội ngũ',
            path: '/dashboard/reports/performance',
            roles: [ROLES.ADMIN, ROLES.MANAGER],
            permissions: [PERMISSIONS.REPORT_VIEW],
          },
        ],
      },
      {
        id: 'menu-teams',
        title: 'Quản lý Đội nhóm',
        path: '/dashboard/teams',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Quản lý thành viên phòng ban và phân chia phụ trách',
        children: [
          {
            id: 'menu-teams-members',
            title: 'Thành viên đội nhóm',
            path: '/dashboard/teams/members',
            roles: [ROLES.ADMIN, ROLES.MANAGER],
          },
          {
            id: 'menu-teams-assignments',
            title: 'Phân bổ khách hàng',
            path: '/dashboard/teams/assignments',
            roles: [ROLES.ADMIN, ROLES.MANAGER],
          },
        ],
      },
    ],
  },
  {
    id: 'group-admin',
    title: 'HỆ THỐNG & CẤU HÌNH',
    description: 'Chỉ dành cho Quản trị viên (ADMIN)',
    items: [
      {
        id: 'menu-settings',
        title: 'Cấu hình hệ thống',
        path: '/dashboard/settings',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Cấu hình tham số, phân quyền vai trò và nhật ký hệ thống',
        children: [
          {
            id: 'menu-settings-general',
            title: 'Thiết lập chung',
            path: '/dashboard/settings/general',
            roles: [ROLES.ADMIN],
            permissions: [PERMISSIONS.SYSTEM_SETTINGS],
          },
          {
            id: 'menu-settings-roles',
            title: 'Phân quyền & Vai trò',
            path: '/dashboard/settings/roles',
            roles: [ROLES.ADMIN],
            permissions: [PERMISSIONS.SYSTEM_SETTINGS],
          },
          {
            id: 'menu-settings-win-loss',
            title: 'Lý do Thắng/Thua & Đối thủ',
            path: '/dashboard/settings/win-loss',
            roles: [ROLES.ADMIN, ROLES.MANAGER],
            description: 'Khai báo danh mục lý do thắng thua và đối thủ cạnh tranh (S2-10)',
          },
          {
            id: 'menu-settings-logs',
            title: 'Nhật ký hoạt động',
            path: '/dashboard/settings/audit-logs',
            roles: [ROLES.ADMIN],
            permissions: [PERMISSIONS.SYSTEM_SETTINGS],
          },
        ],
      },
      {
        id: 'menu-users',
        title: 'Quản lý tài khoản',
        path: '/dashboard/users',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Tạo, phân quyền vai trò, nhóm và khóa tài khoản người dùng',
      },
    ],
  },
]
