import * as XLSX from 'xlsx'
import type {
  MemberProductivity,
  LeadSlaDetail,
  ProductivityFilter,
  ProductivitySummary,
} from '../types/teamProductivity.ts'

const STORAGE_KEY_PRODUCTIVITY = 'crm_team_productivity_data_v1'
const STORAGE_KEY_LEAD_SLA = 'crm_lead_sla_details_v1'

const INITIAL_MEMBERS: MemberProductivity[] = [
  {
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    role: 'Chuyên viên Kinh doanh Senior',
    total_calls: 142,
    total_meetings: 38,
    total_quotes_sent: 24,
    total_activities: 204,
    leads_assigned: 45,
    leads_responded_in_sla: 42,
    leads_overdue_sla: 3,
    sla_compliance_rate: 93.3,
    avg_response_time_hours: 1.8,
    weekly_activities: [
      { week_number: 1, week_label: 'Tuần 1 (01/10 - 07/10)', calls: 35, meetings: 9, quotes_sent: 6, total_activities: 50 },
      { week_number: 2, week_label: 'Tuần 2 (08/10 - 14/10)', calls: 40, meetings: 11, quotes_sent: 7, total_activities: 58 },
      { week_number: 3, week_label: 'Tuần 3 (15/10 - 21/10)', calls: 38, meetings: 10, quotes_sent: 5, total_activities: 53 },
      { week_number: 4, week_label: 'Tuần 4 (22/10 - 28/10)', calls: 29, meetings: 8, quotes_sent: 6, total_activities: 43 },
    ],
  },
  {
    user_id: 2,
    user_name: 'Trần Thị B',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    role: 'Chuyên viên Kinh doanh',
    total_calls: 118,
    total_meetings: 29,
    total_quotes_sent: 19,
    total_activities: 166,
    leads_assigned: 38,
    leads_responded_in_sla: 35,
    leads_overdue_sla: 3,
    sla_compliance_rate: 92.1,
    avg_response_time_hours: 2.3,
    weekly_activities: [
      { week_number: 1, week_label: 'Tuần 1 (01/10 - 07/10)', calls: 28, meetings: 7, quotes_sent: 4, total_activities: 39 },
      { week_number: 2, week_label: 'Tuần 2 (08/10 - 14/10)', calls: 32, meetings: 8, quotes_sent: 5, total_activities: 45 },
      { week_number: 3, week_label: 'Tuần 3 (15/10 - 21/10)', calls: 30, meetings: 8, quotes_sent: 5, total_activities: 43 },
      { week_number: 4, week_label: 'Tuần 4 (22/10 - 28/10)', calls: 28, meetings: 6, quotes_sent: 5, total_activities: 39 },
    ],
  },
  {
    user_id: 3,
    user_name: 'Lê Văn C',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    role: 'Chuyên viên Kinh doanh',
    total_calls: 95,
    total_meetings: 22,
    total_quotes_sent: 14,
    total_activities: 131,
    leads_assigned: 32,
    leads_responded_in_sla: 25,
    leads_overdue_sla: 7,
    sla_compliance_rate: 78.1,
    avg_response_time_hours: 4.6,
    weekly_activities: [
      { week_number: 1, week_label: 'Tuần 1 (01/10 - 07/10)', calls: 24, meetings: 5, quotes_sent: 3, total_activities: 32 },
      { week_number: 2, week_label: 'Tuần 2 (08/10 - 14/10)', calls: 26, meetings: 6, quotes_sent: 4, total_activities: 36 },
      { week_number: 3, week_label: 'Tuần 3 (15/10 - 21/10)', calls: 25, meetings: 6, quotes_sent: 4, total_activities: 35 },
      { week_number: 4, week_label: 'Tuần 4 (22/10 - 28/10)', calls: 20, meetings: 5, quotes_sent: 3, total_activities: 28 },
    ],
  },
  {
    user_id: 4,
    user_name: 'Phạm Thị D',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    role: 'Account Executive Senior',
    total_calls: 165,
    total_meetings: 45,
    total_quotes_sent: 31,
    total_activities: 241,
    leads_assigned: 50,
    leads_responded_in_sla: 48,
    leads_overdue_sla: 2,
    sla_compliance_rate: 96.0,
    avg_response_time_hours: 1.4,
    weekly_activities: [
      { week_number: 1, week_label: 'Tuần 1 (01/10 - 07/10)', calls: 42, meetings: 12, quotes_sent: 8, total_activities: 62 },
      { week_number: 2, week_label: 'Tuần 2 (08/10 - 14/10)', calls: 44, meetings: 11, quotes_sent: 8, total_activities: 63 },
      { week_number: 3, week_label: 'Tuần 3 (15/10 - 21/10)', calls: 41, meetings: 12, quotes_sent: 8, total_activities: 61 },
      { week_number: 4, week_label: 'Tuần 4 (22/10 - 28/10)', calls: 38, meetings: 10, quotes_sent: 7, total_activities: 55 },
    ],
  },
  {
    user_id: 5,
    user_name: 'Hoàng Văn E',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    role: 'Account Executive',
    total_calls: 130,
    total_meetings: 34,
    total_quotes_sent: 22,
    total_activities: 186,
    leads_assigned: 40,
    leads_responded_in_sla: 36,
    leads_overdue_sla: 4,
    sla_compliance_rate: 90.0,
    avg_response_time_hours: 2.1,
    weekly_activities: [
      { week_number: 1, week_label: 'Tuần 1 (01/10 - 07/10)', calls: 32, meetings: 8, quotes_sent: 5, total_activities: 45 },
      { week_number: 2, week_label: 'Tuần 2 (08/10 - 14/10)', calls: 35, meetings: 9, quotes_sent: 6, total_activities: 50 },
      { week_number: 3, week_label: 'Tuần 3 (15/10 - 21/10)', calls: 33, meetings: 9, quotes_sent: 6, total_activities: 48 },
      { week_number: 4, week_label: 'Tuần 4 (22/10 - 28/10)', calls: 30, meetings: 8, quotes_sent: 5, total_activities: 43 },
    ],
  },
]

