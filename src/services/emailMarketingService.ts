import type {
  EmailTemplate,
  EmailQueueItem,
  SendEmailPayload,
} from '../types/emailMarketing.ts'
import { customerService } from './customerService.ts'

const STORAGE_KEY_TEMPLATES = 'crm_email_templates_v1'
const STORAGE_KEY_QUEUE = 'crm_email_queue_v1'

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-01',
    name: 'Giới thiệu giải pháp CRM & Ưu đãi Q4',
    category: 'INTRODUCTION',
    subject: 'Kính gửi {{contact_name}} - Giải pháp chuyển đổi số bán hàng từ {{assigned_rep}}',
    body: `Kính gửi Anh/Chị {{contact_name}},

Em là {{assigned_rep}} phụ trách tư vấn giải pháp tại SmartCRM.

Nhận thấy {{company_name}} đang đẩy mạnh chuyển đổi số và mở rộng quy mô kinh doanh, chúng tôi xin gửi đến Anh/Chị bộ giải pháp quản lý quan hệ khách hàng và tối ưu hiệu suất đội ngũ kinh doanh.

Các lợi ích then chốt:
- Quản lý tập trung dữ liệu khách hàng 360 độ
- Tự động hóa quy trình theo dõi báo giá và hợp đồng
- Cảnh báo chống bỏ sót cơ hội và đo lường tỷ lệ chuyển đổi

Em xin phép gửi kèm tài liệu chi tiết. Rất mong có dịp trao đổi thêm cùng Anh/Chị và {{company_name}}.

Trân trọng,
{{assigned_rep}}
Bộ phận Phát triển Giải pháp`,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    usage_count: 24,
  },
  {
    id: 'tmpl-02',
    name: 'Thư chăm sóc & Lắng nghe phản hồi sau Báo giá',
    category: 'FOLLOWUP',
    subject: 'Trao đổi thêm về phương án báo giá cho {{company_name}}',
    body: `Chào Anh/Chị {{contact_name}},

Sau khi gửi bảng báo giá chi tiết, {{assigned_rep}} muốn liên hệ để lắng nghe thêm phản hồi của {{company_name}}.

Không biết Anh/Chị đã xem qua đề xuất của bên em chưa? Nếu có điểm nào cần làm rõ về cấu hình giải pháp, điều khoản thanh toán hoặc chính sách ưu đãi, {{assigned_rep}} luôn sẵn sàng hỗ trợ trực tiếp.

Chúc Anh/Chị {{contact_name}} và Quý công ty một tuần làm việc hiệu quả!

Thân ái,
{{assigned_rep}}`,
    created_at: '2026-10-03T10:00:00.000Z',
    updated_at: '2026-10-03T10:00:00.000Z',
    usage_count: 18,
  },
  {
    id: 'tmpl-03',
    name: 'Thư cảm ơn & Kích hoạt dịch vụ Hợp đồng',
    category: 'CONTRACT',
    subject: 'Chào mừng {{company_name}} chính thức gia nhập hệ sinh thái dịch vụ',
    body: `Kính gửi Quý công ty {{company_name}} và Anh/Chị {{contact_name}},

Chúng tôi xin chân thành cảm ơn sự tin tưởng và đồng hành của Quý khách cùng chúng tôi trong thời gian qua.

Hợp đồng cung cấp dịch vụ đã chính thức có hiệu lực. Chuyên viên phụ trách của Anh/Chị là {{assigned_rep}} sẽ liên hệ trong vòng 24 giờ tới để tiến hành các bước bàn giao và hướng dẫn triển khai.

Mọi yêu cầu hỗ trợ kỹ thuật hoặc tư vấn phát sinh, xin vui lòng phản hồi trực tiếp qua email này.

Kính chúc {{company_name}} ngày càng phát triển thịnh vượng!

Trân trọng,
{{assigned_rep}}`,
    created_at: '2026-10-05T14:30:00.000Z',
    updated_at: '2026-10-05T14:30:00.000Z',
    usage_count: 12,
  },
]

const INITIAL_QUEUE: EmailQueueItem[] = []

class EmailMarketingService {
  private templates: EmailTemplate[]
  private queue: EmailQueueItem[]
  private isProcessingQueue = false

  constructor() {
    this.templates = this.loadTemplates()
    this.queue = this.loadQueue()
  }

