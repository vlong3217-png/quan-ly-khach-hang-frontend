import type {
  AutomationRule,
  AutomationExecutionLog,
} from '../types/workflowAutomation.ts'
import { notificationService } from './notificationService.ts'

const STORAGE_KEY_RULES = 'crm_workflow_automation_rules_v2'
const STORAGE_KEY_LOGS = 'crm_workflow_automation_logs_v2'

const INITIAL_RULES: AutomationRule[] = []

const INITIAL_LOGS: AutomationExecutionLog[] = []

class WorkflowAutomationService {
  private rules: AutomationRule[]
  private logs: AutomationExecutionLog[]

  constructor() {
    this.rules = this.loadRules()
    this.logs = this.loadLogs()
  }

  private loadRules(): AutomationRule[] {
    try {
      localStorage.removeItem('crm_workflow_automation_rules_v1')
      localStorage.removeItem('crm_workflow_automation_logs_v1')
    } catch {}
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
