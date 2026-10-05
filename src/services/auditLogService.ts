/* ──────────── Audit Log Service (S2-04) ──────────── */
import type {
  AuditLogEntry,
  AuditLogFilterParams,
  AuditLogResponse,
} from '../types/auditLog.ts'
import { API_BASE_URL } from './authService.ts'

/* ──────────── Mock Data đầy đủ theo yêu cầu S2-04 ──────────── */
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 1,
    performer_id: 1,
    performer_name: 'Nguyễn Văn A',
    performer_email: 'nguyen.a@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-10-02T09:15:00+07:00',
    entity_type: 'DISCOUNT',
    entity_id: 'KH001',
    entity_name: 'Công ty Cổ phần Công Nghệ Alpha',
    action: 'UPDATE',
    old_value: '5%',
    new_value: '10%',
    reason: 'Phê duyệt chính sách chiết khấu ưu đãi khách hàng VIP quý 4',
  },
  {
    id: 2,
    performer_id: 2,
    performer_name: 'Trần Văn B',
    performer_email: 'tran.b@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-10-02T10:30:00+07:00',
    entity_type: 'TARGET',
    entity_id: 'TARGET-01',
    entity_name: 'Chỉ tiêu Doanh số Đội Kinh Doanh 1',
    action: 'UPDATE',
    old_value: '100.000.000',
    new_value: '150.000.000',
    reason: 'Điều chỉnh nâng chỉ tiêu doanh thu theo kế hoạch mở rộng thị trường',
  },
  {
    id: 3,
    performer_id: 3,
    performer_name: 'Lê Văn C',
    performer_email: 'le.c@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-10-01T14:20:00+07:00',
    entity_type: 'OWNERSHIP',
    entity_id: 'KH002',
    entity_name: 'Tập đoàn Bất Động Sản Hòa Bình',
    action: 'CHANGE',
    old_value: 'Nguyễn Văn A',
    new_value: 'Trần Văn B',
    reason: 'Bàn giao phụ trách khách hàng theo điều phối nhân sự nội bộ',
  },
  {
    id: 4,
    performer_id: 1,
    performer_name: 'Nguyễn Văn A',
    performer_email: 'nguyen.a@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-30T16:45:00+07:00',
    entity_type: 'USER_ROLE',
    entity_id: 'USER-005',
    entity_name: 'Phạm Thị Dung (dung.pham@company.com)',
    action: 'CHANGE',
    old_value: 'USER',
    new_value: 'MANAGER',
    reason: 'Bổ nhiệm vị trí Trưởng nhóm Kinh doanh Đội 2',
  },
  {
    id: 5,
    performer_id: 1,
    performer_name: 'Nguyễn Văn A',
    performer_email: 'nguyen.a@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-29T11:10:00+07:00',
    entity_type: 'DISCOUNT',
    entity_id: 'KH003',
    entity_name: 'Hệ thống Bán Lẻ Toàn Cầu Mekong',
    action: 'UPDATE',
    old_value: '8%',
    new_value: '12%',
    reason: 'Áp dụng mức chiết khấu khối lượng đơn hàng lớn',
  },
  {
    id: 6,
    performer_id: 2,
    performer_name: 'Trần Văn B',
    performer_email: 'tran.b@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-28T15:30:00+07:00',
    entity_type: 'TARGET',
    entity_id: 'TARGET-02',
    entity_name: 'Chỉ tiêu Doanh số Đội Kinh Doanh 2',
    action: 'UPDATE',
    old_value: '200.000.000',
    new_value: '250.000.000',
    reason: 'Cân đối chỉ tiêu sau khi tuyển dụng bổ sung 3 nhân sự',
  },
  {
    id: 7,
    performer_id: 3,
    performer_name: 'Lê Văn C',
    performer_email: 'le.c@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-27T08:45:00+07:00',
    entity_type: 'OWNERSHIP',
    entity_id: 'KH004',
    entity_name: 'Tổng Công ty Logistics Sao Vàng',
    action: 'CHANGE',
    old_value: 'Lê Đình Trọng',
    new_value: 'Nguyễn Văn A',
    reason: 'Khách hàng chiến lược bàn giao cho cấp quản lý trực tiếp phụ trách',
  },
  {
    id: 8,
    performer_id: 1,
    performer_name: 'Nguyễn Văn A',
    performer_email: 'nguyen.a@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-25T17:00:00+07:00',
    entity_type: 'USER_ROLE',
    entity_id: 'USER-008',
    entity_name: 'Vũ Quốc Bảo (bao.vu@company.com)',
    action: 'CHANGE',
    old_value: 'MANAGER',
    new_value: 'ADMIN',
    reason: 'Thăng cấp phân quyền quản trị hệ thống kỹ thuật',
  },
  {
    id: 9,
    performer_id: 2,
    performer_name: 'Trần Văn B',
    performer_email: 'tran.b@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-22T10:15:00+07:00',
    entity_type: 'DISCOUNT',
    entity_id: 'KH005',
    entity_name: 'Bảo Hiểm Đại Việt Life',
    action: 'UPDATE',
    old_value: '3%',
    new_value: '7%',
    reason: 'Cập nhật lại tỷ lệ chiết khấu hợp đồng dịch vụ thường niên',
  },
  {
    id: 10,
    performer_id: 1,
    performer_name: 'Nguyễn Văn A',
    performer_email: 'nguyen.a@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-20T13:50:00+07:00',
    entity_type: 'TARGET',
    entity_id: 'TARGET-Q4',
    entity_name: 'Chỉ tiêu Doanh số Toàn Công ty Quý 4',
    action: 'UPDATE',
    old_value: '1.000.000.000',
    new_value: '1.200.000.000',
    reason: 'Quyết định HĐQT điều chỉnh kế hoạch kinh doanh cuối năm',
  },
  {
    id: 11,
    performer_id: 3,
    performer_name: 'Lê Văn C',
    performer_email: 'le.c@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-18T09:00:00+07:00',
    entity_type: 'OWNERSHIP',
    entity_id: 'KH007',
    entity_name: 'Dược phẩm Phương Đông Pharma',
    action: 'CHANGE',
    old_value: 'Trần Thị Mai',
    new_value: 'Nguyễn Văn Tuấn',
    reason: 'Nhân viên Mai nghỉ thai sản, chuyển nhượng quyền quản lý tài khoản',
  },
  {
    id: 12,
    performer_id: 1,
    performer_name: 'Nguyễn Văn A',
    performer_email: 'nguyen.a@company.com',
    performer_role: 'ADMIN',
    timestamp: '2026-09-15T14:30:00+07:00',
    entity_type: 'USER_ROLE',
    entity_id: 'USER-012',
    entity_name: 'Hoàng Kim Chi (chi.hoang@company.com)',
    action: 'CHANGE',
    old_value: 'USER',
    new_value: 'MANAGER',
    reason: 'Chuyển giao điều hành đội kinh doanh miền Trung',
  },
]

