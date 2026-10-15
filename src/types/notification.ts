export type NotificationType =
  | 'LEAD_ASSIGNED'
  | 'QUOTE_PENDING_APPROVAL'
  | 'CUSTOMER_FEEDBACK'
  | 'TASK_ASSIGNED'
  | 'STALLED_OPPORTUNITY'
  | 'CONTRACT_EXPIRING'

export interface AppNotification {
  id: string
  recipient_id?: number // User ID nhận thông báo, nếu không có là thông báo chung
  recipient_role?: string // Role được nhận (VD: MANAGER, ADMIN)
  type: NotificationType
  title: string
  message: string
  link_path: string // Deep link đến màn hình liên quan (S7-08 AC 3)
  is_read: boolean
  created_at: string
  data_payload?: Record<string, any>
}

export interface CreateNotificationPayload {
  recipient_id?: number
  recipient_role?: string
  type: NotificationType
  title: string
  message: string
  link_path: string
  data_payload?: Record<string, any>
}
