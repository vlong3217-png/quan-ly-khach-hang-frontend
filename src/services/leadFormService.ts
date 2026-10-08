import type {
  LeadForm,
  LeadSubmission,
  CreateLeadFormPayload,
  UpdateLeadFormPayload,
  SubmitLeadPayload,
  LeadSubmissionStatus,
} from '../types/leadForm.ts'
import { API_BASE_URL } from './authService.ts'

const STORAGE_KEY_FORMS = 'crm_lead_forms_data'
const STORAGE_KEY_SUBMISSIONS = 'crm_lead_submissions_data'

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

async function parseErrorResponse(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    if (data.message && typeof data.message === 'string') return data.message
  } catch {
    // body not JSON
  }
  return defaultMessage
}

/* ──────────── Dữ liệu khởi tạo mẫu ──────────── */
const INITIAL_LEAD_FORMS: LeadForm[] = [
  {
    id: 'form-001',
    code: 'FORM-WEB-01',
    name: 'Biểu mẫu Đăng ký Tư vấn - Trang chủ Website',
    title: 'Đăng ký tư vấn miễn phí giải pháp Quản lý Khách hàng CRM',
    description: 'Vui lòng để lại thông tin để chuyên viên tư vấn liên hệ và demo hệ thống trong vòng 15 phút.',
    submit_button_text: 'Đăng ký nhận tư vấn ngay',
    success_message: 'Cảm ơn bạn đã đăng ký! Chuyên viên tư vấn của chúng tôi sẽ liên hệ lại với bạn trong ít phút.',
    redirect_url: '',
    is_active: true,
    submissions_count: 6,
    campaign_id: 'camp-001',
    campaign_name: 'Chiến dịch Q4 Chuyển đổi số 2026',
    created_at: '2026-09-15T08:30:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'form-002',
    code: 'FORM-TRIAL-02',
    name: 'Biểu mẫu Dùng thử 14 ngày - Landing Page',
    title: 'Trải nghiệm miễn phí 14 ngày đầy đủ tính năng CRM Doanh nghiệp',
    description: 'Khởi tạo tài khoản dùng thử không cần thẻ tín dụng, hỗ trợ cài đặt và import dữ liệu ban đầu.',
    submit_button_text: 'Bắt đầu dùng thử miễn phí',
    success_message: 'Yêu cầu dùng thử của bạn đã được tiếp nhận. Chúng tôi đã gửi thông tin kích hoạt qua email!',
    redirect_url: '',
    is_active: true,
    submissions_count: 4,
    campaign_id: 'camp-002',
    campaign_name: 'Quảng cáo Google Search Khách hàng B2B',
    created_at: '2026-09-20T09:00:00Z',
    updated_at: '2026-10-05T14:15:00Z',
  },
  {
    id: 'form-003',
    code: 'FORM-EBOOK-03',
    name: 'Biểu mẫu Tải tài liệu Ebook Quản trị Sales B2B',
    title: 'Tải cẩm nang: Tối ưu quy trình kinh doanh và chăm sóc khách hàng 2026',
    description: 'Nhập thông tin doanh nghiệp để tải ngay tài liệu hướng dẫn chuẩn hóa đội ngũ kinh doanh B2B.',
    submit_button_text: 'Tải tài liệu ngay (PDF)',
    success_message: 'Đăng ký tải tài liệu thành công! Đường link tải cẩm nang đã được gửi tới hòm thư của bạn.',
    redirect_url: '',
    is_active: false,
    submissions_count: 2,
    created_at: '2026-09-28T11:00:00Z',
    updated_at: '2026-10-07T16:20:00Z',
  },
]

