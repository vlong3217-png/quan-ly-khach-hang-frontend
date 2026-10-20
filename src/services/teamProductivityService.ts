import * as XLSX from 'xlsx'
import type {
  MemberProductivity,
  LeadSlaDetail,
  ProductivityFilter,
  ProductivitySummary,
} from '../types/teamProductivity.ts'
import { getMockUsers } from './userService.ts'
import { getStoredLeads } from './leadService.ts'
import { getStoredOpportunities } from './opportunityService.ts'
import { quoteService } from './quoteService.ts'

export const teamProductivityService = {
  /**
   * Tính toán năng suất động của các thành viên dựa trên dữ liệu người dùng thực tế,
   * số Lead được bàn giao, số Báo giá đã lập, và số Cơ hội bán hàng đang xử lý.
   */
  getMembersProductivity(filter?: ProductivityFilter): MemberProductivity[] {
    const users = getMockUsers()
    const leads = getStoredLeads()
    const opps = getStoredOpportunities()
    const quotes = quoteService.getQuotes()

    // Phân loại Lead theo người phụ trách
    const leadsByUser = new Map<number, typeof leads>()
    for (const l of leads) {
      const uId = l.owner_id ? Number(l.owner_id) : 1
      const cur = leadsByUser.get(uId) || []
      cur.push(l)
      leadsByUser.set(uId, cur)
    }

    // Phân loại Báo giá theo người lập/phụ trách
    const quotesByUser = new Map<number, number>()
    for (const q of quotes) {
      const uId = q.created_by_id ? Number(q.created_by_id) : 1
      quotesByUser.set(uId, (quotesByUser.get(uId) || 0) + 1)
    }

    // Phân loại Cơ hội theo người phụ trách
    const oppsByUser = new Map<number, number>()
    for (const opp of opps) {
      const uId = opp.owner_id ? Number(opp.owner_id) : 1
      oppsByUser.set(uId, (oppsByUser.get(uId) || 0) + 1)
    }

    const members: MemberProductivity[] = users.map((u) => {
      const uId = Number(u.id)
      const userLeads = leadsByUser.get(uId) || []
      const quotesCount = quotesByUser.get(uId) || 0
      const oppsCount = oppsByUser.get(uId) || 0

      let teamId = 1
      let teamName = u.team || 'Đội Kinh Doanh 1'
      if (teamName.includes('2') || teamName.toLowerCase().includes('miền nam')) {
        teamId = 2
      } else if (teamName.includes('3') || teamName.toLowerCase().includes('miền trung')) {
        teamId = 3
      }

      // Thống kê SLA Leads của nhân viên
      const leadsAssigned = userLeads.length
      const leadsInSla = userLeads.filter(
        (l) => l.assignment_status === 'ACCEPTED' || l.status !== 'NEW' || l.sla_status === 'ON_TIME'
      ).length
      const leadsOverdue = Math.max(0, leadsAssigned - leadsInSla)
      const slaRate = leadsAssigned > 0 ? Number(((leadsInSla / leadsAssigned) * 100).toFixed(1)) : 100

      // Ước tính số cuộc gọi và gặp gỡ dựa trên số lượng tương tác deal & lead
      const callsCount = leadsAssigned * 2 + oppsCount * 3
      const meetingsCount = Math.floor(oppsCount * 1.5)
      const totalActivities = callsCount + meetingsCount + quotesCount

      const weeklyActivities = [
        {
          week_number: 1,
          week_label: 'Tuần 1 (01/10 - 07/10)',
          calls: Math.ceil(callsCount * 0.25),
          meetings: Math.ceil(meetingsCount * 0.25),
          quotes_sent: Math.ceil(quotesCount * 0.25),
          total_activities: Math.ceil(totalActivities * 0.25),
        },
        {
          week_number: 2,
          week_label: 'Tuần 2 (08/10 - 14/10)',
          calls: Math.ceil(callsCount * 0.25),
          meetings: Math.ceil(meetingsCount * 0.25),
          quotes_sent: Math.ceil(quotesCount * 0.25),
          total_activities: Math.ceil(totalActivities * 0.25),
        },
        {
          week_number: 3,
          week_label: 'Tuần 3 (15/10 - 21/10)',
          calls: Math.ceil(callsCount * 0.25),
          meetings: Math.ceil(meetingsCount * 0.25),
          quotes_sent: Math.ceil(quotesCount * 0.25),
          total_activities: Math.ceil(totalActivities * 0.25),
        },
        {
          week_number: 4,
          week_label: 'Tuần 4 (22/10 - 28/10)',
          calls: Math.max(0, callsCount - Math.ceil(callsCount * 0.75)),
          meetings: Math.max(0, meetingsCount - Math.ceil(meetingsCount * 0.75)),
          quotes_sent: Math.max(0, quotesCount - Math.ceil(quotesCount * 0.75)),
          total_activities: Math.max(0, totalActivities - Math.ceil(totalActivities * 0.75)),
        },
      ]

      return {
        user_id: uId,
        user_name: u.full_name || u.email,
        team_id: teamId,
        team_name: teamName,
        role: u.role || 'STAFF',
        total_calls: callsCount,
        total_meetings: meetingsCount,
        total_quotes_sent: quotesCount,
        total_activities: totalActivities,
        leads_assigned: leadsAssigned,
        leads_responded_in_sla: leadsInSla,
        leads_overdue_sla: leadsOverdue,
        sla_compliance_rate: slaRate,
        avg_response_time_hours: leadsAssigned > 0 ? 1.5 : 0,
        weekly_activities: weeklyActivities,
      }
    })

    let list = [...members]

    if (!filter) return list

    if (filter.team_id && filter.team_id !== 'ALL') {
      list = list.filter((m) => m.team_id === Number(filter.team_id))
    }
    if (filter.user_id && filter.user_id !== 'ALL') {
      list = list.filter((m) => m.user_id === Number(filter.user_id))
    }
    if (filter.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      list = list.filter(
        (m) => m.user_name.toLowerCase().includes(q) || m.team_name.toLowerCase().includes(q)
      )
    }

    return list
  },

  getLeadSlaDetails(filter?: ProductivityFilter): LeadSlaDetail[] {
    const leads = getStoredLeads()
    const users = getMockUsers()
    const userMap = new Map(users.map((u) => [Number(u.id), u.full_name || u.email]))

    const list: LeadSlaDetail[] = leads.map((l) => {
      const ownerId = l.owner_id ? Number(l.owner_id) : 1
      const isWithin = l.assignment_status === 'ACCEPTED' || l.status !== 'NEW' || l.sla_status === 'ON_TIME'
      return {
        id: l.id,
        lead_name: l.full_name,
        company: l.company || 'Công ty Chưa cập nhật',
        assigned_to_id: ownerId,
        assigned_to_name: userMap.get(ownerId) || l.owner_name || 'Admin',
        created_at: l.created_at || new Date().toISOString(),
        first_responded_at: l.assigned_at,
        sla_limit_hours: l.sla_hours || 24,
        actual_duration_hours: 1.5,
        is_within_sla: isWithin,
        status: isWithin ? 'IN_SLA' : 'OVERDUE',
      }
    })

    let filtered = [...list]
    if (!filter) return filtered

    if (filter.user_id && filter.user_id !== 'ALL') {
      filtered = filtered.filter((l) => l.assigned_to_id === Number(filter.user_id))
    }
    if (filter.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      filtered = filtered.filter(
        (l) =>
          l.lead_name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.assigned_to_name.toLowerCase().includes(q)
      )
    }

    return filtered
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
