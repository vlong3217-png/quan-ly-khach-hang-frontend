import * as XLSX from 'xlsx'
import type {
  RepActivityItem,
  RepWorkloadSummary,
  RepActivityFilter,
} from '../types/repActivityAudit.ts'

const STORAGE_KEY_ACTIVITIES = 'crm_rep_activity_audit_logs_v1'

const INITIAL_ACTIVITIES: RepActivityItem[] = [
  {
    id: 'act-101',
    timestamp: '2026-10-15T09:30:00Z',
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    user_role: 'Chuyên viên Kinh doanh Senior',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'CALL',
    target_type: 'CUSTOMER',
    target_name: 'Công ty Cổ phần Công nghệ AlphaTech',
    title: 'Gọi điện thoại trao đổi yêu cầu bản quyền bổ sung',
    content: 'Trao đổi với anh Hùng về việc mở rộng thêm 25 user license CRM trong Quý 4.',
    duration_minutes: 18,
  },
  {
    id: 'act-102',
    timestamp: '2026-10-15T08:45:00Z',
    user_id: 2,
    user_name: 'Trần Thị B',
    user_role: 'Chuyên viên Kinh doanh',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'EMAIL',
    target_type: 'OPPORTUNITY',
    target_name: 'OPP-005: Nâng cấp hệ thống Cloud CRM',
    title: 'Gửi email tài liệu giải pháp kỹ thuật và case study',
    content: 'Đã gửi file PDF tài liệu kiến trúc bảo mật đám mây và bảng tính ROI mẫu cho giám đốc CNTT.',
  },
  {
    id: 'act-103',
    timestamp: '2026-10-14T15:20:00Z',
    user_id: 4,
    user_name: 'Phạm Thị D',
    user_role: 'Account Executive Senior',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    activity_type: 'MEETING',
    target_type: 'OPPORTUNITY',
    target_name: 'OPP-008: Triển khai ERP & CRM Tập đoàn Thái Bình Dương',
    title: 'Cuộc gặp trực tiếp trình diễn Demo quy trình phê duyệt',
    content: 'Thuyết trình trực tiếp tại văn phòng khách hàng với Ban Giám đốc và Trưởng phòng kinh doanh.',
    duration_minutes: 75,
  },
  {
    id: 'act-104',
    timestamp: '2026-10-14T14:00:00Z',
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    user_role: 'Chuyên viên Kinh doanh Senior',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'QUOTE',
    target_type: 'OPPORTUNITY',
    target_name: 'OPP-001: Triển khai CRM Doanh nghiệp AlphaTech',
    title: 'Gửi báo giá số BG-2026-1014 kèm chiết khấu 10%',
    content: 'Phát hành bảng báo giá chính thức kèm điều khoản bảo hành 24 tháng cho khách hàng.',
  },
  {
    id: 'act-105',
    timestamp: '2026-10-14T10:15:00Z',
    user_id: 3,
    user_name: 'Lê Văn C',
    user_role: 'Chuyên viên Kinh doanh',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'CALL',
    target_type: 'LEAD',
    target_name: 'Anh Vũ Hoàng Long - Chuỗi Bán Lẻ Techzone',
    title: 'Cuộc gọi xác nhận nhu cầu & hẹn lịch demo trực tuyến',
    content: 'Khách hàng có nhu cầu đồng bộ dữ liệu giữa POS và CRM cho chuỗi 12 cửa hàng.',
    duration_minutes: 15,
  },
  {
    id: 'act-106',
    timestamp: '2026-10-13T16:30:00Z',
    user_id: 5,
    user_name: 'Hoàng Văn E',
    user_role: 'Account Executive',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    activity_type: 'STAGE_CHANGE',
    target_type: 'OPPORTUNITY',
    target_name: 'OPP-012: Phần mềm Quản lý phân phối VinaLogistics',
    title: 'Chuyển giai đoạn cơ hội: Báo giá & Đề xuất → Đàm phán thương thảo',
    content: 'Khách hàng đã đồng ý về mặt kỹ thuật, bắt đầu thương thảo điều khoản thanh toán.',
  },
  {
    id: 'act-107',
    timestamp: '2026-10-13T11:00:00Z',
    user_id: 4,
    user_name: 'Phạm Thị D',
    user_role: 'Account Executive Senior',
    team_id: 2,
    team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
    activity_type: 'NOTE',
    target_type: 'CUSTOMER',
    target_name: 'Tập đoàn Dược phẩm Thiên Ý',
    title: 'Ghi chú cuộc trao đổi sau cuộc họp nội bộ của khách hàng',
    content: 'Hội đồng quản trị khách hàng đã phê duyệt ngân sách 1.5 tỷ cho dự án chuyển đổi số.',
  },
  {
    id: 'act-108',
    timestamp: '2026-10-12T14:45:00Z',
    user_id: 2,
    user_name: 'Trần Thị B',
    user_role: 'Chuyên viên Kinh doanh',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'MEETING',
    target_type: 'CUSTOMER',
    target_name: 'Công ty May mặc Tân Hưng Thịnh',
    title: 'Họp trực tuyến qua Google Meet khảo sát quy trình bán buôn',
    content: 'Ghi nhận luồng xuất kho và chiết khấu bậc thang theo đại lý.',
    duration_minutes: 50,
  },
  {
    id: 'act-109',
    timestamp: '2026-10-11T09:10:00Z',
    user_id: 3,
    user_name: 'Lê Văn C',
    user_role: 'Chuyên viên Kinh doanh',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'EMAIL',
    target_type: 'LEAD',
    target_name: 'Chị Mai Lan - Bất động sản Thịnh Vượng',
    title: 'Gửi thư cảm ơn và tóm tắt buổi gặp giới thiệu sản phẩm',
    content: 'Cung cấp liên kết dùng thử hệ thống CRM trong vòng 14 ngày.',
  },
  {
    id: 'act-110',
    timestamp: '2026-10-10T16:00:00Z',
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    user_role: 'Chuyên viên Kinh doanh Senior',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    activity_type: 'CALL',
    target_type: 'CUSTOMER',
    target_name: 'Công ty CP Nhựa Song Long An',
    title: 'Gọi kiểm tra mức độ hài lòng sau khi bàn giao dự án',
    content: 'Khách hàng phản hồi đội hỗ trợ kỹ thuật nhiệt tình, hệ thống chạy ổn định.',
    duration_minutes: 12,
  },
]