const INITIAL_LEAD_SLAS: LeadSlaDetail[] = [
  {
    id: 'sla-001',
    lead_name: 'Trương Quốc Hùng',
    company: 'Tập đoàn Công nghệ Sao Mai',
    assigned_to_id: 1,
    assigned_to_name: 'Nguyễn Văn A',
    created_at: '2026-10-02T08:30:00Z',
    first_responded_at: '2026-10-02T09:45:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 1.25,
    is_within_sla: true,
    status: 'IN_SLA',
  },
  {
    id: 'sla-002',
    lead_name: 'Đinh Thị Mai',
    company: 'Công ty CP Vận tải Á Châu',
    assigned_to_id: 1,
    assigned_to_name: 'Nguyễn Văn A',
    created_at: '2026-10-04T10:00:00Z',
    first_responded_at: '2026-10-04T12:00:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 2.0,
    is_within_sla: true,
    status: 'IN_SLA',
  },
  {
    id: 'sla-003',
    lead_name: 'Lê Minh Tuấn',
    company: 'Chuỗi Bán lẻ Horizon Mart',
    assigned_to_id: 3,
    assigned_to_name: 'Lê Văn C',
    created_at: '2026-10-05T14:15:00Z',
    first_responded_at: '2026-10-06T19:30:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 29.25,
    is_within_sla: false,
    status: 'OVERDUE',
  },
  {
    id: 'sla-004',
    lead_name: 'Vũ Hải Đăng',
    company: 'Bất động sản Nam Long An',
    assigned_to_id: 4,
    assigned_to_name: 'Phạm Thị D',
    created_at: '2026-10-08T09:00:00Z',
    first_responded_at: '2026-10-08T10:15:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 1.25,
    is_within_sla: true,
    status: 'IN_SLA',
  },
  {
    id: 'sla-005',
    lead_name: 'Hoàng Kim Ngân',
    company: 'Dược phẩm Tân Á Bình Minh',
    assigned_to_id: 2,
    assigned_to_name: 'Trần Thị B',
    created_at: '2026-10-10T11:20:00Z',
    first_responded_at: '2026-10-10T13:40:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 2.33,
    is_within_sla: true,
    status: 'IN_SLA',
  },
  {
    id: 'sla-006',
    lead_name: 'Phan Bảo Long',
    company: 'Logistics Toàn Cầu Vina',
    assigned_to_id: 5,
    assigned_to_name: 'Hoàng Văn E',
    created_at: '2026-10-12T15:00:00Z',
    first_responded_at: '2026-10-12T17:15:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 2.25,
    is_within_sla: true,
    status: 'IN_SLA',
  },
  {
    id: 'sla-007',
    lead_name: 'Bùi Thanh Hương',
    company: 'Nội thất Kiến Vàng',
    assigned_to_id: 3,
    assigned_to_name: 'Lê Văn C',
    created_at: '2026-10-15T08:00:00Z',
    first_responded_at: '2026-10-16T14:30:00Z',
    sla_limit_hours: 24,
    actual_duration_hours: 30.5,
    is_within_sla: false,
    status: 'OVERDUE',
  },
]

export const teamProductivityService = {
  getMembersProductivity(filter?: ProductivityFilter): MemberProductivity[] {
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