  private loadTemplates(): EmailTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Failed to parse email templates:', e)
    }
    this.saveTemplatesToStorage(INITIAL_TEMPLATES)
    return INITIAL_TEMPLATES
  }

  private saveTemplatesToStorage(list: EmailTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(list))
    } catch (e) {
      console.warn('Failed to save email templates:', e)
    }
  }

  private loadQueue(): EmailQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_QUEUE)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Failed to parse email queue:', e)
    }
    this.saveQueueToStorage(INITIAL_QUEUE)
    return INITIAL_QUEUE
  }

  private saveQueueToStorage(list: EmailQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(list))
    } catch (e) {
      console.warn('Failed to save email queue:', e)
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm-email-queue-updated'))
    }
  }

  /**
   * Thay thế biến mẫu (Merge Tags):
   * {{contact_name}} -> Tên người liên hệ
   * {{company_name}} -> Tên công ty / Doanh nghiệp
   * {{assigned_rep}} -> Tên nhân viên phụ trách
   */
  public renderMergeTags(
    rawText: string,
    params: {
      contact_name?: string
      company_name?: string
      assigned_rep?: string
    }
  ): string {
    let result = rawText || ''
    const contact = params.contact_name?.trim() || 'Quý khách'
    const company = params.company_name?.trim() || 'Quý công ty'
    const rep = params.assigned_rep?.trim() || 'Chuyên viên tư vấn'
    const today = new Date().toLocaleDateString('vi-VN')

    result = result.replace(/\{\{\s*contact_name\s*\}\}/gi, contact)
    result = result.replace(/\{\{\s*company_name\s*\}\}/gi, company)
    result = result.replace(/\{\{\s*assigned_rep\s*\}\}/gi, rep)
    result = result.replace(/\{\{\s*current_date\s*\}\}/gi, today)

    return result
  }

  public getTemplates(): EmailTemplate[] {
    return [...this.templates]
  }

  public getTemplateById(id: string): EmailTemplate | undefined {
    return this.templates.find((t) => t.id === id)
  }

  public saveTemplate(data: Partial<EmailTemplate> & { name: string; subject: string; body: string }): EmailTemplate {
    const now = new Date().toISOString()
    if (data.id) {
      this.templates = this.templates.map((t) => {
        if (t.id === data.id) {
          return {
            ...t,
            ...data,
            updated_at: now,
          } as EmailTemplate
        }
        return t
      })
      this.saveTemplatesToStorage(this.templates)
      return this.templates.find((t) => t.id === data.id)!
    } else {
      const newTmpl: EmailTemplate = {
        id: `tmpl-${Date.now()}`,
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category || 'GENERAL',
        created_at: now,
        updated_at: now,
        usage_count: 0,
      }
      this.templates.unshift(newTmpl)
      this.saveTemplatesToStorage(this.templates)
      return newTmpl
    }
  }

  public deleteTemplate(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id)
    this.saveTemplatesToStorage(this.templates)
  }

  public getQueue(): EmailQueueItem[] {
    return [...this.queue]
  }

  public clearQueue(): void {
    this.queue = []
    this.saveQueueToStorage([])
  }

  /**
   * Đưa email vào hàng đợi gửi bất đồng bộ (S8-01 AC: Gửi bất đồng bộ qua hàng đợi)
   */
  public async queueEmail(payload: SendEmailPayload): Promise<EmailQueueItem> {
    const now = new Date().toISOString()
    const newItem: EmailQueueItem = {
      id: `mail-q-${Date.now()}`,
      template_id: payload.template_id,
      template_name: payload.template_name,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      contact_name: payload.contact_name,
      recipient_email: payload.recipient_email,
      subject: payload.subject,
      body: payload.body,
      assigned_rep: payload.assigned_rep,
      status: 'QUEUED',
      queued_at: now,
      retry_count: 0,
    }

    this.queue.unshift(newItem)
    this.saveQueueToStorage(this.queue)

    // Tăng usage_count của template nếu có
    if (payload.template_id) {
      this.templates = this.templates.map((t) =>
        t.id === payload.template_id ? { ...t, usage_count: t.usage_count + 1 } : t
      )
      this.saveTemplatesToStorage(this.templates)
    }

    // Kích hoạt xử lý hàng đợi bất đồng bộ
    setTimeout(() => {
      this.processQueue()
    }, 100)

    return newItem
  }

  /**
   * S8-01 AC: Gửi lại thư thất bại (Retry failed email)
   */
  public async retryFailedEmail(queueId: string): Promise<void> {
    const item = this.queue.find((q) => q.id === queueId)
    if (!item) throw new Error('Không tìm thấy thư trong hàng đợi')

    this.queue = this.queue.map((q) => {
      if (q.id === queueId) {
        return {
          ...q,
          status: 'QUEUED',
          retry_count: q.retry_count + 1,
          error_message: undefined,
          queued_at: new Date().toISOString(),
        }
      }
      return q
    })

    this.saveQueueToStorage(this.queue)

    setTimeout(() => {
      this.processQueue()
    }, 100)
  }

  /**
   * Xử lý hàng đợi bất đồng bộ qua luồng ngầm
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    try {
      const pendingItems = this.queue.filter((q) => q.status === 'QUEUED')
      for (const item of pendingItems) {
        // Cập nhật trạng thái sang SENDING
        this.updateItemStatus(item.id, 'SENDING')

        // Giả lập thời gian gửi bất đồng bộ qua SMTP / Mail service (1 - 1.5 giây)
        await new Promise((resolve) => setTimeout(resolve, 1200))

        // Giả lập 5% cơ hội gặp lỗi nếu địa chỉ có chứa 'fail' hoặc 'test-error'
        const isSimulatedFail = item.recipient_email.includes('error') || item.recipient_email.includes('fail')

        if (isSimulatedFail) {
          this.updateItemStatus(item.id, 'FAILED', 'Kết nối máy chủ gửi thư SMTP timeout (421 Connection rejected)')
        } else {
          this.updateItemStatus(item.id, 'SENT')

          // S8-01 AC: Email gửi đi được tự động ghi vào dòng thời gian của khách hàng
          if (item.customer_id) {
            customerService.addActivity({
              customer_id: item.customer_id,
              type: 'EMAIL',
              title: `[Email đã gửi] ${item.subject}`,
              description: `Người nhận: ${item.recipient_email} (${item.contact_name})\nNhân viên gửi: ${item.assigned_rep}\n\nNội dung email:\n${item.body}`,
              performed_by_name: item.assigned_rep,
            })
          }
        }
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  private updateItemStatus(id: string, status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED', error?: string): void {
    const now = new Date().toISOString()
    this.queue = this.queue.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status,
          sent_at: status === 'SENT' ? now : q.sent_at,
          failed_at: status === 'FAILED' ? now : q.failed_at,
          error_message: error || (status === 'SENT' ? undefined : q.error_message),
        }
      }
      return q
    })
    this.saveQueueToStorage(this.queue)
  }
}

export const emailMarketingService = new EmailMarketingService()
