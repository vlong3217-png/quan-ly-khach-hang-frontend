import * as XLSX from 'xlsx'
import type {
  Lead,
  CreateLeadPayload,
  UpdateLeadPayload,
  ExcelLeadRow,
  ImportLeadResult,
} from '../types/lead.ts'
import { API_BASE_URL } from './authService.ts'
import {
  calculateLeadScore,
  determineScoreTier,
  determineLeadSegment,
} from './leadScoringService.ts'

const STORAGE_KEY_LEADS = 'crm_leads_master_data'

/* ──────────── Helper ──────────── */
function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

/* ──────────── Dữ liệu Lead ban đầu phong phú ──────────── */
const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-001',
    code: 'LEAD-001',
    full_name: 'Trần Hải Đăng',
    email: 'dang.tran@saovangtech.com',
    phone: '0912345678',
    company: 'Công ty TNHH Giải pháp Công nghệ Sao Vàng',
    industry: 'Công nghệ thông tin & Viễn thông',
    source: 'WEB_FORM',
    source_detail: 'Biểu mẫu Đăng ký Tư vấn - Trang chủ',
    campaign_id: 'camp-001',
    campaign_name: 'Chiến dịch Q4 Chuyển đổi số 2026',
    status: 'NEW',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    requirement: 'Cần tư vấn gói CRM cho đội ngũ kinh doanh 25 nhân sự, quản lý pipeline và nhắc hẹn chăm sóc.',
    notes: 'Khách yêu cầu liên hệ lại vào buổi sáng.',
    assignment_status: 'PENDING',
    assigned_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4h trước
    sla_hours: 24,
    sla_deadline: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    sla_status: 'ON_TIME',
    created_at: '2026-10-08T09:15:00Z',
    updated_at: '2026-10-08T09:15:00Z',
  },
  {
    id: 'lead-002',
    code: 'LEAD-002',
    full_name: 'Ngô Thanh Hương',
    email: 'huong.ngo@anphatlogistics.vn',
    phone: '0987654321',
    company: 'Công ty Cổ phần Vận tải & Logistics An Phát',
    industry: 'Vận tải & Logistics',
    source: 'MANUAL',
    source_detail: 'Gặp gỡ trao đổi tại hội thảo VCCI',
    status: 'CONTACTED',
    owner_id: 2,
    owner_name: 'Trần Thị Bình',
    requirement: 'Muốn đặt lịch demo trực tiếp phần mềm vào sáng thứ 6 tuần này tại văn phòng công ty ở Cầu Giấy.',
    notes: 'Đã gọi điện thoại lần 1, giám đốc sales bên đó rất quan tâm.',
    assignment_status: 'ACCEPTED',
    assigned_at: '2026-10-07T15:30:00Z',
    accepted_at: '2026-10-07T16:00:00Z',
    sla_hours: 24,
    sla_deadline: '2026-10-08T15:30:00Z',
    sla_status: 'ON_TIME',
    created_at: '2026-10-07T15:30:00Z',
    updated_at: '2026-10-07T16:00:00Z',
  },
  {
    id: 'lead-003',
    code: 'LEAD-003',
    full_name: 'Vũ Đức Mạnh',
    email: 'manh.vu@namvietsteel.com',
    phone: '0903456789',
    company: 'Công ty Cổ phần Thép Nam Việt',
    industry: 'Sản xuất & Chế tạo công nghiệp',
    source: 'EXCEL_IMPORT',
    source_detail: 'Nhập từ danh sách khách hàng triển lãm VietBuild',
    status: 'QUALIFIED',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    requirement: 'Dùng thử tính năng phân quyền dữ liệu khách hàng theo chi nhánh Bắc - Trung - Nam.',
    notes: 'Quy mô công ty hơn 150 nhân viên.',
    assignment_status: 'ACCEPTED',
    assigned_at: '2026-10-06T10:45:00Z',
    accepted_at: '2026-10-06T11:00:00Z',
    sla_hours: 24,
    sla_status: 'ON_TIME',
    created_at: '2026-10-06T10:45:00Z',
    updated_at: '2026-10-06T11:20:00Z',
  },
  {
    id: 'lead-004',
    code: 'LEAD-004',
    full_name: 'Phan Thị Mai Lan',
    email: 'lan.phan@thudoedu.vn',
    phone: '0934567890',
    company: 'Tổ chức Giáo dục & Đào tạo Thủ Đô',
    industry: 'Giáo dục & Đào tạo',
    source: 'REFERRAL',
    source_detail: 'Khách hàng Alpha Tech giới thiệu',
    status: 'CONVERTED',
    owner_id: 3,
    owner_name: 'Lê Hoàng Cường',
    requirement: 'Tìm kiếm phần mềm quản lý học viên và phụ huynh, có tính năng gửi email báo giá khóa học.',
    notes: 'Đã chốt hợp đồng và chuyển đổi thành khách hàng chính thức.',
    assignment_status: 'ACCEPTED',
    assigned_at: '2026-10-05T08:20:00Z',
    accepted_at: '2026-10-05T09:00:00Z',
    sla_hours: 24,
    sla_status: 'ON_TIME',
    created_at: '2026-10-05T08:20:00Z',
    updated_at: '2026-10-07T14:30:00Z',
  },
  {
    id: 'lead-005',
    code: 'LEAD-005',
    full_name: 'Đặng Quốc Huy',
    email: 'huy.dang@greenfood.vn',
    phone: '0945678901',
    company: 'Công ty TNHH Thực phẩm Sạch Green Food',
    industry: 'Nông nghiệp & Thực phẩm',
    source: 'FACEBOOK',
    source_detail: 'Quảng cáo Lead Form Facebook',
    status: 'CONTACTED',
    owner_id: 2,
    owner_name: 'Trần Thị Bình',
    requirement: 'Cần hướng dẫn import dữ liệu khách hàng từ file Excel cũ vào hệ thống.',
    notes: 'Đang gửi tài liệu hướng dẫn qua Zalo.',
    assignment_status: 'ACCEPTED',
    assigned_at: '2026-10-04T14:10:00Z',
    accepted_at: '2026-10-04T15:00:00Z',
    sla_hours: 24,
    sla_status: 'ON_TIME',
    created_at: '2026-10-04T14:10:00Z',
    updated_at: '2026-10-05T09:00:00Z',
  },
  {
    id: 'lead-006',
    code: 'LEAD-006',
    full_name: 'Phạm Minh Tuấn',
    email: 'tuan.pm@daiduonggroup.vn',
    phone: '0978112233',
    company: 'Tập đoàn Đầu tư & Thương mại Đại Dương',
    industry: 'Bất động sản & Xây dựng',
    source: 'WEB_FORM',
    source_detail: 'Form Báo giá gói Doanh nghiệp lớn',
    status: 'NEW',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    requirement: 'Quan tâm giải pháp CRM quản lý hơn 50 chuyên viên tư vấn đầu tư, cần SLA tiếp nhận khẩn cấp.',
    notes: 'Khách hàng phân khúc VIP cần phản hồi trong vòng 24h.',
    assignment_status: 'PENDING',
    assigned_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // Đã quá hạn 36h trước!
    sla_hours: 24,
    sla_deadline: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    sla_status: 'OVERDUE',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'lead-007',
    code: 'LEAD-007',
    full_name: 'Lê Bảo Trâm',
    email: 'tram.lb@hoabinhpharma.com',
    phone: '0933445566',
    company: 'Công ty Dược phẩm Hòa Bình',
    industry: 'Y tế & Chăm sóc sức khỏe',
    source: 'MANUAL',
    source_detail: 'Hội thảo triển lãm Dược phẩm 2026',
    status: 'NEW',
    assignment_status: 'UNASSIGNED',
    requirement: 'Tìm kiếm nền tảng quản lý kênh phân phối nhà thuốc và trình dược viên.',
    notes: 'Lead đang trong hàng chờ phân bổ cho nhân viên kinh doanh.',
    sla_hours: 24,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
]

