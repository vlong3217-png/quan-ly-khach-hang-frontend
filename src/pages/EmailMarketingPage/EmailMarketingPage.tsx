import { useState, useEffect, useMemo } from 'react'
import Pagination from '../../components/ui/Pagination.tsx'
import Button from '../../components/ui/Button.tsx'
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
  const [queuePage, setQueuePage] = useState(1)
  const [queuePageSize, setQueuePageSize] = useState(10)
  const [tmplPage, setTmplPage] = useState(1)
  const [tmplPageSize, setTmplPageSize] = useState(6)
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
  const [assignedRep, setAssignedRep] = useState(user?.full_name || 'Nguyá»…n VÄƒn A')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // Template Modal State
  const [editingTmplId, setEditingTmplId] = useState<string | null>(null)
  const [tmplName, setTmplName] = useState('')
  const [tmplCategory, setTmplCategory] = useState<EmailTemplateCategory>('GENERAL')
  const [tmplSubject, setTmplSubject] = useState('')
  const [tmplBody, setTmplBody] = useState('')

  useEffect(() => {
    setQueuePage(1)
  }, [searchTerm])

  useEffect(() => {
    setQueuePage(1)
    setTmplPage(1)
  }, [activeTab])

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
      const primaryContact = contacts.length > 0 ? contacts[0].full_name : 'QuÃ½ khÃ¡ch'
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
      alert('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ email ngÆ°á»i nháº­n, tiÃªu Ä‘á» vÃ  ná»™i dung thÆ°.')
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
      customer_name: customerName || 'KhÃ¡ch hÃ ng liÃªn há»‡ trá»±c tiáº¿p',
      contact_name: contactName || 'QuÃ½ khÃ¡ch',
      recipient_email: recipientEmail.trim(),
      subject: renderedSubject,
      body: renderedBody,
      assigned_rep: assignedRep,
    })

    loadData()
    setIsSendModalOpen(false)
    setActiveTab('QUEUE')
    showToast(`ÄÃ£ Ä‘Æ°a email vÃ o hÃ ng Ä‘á»£i gá»­i báº¥t Ä‘á»“ng bá»™ cho ${recipientEmail}!`)
  }

  // Retry Failed Email
  const handleRetryEmail = async (queueId: string) => {
    try {
      await emailMarketingService.retryFailedEmail(queueId)
      loadData()
      showToast('Äang gá»­i láº¡i thÆ° qua hÃ ng Ä‘á»£i báº¥t Ä‘á»“ng bá»™...')
    } catch (e: unknown) {
      alert((e as Error).message)
    }
  }

  // Template Save Handler
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tmplName.trim() || !tmplSubject.trim() || !tmplBody.trim()) {
      alert('Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ tÃªn máº«u, tiÃªu Ä‘á» vÃ  ná»™i dung máº«u thÆ°.')
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
    showToast(editingTmplId ? 'Cáº­p nháº­t máº«u email thÃ nh cÃ´ng' : 'ÄÃ£ táº¡o má»›i máº«u email thÃ nh cÃ´ng')
  }

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Báº¡n cÃ³ cháº¯c muá»‘n xoÃ¡ máº«u email nÃ y?')) {
      emailMarketingService.deleteTemplate(id)
      loadData()
      showToast('ÄÃ£ xoÃ¡ máº«u email')
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
    if (!iso) return 'â€”'
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
  const queueTotalPages = Math.max(1, Math.ceil(filteredQueue.length / queuePageSize))
  const pagedQueue = useMemo(() => {
    const start = (queuePage - 1) * queuePageSize
    return filteredQueue.slice(start, start + queuePageSize)
  }, [filteredQueue, queuePage, queuePageSize])

  const tmplTotalPages = Math.max(1, Math.ceil(templates.length / tmplPageSize))
  const pagedTemplates = useMemo(() => {
    const start = (tmplPage - 1) * tmplPageSize
    return templates.slice(start, start + tmplPageSize)
  }, [templates, tmplPage, tmplPageSize])


  // Live rendered preview in send modal
  const liveRenderedSubject = emailMarketingService.renderMergeTags(emailSubject, {
    contact_name: contactName || 'Nguyá»…n VÄƒn Minh',
    company_name: customerName || 'Táº­p Ä‘oÃ n CÃ´ng nghá»‡ FPT',
    assigned_rep: assignedRep,
  })
  const liveRenderedBody = emailMarketingService.renderMergeTags(emailBody, {
    contact_name: contactName || 'Nguyá»…n VÄƒn Minh',
    company_name: customerName || 'Táº­p Ä‘oÃ n CÃ´ng nghá»‡ FPT',
    assigned_rep: assignedRep,
  })

  return (
    <div className="email-marketing-page" id="email-marketing-page">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="action-notice-toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <span>âœ“ {toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="email-page-header">
        <div>
          <h1>
            <span>Tiáº¿p thá»‹ Email & Máº«u thÆ°</span>
          </h1>
          
        </div>
                <div className="email-header-actions">
          <Button
            type="button"
            variant="primary"
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
          >
            Soáº¡n email gá»­i khÃ¡ch
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="btn btn-secondary"
            id="btn-create-template"
            onClick={handleOpenCreateTmpl}
          >
            + Táº¡o máº«u thÆ° má»›i
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="email-tabs">
        <button
          type="button"
          className={`email-tab-btn ${activeTab === 'QUEUE' ? 'active' : ''}`}
          onClick={() => setActiveTab('QUEUE')}
        >
          <span>HÃ ng Ä‘á»£i & Lá»‹ch sá»­ gá»­i</span>
          <span className="tab-badge">{queue.length}</span>
        </button>
        <button
          type="button"
          className={`email-tab-btn ${activeTab === 'TEMPLATES' ? 'active' : ''}`}
          onClick={() => setActiveTab('TEMPLATES')}
        >
          <span>ThÆ° viá»‡n máº«u email (Templates)</span>
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
              placeholder="TÃ¬m theo email, khÃ¡ch hÃ ng, tiÃªu Ä‘á»..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <span>
                ThÃ nh cÃ´ng: <strong>{queue.filter((q) => q.status === 'SENT').length}</strong>
              </span>
              <span>â€¢</span>
              <span>
                Tháº¥t báº¡i:{' '}
                <strong style={{ color: '#ef4444' }}>
                  {queue.filter((q) => q.status === 'FAILED').length}
                </strong>
              </span>
              <span>â€¢</span>
              <span>
                Äang xá»­ lÃ½:{' '}
                <strong style={{ color: '#2563eb' }}>
                  {queue.filter((q) => q.status === 'QUEUED' || q.status === 'SENDING').length}
                </strong>
              </span>
            </div>
          </div>

          <table className="queue-table" id="email-queue-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Thá»i gian</th>
                <th style={{ width: 230 }}>NgÆ°á»i nháº­n & KhÃ¡ch hÃ ng</th>
                <th>TiÃªu Ä‘á» & Máº«u thÆ°</th>
                <th style={{ width: 140, textAlign: 'center' }}>Tráº¡ng thÃ¡i</th>
                <th style={{ width: 180, textAlign: 'right' }}>HÃ nh Ä‘á»™ng</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    KhÃ´ng cÃ³ email nÃ o trong hÃ ng Ä‘á»£i hoáº·c lá»‹ch sá»­.
                  </td>
                </tr>
              ) : (
                pagedQueue.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {formatTime(item.sent_at || item.queued_at)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.recipient_email}</div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                        {item.contact_name} â€¢ {item.customer_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2563eb' }}>{item.subject}</div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b', display: 'flex', gap: 6 }}>
                        <span>NV: {item.assigned_rep}</span>
                        {item.template_name && <span>â€¢ Máº«u: {item.template_name}</span>}
                        {item.retry_count > 0 && (
                          <span style={{ color: '#b45309', fontWeight: 600 }}>
                            (ÄÃ£ gá»­i láº¡i: {item.retry_count} láº§n)
                          </span>
                        )}
                      </div>
                      {item.error_message && (
                        <div style={{ fontSize: '0.775rem', color: '#ef4444', marginTop: 2 }}>
                          Lá»—i: {item.error_message}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${item.status}`}>
                        {item.status === 'QUEUED' && 'Chá» gá»­i'}
                        {item.status === 'SENDING' && 'Äang gá»­i...'}
                        {item.status === 'SENT' && 'ÄÃ£ gá»­i'}
                        {item.status === 'FAILED' && 'Tháº¥t báº¡i'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {item.status === 'FAILED' && (
                          <Button
                            type="button"
                            variant="danger"
                            className="btn btn-danger"
                            onClick={() => handleRetryEmail(item.id)}
                            title="Thá»­ gá»­i láº¡i thÆ° nÃ y qua hÃ ng Ä‘á»£i báº¥t Ä‘á»“ng bá»™ (S8-01 AC)"
                          >
                            Gá»­i láº¡i (Retry)
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          className="btn btn-secondary"
                          onClick={() => setViewingQueueItem(item)}
                        >
                          Xem ná»™i dung
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredQueue.length > 0 && (
            <Pagination
              currentPage={queuePage}
              totalPages={queueTotalPages}
              totalItems={filteredQueue.length}
              pageSize={queuePageSize}
              onPageChange={setQueuePage}
              onPageSizeChange={(newSize) => {
                setQueuePageSize(newSize)
                setQueuePage(1)
              }}
              pageSizeOptions={[5, 10, 20]}
              itemName="email"
            />
          )}
        </div>
      )}

      {/* TAB 2: EMAIL TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div>
          <div className="templates-grid" id="templates-grid">
          {pagedTemplates.map((tmpl) => (
            <div key={tmpl.id} className="template-card" id={`template-card-${tmpl.id}`}>
              <div className="template-card-header">
                <h3 className="template-title">{tmpl.name}</h3>
                <span className={`category-tag ${tmpl.category}`}>{tmpl.category}</span>
              </div>

              <div className="template-subject-preview">
                <strong>TiÃªu Ä‘á»:</strong> {tmpl.subject}
              </div>

              <div className="template-body-snippet">
                {tmpl.body}
              </div>

              <div className="template-card-footer">
                <span>ÄÃ£ dÃ¹ng: <strong>{tmpl.usage_count} láº§n</strong></span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    type="button"
                    variant="primary"
                    className="btn btn-primary"
                    onClick={() => handleUseTemplateToSend(tmpl)}
                  >
                    DÃ¹ng máº«u
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="btn btn-secondary"
                    onClick={() => handleOpenEditTmpl(tmpl)}
                  >
                    Sá»­a
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="btn btn-danger"
                    onClick={() => handleDeleteTemplate(tmpl.id)}
                  >
                    XÃ³a
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Pagination
              currentPage={tmplPage}
              totalPages={tmplTotalPages}
              totalItems={templates.length}
              pageSize={tmplPageSize}
              onPageChange={setTmplPage}
              onPageSizeChange={(newSize) => {
                setTmplPageSize(newSize)
                setTmplPage(1)
              }}
              pageSizeOptions={[3, 6, 12]}
              itemName="mẫu email"
            />
          </div>
        )}
        </div>
      )}

      {/* MODAL 1: SOáº N VÃ€ Gá»¬I EMAIL */}
      {isSendModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSendModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Soáº¡n email gá»­i khÃ¡ch hÃ ng & Tá»± Ä‘á»™ng ghi DÃ²ng thá»i gian</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsSendModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                âœ•
              </button>
            </div>

            <form onSubmit={handleQueueSendEmail}>
              <div className="modal-body-custom">
                {/* Customer Picker */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
                  <div className="form-group-custom">
                    <label>Chá»n khÃ¡ch hÃ ng tá»« há»‡ thá»‘ng:</label>
                    <select
                      className="form-select-custom"
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                    >
                      <option value="">-- Chá»n khÃ¡ch hÃ ng sáºµn cÃ³ --</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email || 'ChÆ°a cÃ³ email'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Ãp dá»¥ng máº«u thÆ° sáºµn cÃ³:</label>
                    <select
                      className="form-select-custom"
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                    >
                      <option value="">-- Tá»± soáº¡n hoáº·c chá»n máº«u --</option>
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
                    <label>Email ngÆ°á»i nháº­n (*):</label>
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
                    <label>TÃªn khÃ¡ch hÃ ng / CÃ´ng ty:</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Táº­p Ä‘oÃ n ABC..."
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>TÃªn ngÆ°á»i liÃªn há»‡:</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Anh/Chá»‹..."
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>ChuyÃªn viÃªn gá»­i:</label>
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
                  <span>ChÃ¨n nhanh biáº¿n máº«u (Merge tags):</span>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{contact_name}}', 'BODY')}
                    title="ChÃ¨n biáº¿n TÃªn ngÆ°á»i liÃªn há»‡"
                  >
                    + {'{{contact_name}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{company_name}}', 'BODY')}
                    title="ChÃ¨n biáº¿n TÃªn cÃ´ng ty"
                  >
                    + {'{{company_name}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{assigned_rep}}', 'BODY')}
                    title="ChÃ¨n biáº¿n TÃªn nhÃ¢n viÃªn phá»¥ trÃ¡ch"
                  >
                    + {'{{assigned_rep}}'}
                  </button>
                  <button
                    type="button"
                    className="btn-tag-insert"
                    onClick={() => handleInsertTag('{{current_date}}', 'BODY')}
                    title="ChÃ¨n NgÃ y hiá»‡n táº¡i"
                  >
                    + {'{{current_date}}'}
                  </button>
                </div>

                {/* Subject & Body */}
                <div className="form-group-custom">
                  <label>TiÃªu Ä‘á» Email (*):</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Nháº­p tiÃªu Ä‘á» email..."
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Ná»™i dung Email (*):</label>
                  <textarea
                    rows={8}
                    className="form-textarea-custom"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Soáº¡n ná»™i dung thÆ° táº¡i Ä‘Ã¢y..."
                    required
                  />
                </div>

                {/* Live rendered preview */}
                <div className="rendered-preview-box">
                  <div className="preview-meta">
                    <div>
                      <strong>Äáº¿n:</strong> {recipientEmail || 'chÆ°a nháº­p'} ({contactName || 'NgÆ°á»i nháº­n'} -{' '}
                      {customerName || 'Doanh nghiá»‡p'})
                    </div>
                    <div>
                      <strong>TiÃªu Ä‘á» thá»±c táº¿:</strong> {liveRenderedSubject || 'â€”'}
                    </div>
                  </div>
                  <div className="preview-body-content">
                    {liveRenderedBody || '(ChÆ°a cÃ³ ná»™i dung xem trÆ°á»›c)'}
                  </div>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSendModalOpen(false)}
                >
                  Huá»· bá»
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-confirm-queue-email"
                >
                  ðŸš€ Gá»­i email (VÃ o hÃ ng Ä‘á»£i)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Táº O / Sá»¬A MáºªU THÆ¯ */}
      {isTmplModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTmplModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>{editingTmplId ? 'Chá»‰nh sá»­a máº«u email' : 'Táº¡o má»›i máº«u email marketing'}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsTmplModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                âœ•
              </button>
            </div>

            <form onSubmit={handleSaveTemplate}>
              <div className="modal-body-custom">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                  <div className="form-group-custom">
                    <label>TÃªn máº«u thÆ° (*):</label>
                    <input
                      type="text"
                      className="form-input-custom"
                      placeholder="VÃ­ dá»¥: Giá»›i thiá»‡u giáº£i phÃ¡p CRM & Khuyáº¿n mÃ£i Q4"
                      value={tmplName}
                      onChange={(e) => setTmplName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>ChuyÃªn má»¥c:</label>
                    <select
                      className="form-select-custom"
                      value={tmplCategory}
                      onChange={(e) => setTmplCategory(e.target.value as EmailTemplateCategory)}
                    >
                      <option value="INTRODUCTION">Giá»›i thiá»‡u (INTRODUCTION)</option>
                      <option value="FOLLOWUP">ChÄƒm sÃ³c sau bÃ¡o giÃ¡ (FOLLOWUP)</option>
                      <option value="CONTRACT">Há»£p Ä‘á»“ng & Triá»ƒn khai (CONTRACT)</option>
                      <option value="PROMOTION">Khuyáº¿n mÃ£i / Marketing (PROMOTION)</option>
                      <option value="GENERAL">Chung (GENERAL)</option>
                    </select>
                  </div>
                </div>

                {/* Variable tags buttons for template editor */}
                <div className="variables-bar">
                  <span>ChÃ¨n biáº¿n cÃ¡ nhÃ¢n hoÃ¡:</span>
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
                  <label>TiÃªu Ä‘á» máº«u (*):</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="TiÃªu Ä‘á» cÃ³ thá»ƒ chá»©a biáº¿n nhÆ° {{company_name}}..."
                    value={tmplSubject}
                    onChange={(e) => setTmplSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Ná»™i dung máº«u thÆ° (*):</label>
                  <textarea
                    rows={9}
                    className="form-textarea-custom"
                    placeholder="Soáº¡n ná»™i dung vá»›i cÃ¡c biáº¿n {{contact_name}}, {{company_name}}, {{assigned_rep}}..."
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
                  Huá»· bá»
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-save-template-submit"
                >
                  {editingTmplId ? 'LÆ°u thay Ä‘á»•i' : 'Táº¡o máº«u thÆ°'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM CHI TIáº¾T THÆ¯ TRONG HÃ€NG Äá»¢I */}
      {viewingQueueItem && (
        <div className="modal-overlay" onClick={() => setViewingQueueItem(null)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Chi tiáº¿t email trong hÃ ng Ä‘á»£i</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setViewingQueueItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                âœ•
              </button>
            </div>
            <div className="modal-body-custom">
              <div className="rendered-preview-box">
                <div className="preview-meta">
                  <div>
                    <strong>NgÆ°á»i nháº­n:</strong> {viewingQueueItem.recipient_email} ({viewingQueueItem.contact_name} - {viewingQueueItem.customer_name})
                  </div>
                  <div>
                    <strong>NhÃ¢n viÃªn gá»­i:</strong> {viewingQueueItem.assigned_rep}
                  </div>
                  <div>
                    <strong>TiÃªu Ä‘á»:</strong> {viewingQueueItem.subject}
                  </div>
                  <div>
                    <strong>Thá»i gian:</strong> {formatTime(viewingQueueItem.sent_at || viewingQueueItem.queued_at)}
                  </div>
                  <div>
                    <strong>Tráº¡ng thÃ¡i:</strong>{' '}
                    <span className={`status-pill ${viewingQueueItem.status}`}>
                      {viewingQueueItem.status}
                    </span>
                  </div>
                  {viewingQueueItem.error_message && (
                    <div style={{ color: '#ef4444', marginTop: 4 }}>
                      <strong>ThÃ´ng tin lá»—i mÃ¡y chá»§:</strong> {viewingQueueItem.error_message}
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
                  ðŸ”„ Gá»­i láº¡i ngay
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingQueueItem(null)}
              >
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
