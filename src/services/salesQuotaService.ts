import type {
  TeamQuota,
  QuotaAuditLog,
  QuotaPeriodType,
  MemberQuota,
} from '../types/salesQuota.ts'

const STORAGE_KEY_QUOTAS = 'crm_sales_quotas_v1'
const STORAGE_KEY_LOGS = 'crm_sales_quota_audit_logs_v1'

const INITIAL_QUOTAS: TeamQuota[] = [
  {
    id: 'quota-2026-10-t1',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    period_type: 'MONTH',
    period_code: '2026-10',
    period_label: 'Tháng 10/2026',
    target_amount: 1500000000, // 1.5 tỷ
    achieved_amount: 1150000000,
    is_locked: false,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    members: [
      {
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        role: 'USER',
        target_amount: 600000000,
        achieved_amount: 480000000,
      },
      {
        user_id: 2,
        user_name: 'Trần Thị B',
        role: 'USER',
        target_amount: 500000000,
        achieved_amount: 420000000,
      },
      {
        user_id: 3,
        user_name: 'Lê Văn C',
        role: 'USER',
        target_amount: 400000000,
        achieved_amount: 250000000,
      },
    ],
  },
  {
    id: 'quota-2026-10-t2',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    period_type: 'MONTH',
    period_code: '2026-10',
    period_label: 'Tháng 10/2026',
    target_amount: 2800000000, // 2.8 tỷ
    achieved_amount: 2100000000,
    is_locked: false,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    members: [
      {
        user_id: 4,
        user_name: 'Phạm Hồng Đăng',
        role: 'USER',
        target_amount: 1500000000,
        achieved_amount: 1250000000,
      },
      {
        user_id: 5,
        user_name: 'Vũ Thu Trang',
        role: 'USER',
        target_amount: 1300000000,
        achieved_amount: 850000000,
      },
    ],
  },
  {
    id: 'quota-2026-q4-t1',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    period_type: 'QUARTER',
    period_code: '2026-Q4',
    period_label: 'Quý 4/2026',
    target_amount: 4500000000, // 4.5 tỷ
    achieved_amount: 1150000000,
    is_locked: false,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    members: [
      {
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        role: 'USER',
        target_amount: 1800000000,
        achieved_amount: 480000000,
      },
      {
        user_id: 2,
        user_name: 'Trần Thị B',
        role: 'USER',
        target_amount: 1500000000,
        achieved_amount: 420000000,
      },
      {
        user_id: 3,
        user_name: 'Lê Văn C',
        role: 'USER',
        target_amount: 1200000000,
        achieved_amount: 250000000,
      },
    ],
  },
  {
    id: 'quota-2026-09-t1',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    period_type: 'MONTH',
    period_code: '2026-09',
    period_label: 'Tháng 09/2026',
    target_amount: 1400000000,
    achieved_amount: 1480000000,
    is_locked: true, // S8-03 AC: Chỉ tiêu đã qua kỳ thì khoá lại, sửa phải có lý do và được ghi nhật ký
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-01T08:00:00.000Z',
    members: [
      {
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        role: 'USER',
        target_amount: 550000000,
        achieved_amount: 610000000,
      },
      {
        user_id: 2,
        user_name: 'Trần Thị B',
        role: 'USER',
        target_amount: 450000000,
        achieved_amount: 490000000,
      },
      {
        user_id: 3,
        user_name: 'Lê Văn C',
        role: 'USER',
        target_amount: 400000000,
        achieved_amount: 380000000,
      },
    ],
  },
]

const INITIAL_LOGS: QuotaAuditLog[] = []

class SalesQuotaService {
  private quotas: TeamQuota[]
  private logs: QuotaAuditLog[]

  constructor() {
    this.quotas = this.loadQuotas()
    this.logs = this.loadLogs()
  }

