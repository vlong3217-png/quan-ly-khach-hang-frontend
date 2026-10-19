import * as XLSX from 'xlsx'
import type {
  RepActivityItem,
  RepWorkloadSummary,
  RepActivityFilter,
} from '../types/repActivityAudit.ts'

const STORAGE_KEY_ACTIVITIES = 'crm_rep_activity_audit_logs_v2'

const INITIAL_ACTIVITIES: RepActivityItem[] = []

export const repActivityAuditService = {
  getActivities(filter?: RepActivityFilter): RepActivityItem[] {
    try {
      localStorage.removeItem('crm_rep_activity_audit_logs_v1')
    } catch {
      // ignore
    }
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES)
    let list: RepActivityItem[] = raw ? JSON.parse(raw) : INITIAL_ACTIVITIES
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES))
    }

    if (!filter) return list

    // Lọc theo thành viên
    if (filter.user_id && filter.user_id !== 'ALL') {
      list = list.filter((a) => a.user_id === Number(filter.user_id))
    }

    // Lọc theo đội nhóm
    if (filter.team_id && filter.team_id !== 'ALL') {
      list = list.filter((a) => a.team_id === Number(filter.team_id))
    }

    // Lọc theo loại hoạt động
    if (filter.activity_type && filter.activity_type !== 'ALL') {
      list = list.filter((a) => a.activity_type === filter.activity_type)
    }

    // Lọc theo từ khóa
    if (filter.search_keyword && filter.search_keyword.trim() !== '') {
      const q = filter.search_keyword.toLowerCase().trim()
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.target_name.toLowerCase().includes(q) ||
          a.user_name.toLowerCase().includes(q)
      )
    }

    return list
  },

  getRepWorkloadSummaries(filter?: RepActivityFilter): RepWorkloadSummary[] {
    const activities = this.getActivities(filter)
    const membersMap: Record<number, RepWorkloadSummary> = {}

    activities.forEach((act) => {
      let m = membersMap[act.user_id]
      if (!m) {
        membersMap[act.user_id] = {
          user_id: act.user_id,
          user_name: act.user_name,
          team_name: act.team_name,
          role: act.user_role,
          total_activities: 0,
          calls_count: 0,
          meetings_count: 0,
          emails_count: 0,
          quotes_count: 0,
          notes_and_others: 0,
          workload_level: 'NORMAL',
          workload_share_percentage: 0,
        }
        m = membersMap[act.user_id]
      }

      m.total_activities += 1
      if (act.activity_type === 'CALL') m.calls_count += 1
      else if (act.activity_type === 'MEETING') m.meetings_count += 1
      else if (act.activity_type === 'EMAIL') m.emails_count += 1
      else if (act.activity_type === 'QUOTE') m.quotes_count += 1
      else m.notes_and_others += 1
    })

    const list = Object.values(membersMap)
    const totalAll = list.reduce((sum, item) => sum + item.total_activities, 0)

    list.forEach((m) => {
      m.workload_share_percentage =
        totalAll > 0 ? Number(((m.total_activities / totalAll) * 100).toFixed(1)) : 0
      if (m.total_activities >= 3) m.workload_level = 'HIGH'
      else if (m.total_activities >= 1) m.workload_level = 'NORMAL'
      else m.workload_level = 'LOW'
    })

    // Sort descending by total activities
    list.sort((a, b) => b.total_activities - a.total_activities)
    return list
  },

  exportToExcel(activities: RepActivityItem[], workloads: RepWorkloadSummary[]): void {
    // Sheet 1: Tổng số hoạt động theo từng thành viên
    const sheet1Data = workloads.map((w, idx) => ({
      STT: idx + 1,
      'Thành viên': w.user_name,
      'Đội nhóm': w.team_name,
      'Chức vụ': w.role,
      'Tổng số hoạt động': w.total_activities,
      'Cuộc gọi': w.calls_count,
      'Cuộc gặp': w.meetings_count,
      Email: w.emails_count,
      'Báo giá': w.quotes_count,
      'Ghi chú & khác': w.notes_and_others,
      'Tỷ trọng đóng góp (%)': `${w.workload_share_percentage}%`,
      'Mức độ khối lượng công việc':
        w.workload_level === 'HIGH' ? 'Cao' : w.workload_level === 'NORMAL' ? 'Trung bình' : 'Thấp',
    }))

    // Sheet 2: Nhật ký chi tiết hoạt động (Audit log)
    const sheet2Data = activities.map((a, idx) => ({
      STT: idx + 1,
      'Thời gian': new Date(a.timestamp).toLocaleString('vi-VN'),
      'Người thực hiện': a.user_name,
      'Đội nhóm': a.team_name,
      'Loại hoạt động': a.activity_type,
      'Đối tượng tác động': `${a.target_type}: ${a.target_name}`,
      'Tiêu đề': a.title,
      'Nội dung ghi nhận': a.content,
      'Thời lượng (phút)': a.duration_minutes || '—',
    }))

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data)
    const ws2 = XLSX.utils.json_to_sheet(sheet2Data)

    XLSX.utils.book_append_sheet(wb, ws1, 'Khoi_Luong_Cong_Viec')
    XLSX.utils.book_append_sheet(wb, ws2, 'Nhat_Ky_Hoat_Dong_Chi_Tiet')

    const filename = `Nhat_Ky_Hoat_Dong_Va_Khoi_Luong_Sales_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  },
}