/**
 * Hàm hỗ trợ tính toán trạng thái SLA động dựa trên deadline và trạng thái xử lý
 */
export function calculateSlaStatus(lead: Lead): 'ON_TIME' | 'WARNING' | 'OVERDUE' {
  if (lead.assignment_status === 'ACCEPTED' || lead.status === 'CONTACTED' || lead.status === 'QUALIFIED' || lead.status === 'CONVERTED') {
    return 'ON_TIME'
  }
  if (!lead.sla_deadline) {
    if (!lead.assigned_at) return 'ON_TIME'
    const hours = lead.sla_hours || 24
    const deadline = new Date(new Date(lead.assigned_at).getTime() + hours * 3600 * 1000)
    lead.sla_deadline = deadline.toISOString()
  }

  const now = Date.now()
  const deadlineMs = new Date(lead.sla_deadline).getTime()
  const diffHours = (deadlineMs - now) / (1000 * 3600)

  if (diffHours < 0) {
    return 'OVERDUE'
  } else if (diffHours <= 4) {
    return 'WARNING'
  }
  return 'ON_TIME'
}

function getStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS)
    if (raw) {
      const parsed: Lead[] = JSON.parse(raw)
      let hasChanges = false
      const enriched = parsed.map((lead) => {
        let currentLead = { ...lead }
        // Bổ sung điểm số nếu thiếu
        if (typeof currentLead.score !== 'number' || !currentLead.score_tier) {
          hasChanges = true
          const breakdown = calculateLeadScore(currentLead)
          const score = breakdown.total_score
          const score_tier = determineScoreTier(score)
          const segment = currentLead.segment || determineLeadSegment(currentLead, score)
          currentLead = {
            ...currentLead,
            score,
            score_tier,
            segment,
            score_breakdown: breakdown,
            last_scored_at: currentLead.last_scored_at || new Date().toISOString(),
          }
        }

        // Bổ sung SLA nếu thiếu
        if (!currentLead.assignment_status) {
          hasChanges = true
          if (currentLead.status === 'NEW' && currentLead.owner_id) {
            currentLead.assignment_status = 'PENDING'
            currentLead.assigned_at = currentLead.created_at
            currentLead.sla_hours = 24
            currentLead.sla_deadline = new Date(new Date(currentLead.created_at).getTime() + 24 * 3600 * 1000).toISOString()
          } else if (currentLead.status === 'NEW' && !currentLead.owner_id) {
            currentLead.assignment_status = 'UNASSIGNED'
          } else {
            currentLead.assignment_status = 'ACCEPTED'
          }
        }

        const dynamicSla = calculateSlaStatus(currentLead)
        if (currentLead.sla_status !== dynamicSla) {
          hasChanges = true
          currentLead.sla_status = dynamicSla
        }

        return currentLead
      })
      if (hasChanges) {
        saveStoredLeads(enriched)
      }
      return enriched
    }
  } catch {}

  const initialEnriched = INITIAL_LEADS.map((lead) => {
    const breakdown = calculateLeadScore(lead)
    const score = breakdown.total_score
    const score_tier = determineScoreTier(score)
    const segment = lead.segment || determineLeadSegment(lead, score)
    const dynamicSla = calculateSlaStatus(lead)
    return {
      ...lead,
      score,
      score_tier,
      segment,
      score_breakdown: breakdown,
      sla_status: dynamicSla,
      last_scored_at: new Date().toISOString(),
    }
  })
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(initialEnriched))
  return initialEnriched
}


function saveStoredLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads))
}

/* ──────────── Lead Service Implementation ──────────── */
export const leadService = {
  /**
   * Lấy danh sách toàn bộ Lead trong hệ thống
   */
  async getLeads(): Promise<Lead[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          saveStoredLeads(data)
          return data
        }
      }
    } catch {}
    return getStoredLeads()
  },

  /**
   * Tạo Lead thủ công (User Story S4-02)
   */
  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    const leads = getStoredLeads()
    const nextCodeNumber = leads.length + 1
    const newCode = `LEAD-${String(nextCodeNumber).padStart(3, '0')}`

    const breakdown = calculateLeadScore({
      full_name: payload.full_name,
      company: payload.company,
      email: payload.email,
      phone: payload.phone,
      industry: payload.industry,
      requirement: payload.requirement,
      campaign_id: payload.campaign_id,
      source: payload.source || 'MANUAL',
      status: payload.status || 'NEW',
    })
    const score = breakdown.total_score
    const score_tier = determineScoreTier(score)
    const segment = determineLeadSegment(
      { company: payload.company, status: payload.status || 'NEW' },
      score
    )

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      code: newCode,
      full_name: payload.full_name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      company: payload.company?.trim() || '',
      industry: payload.industry?.trim() || '',
      source: payload.source || 'MANUAL',
      source_detail: payload.source_detail?.trim() || 'Tạo thủ công trong hệ thống',
      campaign_id: payload.campaign_id,
      status: payload.status || 'NEW',
      owner_id: payload.owner_id || 1,
      owner_name: payload.owner_id === 2 ? 'Trần Thị Bình' : payload.owner_id === 3 ? 'Lê Hoàng Cường' : 'Nguyễn Văn An',
      requirement: payload.requirement?.trim() || '',
      notes: payload.notes?.trim() || '',
      score,
      score_tier,
      segment,
      score_breakdown: breakdown,
      last_scored_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newLead),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const updated = [data, ...leads]
          saveStoredLeads(updated)
          return data
        }
      }
    } catch {}

    const updated = [newLead, ...leads]
    saveStoredLeads(updated)
    return newLead
  },

  /**
   * Cập nhật thông tin Lead
   */
  async updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
    const leads = getStoredLeads()
    const index = leads.findIndex((l) => l.id === id)
    if (index === -1) throw new Error('Không tìm thấy Lead')

    const existing = leads[index]
    const updatedLead: Lead = {
      ...existing,
      ...payload,
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedLead),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          leads[index] = data
          saveStoredLeads(leads)
          return data
        }
      }
    } catch {}

    leads[index] = updatedLead
    saveStoredLeads(leads)
    return updatedLead
  },

  /**
   * Xóa Lead
   */
  async deleteLead(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/leads/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

    const leads = getStoredLeads().filter((l) => l.id !== id)
    saveStoredLeads(leads)
  },

  /**
   * Xuất danh sách Lead ra file Excel
   */
  exportLeadsToExcel(leadsToExport: Lead[]): void {
    const data = leadsToExport.map((l, idx) => ({
      'STT': idx + 1,
      'Mã Lead': l.code,
      'Họ và tên': l.full_name,
      'Email': l.email,
      'Số điện thoại': l.phone,
      'Công ty / Doanh nghiệp': l.company,
      'Ngành nghề': l.industry || '',
      'Nguồn': l.source,
      'Chiến dịch': l.campaign_name || '',
      'Trạng thái': l.status,
      'Người phụ trách': l.owner_name || '',
      'Nhu cầu tư vấn': l.requirement || '',
      'Ngày tạo': new Date(l.created_at).toLocaleDateString('vi-VN'),
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_sach_Lead')
    XLSX.writeFile(workbook, `Danh_sach_Lead_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`)
  },

  /**
   * Tải file Excel mẫu chuẩn phục vụ nhập Lead hàng loạt (S4-02)
   */
  downloadExcelTemplate(): void {
    const templateData = [
      {
        'Họ và tên *': 'Trần Văn Hùng',
        'Email *': 'hung.tran@vietgroup.vn',
        'Số điện thoại *': '0912888999',
        'Tên công ty / Doanh nghiệp': 'Công ty Cổ phần Xây dựng Việt Group',
        'Ngành nghề': 'Bất động sản & Xây dựng',
        'Nguồn Lead': 'Hội thảo / Triển lãm ngành',
        'Nhu cầu tư vấn / Ghi chú': 'Quan tâm phần mềm quản lý dự án và chăm sóc khách hàng.',
      },
      {
        'Họ và tên *': 'Lê Thị Thu Thảo',
        'Email *': 'thao.le@phuclongtea.vn',
        'Số điện thoại *': '0988777666',
        'Tên công ty / Doanh nghiệp': 'Công ty TNHH Đồ uống Phúc Long',
        'Ngành nghề': 'Hàng tiêu dùng nhanh & Bán lẻ',
        'Nguồn Lead': 'Khách hàng cũ giới thiệu',
        'Nhu cầu tư vấn / Ghi chú': 'Tìm hiểu gói CRM quản lý chuỗi điểm bán lẻ.',
      },
      {
        'Họ và tên *': 'Hoàng Minh Quân',
        'Email *': 'quan.hoang@techzone.vn',
        'Số điện thoại *': '0909123456',
        'Tên công ty / Doanh nghiệp': 'Công ty Công nghệ TechZone',
        'Ngành nghề': 'Công nghệ thông tin & Viễn thông',
        'Nguồn Lead': 'Website & Đăng ký Form',
        'Nhu cầu tư vấn / Ghi chú': 'Cần tích hợp API vào hệ thống ERP nội bộ.',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    // Căn chỉnh độ rộng cột
    worksheet['!cols'] = [
      { wch: 22 }, // Họ và tên
      { wch: 26 }, // Email
      { wch: 18 }, // SĐT
      { wch: 36 }, // Công ty
      { wch: 28 }, // Ngành nghề
      { wch: 24 }, // Nguồn
      { wch: 42 }, // Nhu cầu
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Nhap_Lead')
    XLSX.writeFile(workbook, 'Mau_Nhap_Lead_Hang_Loat_CRM.xlsx')
  },

  /**
   * Đọc và kiểm tra tính hợp lệ của file Excel tải lên (S4-02)
   */
  async parseAndValidateExcel(file: File): Promise<ExcelLeadRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result
          if (!buffer) {
            reject(new Error('Không thể đọc nội dung file Excel.'))
            return
          }

          const workbook = XLSX.read(buffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          if (!sheetName) {
            reject(new Error('File Excel không có bất kỳ sheet nào.'))
            return
          }

          const worksheet = workbook.Sheets[sheetName]
          const rawRows: Record<string, string>[] = XLSX.utils.sheet_to_json(worksheet, {
            defval: '',
            raw: false,
          })

          if (rawRows.length === 0) {
            reject(new Error('File Excel rỗng hoặc không có dữ liệu để nhập.'))
            return
          }

          const existingLeads = getStoredLeads()
          const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()))
          const existingPhones = new Set(existingLeads.map((l) => l.phone.replace(/\D/g, '')))

          const seenEmailsInFile = new Set<string>()
          const seenPhonesInFile = new Set<string>()

          const validatedRows: ExcelLeadRow[] = rawRows.map((row, idx) => {
            const rowIndex = idx + 2 // dòng trong Excel tính từ header dòng 1
            const errors: string[] = []

            // Tìm giá trị từ các tên cột có thể có
            const fullName = String(
              row['Họ và tên *'] || row['Họ và tên'] || row['Họ tên'] || row['Họ và Tên'] || row['Full Name'] || ''
            ).trim()

            const email = String(
              row['Email *'] || row['Email'] || row['Địa chỉ email'] || row['Email liên hệ'] || ''
            ).trim()

            const phone = String(
              row['Số điện thoại *'] || row['Số điện thoại'] || row['SĐT'] || row['Phone'] || ''
            ).trim()

            const company = String(
              row['Tên công ty / Doanh nghiệp'] || row['Tên công ty'] || row['Công ty'] || row['Company'] || ''
            ).trim()

            const industry = String(row['Ngành nghề'] || row['Lĩnh vực'] || row['Industry'] || '').trim()
            const source = String(row['Nguồn Lead'] || row['Nguồn'] || row['Source'] || '').trim()
            const requirement = String(
              row['Nhu cầu tư vấn / Ghi chú'] || row['Nhu cầu'] || row['Ghi chú'] || row['Requirement'] || ''
            ).trim()

            // 1. Kiểm tra Họ và tên
            if (!fullName) {
              errors.push('Thiếu họ và tên khách hàng')
            }

            // 2. Kiểm tra Email
            if (!email) {
              errors.push('Thiếu địa chỉ email')
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              errors.push('Email không đúng định dạng')
            }

            // 3. Kiểm tra Số điện thoại
            const cleanPhone = phone.replace(/\D/g, '')
            if (!phone) {
              errors.push('Thiếu số điện thoại liên hệ')
            } else if (cleanPhone.length < 9 || cleanPhone.length > 11) {
              errors.push('Số điện thoại không hợp lệ (cần 9-11 chữ số)')
            }

            // 4. Kiểm tra trùng lặp trong chính file Excel
            let isDuplicate = false
            const normalizedEmail = email.toLowerCase()
            if (email && seenEmailsInFile.has(normalizedEmail)) {
              errors.push('Email bị trùng lặp với một dòng khác trong file')
              isDuplicate = true
            } else if (email) {
              seenEmailsInFile.add(normalizedEmail)
            }

            if (cleanPhone && seenPhonesInFile.has(cleanPhone)) {
              errors.push('Số điện thoại bị trùng lặp với một dòng khác trong file')
              isDuplicate = true
            } else if (cleanPhone) {
              seenPhonesInFile.add(cleanPhone)
            }

            // 5. Kiểm tra trùng lặp với dữ liệu đã có trong hệ thống CRM
            if (email && existingEmails.has(normalizedEmail)) {
              errors.push('Email đã tồn tại trên hệ thống CRM')
              isDuplicate = true
            }
            if (cleanPhone && existingPhones.has(cleanPhone)) {
              errors.push('Số điện thoại đã tồn tại trên hệ thống CRM')
              isDuplicate = true
            }

            return {
              row_index: rowIndex,
              full_name: fullName,
              email: email,
              phone: phone,
              company: company,
              industry: industry,
              source: source || 'Nhập từ file Excel',
              requirement: requirement,
              is_valid: errors.length === 0,
              errors: errors,
              is_duplicate: isDuplicate,
            }
          })

          resolve(validatedRows)
        } catch (err) {
          reject(new Error(`Không thể phân tích dữ liệu file Excel: ${err instanceof Error ? err.message : String(err)}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Lỗi khi đọc file.'))
      }

      reader.readAsArrayBuffer(file)
    })
  },

  /**
   * Lưu các dòng hợp lệ vào cơ sở dữ liệu Lead (Commit Import)
   */
  async commitImport(rows: ExcelLeadRow[]): Promise<ImportLeadResult> {
    const validRows = rows.filter((r) => r.is_valid)
    const errorRows = rows.filter((r) => !r.is_valid)

    const existingLeads = getStoredLeads()
    let currentCount = existingLeads.length

    const newLeads: Lead[] = validRows.map((r) => {
      currentCount++
      const breakdown = calculateLeadScore({
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        industry: r.industry,
        source: 'EXCEL_IMPORT',
        requirement: r.requirement,
        status: 'NEW',
      })
      const score = breakdown.total_score
      const score_tier = determineScoreTier(score)
      const segment = determineLeadSegment({ company: r.company, status: 'NEW' }, score)

      return {
        id: `lead-import-${Date.now()}-${currentCount}`,
        code: `LEAD-${String(currentCount).padStart(3, '0')}`,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        industry: r.industry || 'Chưa phân loại',
        source: 'EXCEL_IMPORT',
        source_detail: r.source || 'Nhập hàng loạt từ Excel',
        status: 'NEW',
        owner_id: 1,
        owner_name: 'Nguyễn Văn An',
        requirement: r.requirement,
        notes: `Import ngày ${new Date().toLocaleDateString('vi-VN')}`,
        score,
        score_tier,
        segment,
        score_breakdown: breakdown,
        last_scored_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    // Gọi API Backend batch import nếu có
    try {
      await fetch(`${API_BASE_URL}/leads/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newLeads),
      })
    } catch {}

    // Lưu vào localStorage
    const updated = [...newLeads, ...existingLeads]
    saveStoredLeads(updated)

    return {
      total_rows: rows.length,
      success_count: newLeads.length,
      error_count: errorRows.length,
      duplicate_count: rows.filter((r) => r.is_duplicate).length,
      imported_leads: newLeads,
      errors: errorRows.map((r) => ({
        row: r.row_index,
        name: r.full_name || 'Không có tên',
        error: r.errors.join(', '),
      })),
    }
  },

  /* ──────────── User Story S4-07: Nhận / Từ chối Lead & Ràng buộc SLA phản hồi ──────────── */
  /**
   * Nhân viên kinh doanh nhận Lead:
   * - Chuyển trạng thái sang CONTACTED ("Đang chăm sóc / Đã liên hệ")
   * - assignment_status = 'ACCEPTED'
   * - Ghi nhận accepted_at
   */
  async acceptLead(leadId: string, ownerId?: number, ownerName?: string): Promise<Lead> {
    const leads = getStoredLeads()
    const index = leads.findIndex((l) => l.id === leadId)
    if (index === -1) throw new Error('Không tìm thấy Lead để tiếp nhận.')

    const existing = leads[index]
    const nowIso = new Date().toISOString()
    const updatedLead: Lead = {
      ...existing,
      status: 'CONTACTED',
      assignment_status: 'ACCEPTED',
      accepted_at: nowIso,
      owner_id: ownerId || existing.owner_id || 1,
      owner_name: ownerName || existing.owner_name || 'Nhân viên kinh doanh',
      sla_status: 'ON_TIME',
      updated_at: nowIso,
    }

    try {
      await fetch(`${API_BASE_URL}/leads/${leadId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          owner_id: updatedLead.owner_id,
          owner_name: updatedLead.owner_name,
        }),
      })
    } catch {
      // Fallback API
    }

    leads[index] = updatedLead
    saveStoredLeads(leads)
    return updatedLead
  },

  /**
   * Nhân viên kinh doanh từ chối Lead:
   * - Bắt buộc có lý do từ chối
   * - Chuyển lead quay lại hàng chờ phân bổ (UNASSIGNED)
   * - Xóa người phụ trách hiện tại
   * - assignment_status = 'REJECTED' / 'UNASSIGNED'
   */
  async rejectLead(leadId: string, reason: string): Promise<Lead> {
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do từ chối tiếp nhận Lead.')
    }

    const leads = getStoredLeads()
    const index = leads.findIndex((l) => l.id === leadId)
    if (index === -1) throw new Error('Không tìm thấy Lead để từ chối.')

    const existing = leads[index]
    const nowIso = new Date().toISOString()
    const updatedLead: Lead = {
      ...existing,
      status: 'NEW',
      assignment_status: 'UNASSIGNED',
      owner_id: undefined,
      owner_name: undefined,
      rejection_reason: reason.trim(),
      rejected_at: nowIso,
      sla_status: 'ON_TIME',
      updated_at: nowIso,
    }

    try {
      await fetch(`${API_BASE_URL}/leads/${leadId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reason.trim() }),
      })
    } catch {
      // Fallback API
    }

    leads[index] = updatedLead
    saveStoredLeads(leads)
    return updatedLead
  },

  /**
   * Trưởng nhóm / Quản lý phân bổ lại Lead (Re-assign) với thời hạn SLA mới
   */
  async reassignLead(leadId: string, newOwnerId: number, newOwnerName: string, slaHours = 24): Promise<Lead> {
    const leads = getStoredLeads()
    const index = leads.findIndex((l) => l.id === leadId)
    if (index === -1) throw new Error('Không tìm thấy Lead để phân bổ.')

    const existing = leads[index]
    const now = new Date()
    const deadline = new Date(now.getTime() + slaHours * 3600 * 1000)

    const updatedLead: Lead = {
      ...existing,
      status: 'NEW',
      owner_id: newOwnerId,
      owner_name: newOwnerName,
      assignment_status: 'PENDING',
      assigned_at: now.toISOString(),
      sla_hours: slaHours,
      sla_deadline: deadline.toISOString(),
      sla_status: 'ON_TIME',
      updated_at: now.toISOString(),
    }

    try {
      await fetch(`${API_BASE_URL}/leads/${leadId}/reassign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          new_owner_id: newOwnerId,
          new_owner_name: newOwnerName,
          sla_hours: slaHours,
        }),
      })
    } catch {
      // Fallback
    }

    leads[index] = updatedLead
    saveStoredLeads(leads)
    return updatedLead
  },
}

