import type {
  AutomationRule,
  AutomationExecutionLog,
} from '../types/workflowAutomation.ts'
import { notificationService } from './notificationService.ts'

const STORAGE_KEY_RULES = 'crm_workflow_automation_rules_v1'
const STORAGE_KEY_LOGS = 'crm_workflow_automation_logs_v1'

const INITIAL_RULES: AutomationRule[] = [
  {
    id: 'rule-auto-01',
    name: 'Tự tạo việc nhắc gọi sau 3 ngày khi Cơ hội sang Báo giá',
    description: 'Quy tắc mẫu S7-09: Tự động lên lịch nhắc nhân viên gọi điện tư vấn và chốt phương án sau khi gửi báo giá.',
    is_active: true,
    trigger: {
      type: 'STAGE_CHANGED',
      entity: 'OPPORTUNITY',
      target_stage_name: 'Báo giá',
    },
    actions: [
      {
        id: 'act-1-1',
        type: 'CREATE_TASK',
        task_params: {
          task_title: 'Gọi điện chăm sóc phương án báo giá',
          task_type: 'CALL',
          due_days: 3,
          priority: 'HIGH',
          description: 'Khảo sát phản hồi của khách hàng về đơn giá và điều khoản thanh toán trong báo giá.',
        },
      },
      {
        id: 'act-1-2',
        type: 'SEND_NOTIFICATION',
        notification_params: {
          title: 'Quy tắc tự động: Nhắc gọi lại khách hàng',
          message: 'Cơ hội đã chuyển sang Báo giá. Hệ thống đã tự lên lịch cuộc gọi sau 3 ngày.',
          recipient_target: 'CURRENT_OWNER',
        },
      },
    ],
    created_at: '2026-10-10T08:00:00.000Z',
    updated_at: '2026-10-10T08:00:00.000Z',
    execution_count: 14,
    last_executed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'rule-auto-02',
    name: 'Chuyển Lead tiềm năng cao (Hot Lead) cho Trưởng nhóm & lên lịch demo',
    description: 'Khi Lead đạt trạng thái QUALIFIED (Đã thẩm định), tự động gán cho Senior Sales và tạo lịch gặp Demo.',
    is_active: true,
    trigger: {
      type: 'STATUS_CHANGED',
      entity: 'LEAD',
      target_status: 'QUALIFIED',
    },
    actions: [
      {
        id: 'act-2-1',
        type: 'REASSIGN_OWNER',
        reassign_params: {
          new_owner_id: 'usr-senior-sales',
          new_owner_name: 'Nguyễn Văn A (Trưởng nhóm)',
          reason: 'Lead tiềm năng đạt tiêu chuẩn thẩm định, cần chuyên viên giàu kinh nghiệm hỗ trợ',
        },
      },
      {
        id: 'act-2-2',
        type: 'CREATE_TASK',
        task_params: {
          task_title: 'Tổ chức buổi Demo giải pháp chuyên sâu',
          task_type: 'MEETING',
          due_days: 2,
          priority: 'HIGH',
          description: 'Trình chiếu tính năng giải pháp và giải đáp vướng mắc kỹ thuật.',
        },
      },
    ],
    created_at: '2026-10-11T09:30:00.000Z',
    updated_at: '2026-10-11T09:30:00.000Z',
    execution_count: 8,
    last_executed_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'rule-auto-03',
    name: 'Cảnh báo đình trệ khi cơ hội không có tương tác quá 7 ngày',
    description: 'Tự động gửi cảnh báo cho Quản lý khi cơ hội bán hàng bị bỏ quên quá 7 ngày làm việc.',
    is_active: true,
    trigger: {
      type: 'INACTIVITY_DAYS',
      entity: 'OPPORTUNITY',
      days: 7,
    },
    actions: [
      {
        id: 'act-3-1',
        type: 'SEND_NOTIFICATION',
        notification_params: {
          title: 'Cảnh báo cơ hội đình trệ quá 7 ngày',
          message: 'Cơ hội chưa có thêm hoạt động tương tác nào trong 7 ngày qua. Đề nghị kiểm tra và đôn đốc.',
          recipient_target: 'MANAGER',
        },
      },
    ],
    created_at: '2026-10-12T14:15:00.000Z',
    updated_at: '2026-10-12T14:15:00.000Z',
    execution_count: 5,
    last_executed_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: 'rule-auto-04',
    name: 'Nhắc đàm phán tái ký trước 30 ngày hết hạn hợp đồng',
    description: 'Quy tắc gia hạn hợp đồng: Tự tạo công việc liên hệ khách hàng chuẩn bị hồ sơ tái ký khi còn 30 ngày.',
    is_active: false,
    trigger: {
      type: 'DAYS_BEFORE_EXPIRY',
      entity: 'CONTRACT',
      days: 30,
    },
    actions: [
      {
        id: 'act-4-1',
        type: 'CREATE_TASK',
        task_params: {
          task_title: 'Liên hệ khách hàng trao đổi gia hạn hợp đồng',
          task_type: 'CALL',
          due_days: 5,
          priority: 'MEDIUM',
          description: 'Gửi bảng tổng kết dịch vụ năm qua và chính sách ưu đãi tái ký.',
        },
      },
      {
        id: 'act-4-2',
        type: 'SEND_NOTIFICATION',
        notification_params: {
          title: 'Hợp đồng sắp đến hạn tái ký (30 ngày)',
          message: 'Khách hàng có hợp đồng sắp đáo hạn trong 30 ngày tới. Hãy tiến hành xúc tiến tái ký.',
          recipient_target: 'CURRENT_OWNER',
        },
      },
    ],
    created_at: '2026-10-13T10:00:00.000Z',
    updated_at: '2026-10-13T10:00:00.000Z',
    execution_count: 2,
    last_executed_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
]

const INITIAL_LOGS: AutomationExecutionLog[] = [
  {
    id: 'log-01',
    rule_id: 'rule-auto-01',
    rule_name: 'Tự tạo việc nhắc gọi sau 3 ngày khi Cơ hội sang Báo giá',
    entity: 'OPPORTUNITY',
    target_id: 'opp-101',
    target_name: 'Triển khai CRM cho Tập đoàn Hoa Sen',
    trigger_event: 'Cơ hội chuyển sang giai đoạn [Báo giá]',
    executed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'SUCCESS',
    actions_taken: [
      'Đã tự động tạo công việc "Gọi điện chăm sóc phương án báo giá" (hạn 3 ngày tới)',
      'Đã gửi thông báo in-app cho người phụ trách Nguyễn Văn A',
    ],
  },
  {
    id: 'log-02',
    rule_id: 'rule-auto-02',
    rule_name: 'Chuyển Lead tiềm năng cao (Hot Lead) cho Trưởng nhóm & lên lịch demo',
    entity: 'LEAD',
    target_id: 'lead-204',
    target_name: 'Công ty Cổ phần Công nghệ DigiTech',
    trigger_event: 'Lead chuyển trạng thái sang [Đã thẩm định - QUALIFIED]',
    executed_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'SUCCESS',
    actions_taken: [
      'Đã đổi người phụ trách sang "Nguyễn Văn A (Trưởng nhóm)"',
      'Đã tạo công việc "Tổ chức buổi Demo giải pháp chuyên sâu" (hạn 2 ngày)',
    ],
  },
  {
    id: 'log-03',
    rule_id: 'rule-auto-01',
    rule_name: 'Tự tạo việc nhắc gọi sau 3 ngày khi Cơ hội sang Báo giá',
    entity: 'OPPORTUNITY',
    target_id: 'opp-108',
    target_name: 'Gói phần mềm kế toán & bán hàng FPT Retail',
    trigger_event: 'Cơ hội chuyển sang giai đoạn [Báo giá]',
    executed_at: new Date(Date.now() - 3600000 * 25).toISOString(),
    status: 'SUCCESS',
    actions_taken: [
      'Đã tự động tạo công việc "Gọi điện chăm sóc phương án báo giá" (hạn 3 ngày tới)',
      'Đã gửi thông báo in-app cho người phụ trách',
    ],
  },
  {
    id: 'log-04',
    rule_id: 'rule-auto-03',
    rule_name: 'Cảnh báo đình trệ khi cơ hội không có tương tác quá 7 ngày',
    entity: 'OPPORTUNITY',
    target_id: 'opp-094',
    target_name: 'Nâng cấp hệ thống Cloud Server Viettel Post',
    trigger_event: 'Không có hoạt động tương tác trong 7 ngày',
    executed_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    status: 'SUCCESS',
    actions_taken: [
      'Đã gửi thông báo cảnh báo đình trệ tới Quản lý phòng kinh doanh',
    ],
  },
]

class WorkflowAutomationService {
  private rules: AutomationRule[]
  private logs: AutomationExecutionLog[]

  constructor() {
    this.rules = this.loadRules()
    this.logs = this.loadLogs()
  }

  private loadRules(): AutomationRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RULES)
      if (data) {
        return JSON.parse(data)
      }
    } catch (e) {
      console.warn('Failed to parse automation rules from storage:', e)
    }
    this.saveRulesToStorage(INITIAL_RULES)
    return INITIAL_RULES
  }

  private saveRulesToStorage(rules: AutomationRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules))
    } catch (e) {
      console.warn('Failed to save automation rules to storage:', e)
    }
  }

  private loadLogs(): AutomationExecutionLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS)
      if (data) {
        return JSON.parse(data)
      }
    } catch (e) {
      console.warn('Failed to parse automation logs from storage:', e)
    }
    this.saveLogsToStorage(INITIAL_LOGS)
    return INITIAL_LOGS
  }

  private saveLogsToStorage(logs: AutomationExecutionLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs))
    } catch (e) {
      console.warn('Failed to save automation logs to storage:', e)
    }
  }

  public getRules(): AutomationRule[] {
    return [...this.rules]
  }

  public getRuleById(id: string): AutomationRule | undefined {
    return this.rules.find((r) => r.id === id)
  }

  public saveRule(data: Partial<AutomationRule> & { name: string }): AutomationRule {
    const now = new Date().toISOString()
    if (data.id) {
      // Update existing
      this.rules = this.rules.map((r) => {
        if (r.id === data.id) {
          return {
            ...r,
            ...data,
            updated_at: now,
          } as AutomationRule
        }
        return r
      })
      this.saveRulesToStorage(this.rules)
      return this.rules.find((r) => r.id === data.id)!
    } else {
      // Create new
      const newRule: AutomationRule = {
        id: `rule-auto-${Date.now()}`,
        name: data.name,
        description: data.description || '',
        is_active: data.is_active ?? true,
        trigger: data.trigger || {
          type: 'STAGE_CHANGED',
          entity: 'OPPORTUNITY',
          target_stage_name: 'Báo giá',
        },
        actions: data.actions || [],
        created_at: now,
        updated_at: now,
        execution_count: 0,
      }
      this.rules.unshift(newRule)
      this.saveRulesToStorage(this.rules)
      return newRule
    }
  }

  public toggleRuleActive(ruleId: string, isActive: boolean): void {
    this.rules = this.rules.map((r) => {
      if (r.id === ruleId) {
        return {
          ...r,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        }
      }
      return r
    })
    this.saveRulesToStorage(this.rules)
  }

  public deleteRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId)
    this.saveRulesToStorage(this.rules)
  }

  public getLogs(): AutomationExecutionLog[] {
    return [...this.logs]
  }

  public clearLogs(): void {
    this.logs = []
    this.saveLogsToStorage([])
  }

  /**
   * Kích hoạt chạy thử nghiệm (Test Run) hoặc chạy thật một quy tắc
   */
  public executeRule(
    ruleId: string,
    targetInfo: {
      id?: string
      name?: string
      triggerEventText?: string
    }
  ): AutomationExecutionLog {
    const rule = this.rules.find((r) => r.id === ruleId)
    if (!rule) {
      throw new Error(`Không tìm thấy quy tắc tự động với ID: ${ruleId}`)
    }

    const actionsTaken: string[] = []
    const targetName = targetInfo.name || `Đối tượng thử nghiệm (${rule.trigger.entity})`
    const targetId = targetInfo.id || `test-${Date.now()}`

    for (const act of rule.actions) {
      if (act.type === 'CREATE_TASK' && act.task_params) {
        actionsTaken.push(
          `Đã tạo công việc "${act.task_params.task_title}" (${act.task_params.task_type}, hạn ${act.task_params.due_days} ngày, ưu tiên ${act.task_params.priority})`
        )
      } else if (act.type === 'SEND_NOTIFICATION' && act.notification_params) {
        // Dispatch real notification
        notificationService.createNotification({
          type: 'TASK_ASSIGNED',
          title: `[Tự động] ${act.notification_params.title}`,
          message: `${act.notification_params.message} (Áp dụng cho: ${targetName})`,
          link_path: rule.trigger.entity === 'OPPORTUNITY' ? '/dashboard/opportunities' : rule.trigger.entity === 'LEAD' ? '/dashboard/lead-forms' : '/dashboard/contracts',
        })
        actionsTaken.push(
          `Đã gửi thông báo in-app: "${act.notification_params.title}" tới ${act.notification_params.recipient_target === 'CURRENT_OWNER' ? 'Người phụ trách' : 'Quản lý'}`
        )
      } else if (act.type === 'REASSIGN_OWNER' && act.reassign_params) {
        actionsTaken.push(
          `Đã chuyển người phụ trách sang "${act.reassign_params.new_owner_name}"`
        )
      }
    }

    const now = new Date().toISOString()
    const log: AutomationExecutionLog = {
      id: `log-${Date.now()}`,
      rule_id: rule.id,
      rule_name: rule.name,
      entity: rule.trigger.entity,
      target_id: targetId,
      target_name: targetName,
      trigger_event: targetInfo.triggerEventText || this.describeTrigger(rule),
      executed_at: now,
      status: 'SUCCESS',
      actions_taken: actionsTaken,
    }

    // Add log
    this.logs.unshift(log)
    this.saveLogsToStorage(this.logs)

    // Increment execution count on rule
    this.rules = this.rules.map((r) => {
      if (r.id === rule.id) {
        return {
          ...r,
          execution_count: (r.execution_count || 0) + 1,
          last_executed_at: now,
        }
      }
      return r
    })
    this.saveRulesToStorage(this.rules)

    return log
  }

  public describeTrigger(rule: AutomationRule): string {
    const { trigger } = rule
    const entityLabel = trigger.entity === 'OPPORTUNITY' ? 'Cơ hội' : trigger.entity === 'LEAD' ? 'Lead' : 'Hợp đồng'

    switch (trigger.type) {
      case 'STAGE_CHANGED':
        return `Khi ${entityLabel} chuyển sang giai đoạn [${trigger.target_stage_name || 'Báo giá'}]`
      case 'STATUS_CHANGED':
        return `Khi ${entityLabel} thay đổi trạng thái thành [${trigger.target_status || 'Hiệu lực'}]`
      case 'DAYS_AFTER_CREATION':
        return `Khi đã qua ${trigger.days || 3} ngày kể từ lúc tạo ${entityLabel}`
      case 'DAYS_BEFORE_EXPIRY':
        return `Khi còn ${trigger.days || 30} ngày trước khi ${entityLabel} hết hạn`
      case 'INACTIVITY_DAYS':
        return `Khi ${entityLabel} không có tương tác quá ${trigger.days || 7} ngày`
      default:
        return `Điều kiện kích hoạt trên ${entityLabel}`
    }
  }
}

export const workflowAutomationService = new WorkflowAutomationService()