export const repActivityAuditService = {
  getActivities(filter?: RepActivityFilter): RepActivityItem[] {
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
    const membersMap: Record<number, RepWorkloadSummary> = {
      1: {
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        team_name: 'Đội Kinh Doanh 1',
        role: 'Chuyên viên Kinh doanh Senior',
        total_activities: 0,
        calls_count: 0,
        meetings_count: 0,
        emails_count: 0,
        quotes_count: 0,
        notes_and_others: 0,
        workload_level: 'NORMAL',
        workload_share_percentage: 0,
      },
      2: {
        user_id: 2,
        user_name: 'Trần Thị B',
        team_name: 'Đội Kinh Doanh 1',
        role: 'Chuyên viên Kinh doanh',
        total_activities: 0,
        calls_count: 0,
        meetings_count: 0,
        emails_count: 0,
        quotes_count: 0,
        notes_and_others: 0,
        workload_level: 'NORMAL',
        workload_share_percentage: 0,
      },
      3: {
        user_id: 3,
        user_name: 'Lê Văn C',
        team_name: 'Đội Kinh Doanh 1',
        role: 'Chuyên viên Kinh doanh',
        total_activities: 0,
        calls_count: 0,
        meetings_count: 0,
        emails_count: 0,
        quotes_count: 0,
        notes_and_others: 0,
        workload_level: 'NORMAL',
        workload_share_percentage: 0,
      },
      4: {
        user_id: 4,
        user_name: 'Phạm Thị D',
        team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
        role: 'Account Executive Senior',
        total_activities: 0,
        calls_count: 0,
        meetings_count: 0,
        emails_count: 0,
        quotes_count: 0,
        notes_and_others: 0,
        workload_level: 'NORMAL',
        workload_share_percentage: 0,
      },
      5: {
        user_id: 5,
        user_name: 'Hoàng Văn E',
        team_name: 'Đội Khách Hàng Doanh Nghiệp (Enterprise)',
        role: 'Account Executive',
        total_activities: 0,
        calls_count: 0,
        meetings_count: 0,
        emails_count: 0,
        quotes_count: 0,
        notes_and_others: 0,
        workload_level: 'NORMAL',
        workload_share_percentage: 0,
      },
    }

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