/**
 * Lấy danh sách nhật ký thay đổi với bộ lọc và phân trang
 * Được thiết kế để gọi API thực tế nếu có, hoặc fallback sang mock data
 */
export async function getAuditLogs(
  filters: AuditLogFilterParams = {}
): Promise<AuditLogResponse> {
  const {
    performer_name = '',
    entity_type = '',
    from_date = '',
    to_date = '',
    search_keyword = '',
    page = 1,
    pageSize = 10,
  } = filters

  // 1. Thử gọi API Backend nếu endpoint audit log khả dụng
  try {
    const params = new URLSearchParams()
    if (performer_name) params.append('performer', performer_name)
    if (entity_type && entity_type !== 'ALL') params.append('entity_type', entity_type)
    if (from_date) params.append('from_date', from_date)
    if (to_date) params.append('to_date', to_date)
    if (search_keyword) params.append('search', search_keyword)
    params.append('page', String(page))
    params.append('page_size', String(pageSize))

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(2500),
    })

    if (response.ok) {
      const json = await response.json()
      const rawList = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.logs)
        ? json.logs
        : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.results)
        ? json.results
        : []
      return {
        success: true,
        data: rawList,
        total: json.total ?? rawList.length,
        page: json.page ?? page,
        pageSize: json.pageSize ?? pageSize,
        totalPages: json.totalPages ?? Math.max(1, Math.ceil((json.total ?? rawList.length) / pageSize)),
      }
    }
  } catch {
    // Backend chưa có endpoint -> chuyển sang xử lý mock data phía frontend
  }

  // 2. Xử lý Mock data với độ trễ nhẹ giả lập mạng (180ms)
  await new Promise((resolve) => setTimeout(resolve, 180))

  let filtered = [...INITIAL_AUDIT_LOGS]

  // Lọc theo người thực hiện
  if (performer_name && performer_name !== 'ALL') {
    const pTrim = performer_name.trim().toLowerCase()
    filtered = filtered.filter(
      (log) => log.performer_name.toLowerCase() === pTrim || log.performer_name.toLowerCase().includes(pTrim)
    )
  }

  // Lọc theo loại đối tượng
  if (entity_type && entity_type !== 'ALL') {
    filtered = filtered.filter((log) => log.entity_type === entity_type)
  }

  // Lọc theo khoảng thời gian
  if (from_date) {
    const fromTime = new Date(`${from_date}T00:00:00`).getTime()
    filtered = filtered.filter((log) => {
      const logTime = new Date(log.timestamp).getTime()
      return logTime >= fromTime
    })
  }

  if (to_date) {
    const toTime = new Date(`${to_date}T23:59:59`).getTime()
    filtered = filtered.filter((log) => {
      const logTime = new Date(log.timestamp).getTime()
      return logTime <= toTime
    })
  }

  // Lọc theo từ khóa tìm kiếm (mã đối tượng, tên đối tượng, người thực hiện, giá trị)
  if (search_keyword && search_keyword.trim()) {
    const kw = search_keyword.trim().toLowerCase()
    filtered = filtered.filter((log) => {
      return (
        log.entity_id.toLowerCase().includes(kw) ||
        (log.entity_name && log.entity_name.toLowerCase().includes(kw)) ||
        log.performer_name.toLowerCase().includes(kw) ||
        log.old_value.toLowerCase().includes(kw) ||
        log.new_value.toLowerCase().includes(kw) ||
        (log.reason && log.reason.toLowerCase().includes(kw))
      )
    })
  }

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize)

  return {
    success: true,
    data: paginatedData,
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

/**
 * Lấy danh sách tất cả người thực hiện độc nhất để hiển thị dropdown bộ lọc
 */
export function getDistinctPerformers(): string[] {
  const names = new Set<string>()
  INITIAL_AUDIT_LOGS.forEach((log) => {
    if (log.performer_name) names.add(log.performer_name)
  })
  return Array.from(names)
}

/**
 * Định dạng thời gian theo phong cách Việt Nam: DD/MM/YYYY HH:mm
 */
export function formatAuditDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const pad = (n: number) => n.toString().padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear()
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return dateString
  }
}
