import type { AppNotification, CreateNotificationPayload } from '../types/notification.ts'

const STORAGE_KEY = 'crm_in_app_notifications_v1'

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'QUOTE_PENDING_APPROVAL',
    title: 'Báo giá chờ duyệt chiết khấu',
    message: 'Báo giá BG-2025-001 (156.750.000 đ) đang chờ Trưởng nhóm phê duyệt mức chiết khấu 15%.',
    link_path: '/dashboard/opportunities',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'notif-2',
    type: 'CUSTOMER_FEEDBACK',
    title: 'Khách hàng phản hồi báo giá',
    message: 'Công ty Cổ phần Công Nghệ Alpha đã bấm Chấp thuận báo giá trực tuyến!',
    link_path: '/dashboard/opportunities',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'notif-3',
    type: 'LEAD_ASSIGNED',
    title: 'Bạn được phân bổ Lead mới',
    message: 'Lead "Nguyễn Văn Tuấn - Công ty SmartTech" vừa được điều phối cho bạn chăm sóc.',
    link_path: '/dashboard/lead-forms',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'notif-4',
    type: 'TASK_ASSIGNED',
    title: 'Công việc mới được giao',
    message: 'Trưởng nhóm vừa giao cho bạn công việc: "Chuẩn bị tài liệu demo giải pháp cho Beta Corp".',
    link_path: '/dashboard/calendar',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'notif-5',
    type: 'STALLED_OPPORTUNITY',
    title: 'Cơ hội bị gắn cờ đình trệ',
    message: 'Cơ hội "Nâng cấp bảo mật & Email Marketing Beta Corp" đã hơn 7 ngày chưa có hoạt động tương tác.',
    link_path: '/dashboard/opportunities',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
]

function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS))
  return INITIAL_NOTIFICATIONS
}

function saveStoredNotifications(list: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  // Phát sự kiện toàn cục để cập nhật chuông thông báo theo thời gian thực
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('crm-notifications-updated'))
  }
}

export const notificationService = {
  getNotifications(userId?: number, userRole?: string): AppNotification[] {
    const all = getStoredNotifications()
    return all.filter((n) => {
      if (n.recipient_id && userId && n.recipient_id !== userId) return false
      if (n.recipient_role && userRole && n.recipient_role !== userRole && userRole !== 'ADMIN') return false
      return true
    })
  },

  getUnreadCount(userId?: number, userRole?: string): number {
    return this.getNotifications(userId, userRole).filter((n) => !n.is_read).length
  },

  /**
   * S7-08 AC: Thông báo sinh bất đồng bộ, không làm chậm thao tác gốc
   */
  async createNotification(payload: CreateNotificationPayload): Promise<AppNotification> {
    return new Promise((resolve) => {
      // Bất đồng bộ hóa bằng setTimeout 0 để hoàn toàn không chặn luồng chính
      setTimeout(() => {
        const all = getStoredNotifications()
        const newNotif: AppNotification = {
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          recipient_id: payload.recipient_id,
          recipient_role: payload.recipient_role,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          link_path: payload.link_path,
          is_read: false,
          created_at: new Date().toISOString(),
          data_payload: payload.data_payload,
        }

        all.unshift(newNotif)
        saveStoredNotifications(all)
        resolve(newNotif)
      }, 0)
    })
  },

  markAsRead(notificationId: string): void {
    const all = getStoredNotifications()
    const idx = all.findIndex((n) => n.id === notificationId)
    if (idx !== -1) {
      all[idx].is_read = true
      saveStoredNotifications(all)
    }
  },

  markAllAsRead(userId?: number, userRole?: string): void {
    const all = getStoredNotifications()
    all.forEach((n) => {
      const matchUser = !n.recipient_id || (userId && n.recipient_id === userId)
      const matchRole = !n.recipient_role || (userRole && n.recipient_role === userRole)
      if (matchUser && matchRole) {
        n.is_read = true
      }
    })
    saveStoredNotifications(all)
  },

  deleteNotification(notificationId: string): void {
    const all = getStoredNotifications().filter((n) => n.id !== notificationId)
    saveStoredNotifications(all)
  },
}
