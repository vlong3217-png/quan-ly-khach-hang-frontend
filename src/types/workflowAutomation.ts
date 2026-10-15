export type AutomationEntity = 'OPPORTUNITY' | 'LEAD' | 'CONTRACT'

export type AutomationTriggerType =
  | 'STAGE_CHANGED'       // Khi chuyển giai đoạn (ví dụ sang Báo giá)
  | 'STATUS_CHANGED'      // Khi trạng thái thay đổi (ví dụ Khách hàng chốt đơn/Hợp đồng hiệu lực)
  | 'DAYS_AFTER_CREATION' // Mốc thời gian X ngày sau khi tạo
  | 'DAYS_BEFORE_EXPIRY'  // Mốc thời gian X ngày trước khi hết hạn
  | 'INACTIVITY_DAYS'     // Không có tương tác trong X ngày

export type AutomationActionType =
  | 'CREATE_TASK'         // Tự tạo công việc
  | 'SEND_NOTIFICATION'   // Gửi thông báo in-app
  | 'REASSIGN_OWNER'      // Đổi người sở hữu/phụ trách

export interface TaskActionParams {
  task_title: string
  task_type: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE'
  due_days: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  description?: string
}

export interface NotificationActionParams {
  title: string
  message: string
  recipient_target: 'CURRENT_OWNER' | 'MANAGER' | 'ALL_MEMBERS'
}

export interface ReassignActionParams {
  new_owner_id: string
  new_owner_name: string
  reason?: string
}

export interface AutomationAction {
  id: string
  type: AutomationActionType
  task_params?: TaskActionParams
  notification_params?: NotificationActionParams
  reassign_params?: ReassignActionParams
}

export interface AutomationTrigger {
  type: AutomationTriggerType
  entity: AutomationEntity
  target_stage_name?: string
  target_status?: string
  days?: number
}

export interface AutomationRule {
  id: string
  name: string
  description?: string
  is_active: boolean
  trigger: AutomationTrigger
  actions: AutomationAction[]
  created_at: string
  updated_at: string
  execution_count: number
  last_executed_at?: string
}

export interface AutomationExecutionLog {
  id: string
  rule_id: string
  rule_name: string
  entity: AutomationEntity
  target_id: string
  target_name: string
  trigger_event: string
  executed_at: string
  status: 'SUCCESS' | 'FAILED'
  actions_taken: string[]
  error_message?: string
}