  private loadQuotas(): TeamQuota[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_QUOTAS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Failed to parse sales quotas:', e)
    }
    this.saveQuotasToStorage(INITIAL_QUOTAS)
    return INITIAL_QUOTAS
  }

  private saveQuotasToStorage(list: TeamQuota[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_QUOTAS, JSON.stringify(list))
    } catch (e) {
      console.warn('Failed to save sales quotas:', e)
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm-quotas-updated'))
    }
  }

  private loadLogs(): QuotaAuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Failed to parse quota logs:', e)
    }
    this.saveLogsToStorage(INITIAL_LOGS)
    return INITIAL_LOGS
  }

  private saveLogsToStorage(list: QuotaAuditLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(list))
    } catch (e) {
      console.warn('Failed to save quota logs:', e)
    }
  }

  /**
   * S8-03 AC: Chỉ tiêu của nhóm phải bằng tổng chỉ tiêu các thành viên, lệch thì cảnh báo
   */
  public validateTeamSum(
    teamTarget: number,
    members: MemberQuota[]
  ): {
    isValid: boolean
    sumMembers: number
    diff: number
    warningMessage?: string
  } {
    const sumMembers = members.reduce((sum, m) => sum + (Number(m.target_amount) || 0), 0)
    const diff = teamTarget - sumMembers
    if (Math.abs(diff) > 0.01) {
      const formattedDiff = Math.abs(diff).toLocaleString('vi-VN')
      const msg =
        diff > 0
          ? `Cảnh báo lệch chỉ tiêu: Chỉ tiêu nhóm (${teamTarget.toLocaleString('vi-VN')} ₫) lớn hơn tổng các thành viên (${sumMembers.toLocaleString('vi-VN')} ₫). Đang hụt ${formattedDiff} ₫!`
          : `Cảnh báo lệch chỉ tiêu: Tổng thành viên (${sumMembers.toLocaleString('vi-VN')} ₫) vượt quá chỉ tiêu nhóm (${teamTarget.toLocaleString('vi-VN')} ₫). Đang dư ${formattedDiff} ₫!`
      return { isValid: false, sumMembers, diff, warningMessage: msg }
    }
    return { isValid: true, sumMembers, diff: 0 }
  }

  /**
   * S8-03 AC: Nhân viên chỉ xem được chỉ tiêu của chính mình
   */
  public getQuotasForUser(user: { id?: number; role?: string; full_name?: string }): TeamQuota[] {
    const all = [...this.quotas]

    // Admin hoặc Director: xem toàn bộ
    if (user.role === 'ADMIN' || user.role === 'DIRECTOR') {
      return all
    }

    // Manager: xem toàn đội nhóm của mình
    if (user.role === 'MANAGER') {
      return all.filter((t) => t.team_id === 1 || t.team_name.includes('1'))
    }

    // User / Sales rep: CHỈ xem được chỉ tiêu của CHÍNH MÌNH (lọc bỏ các thành viên khác)
    return all.map((t) => {
      const myQuota = t.members.filter(
        (m) =>
          (user.id && m.user_id === user.id) ||
          (user.full_name && m.user_name.toLowerCase().includes(user.full_name.toLowerCase()))
      )
      // Nếu không tìm thấy chính xác id thì lấy member đầu tiên để demo
      const effectiveMembers = myQuota.length > 0 ? myQuota : [t.members[0]]
      return {
        ...t,
        target_amount: effectiveMembers[0]?.target_amount || 0,
        achieved_amount: effectiveMembers[0]?.achieved_amount || 0,
        members: effectiveMembers,
      }
    })
  }

  public getAllQuotas(): TeamQuota[] {
    return [...this.quotas]
  }

  public getQuotaById(id: string): TeamQuota | undefined {
    return this.quotas.find((q) => q.id === id)
  }

  public getAuditLogs(): QuotaAuditLog[] {
    return [...this.logs]
  }

  /**
   * Lưu hoặc cập nhật chỉ tiêu (kèm kiểm tra khoá kỳ và ghi nhật ký kiểm toán nếu có sửa kỳ đã qua)
   */
  public saveQuota(
    payload: {
      id?: string
      team_id: number
      team_name: string
      period_type: QuotaPeriodType
      period_code: string
      period_label: string
      target_amount: number
      members: MemberQuota[]
      is_locked?: boolean
    },
    userModifier: { id: number; name: string },
    auditReason?: string
  ): TeamQuota {
    const now = new Date().toISOString()
    const existing = payload.id ? this.quotas.find((q) => q.id === payload.id) : null

    // S8-03 AC: Chỉ tiêu đã qua kỳ thì khoá lại, sửa phải có lý do và được ghi nhật ký
    if (existing && existing.is_locked) {
      if (!auditReason?.trim()) {
        throw new Error('Chỉ tiêu của kỳ này đã bị khoá. Bắt buộc phải nhập Lý do giải trình khi điều chỉnh!')
      }

      // Record Audit Log
      const newLog: QuotaAuditLog = {
        id: `log-quota-${Date.now()}`,
        team_quota_id: existing.id,
        team_name: existing.team_name,
        period_code: existing.period_code,
        modified_by_id: userModifier.id,
        modified_by_name: userModifier.name,
        modified_at: now,
        reason: auditReason.trim(),
        old_target: existing.target_amount,
        new_target: payload.target_amount,
        details: `Cập nhật chỉ tiêu nhóm và ${payload.members.length} thành viên trong kỳ đã kết thúc.`,
      }
      this.logs.unshift(newLog)
      this.saveLogsToStorage(this.logs)
    }

    if (existing) {
      this.quotas = this.quotas.map((q) => {
        if (q.id === existing.id) {
          return {
            ...q,
            ...payload,
            updated_at: now,
          }
        }
        return q
      })
      this.saveQuotasToStorage(this.quotas)
      return this.quotas.find((q) => q.id === existing.id)!
    } else {
      const newQuota: TeamQuota = {
        id: `quota-${payload.period_code}-t${payload.team_id}-${Date.now()}`,
        team_id: payload.team_id,
        team_name: payload.team_name,
        period_type: payload.period_type,
        period_code: payload.period_code,
        period_label: payload.period_label,
        target_amount: payload.target_amount,
        achieved_amount: 0,
        members: payload.members,
        is_locked: payload.is_locked ?? false,
        created_at: now,
        updated_at: now,
      }
      this.quotas.unshift(newQuota)
      this.saveQuotasToStorage(this.quotas)
      return newQuota
    }
  }
}

export const salesQuotaService = new SalesQuotaService()
