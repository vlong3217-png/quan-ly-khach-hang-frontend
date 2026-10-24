import type { MenuGroup } from '../types/menu.ts'
import { ROLES, PERMISSIONS } from './permissions.ts'

/**
 * Cấu hình toàn bộ cấu trúc Menu điều hướng của Hệ thống N5 CRM.
 * Được nhóm theo chuẩn khuyến nghị của Mentor:
 * 1. BÁN HÀNG: Khách hàng, Leads (Khách hàng tiềm năng), Cơ hội bán hàng, Hợp đồng & Gia hạn, Lịch làm việc
 * 2. MARKETING: Chiến dịch Marketing, Email & Mẫu tiếp thị, Báo cáo ROI
 * 3. BÁO CÁO: Bảng điều khiển (Tổng quan), Chỉ tiêu doanh số, Phễu bán hàng, Dự báo doanh thu, Bảng xếp hạng doanh số, Năng suất & Hoạt động, Nhật ký công việc
 * 4. CẤU HÌNH & QUẢN TRỊ: Giai đoạn Pipeline, Trường tuỳ chỉnh, Danh mục bán hàng, Sản phẩm & Bảng giá, Tự động hoá quy trình, Quản lý tài khoản, Quản lý Đội nhóm, Nhật ký hệ thống
 */
export const APP_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'group-sales',
    title: 'BÁN HÀNG',
    description: 'Quản lý khách hàng, phễu lead, cơ hội kinh doanh và hợp đồng',
    items: [
      {
        id: 'menu-customers',
        title: 'Khách hàng',
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
        title: 'Khách hàng tiềm năng (Leads)',
        path: '/dashboard/lead-forms',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý khách hàng tiềm năng, chấm điểm, chuyển đổi và biểu mẫu thu thập',
      },
      {
        id: 'menu-opportunities',
        title: 'Cơ hội bán hàng',
        path: '/dashboard/opportunities',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý cơ hội bán hàng, dòng thời gian hoạt động và công việc',
      },
      {
        id: 'menu-contracts',
        title: 'Hợp đồng & Gia hạn',
        path: '/dashboard/contracts',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Theo dõi hiệu lực, cảnh báo hết hạn và tạo cơ hội gia hạn (S7-07)',
      },
      {
        id: 'menu-calendar',
        title: 'Lịch làm việc',
        path: '/dashboard/calendar',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Xem lịch cuộc gặp, công việc và phát hiện trùng lịch (S6-07)',
      },
    ],
  },
  {
    id: 'group-marketing',
    title: 'MARKETING',
    description: 'Chiến dịch tiếp thị, email marketing và phân tích hiệu quả lead',
    items: [
      {
        id: 'menu-campaigns',
        title: 'Chiến dịch Marketing',
        path: '/dashboard/campaigns',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý chiến dịch tiếp thị, ngân sách và theo dõi nguồn lead',
      },
      {
        id: 'menu-email-marketing',
        title: 'Email & Mẫu tiếp thị',
        path: '/dashboard/email-marketing',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Soạn mẫu email chèn biến, gửi bất đồng bộ và ghi dòng thời gian khách hàng (S8-01)',
      },
      {
        id: 'menu-marketing-roi',
        title: 'Báo cáo ROI Marketing',
        path: '/dashboard/marketing-roi',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Phân tích số lead, tỷ lệ tiếp nhận, chuyển đổi thành cơ hội theo nguồn và chiến dịch (S8-09)',
      },
    ],
  },
  {
    id: 'group-reports',
    title: 'BÁO CÁO & PHÂN TÍCH',
    description: 'Chỉ số đo lường hiệu quả bán hàng, dự báo doanh thu và hoạt động nhân sự',
    items: [
      {
        id: 'menu-dashboard',
        title: 'Bảng điều khiển (Tổng quan)',
        path: '/dashboard',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Tổng quan chỉ số hoạt động, chào mừng và thông tin tài khoản',
      },
      {
        id: 'menu-quotas',
        title: 'Chỉ tiêu doanh số',
        path: '/dashboard/quotas',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Chỉ tiêu doanh số theo tháng/quý, cảnh báo lệch và khoá kỳ (S8-03)',
      },
      {
        id: 'menu-pipeline-funnel',
        title: 'Phễu bán hàng',
        path: '/dashboard/pipeline-funnel',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Phân tích tỷ lệ chuyển đổi, điểm rơi rụng nhiều nhất và điểm nghẽn (S8-05)',
      },
      {
        id: 'menu-forecast',
        title: 'Dự báo doanh thu',
        path: '/dashboard/forecast',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Dự báo doanh thu so với chỉ tiêu (3 con số), phân tích thắng/thua và xuất báo cáo Excel (S8-06)',
      },
      {
        id: 'menu-sales-leaderboard',
        title: 'Bảng xếp hạng Doanh số',
        path: '/dashboard/leaderboard',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Xếp hạng doanh số đã chốt trong kỳ, tiến độ so với chỉ tiêu cá nhân và bảo mật nội bộ nhóm (S8-08)',
      },
      {
        id: 'menu-team-productivity',
        title: 'Năng suất & Hoạt động',
        path: '/dashboard/team-productivity',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Báo cáo số cuộc gọi, cuộc gặp, báo giá gửi đi theo thành viên/tuần và tỷ lệ phản hồi lead trong SLA (S8-07)',
      },
      {
        id: 'menu-rep-activity-audit',
        title: 'Nhật ký công việc',
        path: '/dashboard/rep-activity-audit',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Lọc theo thời gian, loại hoạt động, thành viên và thống kê tổng số hoạt động theo từng nhân sự (S8-11)',
      },
    ],
  },
  {
    id: 'group-config',
    title: 'CẤU HÌNH & QUẢN TRỊ',
    description: 'Thiết lập quy trình pipeline, danh mục sản phẩm, biểu mẫu và tài khoản',
    items: [
      {
        id: 'menu-pipeline',
        title: 'Giai đoạn Pipeline',
        path: '/dashboard/pipeline',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Cấu hình các giai đoạn pipeline và xác suất thắng',
      },
      {
        id: 'menu-custom-fields',
        title: 'Trường tuỳ chỉnh',
        path: '/dashboard/custom-fields',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Khai báo trường tuỳ chỉnh cho khách hàng và cơ hội',
      },
      {
        id: 'menu-categories',
        title: 'Danh mục bán hàng',
        path: '/dashboard/categories',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Khai báo ngành nghề, quy mô, nguồn lead và loại hoạt động',
      },
      {
        id: 'menu-products',
        title: 'Sản phẩm & Bảng giá',
        path: '/dashboard/products',
        roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
        description: 'Quản lý danh mục sản phẩm, dịch vụ và bảng giá niêm yết',
      },
      {
        id: 'menu-automation',
        title: 'Tự động hoá quy trình',
        path: '/dashboard/automation',
        roles: [ROLES.ADMIN, ROLES.MANAGER],
        description: 'Thiết lập quy tắc tự động khi-thì, tạo việc và phân bổ phụ trách (S7-09)',
      },
      {
        id: 'menu-users',
        title: 'Quản lý tài khoản',
        path: '/dashboard/users',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Tạo, phân quyền vai trò, nhóm và khóa tài khoản người dùng',
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
      {
        id: 'menu-settings',
        title: 'Nhật ký hệ thống',
        path: '/dashboard/audit-logs',
        roles: [ROLES.ADMIN],
        permissions: [PERMISSIONS.SYSTEM_SETTINGS],
        description: 'Truy vết toàn diện lịch sử thay đổi trên dữ liệu nhạy cảm và hệ thống',
      },
    ],
  },
]
