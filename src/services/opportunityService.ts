import * as XLSX from 'xlsx'
import { API_BASE_URL } from './authService.ts'
import { pipelineService } from './pipelineService.ts'
import { customerService } from './customerService.ts'
import type {
  Opportunity,
  CreateOpportunityPayload,
  OpportunityFilterParams,
  OpportunitySummary,
} from '../types/opportunity.ts'

const STORAGE_KEY = 'crm_opportunities_data'

/**
 * Dữ liệu mẫu chuẩn hóa ban đầu, liên kết trực tiếp với khách hàng doanh nghiệp & giai đoạn pipeline
 */
const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-001',
    code: 'OPP-001',
    title: 'Nâng cấp hệ thống Core CRM & Mobile App AlphaTech',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    contact_id: 'cont-001',
    contact_name: 'Nguyễn Văn An',
    contact_phone: '0912 345 678',
    contact_email: 'an.nguyen@alphatech.vn',
    stage_id: 'stage-3',
    stage_name: 'Đề xuất giải pháp & Demo',
    stage_order: 3,
    stage_color: '#2563eb',
    win_probability: 50,
    expected_revenue: 150000000,
    expected_close_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    source: 'Khách hàng cũ giới thiệu',
    status: 'OPEN',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Nhu cầu mở rộng thêm module quản lý bảo hành và tích hợp tổng đài VoIP.',
    created_at: '2025-02-10T08:30:00Z',
    updated_at: '2025-03-01T09:00:00Z',
  },
  {
    id: 'opp-002',
    code: 'OPP-002',
    title: 'Hợp đồng Chuyển đổi số Quản lý Công trình Giai đoạn 2',
    customer_id: 'cust-002',
    customer_name: 'Tập đoàn Xây dựng & Bất động sản Hòa Bình',
    contact_id: 'cont-002',
    contact_name: 'Trần Thị Bình',
    contact_phone: '0988 777 666',
    contact_email: 'binh.tran@hoabinhgroup.vn',
    stage_id: 'stage-5',
    stage_name: 'Đàm phán hợp đồng',
    stage_order: 5,
    stage_color: '#d97706',
    win_probability: 85,
    expected_revenue: 320000000,
    expected_close_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    source: 'Website & Đăng ký Form',
    status: 'OPEN',
    owner_id: 2,
    owner_name: 'Trần Thị Bình',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Đã gửi dự thảo hợp đồng, đang thương lượng điều khoản bảo lãnh thanh toán.',
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2025-03-05T14:20:00Z',
  },
  {
    id: 'opp-003',
    code: 'OPP-003',
    title: 'Giải pháp CRM Tích hợp 20 Điểm bán lẻ Siêu thị Mekong',
    customer_id: 'cust-003',
    customer_name: 'Hệ thống Bán lẻ Toàn Cầu Mekong Mart',
    contact_id: 'cont-003',
    contact_name: 'Lê Hoàng Cường',
    contact_phone: '0903 112 233',
    contact_email: 'cuong.le@mekongretail.com',
    stage_id: 'stage-2',
    stage_name: 'Xác định nhu cầu (BANT)',
    stage_order: 2,
    stage_color: '#0284c7',
    win_probability: 25,
    expected_revenue: 210000000,
    expected_close_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    source: 'Facebook Ads / Fanpage',
    status: 'OPEN',
    owner_id: 3,
    owner_name: 'Lê Hoàng Cường',
    team_id: 2,
    team_name: 'Đội Kinh Doanh 2',
    description: 'Đang khảo sát hạ tầng máy POS và luồng đồng bộ tồn kho.',
    created_at: '2025-02-15T09:15:00Z',
    updated_at: '2025-03-02T11:00:00Z',
  },
  {
    id: 'opp-004',
    code: 'OPP-004',
    title: 'Gói Chăm sóc Khách hàng & Quản lý Kho bãi Logistics',
    customer_id: 'cust-004',
    customer_name: 'Tổng Công ty Logistics Sao Vàng Toàn Cầu',
    contact_id: 'cont-004',
    contact_name: 'Phạm Minh Duy',
    contact_phone: '0918 889 990',
    contact_email: 'duy.pham@goldenstarlogistics.com',
    stage_id: 'stage-4',
    stage_name: 'Gửi báo giá chính thức',
    stage_order: 4,
    stage_color: '#7c3aed',
    win_probability: 70,
    expected_revenue: 180000000,
    expected_close_date: new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10),
    source: 'Hội thảo / Triển lãm ngành',
    status: 'OPEN',
    owner_id: 4,
    owner_name: 'Phạm Minh Duy',
    team_id: 2,
    team_name: 'Đội Kinh Doanh 2',
    description: 'Đã gửi báo giá gói Doanh nghiệp, khách hẹn họp lại tuần sau.',
    created_at: '2025-02-01T14:00:00Z',
    updated_at: '2025-03-04T16:30:00Z',
  },
  {
    id: 'opp-005',
    code: 'OPP-005',
    title: 'Phần mềm Quản lý Đại lý Phân phối Dược phẩm AlphaPharma',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    contact_id: 'cont-001',
    contact_name: 'Nguyễn Văn An',
    contact_phone: '0912 345 678',
    contact_email: 'an.nguyen@alphatech.vn',
    stage_id: 'stage-6',
    stage_name: 'Chốt thành công (Won)',
    stage_order: 6,
    stage_color: '#16a34a',
    win_probability: 100,
    expected_revenue: 250000000,
    expected_close_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    source: 'Khách hàng cũ giới thiệu',
    status: 'WON',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    description: 'Đã ký hợp đồng và nhận tạm ứng đợt 1.',
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-03-06T10:00:00Z',
  },
]