const INITIAL_SUBMISSIONS: LeadSubmission[] = [
  {
    id: 'sub-001',
    form_id: 'form-001',
    form_name: 'Biểu mẫu Đăng ký Tư vấn - Trang chủ Website',
    full_name: 'Trần Hải Đăng',
    email: 'dang.tran@saovangtech.com',
    phone: '0912345678',
    company: 'Công ty TNHH Giải pháp Công nghệ Sao Vàng',
    requirement: 'Cần tư vấn gói CRM cho đội ngũ kinh doanh 25 nhân sự, yêu cầu tính năng quản lý pipeline và nhắc hẹn chăm sóc.',
    status: 'NEW',
    created_at: '2026-10-08T09:15:00Z',
  },
  {
    id: 'sub-002',
    form_id: 'form-001',
    form_name: 'Biểu mẫu Đăng ký Tư vấn - Trang chủ Website',
    full_name: 'Ngô Thanh Hương',
    email: 'huong.ngo@anphatlogistics.vn',
    phone: '0987654321',
    company: 'Công ty Cổ phần Vận tải & Logistics An Phát',
    requirement: 'Muốn đặt lịch demo trực tiếp phần mềm vào sáng thứ 6 tuần này tại văn phòng công ty ở Cầu Giấy.',
    status: 'CONTACTED',
    created_at: '2026-10-07T15:30:00Z',
  },
  {
    id: 'sub-003',
    form_id: 'form-002',
    form_name: 'Biểu mẫu Dùng thử 14 ngày - Landing Page',
    full_name: 'Vũ Đức Mạnh',
    email: 'manh.vu@namvietsteel.com',
    phone: '0903456789',
    company: 'Công ty Cổ phần Thép Nam Việt',
    requirement: 'Muốn dùng thử tính năng phân quyền dữ liệu khách hàng theo chi nhánh Bắc - Trung - Nam.',
    status: 'QUALIFIED',
    created_at: '2026-10-06T10:45:00Z',
  },
  {
    id: 'sub-004',
    form_id: 'form-001',
    form_name: 'Biểu mẫu Đăng ký Tư vấn - Trang chủ Website',
    full_name: 'Phan Thị Mai Lan',
    email: 'lan.phan@thudoedu.vn',
    phone: '0934567890',
    company: 'Tổ chức Giáo dục & Đào tạo Thủ Đô',
    requirement: 'Tìm kiếm phần mềm quản lý học viên và phụ huynh, có tính năng gửi email báo giá khóa học.',
    status: 'CONVERTED',
    created_at: '2026-10-05T08:20:00Z',
  },
  {
    id: 'sub-005',
    form_id: 'form-002',
    form_name: 'Biểu mẫu Dùng thử 14 ngày - Landing Page',
    full_name: 'Đặng Quốc Huy',
    email: 'huy.dang@greenfood.vn',
    phone: '0945678901',
    company: 'Công ty TNHH Thực phẩm Sạch Green Food',
    requirement: 'Cần hướng dẫn import dữ liệu khách hàng từ file Excel cũ vào hệ thống.',
    status: 'CONTACTED',
    created_at: '2026-10-04T14:10:00Z',
  },
]

/* ──────────── LocalStorage Helpers ──────────── */
function getStoredForms(): LeadForm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FORMS)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(INITIAL_LEAD_FORMS))
  return INITIAL_LEAD_FORMS
}

function saveStoredForms(forms: LeadForm[]): void {
  localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(forms))
}

function getStoredSubmissions(): LeadSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS))
  return INITIAL_SUBMISSIONS
}

function saveStoredSubmissions(subs: LeadSubmission[]): void {
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(subs))
}

