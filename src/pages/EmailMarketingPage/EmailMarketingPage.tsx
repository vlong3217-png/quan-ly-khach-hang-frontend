import { useState, useEffect } from 'react'
import type {
  EmailTemplate,
  EmailQueueItem,
  EmailTemplateCategory,
} from '../../types/emailMarketing.ts'
import { emailMarketingService } from '../../services/emailMarketingService.ts'
import { customerService } from '../../services/customerService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './EmailMarketingPage.css'

export default function EmailMarketingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'TEMPLATES'>('QUEUE')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [queue, setQueue] = useState<EmailQueueItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modals
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isTmplModalOpen, setIsTmplModalOpen] = useState(false)
  const [viewingQueueItem, setViewingQueueItem] = useState<EmailQueueItem | null>(null)

  // Send Email Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [contactName, setContactName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [assignedRep, setAssignedRep] = useState(user?.full_name || 'Nguyễn Văn A')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // Template Modal State
  const [editingTmplId, setEditingTmplId] = useState<string | null>(null)
  const [tmplName, setTmplName] = useState('')
  const [tmplCategory, setTmplCategory] = useState<EmailTemplateCategory>('GENERAL')
  const [tmplSubject, setTmplSubject] = useState('')
  const [tmplBody, setTmplBody] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = () => {
    setTemplates(emailMarketingService.getTemplates())
    setQueue(emailMarketingService.getQueue())
  }

  useEffect(() => {
    loadData()

    const handleQueueUpdate = () => {
      loadData()
    }
    window.addEventListener('crm-email-queue-updated', handleQueueUpdate)
    return () => {
      window.removeEventListener('crm-email-queue-updated', handleQueueUpdate)
    }
  }, [])

  // Auto-populate customer fields when selecting a customer
  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId)
    if (!cId) {
      setCustomerName('')
      setContactName('')
      setRecipientEmail('')
      return
    }
    const c = customerService.getCustomerById(cId)
    if (c) {
      setCustomerName(c.name || '')
      const contacts = customerService.getContacts(cId)
      const primaryContact = contacts.length > 0 ? contacts[0].full_name : 'Quý khách'
      setContactName(primaryContact)
      setRecipientEmail(contacts[0]?.email || c.email || 'khachhang@doanhnghiep.vn')
    }
  }

  // Auto-populate template fields
  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId)
    if (!tId) return
    const tmpl = emailMarketingService.getTemplateById(tId)
    if (tmpl) {
      setEmailSubject(tmpl.subject)
      setEmailBody(tmpl.body)
    }
  }

  // Insert variable tag into subject or body
  const handleInsertTag = (tag: string, targetField: 'SUBJECT' | 'BODY' | 'TMPL_SUBJECT' | 'TMPL_BODY') => {
    if (targetField === 'SUBJECT') {
      setEmailSubject((prev) => prev + tag)
    } else if (targetField === 'BODY') {
      setEmailBody((prev) => prev + tag)
    } else if (targetField === 'TMPL_SUBJECT') {
      setTmplSubject((prev) => prev + tag)
    } else if (targetField === 'TMPL_BODY') {
      setTmplBody((prev) => prev + tag)
    }
  }

  // Send Email Handler
  const handleQueueSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientEmail.trim() || !emailSubject.trim() || !emailBody.trim()) {
      alert('Vui lòng điền đầy đủ email người nhận, tiêu đề và nội dung thư.')
      return
    }

    // Render merge tags
    const renderedSubject = emailMarketingService.renderMergeTags(emailSubject, {
      contact_name: contactName,
      company_name: customerName,
      assigned_rep: assignedRep,
    })
    const renderedBody = emailMarketingService.renderMergeTags(emailBody, {
      contact_name: contactName,
      company_name: customerName,
      assigned_rep: assignedRep,
    })

    const tmpl = templates.find((t) => t.id === selectedTemplateId)

    await emailMarketingService.queueEmail({
      template_id: selectedTemplateId || undefined,
      template_name: tmpl?.name || undefined,
      customer_id: selectedCustomerId || 'cust-direct',
      customer_name: customerName || 'Khách hàng liên hệ trực tiếp',
      contact_name: contactName || 'Quý khách',
      recipient_email: recipientEmail.trim(),
      subject: renderedSubject,
      body: renderedBody,
      assigned_rep: assignedRep,
    })

    loadData()
    setIsSendModalOpen(false)
    setActiveTab('QUEUE')
    showToast(`Đã đưa email vào hàng đợi gửi bất đồng bộ cho ${recipientEmail}!`)
  }

  // Retry Failed Email
  const handleRetryEmail = async (queueId: string) => {
    try {
      await emailMarketingService.retryFailedEmail(queueId)
      loadData()
      showToast('Đang gửi lại thư qua hàng đợi bất đồng bộ...')
    } catch (e: unknown) {
      alert((e as Error).message)
    }
  }

  // Template Save Handler
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tmplName.trim() || !tmplSubject.trim() || !tmplBody.trim()) {
      alert('Vui lòng nhập đầy đủ tên mẫu, tiêu đề và nội dung mẫu thư.')
      return
    }

    emailMarketingService.saveTemplate({
      id: editingTmplId || undefined,
      name: tmplName.trim(),
      category: tmplCategory,
      subject: tmplSubject.trim(),
      body: tmplBody.trim(),
    })

    loadData()
    setIsTmplModalOpen(false)
    showToast(editingTmplId ? 'Cập nhật mẫu email thành công' : 'Đã tạo mới mẫu email thành công')
  }

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xoá mẫu email này?')) {
      emailMarketingService.deleteTemplate(id)
      loadData()
      showToast('Đã xoá mẫu email')
    }
  }

  const handleOpenEditTmpl = (t: EmailTemplate) => {
    setEditingTmplId(t.id)
    setTmplName(t.name)
    setTmplCategory(t.category)
    setTmplSubject(t.subject)
    setTmplBody(t.body)
    setIsTmplModalOpen(true)
  }

  const handleOpenCreateTmpl = () => {
    setEditingTmplId(null)
    setTmplName('')
    setTmplCategory('GENERAL')
    setTmplSubject('')
    setTmplBody('')
    setIsTmplModalOpen(true)
  }

  const handleUseTemplateToSend = (t: EmailTemplate) => {
    setSelectedTemplateId(t.id)
    setEmailSubject(t.subject)
    setEmailBody(t.body)
    setIsSendModalOpen(true)
  }

  // Format date helper
  const formatTime = (iso?: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const customersList = customerService.getCustomers()

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      item.recipient_email.toLowerCase().includes(term) ||
      item.customer_name.toLowerCase().includes(term) ||
      item.subject.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    )
  })

  // Live rendered preview in send modal
  const liveRenderedSubject = emailMarketingService.renderMergeTags(emailSubject, {
    contact_name: contactName || 'Nguyễn Văn Minh',
    company_name: customerName || 'Tập đoàn Công nghệ FPT',
    assigned_rep: assignedRep,
  })
  const liveRenderedBody = emailMarketingService.renderMergeTags(emailBody, {
    contact_name: contactName || 'Nguyễn Văn Minh',
    company_name: customerName || 'Tập đoàn Công nghệ FPT',
    assigned_rep: assignedRep,
  })

  return (
    <div className="email-marketing-page" id="email-marketing-page">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="action-notice-toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="email-page-header">
        <div>
          <h1>
            <span>Tiếp thị Email & Mẫu thư</span>
          </h1>
          
        </div>
        <div className="email-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            id="btn-compose-email"
            onClick={() => {
              setSelectedCustomerId('')
              setCustomerName('')
              setContactName('')
              setRecipientEmail('')
              setSelectedTemplateId('')
              setEmailSubject('')
              setEmailBody('')
              setIsSendModalOpen(true)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <span>Soạn email gửi khách</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            id="btn-create-template"
            onClick={handleOpenCreateTmpl}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>+ Tạo mẫu thư mới</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="email-tabs">
        <button
          type="button"
          className={`email-tab-btn ${activeTab === 'QUEUE' ? 'active' : ''}`}
          onClick={() => setActiveTab('QUEUE')}
        >
          <span>Hàng đợi & Lịch sử gửi</span>
          <span className="tab-badge">{queue.length}</span>
        </button>
        <button
          type="button"
          className={`email-tab-btn ${activeTab === 'TEMPLATES' ? 'active' : ''}`}
          onClick={() => setActiveTab('TEMPLATES')}
        >
          <span>Thư viện mẫu email (Templates)</span>
          <span className="tab-badge">{templates.length}</span>
        </button>
      </div>

      {/* TAB 1: QUEUE & HISTORY */}
      {activeTab === 'QUEUE' && (
        <div className="queue-container" id="email-queue-container">
          <div className="queue-toolbar">
            <input
              type="text"
              className="queue-search-input"
              placeholder="Tìm theo email, khách hàng, tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <span>
                Thành công: <strong>{queue.filter((q) => q.status === 'SENT').length}</strong>
              </span>
              <span>•</span>
              <span>
                Thất bại:{' '}
                <strong style={{ color: '#ef4444' }}>
                  {queue.filter((q) => q.status === 'FAILED').length}
                </strong>
              </span>
              <span>•</span>
              <span>
                Đang xử lý:{' '}
                <strong style={{ color: '#2563eb' }}>
                  {queue.filter((q) => q.status === 'QUEUED' || q.status === 'SENDING').length}
                </strong>
              </span>
            </div>
          </div>

          <table className="queue-table" id="email-queue-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Thời gian</th>
                <th style={{ width: 230 }}>Người nhận & Khách hàng</th>
                <th>Tiêu đề & Mẫu thư</th>
                <th style={{ width: 140, textAlign: 'center' }}>Trạng thái</th>
                <th style={{ width: 180, textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Không có email nào trong hàng đợi hoặc lịch sử.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {formatTime(item.sent_at || item.queued_at)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.recipient_email}</div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                        {item.contact_name} • {item.customer_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2563eb' }}>{item.subject}</div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b', display: 'flex', gap: 6 }}>
                        <span>NV: {item.assigned_rep}</span>
                        {item.template_name && <span>• Mẫu: {item.template_name}</span>}
                        {item.retry_count > 0 && (
                          <span style={{ color: '#b45309', fontWeight: 600 }}>
                            (Đã gửi lại: {item.retry_count} lần)
                          </span>
                        )}
                      </div>
                      {item.error_message && (
                        <div style={{ fontSize: '0.775rem', color: '#ef4444', marginTop: 2 }}>
                          Lỗi: {item.error_message}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${item.status}`}>
                        {item.status === 'QUEUED' && 'Chờ gửi'}
                        {item.status === 'SENDING' && 'Đang gửi...'}
                        {item.status === 'SENT' && 'Đã gửi'}
                        {item.status === 'FAILED' && 'Thất bại'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {item.status === 'FAILED' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#dc2626', borderColor: '#dc2626' }}
                            onClick={() => handleRetryEmail(item.id)}
                            title="Thử gửi lại thư này qua hàng đợi bất đồng bộ (S8-01 AC)"
                          >
                            Gửi lại (Retry)
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => setViewingQueueItem(item)}
                        >
                          Xem nội dung
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: EMAIL TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="templates-grid" id="templates-grid">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="template-card" id={`template-card-${tmpl.id}`}>
              <div className="template-card-header">
                <h3 className="template-title">{tmpl.name}</h3>
                <span className={`category-tag ${tmpl.category}`}>{tmpl.category}</span>
              </div>

              <div className="template-subject-preview">
                <strong>Tiêu đề:</strong> {tmpl.subject}
              </div>

              <div className="template-body-snippet">
                {tmpl.body}
              </div>

              <div className="template-card-footer">
                <span>Đã dùng: <strong>{tmpl.usage_count} lần</strong></span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => handleUseTemplateToSend(tmpl)}
                  >
                    Dùng mẫu
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => handleOpenEditTmpl(tmpl)}
                  >
                    ✏
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#ef4444' }}
                    onClick={() => handleDeleteTemplate(tmpl.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: SOẠN VÀ GỬI EMAIL */}
      {isSendModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSendModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Soạn email gửi khách hàng & Tự động ghi Dòng thời gian</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsSendModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQueueSendEmail}>
              <div className="modal-body-custom">
                {/* Customer Picker */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
                  <div className="form-group-custom">
                    <label>Chọn khách hàng từ hệ thống:</label>
                    <select
                      className="form-select-custom"
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                    >
                      <option value="">-- Chọn khách hàng sẵn có --</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email || 'Chưa có email'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Áp dụng mẫu thư sẵn có:</label>
                    <select
                      className="form-select-custom"
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                    >
                      <option value="">-- Tự soạn hoặc chọn mẫu --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Recipient details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.2fr 1fr', gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Email người nhận (*):</label>
                    <input
                      type="email"
                      className="form-input-custom"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="email@doanhnghiep.vn"
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Tên khách hàng / Công ty:</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tập đoàn ABC..."
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Tên người liên hệ:</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Anh/Chị..."
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Chuyên viên gửi:</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={assignedRep}
                      onChange={(e) => setAssignedRep(e.target.value)}
                    />
                  </div>
                </div>

                {/* Merge Tags Helper Bar */}
                <div className="variables-bar">
                  <span>Chèn nhanh biến mẫu (Merge tags):</span>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{contact_name}}', 'BODY')}
                    title="Chèn biến Tên người liên hệ"
                  >
                    + {'{{contact_name}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{company_name}}', 'BODY')}
                    title="Chèn biến Tên công ty"
                  >
                    + {'{{company_name}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{assigned_rep}}', 'BODY')}
                    title="Chèn biến Tên nhân viên phụ trách"
                  >
                    + {'{{assigned_rep}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{current_date}}', 'BODY')}
                    title="Chèn Ngày hiện tại"
                  >
                    + {'{{current_date}}'}
                  </button>
                </div>

                {/* Subject & Body */}
                <div className="form-group-custom">
                  <label>Tiêu đề Email (*):</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Nhập tiêu đề email..."
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Nội dung Email (*):</label>
                  <textarea
                    rows={8}
                    className="form-textarea-custom"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Soạn nội dung thư tại đây..."
                    required
                  />
                </div>

                {/* Live rendered preview */}
                <div className="rendered-preview-box">
                  <div className="preview-meta">
                    <div>
                      <strong>Đến:</strong> {recipientEmail || 'chưa nhập'} ({contactName || 'Người nhận'} -{' '}
                      {customerName || 'Doanh nghiệp'})
                    </div>
                    <div>
                      <strong>Tiêu đề thực tế:</strong> {liveRenderedSubject || '—'}
                    </div>
                  </div>
                  <div className="preview-body-content">
                    {liveRenderedBody || '(Chưa có nội dung xem trước)'}
                  </div>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSendModalOpen(false)}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-confirm-queue-email"
                >
                  🚀 Gửi email (Vào hàng đợi)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO / SỬA MẪU THƯ */}
      {isTmplModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTmplModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>{editingTmplId ? 'Chỉnh sửa mẫu email' : 'Tạo mới mẫu email marketing'}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsTmplModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate}>
              <div className="modal-body-custom">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                  <div className="form-group-custom">
                    <label>Tên mẫu thư (*):</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      placeholder="Ví dụ: Giới thiệu giải pháp CRM & Khuyến mãi Q4"
                      value={tmplName}
                      onChange={(e) => setTmplName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Chuyên mục:</label>
                    <select
                      className="form-select-custom"
                      value={tmplCategory}
                      onChange={(e) => setTmplCategory(e.target.value as EmailTemplateCategory)}
                    >
                      <option value="INTRODUCTION">Giới thiệu (INTRODUCTION)</option>
                      <option value="FOLLOWUP">Chăm sóc sau báo giá (FOLLOWUP)</option>
                      <option value="CONTRACT">Hợp đồng & Triển khai (CONTRACT)</option>
                      <option value="PROMOTION">Khuyến mãi / Marketing (PROMOTION)</option>
                      <option value="GENERAL">Chung (GENERAL)</option>
                    </select>
                  </div>
                </div>

                {/* Variable tags buttons for template editor */}
                <div className="variables-bar">
                  <span>Chèn biến cá nhân hoá:</span>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{contact_name}}', 'TMPL_BODY')}
                  >
                    + {'{{contact_name}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{company_name}}', 'TMPL_BODY')}
                  >
                    + {'{{company_name}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{assigned_rep}}', 'TMPL_BODY')}
                  >
                    + {'{{assigned_rep}}'}
                  </button>
                </div>

                <div className="form-group-custom">
                  <label>Tiêu đề mẫu (*):</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="Tiêu đề có thể chứa biến như {{company_name}}..."
                    value={tmplSubject}
                    onChange={(e) => setTmplSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Nội dung mẫu thư (*):</label>
                  <textarea
                    rows={9}
                    className="form-textarea-custom"
                    placeholder="Soạn nội dung với các biến {{contact_name}}, {{company_name}}, {{assigned_rep}}..."
                    value={tmplBody}
                    onChange={(e) => setTmplBody(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsTmplModalOpen(false)}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-save-template-submit"
                >
                  {editingTmplId ? 'Lưu thay đổi' : 'Tạo mẫu thư'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM CHI TIẾT THƯ TRONG HÀNG ĐỢI */}
      {viewingQueueItem && (
        <div className="modal-overlay" onClick={() => setViewingQueueItem(null)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Chi tiết email trong hàng đợi</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setViewingQueueItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="rendered-preview-box">
                <div className="preview-meta">
                  <div>
                    <strong>Người nhận:</strong> {viewingQueueItem.recipient_email} ({viewingQueueItem.contact_name} - {viewingQueueItem.customer_name})
                  </div>
                  <div>
                    <strong>Nhân viên gửi:</strong> {viewingQueueItem.assigned_rep}
                  </div>
                  <div>
                    <strong>Tiêu đề:</strong> {viewingQueueItem.subject}
                  </div>
                  <div>
                    <strong>Thời gian:</strong> {formatTime(viewingQueueItem.sent_at || viewingQueueItem.queued_at)}
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>{' '}
                    <span className={`status-pill ${viewingQueueItem.status}`}>
                      {viewingQueueItem.status}
                    </span>
                  </div>
                  {viewingQueueItem.error_message && (
                    <div style={{ color: '#ef4444', marginTop: 4 }}>
                      <strong>Thông tin lỗi máy chủ:</strong> {viewingQueueItem.error_message}
                    </div>
                  )}
                </div>
                <div className="preview-body-content">
                  {viewingQueueItem.body}
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              {viewingQueueItem.status === 'FAILED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                  onClick={() => {
                    handleRetryEmail(viewingQueueItem.id)
                    setViewingQueueItem(null)
                  }}
                >
                  🔄 Gửi lại ngay
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingQueueItem(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
