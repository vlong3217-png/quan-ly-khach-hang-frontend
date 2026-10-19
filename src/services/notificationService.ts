import type {
  AppNotification,
  CreateNotificationPayload,
  NotificationChannelConfig,
} from '../types/notification.ts'

const STORAGE_KEY = 'crm_app_notifications_v2'
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

const INITIAL_NOTIFICATIONS: AppNotification[] = []

function getStoredNotifications(): AppNotification[] {
  try {
    localStorage.removeItem('crm_app_notifications_v1')
  } catch {}
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
