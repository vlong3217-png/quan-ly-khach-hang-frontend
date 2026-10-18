import * as XLSX from 'xlsx'
import type {
  MemberProductivity,
  LeadSlaDetail,
  ProductivityFilter,
  ProductivitySummary,
} from '../types/teamProductivity.ts'

const STORAGE_KEY_PRODUCTIVITY = 'crm_team_productivity_data_v2'
const STORAGE_KEY_LEAD_SLA = 'crm_lead_sla_details_v2'

const INITIAL_MEMBERS: MemberProductivity[] = []

const INITIAL_LEAD_SLAS: LeadSlaDetail[] = []

export const teamProductivityService = {
  getMembersProductivity(filter?: ProductivityFilter): MemberProductivity[] {
    try {
      localStorage.removeItem('crm_team_productivity_data_v1')
    } catch {
      // ignore
    }
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTIVITY)
    let list: MemberProductivity[] = raw ? JSON.parse(raw) : INITIAL_MEMBERS
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PRODUCTIVITY, JSON.stringify(INITIAL_MEMBERS))
    }

    if (!filter) return list

    if (filter.team_id && filter.team_id !== 'ALL') {
      list = list.filter((m) => m.team_id === Number(filter.team_id))
    }
    if (filter.user_id && filter.user_id !== 'ALL') {
      list = list.filter((m) => m.user_id === Number(filter.user_id))
    }
    if (filter.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      list = list.filter((m) => m.user_name.toLowerCase().includes(q) || m.team_name.toLowerCase().includes(q))
    }

    return list
  },

  getLeadSlaDetails(filter?: ProductivityFilter): LeadSlaDetail[] {
    try {
      localStorage.removeItem('crm_lead_sla_details_v1')
    } catch {
      // ignore
    }
    const raw = localStorage.getItem(STORAGE_KEY_LEAD_SLA)
    let list: LeadSlaDetail[] = raw ? JSON.parse(raw) : INITIAL_LEAD_SLAS
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LEAD_SLA, JSON.stringify(INITIAL_LEAD_SLAS))
    }

    if (!filter) return list

    if (filter.user_id && filter.user_id !== 'ALL') {
      list = list.filter((l) => l.assigned_to_id === Number(filter.user_id))
    }
    if (filter.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      list = list.filter(
        (l) =>
          l.lead_name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.assigned_to_name.toLowerCase().includes(q)
      )
    }

    return list
  },

  calculateSummary(members: MemberProductivity[]): ProductivitySummary {
    const total_calls = members.reduce((sum, m) => sum + m.total_calls, 0)
    const total_meetings = members.reduce((sum, m) => sum + m.total_meetings, 0)
    const total_quotes_sent = members.reduce((sum, m) => sum + m.total_quotes_sent, 0)
    const total_activities = members.reduce((sum, m) => sum + m.total_activities, 0)
    const total_leads_assigned = members.reduce((sum, m) => sum + m.leads_assigned, 0)
    const total_leads_in_sla = members.reduce((sum, m) => sum + m.leads_responded_in_sla, 0)

    const overall_sla_rate =
      total_leads_assigned > 0
        ? Number(((total_leads_in_sla / total_leads_assigned) * 100).toFixed(1))
        : 100

    const totalHours = members.reduce((sum, m) => sum + m.avg_response_time_hours * m.leads_assigned, 0)
    const overall_avg_response_hours =
      total_leads_assigned > 0 ? Number((totalHours / total_leads_assigned).toFixed(1)) : 0

    return {
      total_calls,
      total_meetings,
      total_quotes_sent,
      total_activities,
      total_leads_assigned,
      total_leads_in_sla,
      overall_sla_rate,
      overall_avg_response_hours,
    }
  },

  exportToExcel(periodLabel: string, filter?: ProductivityFilter): void {
    const members = this.getMembersProductivity(filter)
    const leadSlas = this.getLeadSlaDetails(filter)

    // Sheet 1: Năng suất thành viên
    const sheet1Data = members.map((m, idx) => ({
      STT: idx + 1,
      'Thành viên': m.user_name,
      'Phòng ban/Đội': m.team_name,
      'Chức vụ': m.role,
      'Số cuộc gọi': m.total_calls,
      'Số cuộc gặp': m.total_meetings,
      'Báo giá đã gửi': m.total_quotes_sent,
      'Tổng hoạt động': m.total_activities,
      'Lead được phân bổ': m.leads_assigned,
      'Lead phản hồi đúng SLA': m.leads_responded_in_sla,
      'Lead quá hạn SLA': m.leads_overdue_sla,
      'Tỷ lệ tuân thủ SLA (%)': `${m.sla_compliance_rate}%`,
      'TG phản hồi TB (giờ)': `${m.avg_response_time_hours}h`,
    }))

    // Sheet 2: Hoạt động theo tuần
    const sheet2Data: Array<Record<string, string | number>> = []
    members.forEach((m) => {
      m.weekly_activities.forEach((w) => {
        sheet2Data.push({
          'Thành viên': m.user_name,
          'Đội nhóm': m.team_name,
          Tuần: w.week_label,
          'Cuộc gọi': w.calls,
          'Cuộc gặp': w.meetings,
          'Báo giá': w.quotes_sent,
          'Tổng hoạt động': w.total_activities,
        })
      })
    })

    // Sheet 3: Danh sách phản hồi SLA Lead
    const sheet3Data = leadSlas.map((l, idx) => ({
      STT: idx + 1,
      'Tên khách hàng tiềm năng': l.lead_name,
      'Công ty/Tổ chức': l.company,
      'Phụ trách': l.assigned_to_name,
      'Thời điểm tạo': l.created_at,
      'Thời điểm phản hồi đầu tiên': l.first_responded_at || 'Chưa phản hồi',
      'Định mức SLA (giờ)': l.sla_limit_hours,
      'Thời gian phản hồi thực tế (giờ)': l.actual_duration_hours ? `${l.actual_duration_hours}h` : 'N/A',
      'Trạng thái SLA': l.is_within_sla ? 'Trong SLA (<24h)' : 'Quá hạn SLA (>24h)',
    }))

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data)
    const ws2 = XLSX.utils.json_to_sheet(sheet2Data)
    const ws3 = XLSX.utils.json_to_sheet(sheet3Data)

    XLSX.utils.book_append_sheet(wb, ws1, 'Năng Suất Thành Viên')
    XLSX.utils.book_append_sheet(wb, ws2, 'Hoạt Động Theo Tuần')
    XLSX.utils.book_append_sheet(wb, ws3, 'Tuân Thủ SLA Lead')

    const filename = `Bao_Cao_Nang_Suat_Va_SLA_${periodLabel.replace(/\s+/g, '_')}.xlsx`
    XLSX.writeFile(wb, filename)
  },
}