/* ──────────── Service API Implementation ──────────── */
export const leadFormService = {
  /**
   * Lấy danh sách toàn bộ biểu mẫu Lead
   */
  async getLeadForms(): Promise<LeadForm[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/lead-forms`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          saveStoredForms(data)
          return data
        }
      }
    } catch {
      // Backend offline hoặc chưa có route, sử dụng local fallback
    }
    return getStoredForms()
  },

  /**
   * Lấy thông tin chi tiết một biểu mẫu (dùng cho cả trang public nhúng)
   */
  async getLeadFormById(id: string): Promise<LeadForm | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/lead-forms/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) return data
      }
    } catch {}

    const forms = getStoredForms()
    return forms.find((f) => f.id === id) || null
  },

  /**
   * Tạo biểu mẫu Lead mới
   */
  async createLeadForm(payload: CreateLeadFormPayload): Promise<LeadForm> {
    const forms = getStoredForms()
    const nextCodeNumber = forms.length + 1
    const newFormCode = `FORM-${String(nextCodeNumber).padStart(3, '0')}`

    const localNewForm: LeadForm = {
      id: `form-${Date.now()}`,
      code: newFormCode,
      name: payload.name.trim(),
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      submit_button_text: payload.submit_button_text?.trim() || 'Gửi thông tin tư vấn',
      success_message:
        payload.success_message?.trim() ||
        'Cảm ơn bạn đã đăng ký! Chuyên viên tư vấn sẽ liên hệ lại với bạn trong ít phút.',
      redirect_url: payload.redirect_url?.trim() || '',
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      submissions_count: 0,
      campaign_id: payload.campaign_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/lead-forms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(localNewForm),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const updated = [data, ...forms]
          saveStoredForms(updated)
          return data
        }
      } else {
        const err = await parseErrorResponse(response, 'Lỗi khi tạo biểu mẫu trên máy chủ')
        console.warn('API createLeadForm failed, using local store:', err)
      }
    } catch {
      // Backend offline -> lưu local
    }

    const updated = [localNewForm, ...forms]
    saveStoredForms(updated)
    return localNewForm
  },

  /**
   * Cập nhật thông tin biểu mẫu
   */
  async updateLeadForm(id: string, payload: UpdateLeadFormPayload): Promise<LeadForm> {
    const forms = getStoredForms()
    const index = forms.findIndex((f) => f.id === id)
    if (index === -1) throw new Error('Không tìm thấy biểu mẫu cần cập nhật')

    const existing = forms[index]
    const updatedForm: LeadForm = {
      ...existing,
      ...payload,
      name: payload.name !== undefined ? payload.name.trim() : existing.name,
      title: payload.title !== undefined ? payload.title.trim() : existing.title,
      description: payload.description !== undefined ? payload.description.trim() : existing.description,
      submit_button_text:
        payload.submit_button_text !== undefined ? payload.submit_button_text.trim() : existing.submit_button_text,
      success_message:
        payload.success_message !== undefined ? payload.success_message.trim() : existing.success_message,
      redirect_url: payload.redirect_url !== undefined ? payload.redirect_url.trim() : existing.redirect_url,
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/lead-forms/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedForm),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          forms[index] = data
          saveStoredForms(forms)
          return data
        }
      }
    } catch {}

    forms[index] = updatedForm
    saveStoredForms(forms)
    return updatedForm
  },

  /**
   * Bật/tắt trạng thái hoạt động của biểu mẫu
   */
  async toggleLeadFormStatus(id: string): Promise<LeadForm> {
    const forms = getStoredForms()
    const target = forms.find((f) => f.id === id)
    if (!target) throw new Error('Không tìm thấy biểu mẫu')
    return this.updateLeadForm(id, { is_active: !target.is_active })
  },

  /**
   * Xóa biểu mẫu
   */
  async deleteLeadForm(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/lead-forms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

    const forms = getStoredForms().filter((f) => f.id !== id)
    saveStoredForms(forms)
  },

  /**
   * Gửi biểu mẫu Lead từ trang công khai / iframe (Web-to-Lead submission)
   */
  async submitLead(formId: string, payload: SubmitLeadPayload): Promise<{ success: boolean; message: string; redirect_url?: string }> {
    const forms = getStoredForms()
    const targetForm = forms.find((f) => f.id === formId)

    if (!targetForm) {
      throw new Error('Biểu mẫu không tồn tại hoặc đã bị xóa')
    }

    if (!targetForm.is_active) {
      throw new Error('Biểu mẫu này hiện đang tạm dừng tiếp nhận thông tin')
    }

    // Validate fields
    if (!payload.full_name || !payload.full_name.trim()) {
      throw new Error('Vui lòng nhập họ và tên của bạn')
    }
    if (!payload.phone || !payload.phone.trim()) {
      throw new Error('Vui lòng nhập số điện thoại liên hệ')
    }
    if (!payload.email || !payload.email.trim()) {
      throw new Error('Vui lòng nhập địa chỉ email')
    }

    const newSubmission: LeadSubmission = {
      id: `sub-${Date.now()}`,
      form_id: targetForm.id,
      form_name: targetForm.name,
      full_name: payload.full_name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      company: payload.company?.trim() || '',
      requirement: payload.requirement?.trim() || '',
      status: 'NEW',
      created_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/lead-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubmission),
      })
      if (!response.ok) {
        // Fallback lưu local
      }
    } catch {}

    // Lưu submission vào local
    const subs = getStoredSubmissions()
    saveStoredSubmissions([newSubmission, ...subs])

    // Tăng submission count của form
    targetForm.submissions_count += 1
    targetForm.updated_at = new Date().toISOString()
    saveStoredForms(forms)

    return {
      success: true,
      message: targetForm.success_message,
      redirect_url: targetForm.redirect_url,
    }
  },

  /**
   * Lấy danh sách Lead thu thập được từ biểu mẫu
   */
  async getLeadSubmissions(formId?: string): Promise<LeadSubmission[]> {
    try {
      const url = formId
        ? `${API_BASE_URL}/lead-forms/${formId}/submissions`
        : `${API_BASE_URL}/lead-submissions`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          saveStoredSubmissions(data)
          return data
        }
      }
    } catch {}

    const list = getStoredSubmissions()
    if (formId) {
      return list.filter((s) => s.form_id === formId)
    }
    return list
  },

  /**
   * Cập nhật trạng thái xử lý của Lead
   */
  async updateSubmissionStatus(id: string, status: LeadSubmissionStatus): Promise<LeadSubmission> {
    const list = getStoredSubmissions()
    const target = list.find((s) => s.id === id)
    if (!target) throw new Error('Không tìm thấy Lead')

    target.status = status
    saveStoredSubmissions(list)
    return target
  },
}
