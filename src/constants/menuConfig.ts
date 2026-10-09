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
      {
        id: 'menu-lead-forms',
        title: 'Biểu mẫu & Thu thập Lead',
        path: '/dashboard/lead-forms',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý biểu mẫu web-to-lead, nhúng iframe và thu thập khách hàng tiềm năng',
      },
      {
        id: 'menu-campaigns',
        title: 'Chiến dịch Marketing',
        path: '/dashboard/campaigns',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý chiến dịch tiếp thị, ngân sách và theo dõi nguồn lead',
      },
      {
        id: 'menu-opportunities',
        title: 'Cơ hội bán hàng',
        path: '/dashboard/opportunities',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý cơ hội bán hàng, dòng thời gian hoạt động và công việc',
      },
      {
        id: 'menu-products',
        title: 'Sản phẩm & Bảng giá',
        path: '/dashboard/products',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý danh mục sản phẩm, dịch vụ và bảng giá niêm yết',
      },
      {
        id: 'menu-pipeline',
        title: 'Giai đoạn Pipeline',
        path: '/dashboard/pipeline',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Cấu hình các giai đoạn pipeline và xác suất thắng',
      },
      {
        id: 'menu-categories',
        title: 'Danh mục bán hàng',
        path: '/dashboard/categories',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Khai báo ngành nghề, quy mô, nguồn lead và loại hoạt động',
      },
      {
        id: 'menu-custom-fields',
        title: 'Trường tuỳ chỉnh',
        path: '/dashboard/custom-fields',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Khai báo trường tuỳ chỉnh cho khách hàng và cơ hội',
      },
    ],
  },
  {
    id: 'group-management',
    title: 'NGHIỆP VỤ & QUẢN LÝ',
    description: 'Báo cáo thống kê số liệu và quản lý tổ chức',
    items: [
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
        id: 'menu-users',
        title: 'Quản lý tài khoản',
        path: '/dashboard/users',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Tạo, phân quyền vai trò, nhóm và khóa tài khoản người dùng',
      },
      {
        id: 'menu-settings',
        title: 'Nhật ký & Hệ thống',
        path: '/dashboard/settings',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Theo dõi nhật ký hoạt động và thông số hệ thống',
      },
    ],
  },
]
