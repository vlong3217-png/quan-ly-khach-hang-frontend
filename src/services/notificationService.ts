import type {
  AppNotification,
  CreateNotificationPayload,
  NotificationChannelConfig,
} from '../types/notification.ts'

const STORAGE_KEY = 'crm_app_notifications_v1'
const PREFS_STORAGE_PREFIX = 'crm_notification_preferences_user_'

const DEFAULT_PREFERENCES: NotificationChannelConfig[] = [
  {
    type: 'QUOTE_PENDING_APPROVAL',
    label: 'Báo giá chờ phê duyệt (Level 1 / Level 2)',
    description: 'Thông báo xét duyệt chiết khấu vượt ngưỡng, mức giá sàn bắt buộc phải thông qua cấp trên.',
    is_mandatory: true, // S8-02 AC: Thông báo bắt buộc như báo giá chờ duyệt thì không tắt được
    in_app: true,
    email: true,
  },
  {
    type: 'LEAD_ASSIGNED',
    label: 'Khách hàng tiềm năng mới được phân bổ',
    description: 'Nhận thông báo ngay khi có lead mới từ form website hoặc chiến dịch marketing gán cho bạn.',
    is_mandatory: false,
    in_app: true,
    email: true,
  },
  {
    type: 'CUSTOMER_FEEDBACK',
    label: 'Khách hàng phản hồi báo giá',
    description: 'Khách hàng chấp thuận trực tuyến hoặc gửi phản hồi điều chỉnh phương án báo giá.',
    is_mandatory: false,
    in_app: true,
    email: true,
  },
  {
    type: 'TASK_ASSIGNED',
    label: 'Công việc & Lịch hẹn được phân công',
    description: 'Trưởng nhóm hoặc hệ thống tự động giao nhiệm vụ chăm sóc khách hàng.',
    is_mandatory: false,
    in_app: true,
    email: false,
  },
  {
    type: 'STALLED_OPPORTUNITY',
    label: 'Cảnh báo cơ hội bán hàng đình trệ',
    description: 'Cơ hội quá 7 ngày chưa có hoạt động tương tác, nhắc nhở phòng tránh mất khách.',
    is_mandatory: false,
    in_app: true,
    email: false,
  },
  {
    type: 'CONTRACT_EXPIRING',
    label: 'Hợp đồng sắp hết hạn & Cần tái ký',
    description: 'Cảnh báo hợp đồng sắp đáo hạn trong 15 - 30 ngày để kịp thời liên hệ tái ký.',
    is_mandatory: false,
    in_app: true,
    email: true,
  },
]

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'LEAD_ASSIGNED',
    title: 'Lead mới được phân bổ',
    message: 'Bạn vừa được phân bổ khách hàng tiềm năng: "Trần Thị Mai (Công ty Tân Phát)". Hãy liên hệ trong vòng 4 giờ theo cam kết SLA.',
    link_path: '/dashboard/lead-forms',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'notif-2',
    type: 'QUOTE_PENDING_APPROVAL',
    recipient_role: 'MANAGER',
    title: 'Báo giá chờ phê duyệt chiết khấu',
    message: 'Báo giá BG-2026-003 cho Tập đoàn Hòa Phát áp dụng chiết khấu 15% (vượt thẩm quyền nhân viên, yêu cầu Trưởng nhóm duyệt).',
    link_path: '/dashboard/opportunities',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'notif-3',
    type: 'CUSTOMER_FEEDBACK',
    title: 'Khách hàng phản hồi báo giá',
    message: 'Khách hàng Công ty Alpha Tech đã chấp thuận trực tuyến báo giá BG-2026-001. Có thể chuyển đổi sang Hợp đồng.',
    link_path: '/dashboard/opportunities',
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
   * S8-02: Lấy cấu hình thông báo cá nhân (Notification Channel Preferences)
   */
  getUserPreferences(userId?: number): NotificationChannelConfig[] {
    const key = `${PREFS_STORAGE_PREFIX}${userId ?? 'default'}`
    try {
      const data = localStorage.getItem(key)
      if (data) {
        const parsed: NotificationChannelConfig[] = JSON.parse(data)
        // Ensure mandatory rules always stay mandatory & enabled
        return DEFAULT_PREFERENCES.map((def) => {
          const found = parsed.find((p) => p.type === def.type)
          if (!found) return def
          if (def.is_mandatory) {
            return { ...def, in_app: true, email: true }
          }
          return { ...def, in_app: found.in_app, email: found.email }
        })
      }
    } catch {}
    return DEFAULT_PREFERENCES
  },

  /**
   * S8-02: Lưu cấu hình thông báo cá nhân
   */
  saveUserPreferences(userId: number | undefined, configs: NotificationChannelConfig[]): void {
    const key = `${PREFS_STORAGE_PREFIX}${userId ?? 'default'}`
    // Validate mandatory constraint
    const sanitized = configs.map((cfg) => {
      if (cfg.is_mandatory) {
        return { ...cfg, in_app: true, email: true }
      }
      return cfg
    })
    try {
      localStorage.setItem(key, JSON.stringify(sanitized))
    } catch (e) {
      console.warn('Failed to save notification preferences:', e)
    }
  },

  /**
   * S7-08 & S8-02 AC: Thông báo sinh bất đồng bộ, tôn trọng cấu hình cá nhân
   */
  async createNotification(payload: CreateNotificationPayload): Promise<AppNotification | null> {
    const prefs = this.getUserPreferences(payload.recipient_id)
    const pref = prefs.find((p) => p.type === payload.type)

    // Nếu thông báo không bắt buộc và người dùng đã tắt kênh in-app
    if (pref && !pref.is_mandatory && !pref.in_app) {
      return null
    }

    return new Promise((resolve) => {
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