function getStored(): Opportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc cơ hội từ localStorage:', err)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OPPORTUNITIES))
  return INITIAL_OPPORTUNITIES
}

function saveStored(items: Opportunity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Lỗi lưu cơ hội vào localStorage:', err)
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const opportunityService = {
  /**
   * Lấy danh sách cơ hội có hỗ trợ tìm kiếm và lọc
   */
  async getOpportunities(params?: OpportunityFilterParams): Promise<Opportunity[]> {
    // 1. Cố gắng gọi API Backend nếu có
    try {
      const query = new URLSearchParams()
      if (params?.search) query.append('search', params.search)
      if (params?.stage_id) query.append('stage_id', params.stage_id)
      if (params?.source) query.append('source', params.source)
      if (params?.status) query.append('status', params.status)
      if (params?.owner_id) query.append('owner_id', String(params.owner_id))

      const url = `${API_BASE_URL}/opportunities${query.toString() ? '?' + query.toString() : ''}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      })

      if (response.status === 401) {
        throw new Error('401_UNAUTHORIZED: Phiên đăng nhập đã hết hạn')
      }
      if (response.status === 403) {
        throw new Error('403_FORBIDDEN: Bạn không có quyền xem cơ hội bán hàng')
      }

      if (response.ok) {
        const data = await response.json()
        const items: Opportunity[] = Array.isArray(data) ? data : data.data || data.items
        if (Array.isArray(items)) {
          saveStored(items)
          return items
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      if (errorMsg.includes('401_UNAUTHORIZED') || errorMsg.includes('403_FORBIDDEN')) {
        throw err
      }
      // Tiếp tục sử dụng fallback localStorage khi Backend chưa có endpoint hoặc lỗi mạng
    }

    // 2. Fallback localStorage
    let list = getStored()

    if (params) {
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase()
        list = list.filter(
          (o) =>
            o.title.toLowerCase().includes(q) ||
            o.code.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            (o.contact_name && o.contact_name.toLowerCase().includes(q))
        )
      }
      if (params.stage_id && params.stage_id !== 'ALL') {
        list = list.filter((o) => o.stage_id === params.stage_id)
      }
      if (params.source && params.source !== 'ALL') {
        list = list.filter((o) => o.source === params.source)
      }
      if (params.status && params.status !== 'ALL') {
        list = list.filter((o) => o.status === params.status)
      }
      if (params.owner_id !== undefined && params.owner_id !== '') {
        list = list.filter((o) => o.owner_id === Number(params.owner_id))
      }
      if (params.close_date_from) {
        list = list.filter((o) => o.expected_close_date >= params.close_date_from!)
      }
      if (params.close_date_to) {
        list = list.filter((o) => o.expected_close_date <= params.close_date_to!)
      }
    }

    // Sắp xếp mặc định: mới nhất lên đầu
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  /**
   * Lấy chi tiết một cơ hội
   */
  async getOpportunityById(id: string): Promise<Opportunity> {
    const list = getStored()
    const found = list.find((o) => o.id === id)
    if (!found) {
      throw new Error(`Không tìm thấy cơ hội có ID ${id}`)
    }
    return found
  },

  /**
   * Tạo mới một cơ hội bán hàng với validation chuẩn (AC S5-01)
   */
  async createOpportunity(payload: CreateOpportunityPayload): Promise<Opportunity> {
    // ── Validation nghiệp vụ (AC S5-01) ──
    if (!payload.title || !payload.title.trim()) {
      throw new Error('Vui lòng nhập tên cơ hội bán hàng')
    }
    if (payload.title.trim().length < 3) {
      throw new Error('Tên cơ hội phải có ít nhất 3 ký tự')
    }
    if (!payload.customer_id) {
      throw new Error('Vui lòng chọn khách hàng liên kết')
    }
    if (!payload.stage_id) {
      throw new Error('Vui lòng chọn giai đoạn Pipeline')
    }
    if (payload.expected_revenue < 0 || isNaN(payload.expected_revenue)) {
      throw new Error('Giá trị dự kiến không được âm')
    }
    if (!payload.expected_close_date) {
      throw new Error('Vui lòng chọn ngày dự kiến chốt')
    }

    // Kiểm tra không cho chọn ngày chốt trong quá khứ
    const today = new Date().toISOString().slice(0, 10)
    if (payload.expected_close_date < today) {
      throw new Error('Ngày dự kiến chốt không được là ngày trong quá khứ')
    }

    // Lấy thông tin khách hàng
    const customers = customerService.getCustomers()
    const customer = customers.find((c) => c.id === payload.customer_id)
    const customerName = customer?.name || payload.customer_name || 'Khách hàng chưa định danh'

    // Lấy thông tin giai đoạn
    const stages = pipelineService.getStages()
    const stage = stages.find((s) => s.id === payload.stage_id)
    const stageName = stage?.name || 'Tiếp cận'
    const stageColor = stage?.color || '#2563eb'
    const stageOrder = stage?.order || 1
    const winProb = stage?.win_probability !== undefined ? stage.win_probability : 20

    // Lấy thông tin người liên hệ nếu có
    let contactName = payload.contact_name
    let contactPhone = ''
    let contactEmail = ''
    if (payload.contact_id) {
      const contacts = customerService.getContacts(payload.customer_id)
      const contact = contacts.find((c) => c.id === payload.contact_id)
      if (contact) {
        contactName = contact.full_name
        contactPhone = contact.phone
        contactEmail = contact.email
      }
    }

    // Gửi lên Backend nếu có API
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
      if (response.status === 401) {
        throw new Error('401_UNAUTHORIZED: Phiên làm việc đã hết hạn')
      }
      if (response.status === 403) {
        throw new Error('403_FORBIDDEN: Bạn không có quyền tạo cơ hội bán hàng')
      }
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const list = getStored()
          list.unshift(data)
          saveStored(list)
          return data
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401_UNAUTHORIZED') || msg.includes('403_FORBIDDEN')) {
        throw err
      }
    }

    // Fallback tạo cục bộ
    const list = getStored()
    const newId = `opp-${Date.now()}`
    const newCode = `OPP-${String(list.length + 1).padStart(3, '0')}`

    const newOpportunity: Opportunity = {
      id: newId,
      code: newCode,
      title: payload.title.trim(),
      customer_id: payload.customer_id,
      customer_name: customerName,
      contact_id: payload.contact_id,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      stage_id: payload.stage_id,
      stage_name: stageName,
      stage_order: stageOrder,
      stage_color: stageColor,
      win_probability: winProb,
      expected_revenue: Number(payload.expected_revenue) || 0,
      expected_close_date: payload.expected_close_date,
      source: payload.source || 'Website & Đăng ký Form',
      status: stage?.is_closed_stage ? (stage.code.includes('WON') ? 'WON' : 'LOST') : 'OPEN',
      owner_id: payload.owner_id || 1,
      owner_name: payload.owner_name || customer?.owner_name || 'Nguyễn Văn An',
      team_id: payload.team_id || customer?.team_id || 1,
      team_name: payload.team_name || customer?.team_name || 'Đội Kinh Doanh 1',
      description: payload.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    list.unshift(newOpportunity)
    saveStored(list)
    return newOpportunity
  },

  /**
   * Cập nhật thông tin cơ hội bán hàng
   */
  async updateOpportunity(
    id: string,
    payload: Partial<CreateOpportunityPayload>
  ): Promise<Opportunity> {
    const list = getStored()
    const index = list.findIndex((o) => o.id === id)
    if (index === -1) {
      throw new Error(`Không tìm thấy cơ hội có ID ${id}`)
    }

    // Validation ngày chốt nếu có cập nhật
    if (payload.expected_close_date) {
      const today = new Date().toISOString().slice(0, 10)
      if (payload.expected_close_date < today) {
        throw new Error('Ngày dự kiến chốt không được chọn trong quá khứ')
      }
    }

    // Nếu đổi giai đoạn, cập nhật thêm win_probability, stage_name, stage_color
    let updatedStageProps = {}
    if (payload.stage_id && payload.stage_id !== list[index].stage_id) {
      const stages = pipelineService.getStages()
      const stage = stages.find((s) => s.id === payload.stage_id)
      if (stage) {
        updatedStageProps = {
          stage_name: stage.name,
          stage_order: stage.order,
          stage_color: stage.color,
          win_probability: stage.win_probability,
          status: stage.is_closed_stage
            ? stage.code.includes('WON')
              ? 'WON'
              : 'LOST'
            : 'OPEN',
        }
      }
    }

    // Nếu đổi khách hàng, cập nhật lại tên khách hàng
    let updatedCustProps = {}
    if (payload.customer_id && payload.customer_id !== list[index].customer_id) {
      const customers = customerService.getCustomers()
      const cust = customers.find((c) => c.id === payload.customer_id)
      if (cust) {
        updatedCustProps = {
          customer_name: cust.name,
          owner_id: cust.owner_id,
          owner_name: cust.owner_name,
          team_id: cust.team_id,
          team_name: cust.team_name,
        }
      }
    }

    // Thử gửi lên Backend nếu có
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
      if (response.status === 401) throw new Error('401_UNAUTHORIZED')
      if (response.status === 403) throw new Error('403_FORBIDDEN')
    } catch {
      // Ignored
    }

    const updated: Opportunity = {
      ...list[index],
      ...payload,
      ...updatedCustProps,
      ...updatedStageProps,
      updated_at: new Date().toISOString(),
    }

    list[index] = updated
    saveStored(list)
    return updated
  },

  /**
   * Thay đổi giai đoạn cơ hội bán hàng (Dùng cho S5-02 Kanban và dropdown nhanh)
   */
  async changeStage(id: string, newStageId: string): Promise<Opportunity> {
    const stages = pipelineService.getStages()
    const stage = stages.find((s) => s.id === newStageId)
    if (!stage) {
      throw new Error(`Giai đoạn có ID ${newStageId} không tồn tại`)
    }

    return this.updateOpportunity(id, { stage_id: newStageId })
  },

  /**
   * Xóa một cơ hội bán hàng
   */
  async deleteOpportunity(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/opportunities/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
        },
      })
    } catch {
      // Fallback
    }

    const list = getStored()
    const filtered = list.filter((o) => o.id !== id)
    if (filtered.length === list.length) {
      return false
    }
    saveStored(filtered)
    return true
  },

  /**
   * Thống kê tổng hợp chỉ số cơ hội bán hàng
   */
  async getOpportunitySummary(): Promise<OpportunitySummary> {
    const list = getStored()
    const totalCount = list.length
    const openList = list.filter((o) => o.status === 'OPEN')
    const wonList = list.filter((o) => o.status === 'WON')
    const lostList = list.filter((o) => o.status === 'LOST')

    const totalExpectedRevenue = list.reduce((sum, o) => sum + (o.expected_revenue || 0), 0)
    const forecastRevenue = list.reduce(
      (sum, o) => sum + ((o.expected_revenue || 0) * (o.win_probability || 0)) / 100,
      0
    )
    const wonRevenue = wonList.reduce((sum, o) => sum + (o.expected_revenue || 0), 0)
    const avgWinRate = totalCount > 0 ? Math.round((wonList.length / totalCount) * 100) : 0

    return {
      total_count: totalCount,
      total_expected_revenue: totalExpectedRevenue,
      forecast_revenue: Math.round(forecastRevenue),
      won_count: wonList.length,
      won_revenue: wonRevenue,
      lost_count: lostList.length,
      open_count: openList.length,
      avg_win_rate: avgWinRate,
    }
  },

  /**
   * Xuất danh sách cơ hội ra file Excel
   */
  exportOpportunitiesToExcel(opportunities: Opportunity[]): void {
    const exportData = opportunities.map((o) => ({
      'Mã cơ hội': o.code,
      'Tên cơ hội': o.title,
      'Khách hàng': o.customer_name,
      'Người liên hệ': o.contact_name || '—',
      'Điện thoại liên hệ': o.contact_phone || '—',
      'Email liên hệ': o.contact_email || '—',
      'Giai đoạn': o.stage_name,
      'Xác suất thắng (%)': `${o.win_probability}%`,
      'Giá trị dự kiến (VNĐ)': o.expected_revenue,
      'Ngày dự kiến chốt': o.expected_close_date,
      'Nguồn': o.source,
      'Trạng thái': o.status,
      'Nhân viên phụ trách': o.owner_name,
      'Đội nhóm': o.team_name || '—',
      'Ghi chú / Nhu cầu': o.description || '—',
      'Ngày tạo': new Date(o.created_at).toLocaleDateString('vi-VN'),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CoHoiBanHang')

    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `Danh_Sach_Co_Hoi_Ban_Hang_${dateStr}.xlsx`)
  },
}
