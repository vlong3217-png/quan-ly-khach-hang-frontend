import type {
  Lead,
  LeadConversionPayload,
  LeadConversionResult,
} from '../types/lead.ts'
import { customerService } from './customerService.ts'
import { opportunityService } from './opportunityService.ts'
import { pipelineService } from './pipelineService.ts'
import { API_BASE_URL } from './authService.ts'

const STORAGE_KEY_LEADS = 'crm_leads_master_data'

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

function getStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveStoredLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads))
}

export const leadConversionService = {
  /**
   * Tạo dữ liệu xem trước mặc định khi mở modal chuyển đổi
   */
  getConversionPreview(lead: Lead) {
    // Ngày kỳ vọng chốt mặc định: 30 ngày tới
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    const defaultCloseDate = nextMonth.toISOString().split('T')[0]

    const stages = pipelineService.getStages()
    const defaultStage = stages[0] || {
      id: 'stage-1',
      name: 'Tiếp cận & Đánh giá',
      win_probability: 20,
    }

    return {
      lead_id: lead.id,
      lead_code: lead.code,
      lead_name: lead.full_name,
      lead_company: lead.company || lead.full_name,
      lead_email: lead.email,
      lead_phone: lead.phone,
      lead_industry: lead.industry || 'Công nghệ thông tin & Viễn thông',
      lead_requirement: lead.requirement || '',
      default_customer_name: lead.company ? lead.company : lead.full_name,
      default_opportunity_title: `Cơ hội bán hàng - ${lead.company || lead.full_name}`,
      default_expected_revenue: 50000000, // 50 triệu VNĐ mặc định
      default_close_date: defaultCloseDate,
      default_stage_id: defaultStage.id,
      default_stage_name: defaultStage.name,
      default_win_probability: defaultStage.win_probability,
    }
  },

  /**
   * Thực hiện chuyển đổi Lead thành Khách hàng và Cơ hội bán hàng
   */
  async convertLead(payload: LeadConversionPayload): Promise<LeadConversionResult> {
    const leads = getStoredLeads()
    const leadIndex = leads.findIndex((l) => l.id === payload.lead_id)
    if (leadIndex === -1) {
      throw new Error('Không tìm thấy khách hàng tiềm năng để chuyển đổi.')
    }

    const currentLead = leads[leadIndex]
    if (currentLead.status === 'CONVERTED') {
      throw new Error('Khách hàng tiềm năng này đã được chuyển đổi trước đó.')
    }

    // 1. Kiểm tra ngày chốt không được ở quá khứ nếu tạo cơ hội
    if (payload.create_opportunity && payload.expected_close_date) {
      const todayStr = new Date().toISOString().split('T')[0]
      if (payload.expected_close_date < todayStr) {
        throw new Error('Ngày dự kiến chốt cơ hội không được là một ngày trong quá khứ.')
      }
    }

    // Thử gọi Backend API chuyển đổi trước
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${payload.lead_id}/convert`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.success) {
          // Cập nhật trạng thái lead
          currentLead.status = 'CONVERTED'
          currentLead.converted_customer_id = data.customer?.id
          currentLead.converted_customer_name = data.customer?.name
          currentLead.converted_opportunity_id = data.opportunity?.id
          currentLead.converted_opportunity_title = data.opportunity?.title
          currentLead.converted_at = new Date().toISOString()
          currentLead.updated_at = new Date().toISOString()
          leads[leadIndex] = currentLead
          saveStoredLeads(leads)
          return data
        }
      }
    } catch {}

    // 2. Logic tạo Khách hàng (Enterprise Customer)
    let finalCustomer:
      | {
          id: string
          code: string
          name: string
          phone?: string
          email?: string
        }
      | undefined

    if (payload.create_new_customer) {
      const customerName = (payload.customer_name || currentLead.company || currentLead.full_name).trim()
      if (!customerName) {
        throw new Error('Vui lòng nhập tên công ty hoặc tên khách hàng.')
      }

      const newCustomer = customerService.createCustomer({
        name: customerName,
        tax_code: payload.tax_code?.trim() || undefined,
        industry: payload.industry || currentLead.industry || 'Công nghệ thông tin & Viễn thông',
        company_size: payload.company_size || '10 - 50 nhân sự',
        website: payload.website?.trim() || undefined,
        address: payload.address?.trim() || 'Hà Nội',
        phone: payload.phone?.trim() || currentLead.phone,
        email: payload.email?.trim() || currentLead.email,
        owner_id: payload.owner_id || currentLead.owner_id || 1,
        owner_name: payload.owner_name || currentLead.owner_name || 'Nguyễn Văn An',
        team_id: 1,
        team_name: 'Đội Kinh Doanh 1',
        status: 'POTENTIAL',
        description: `Chuyển đổi từ khách hàng tiềm năng [${currentLead.code}] ${currentLead.full_name}. Nhu cầu ban đầu: ${currentLead.requirement || 'Chưa có ghi chú'}.`,
      })

      finalCustomer = {
        id: newCustomer.id,
        code: newCustomer.code,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
      }
    } else if (payload.customer_id) {
      const existingCustomers = customerService.getCustomers()
      const found = existingCustomers.find((c) => c.id === payload.customer_id)
      if (found) {
        finalCustomer = {
          id: found.id,
          code: found.code,
          name: found.name,
          phone: found.phone,
          email: found.email,
        }
      } else {
        throw new Error('Không tìm thấy thông tin khách hàng đã chọn để liên kết.')
      }
    } else {
      throw new Error('Vui lòng chọn tạo khách hàng mới hoặc liên kết với khách hàng có sẵn.')
    }

    if (!finalCustomer) {
      throw new Error('Không thể khởi tạo hoặc liên kết khách hàng.')
    }

    // 3. Logic tạo Cơ hội (Opportunity) nếu được bật
    let finalOpportunity:
      | {
          id: string
          code: string
          title: string
          expected_revenue: number
          stage_name: string
        }
      | undefined

    if (payload.create_opportunity) {
      const oppTitle = (payload.opportunity_title || `Cơ hội - ${finalCustomer.name}`).trim()
      if (!oppTitle) {
        throw new Error('Vui lòng nhập tên cơ hội bán hàng.')
      }

      const stages = pipelineService.getStages()
      const stage = stages.find((s) => s.id === payload.stage_id) || stages[0]

      const newOpp = await opportunityService.createOpportunity({
        title: oppTitle,
        customer_id: finalCustomer.id,
        customer_name: finalCustomer.name,
        contact_name: currentLead.full_name,
        contact_phone: currentLead.phone,
        contact_email: currentLead.email,
        stage_id: stage?.id || 'stage-1',
        stage_name: stage?.name || 'Tiếp cận & Đánh giá',
        win_probability: stage?.win_probability ?? payload.win_probability ?? 20,
        expected_revenue: Number(payload.expected_revenue) || 0,
        expected_close_date: payload.expected_close_date || new Date().toISOString().split('T')[0],
        source: currentLead.source_detail || `Nguồn Lead: ${currentLead.source}`,
        owner_id: payload.owner_id || currentLead.owner_id || 1,
        owner_name: payload.owner_name || currentLead.owner_name || 'Nguyễn Văn An',
        description: payload.notes || currentLead.requirement || '',
        lead_id: currentLead.id,
      })

      finalOpportunity = {
        id: newOpp.id,
        code: newOpp.code,
        title: newOpp.title,
        expected_revenue: newOpp.expected_revenue,
        stage_name: newOpp.stage_name,
      }
    }

    // 4. Cập nhật Lead sang trạng thái 'CONVERTED'
    const convertedAt = new Date().toISOString()
    const updatedLead: Lead = {
      ...currentLead,
      status: 'CONVERTED',
      converted_customer_id: finalCustomer.id,
      converted_customer_name: finalCustomer.name,
      converted_opportunity_id: finalOpportunity?.id,
      converted_opportunity_title: finalOpportunity?.title,
      converted_at: convertedAt,
      updated_at: convertedAt,
    }

    leads[leadIndex] = updatedLead
    saveStoredLeads(leads)

    return {
      success: true,
      lead_id: currentLead.id,
      customer: finalCustomer,
      opportunity: finalOpportunity,
      message: `Đã chuyển đổi thành công khách hàng tiềm năng "${currentLead.full_name}" sang Khách hàng chính thức!`,
    }
  },
}
