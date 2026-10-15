import { useState, useEffect } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import type { Quote, QuoteStatus } from '../../types/quote.ts'
import { quoteService } from '../../services/quoteService.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import QuoteComposerModal from './QuoteComposerModal.tsx'
import QuoteComparisonModal from './QuoteComparisonModal.tsx'
import ConvertToContractModal from './ConvertToContractModal.tsx'
import PdfExportModal from '../PdfExportModal/PdfExportModal.tsx'
import { opportunityService } from '../../services/opportunityService.ts'
import './OpportunityQuoteManager.css'

interface OpportunityQuoteManagerProps {
  opportunity: Opportunity
  onOpportunityUpdated?: (updated: Opportunity) => void
  readOnly?: boolean
}

type ApprovalActionType = 'APPROVE' | 'RETURN' | 'REJECT'

export default function OpportunityQuoteManager({
  opportunity,
  onOpportunityUpdated,
  readOnly = false,
}: OpportunityQuoteManagerProps) {
  const { user } = useAuth()
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<Quote | null>(null)

  // S7-03: Quote Version Comparison State
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false)
  const [compareQuoteA, setCompareQuoteA] = useState<Quote | null>(null)
  const [compareQuoteB, setCompareQuoteB] = useState<Quote | null>(null)

  // S7-04: Convert Quote to Contract State
  const [convertToContractQuote, setConvertToContractQuote] = useState<Quote | null>(null)

  // S7-05: PDF Export State
  const [pdfExportQuote, setPdfExportQuote] = useState<Quote | null>(null)

  // S7-02: Approval Modal State
  const [approvalModalQuote, setApprovalModalQuote] = useState<Quote | null>(null)
  const [approvalActionType, setApprovalActionType] = useState<ApprovalActionType>('APPROVE')
  const [approvalComment, setApprovalComment] = useState<string>('')
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [isProcessingApproval, setIsProcessingApproval] = useState<boolean>(false)

  const loadQuotes = () => {
    const list = quoteService.getQuotes(opportunity.id)
    setQuotes(list)
    if (selectedQuoteDetail) {
      const refreshed = list.find((q) => q.id === selectedQuoteDetail.id)
      setSelectedQuoteDetail(refreshed || null)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [opportunity.id])

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="quote-status-badge draft">🟡 Bản nháp</span>
      case 'PENDING_APPROVAL':
        return <span className="quote-status-badge pending">🟠 Chờ duyệt chiết khấu</span>
      case 'APPROVED':
        return <span className="quote-status-badge approved">🟢 Đã phê duyệt</span>
      case 'REJECTED':
        return <span className="quote-status-badge rejected">🔴 Bị từ chối</span>
      case 'RETURNED':
        return <span className="quote-status-badge returned">🟣 Yêu cầu sửa lại</span>
      case 'SENT':
        return <span className="quote-status-badge sent">🔵 Đã gửi khách</span>
      case 'ACCEPTED':
        return <span className="quote-status-badge accepted">🟢 Khách đã chấp nhận</span>
      case 'DECLINED':
        return <span className="quote-status-badge declined">🔴 Khách từ chối</span>
      case 'EXPIRED':
        return <span className="quote-status-badge expired">⚫ Hết hiệu lực</span>
      default:
        return <span className="quote-status-badge">{status}</span>
    }
  }

  // S7-02: Trigger Approval Action Dialog
  const handleOpenApproval = (q: Quote, action: ApprovalActionType) => {
    setApprovalModalQuote(q)
    setApprovalActionType(action)
    setApprovalComment('')
    setApprovalError(null)
  }

  // S7-02: Submit Approval Action
  const handleSubmitApproval = async () => {
    if (!approvalModalQuote || !user) return

    // S7-02 AC: Hai hành động Từ chối và Trả lại bắt buộc nhập ý kiến
    if ((approvalActionType === 'RETURN' || approvalActionType === 'REJECT') && !approvalComment.trim()) {
      setApprovalError('Bắt buộc phải nhập ý kiến lý do khi Từ chối hoặc Trả lại sửa.')
      return
    }

    setIsProcessingApproval(true)
    setApprovalError(null)
    try {
      if (approvalActionType === 'APPROVE') {
        quoteService.approveQuote(approvalModalQuote.id, user, approvalComment)
      } else if (approvalActionType === 'RETURN') {
        quoteService.returnQuote(approvalModalQuote.id, user, approvalComment)
      } else if (approvalActionType === 'REJECT') {
        quoteService.rejectQuote(approvalModalQuote.id, user, approvalComment)
      }

      loadQuotes()
      setApprovalModalQuote(null)
    } catch (err: any) {
      setApprovalError(err.message || 'Lỗi khi xử lý phê duyệt báo giá.')
    } finally {
      setIsProcessingApproval(false)
    }
  }

  // S7-02 AC: Chỉ báo giá đã duyệt mới gửi được cho khách
  const handleSendToCustomer = (q: Quote) => {
    if (q.status !== 'APPROVED') {
      alert('Chỉ báo giá đã được phê duyệt mới được phép gửi cho khách hàng (S7-02 AC)!')
      return
    }

    if (window.confirm(`Xác nhận gửi báo giá ${q.quote_number} (Giá trị: ${formatCurrencyVND(q.grand_total)}) đến khách hàng?`)) {
      try {
        quoteService.sendQuoteToCustomer(q.id, user)
        loadQuotes()
        alert(`Đã gửi báo giá ${q.quote_number} thành công! Khách hàng có thể mở liên kết để xem và quyết định trực tuyến.`)
      } catch (err: any) {
        alert(err.message || 'Không thể gửi báo giá.')
      }
    }
  }

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa báo giá "${number}" không?`)) {
      quoteService.deleteQuote(id)
      loadQuotes()
    }
  }

  // S7-03 AC: Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới, bản cũ giữ nguyên
  const handleCreateNewVersion = (q: Quote) => {
    if (window.confirm(`Tạo phiên bản sửa đổi mới (v${q.version + 1}) cho báo giá "${q.quote_number}"? Bản cũ (v${q.version}) sẽ được giữ nguyên trạng.`)) {
      try {
        const newVer = quoteService.createNewVersion(q.id, user)
        loadQuotes()
        setEditingQuote(newVer)
        setIsComposerOpen(true)
      } catch (err: any) {
        alert(err.message || 'Không thể tạo phiên bản mới.')
      }
    }
  }

  // S7-03 AC: Chỉ một phiên bản ở trạng thái đang hiệu lực tại một thời điểm
  const handleSetActiveVersion = (quoteId: string) => {
    try {
      quoteService.setActiveVersion(quoteId)
      loadQuotes()
    } catch (err: any) {
      alert(err.message || 'Không thể chuyển đổi phiên bản hiệu lực.')
    }
  }

  return (
    <div className="opportunity-quote-manager-container" id="opportunity-quote-manager">
      {/* Header bar */}
      <div className="quote-manager-header">
        <div>
          <h4>Danh sách báo giá ({quotes.length})</h4>
          <span className="sub-hint">
            Soạn thảo, kiểm soát chiết khấu theo ngưỡng, đa phiên bản & phê duyệt (S7-01, S7-02, S7-03)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quotes.length >= 2 && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              id="btn-compare-quotes-s703"
              onClick={() => {
                setCompareQuoteA(quotes[1] || quotes[0])
                setCompareQuoteB(quotes[0])
                setIsComparisonOpen(true)
              }}
            >
              ⚖️ So sánh phiên bản (S7-03)
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-create-quote"
              id="btn-create-quote-s701"
              onClick={() => {
                setEditingQuote(null)
                setIsComposerOpen(true)
              }}
            >
              + Soạn báo giá mới (S7-01)
            </button>
          )}
        </div>
      </div>

      {/* Quotes List Table */}
      {quotes.length === 0 ? (
        <div className="quote-manager-empty-state">
          <span className="empty-icon">📑</span>
          <h5>Chưa có báo giá nào cho cơ hội này</h5>
          <p>
            Bạn có thể kế thừa các dòng sản phẩm đã chọn để tạo báo giá chuyên nghiệp và gửi khách hàng trong buổi chiều!
          </p>
          {!readOnly && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                setEditingQuote(null)
                setIsComposerOpen(true)
              }}
            >
              + Bắt đầu soạn báo giá ngay
            </button>
          )}
        </div>
      ) : (
        <div className="quote-table-wrapper">
          <table className="table quote-list-table">
            <thead>
              <tr>
                <th>Số báo giá</th>
                <th>Phiên bản</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Giá trị thanh toán</th>
                <th style={{ textAlign: 'center' }}>Chiết khấu</th>
                <th>Hiệu lực đến</th>
                <th>Người tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong className="quote-num-txt">{q.quote_number}</strong>
                    {q.requires_approval && q.status === 'PENDING_APPROVAL' && (
                      <span className="approval-req-tag" title={q.approval_reason}>
                        ⚠️ Cần duyệt ({q.approval_level === 'DIRECTOR' ? 'Giám đốc' : 'Trưởng nhóm'})
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="version-pill">v{q.version}</span>
                    {q.is_active_version && <span className="active-ver-tag">Hiệu lực</span>}
                  </td>
                  <td>{getStatusBadge(q.status)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                    {formatCurrencyVND(q.grand_total)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {q.discount_percentage > 0 ? (
                      <span className="badge-dc-pct">{q.discount_percentage}%</span>
                    ) : (
                      <span className="text-muted">0%</span>
                    )}
                  </td>
                  <td>{q.valid_until}</td>
                  <td>{q.created_by_name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btns-group">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedQuoteDetail(q)}
                        title="Xem chi tiết"
                      >
                        👁️ Xem
                      </button>

                      {/* S7-05: Export PDF Button */}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark btn-pdf-export"
                        id={`btn-export-pdf-${q.id}`}
                        onClick={() => setPdfExportQuote(q)}
                        title="Xuất báo giá ra PDF theo mẫu công ty (S7-05 AC)"
                      >
                        🖨️ PDF
                      </button>

                      {/* S7-02: Approval Action Buttons for Managers */}
                      {q.status === 'PENDING_APPROVAL' && isManagerOrAdmin && !readOnly && (
                        <div className="approval-quick-btns">
                          <button
                            type="button"
                            className="btn btn-sm btn-success btn-approve-quick"
                            onClick={() => handleOpenApproval(q, 'APPROVE')}
                            title="Phê duyệt báo giá"
                          >
                            ✓ Duyệt
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleOpenApproval(q, 'RETURN')}
                            title="Yêu cầu sửa lại"
                          >
                            ↩️ Trả lại
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleOpenApproval(q, 'REJECT')}
                            title="Từ chối duyệt"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* S7-02 AC: Chỉ báo giá đã duyệt mới gửi được cho khách */}
                      {q.status === 'APPROVED' && !readOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary btn-send-quote"
                          id={`btn-send-quote-${q.id}`}
                          onClick={() => handleSendToCustomer(q)}
                          title="Gửi báo giá kèm liên kết cho khách"
                        >
                          📤 Gửi khách
                        </button>
                      )}

                      {/* S7-04 AC: Chuyển đổi báo giá đã duyệt / chấp thuận thành hợp đồng */}
                      {(q.status === 'ACCEPTED' || q.status === 'APPROVED') && !readOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success btn-convert-contract"
                          id={`btn-convert-contract-${q.id}`}
                          onClick={() => setConvertToContractQuote(q)}
                          title="Chuyển đổi báo giá thành Hợp đồng (S7-04 AC)"
                        >
                          📜 Tạo Hợp đồng
                        </button>
                      )}

                      {q.status === 'PENDING_APPROVAL' && !isManagerOrAdmin && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary btn-locked"
                          disabled
                          title="Chỉ báo giá đã duyệt mới gửi được cho khách (S7-02 AC)"
                        >
                          🔒 Chờ duyệt
                        </button>
                      )}

                      {/* S7-03: Quick button to compare this version */}
                      {quotes.length >= 2 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setCompareQuoteA(q)
                            const other = quotes.find((o) => o.id !== q.id)
                            setCompareQuoteB(other || q)
                            setIsComparisonOpen(true)
                          }}
                          title="So sánh phiên bản này với bản khác"
                        >
                          ⚖️ So sánh
                        </button>
                      )}

                      {/* S7-03 AC: Mỗi lần sửa sau khi đã gửi tạo phiên bản mới */}
                      {(q.status === 'SENT' || q.status === 'APPROVED' || q.status === 'ACCEPTED' || q.status === 'DECLINED') && !readOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleCreateNewVersion(q)}
                          title="Tạo phiên bản sửa đổi mới v[N+1] (S7-03 AC)"
                        >
                          ➕ Bản mới (v{q.version + 1})
                        </button>
                      )}

                      {/* S7-03 AC: Chỉ một phiên bản đang hiệu lực tại một thời điểm */}
                      {!q.is_active_version && !readOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link"
                          style={{ fontSize: '11px', padding: '2px 4px' }}
                          onClick={() => handleSetActiveVersion(q.id)}
                          title="Đặt làm phiên bản hiệu lực (S7-03 AC)"
                        >
                          Kích hoạt
                        </button>
                      )}

                      {/* S7-01 AC: Lưu nháp và sửa tiếp được */}
                      {(q.status === 'DRAFT' || q.status === 'RETURNED') && !readOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setEditingQuote(q)
                            setIsComposerOpen(true)
                          }}
                          title="Sửa bản nháp"
                        >
                          ✏️ Sửa nháp
                        </button>
                      )}

                      {q.status === 'DRAFT' && !readOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(q.id, q.quote_number)}
                          title="Xóa bản nháp"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL CHI TIẾT BÁO GIÁ & LỊCH SỬ DUYỆT BẤT BIẾN (S7-02) ── */}
      {selectedQuoteDetail && (
        <div className="quote-preview-modal-overlay" onClick={() => setSelectedQuoteDetail(null)}>
          <div
            className="quote-preview-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="preview-modal-header">
              <div className="title-left">
                <h3>Chi tiết báo giá: {selectedQuoteDetail.quote_number} (v{selectedQuoteDetail.version})</h3>
                {getStatusBadge(selectedQuoteDetail.status)}
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedQuoteDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="preview-modal-body">
              {/* Approval alert if pending */}
              {selectedQuoteDetail.status === 'PENDING_APPROVAL' && (
                <div className="preview-pending-approval-card">
                  <div className="alert-content">
                    <span className="siren">⚠️</span>
                    <div>
                      <strong>BÁO GIÁ ĐANG CHỜ PHÊ DUYỆT ({selectedQuoteDetail.approval_level === 'DIRECTOR' ? 'CẤP GIÁM ĐỐC KINH DOANH' : 'CẤP TRƯỞNG NHÓM'})</strong>
                      <p>{selectedQuoteDetail.approval_reason}</p>
                    </div>
                  </div>
                  {isManagerOrAdmin && (
                    <div className="approval-actions-toolbar">
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => handleOpenApproval(selectedQuoteDetail, 'APPROVE')}
                      >
                        ✓ Duyệt báo giá
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-warning"
                        onClick={() => handleOpenApproval(selectedQuoteDetail, 'RETURN')}
                      >
                        ↩️ Trả lại sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleOpenApproval(selectedQuoteDetail, 'REJECT')}
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="preview-info-grid">
                <div>
                  <span className="lbl">Khách hàng:</span>
                  <strong>{selectedQuoteDetail.customer_name}</strong>
                </div>
                <div>
                  <span className="lbl">Hiệu lực đến:</span>
                  <strong>{selectedQuoteDetail.valid_until}</strong>
                </div>
                <div>
                  <span className="lbl">Người lập:</span>
                  <strong>{selectedQuoteDetail.created_by_name}</strong>
                </div>
                <div>
                  <span className="lbl">Mức chiết khấu tổng:</span>
                  <strong style={{ color: '#dc2626' }}>
                    {selectedQuoteDetail.discount_percentage}% ({formatCurrencyVND(selectedQuoteDetail.total_discount_amount)})
                  </strong>
                </div>
              </div>

              <div className="preview-terms-box">
                <div><strong>Điều khoản thanh toán:</strong> {selectedQuoteDetail.payment_terms}</div>
                <div><strong>Điều khoản giao hàng:</strong> {selectedQuoteDetail.delivery_terms}</div>
                {selectedQuoteDetail.notes && (
                  <div><strong>Ghi chú:</strong> {selectedQuoteDetail.notes}</div>
                )}
              </div>

              {/* Items */}
              <h5>Dòng sản phẩm ({selectedQuoteDetail.items.length}):</h5>
              <table className="table preview-items-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: 'center' }}>ĐVT</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'center' }}>Chiết khấu</th>
                    <th style={{ textAlign: 'center' }}>VAT</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuoteDetail.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <strong>{it.product_name}</strong>
                        {it.product_code && <span className="sub-code"> ({it.product_code})</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>{it.unit}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrencyVND(it.unit_price)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {it.discount_value > 0 ? (
                          <span>
                            {it.discount_type === 'PERCENT' ? `${it.discount_value}%` : formatCurrencyVND(it.discount_value)}
                          </span>
                        ) : (
                          '0%'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{it.vat_rate}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrencyVND(it.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="preview-grand-total-row">
                <span>Tổng cộng thanh toán:</span>
                <span className="grand-val">{formatCurrencyVND(selectedQuoteDetail.grand_total)}</span>
              </div>

              {/* ── S7-02 AC: LỊCH SỬ DUYỆT KHÔNG SỬA VÀ KHÔNG XÓA ĐƯỢC ── */}
              <div className="preview-approval-history-section">
                <div className="history-head">
                  <h5>📜 Lịch sử phê duyệt & Kiểm soát chiết khấu (Bất biến)</h5>
                  <span className="audit-lock-badge">🔒 Bất biến (Không sửa / không xóa)</span>
                </div>

                {selectedQuoteDetail.approval_history.length === 0 ? (
                  <div className="history-empty text-muted">Chưa có bản ghi phê duyệt nào.</div>
                ) : (
                  <div className="approval-history-timeline">
                    {selectedQuoteDetail.approval_history.map((hist, idx) => (
                      <div key={hist.id || idx} className="history-log-row">
                        <div className="log-action-col">
                          <span className={`hist-action-tag ${hist.action.toLowerCase()}`}>
                            {hist.action === 'APPROVED' && '✅ ĐÃ DUYỆT'}
                            {hist.action === 'AUTO_APPROVED' && '⚡ TỰ ĐỘNG THÔNG QUA'}
                            {hist.action === 'REJECTED' && '❌ TỪ CHỐI'}
                            {hist.action === 'RETURNED' && '↩️ YÊU CẦU SỬA'}
                            {hist.action === 'SUBMITTED' && '📤 GỬI DUYỆT'}
                          </span>
                        </div>
                        <div className="log-details-col">
                          <div className="log-user-time">
                            <strong>{hist.performed_by_name}</strong> ({hist.performed_by_role})
                            <span className="log-time"> lúc {new Date(hist.timestamp).toLocaleString('vi-VN')}</span>
                          </div>
                          {hist.comments && <p className="log-comment-text">"{hist.comments}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="preview-modal-footer">
              <button
                type="button"
                className="btn btn-outline-dark"
                id="btn-modal-export-pdf"
                onClick={() => setPdfExportQuote(selectedQuoteDetail)}
              >
                🖨️ Xuất PDF theo mẫu (S7-05)
              </button>
              {(selectedQuoteDetail.status === 'ACCEPTED' || selectedQuoteDetail.status === 'APPROVED') && !readOnly && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    const target = selectedQuoteDetail
                    setSelectedQuoteDetail(null)
                    setConvertToContractQuote(target)
                  }}
                >
                  📜 Chuyển thành Hợp đồng (S7-04)
                </button>
              )}
              {selectedQuoteDetail.status === 'APPROVED' && !readOnly && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSendToCustomer(selectedQuoteDetail)}
                >
                  📤 Gửi báo giá cho khách hàng
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedQuoteDetail(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NHẬP Ý KIẾN DUYỆT / TỪ CHỐI / TRẢ LẠI (S7-02) ── */}
      {approvalModalQuote && (
        <div className="approval-dialog-overlay" onClick={() => setApprovalModalQuote(null)}>
          <div
            className="approval-dialog-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="dialog-header">
              <h3>
                {approvalActionType === 'APPROVE' && '✅ Phê duyệt báo giá'}
                {approvalActionType === 'RETURN' && '↩️ Yêu cầu sửa lại báo giá'}
                {approvalActionType === 'REJECT' && '❌ Từ chối duyệt báo giá'}
              </h3>
              <button type="button" className="close-btn" onClick={() => setApprovalModalQuote(null)}>
                ✕
              </button>
            </div>

            <div className="dialog-body">
              <div className="dialog-quote-summary">
                <div>Số báo giá: <strong>{approvalModalQuote.quote_number}</strong></div>
                <div>Khách hàng: <strong>{approvalModalQuote.customer_name}</strong></div>
                <div>Tổng tiền: <strong>{formatCurrencyVND(approvalModalQuote.grand_total)}</strong></div>
                <div>
                  Mức chiết khấu: <strong style={{ color: '#dc2626' }}>{approvalModalQuote.discount_percentage}%</strong>
                </div>
                {approvalModalQuote.approval_reason && (
                  <div className="reason-hint">Cảnh báo: {approvalModalQuote.approval_reason}</div>
                )}
              </div>

              {approvalError && <div className="alert alert-danger">{approvalError}</div>}

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="approval-comments">
                  Ý kiến của người duyệt {approvalActionType !== 'APPROVE' ? '(* Bắt buộc)' : '(Không bắt buộc)'}:
                </label>
                <textarea
                  id="approval-comments"
                  className="form-control"
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder={
                    approvalActionType === 'APPROVE'
                      ? 'Nhập ý kiến duyệt (VD: Đồng ý hỗ trợ giá cho khách hàng tiềm năng)...'
                      : 'Nêu rõ lý do từ chối hoặc các điểm cần sửa lại...'
                  }
                  autoFocus
                />
              </div>
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApprovalModalQuote(null)}
                disabled={isProcessingApproval}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`btn ${
                  approvalActionType === 'APPROVE'
                    ? 'btn-success'
                    : approvalActionType === 'RETURN'
                    ? 'btn-warning'
                    : 'btn-danger'
                }`}
                onClick={handleSubmitApproval}
                disabled={isProcessingApproval}
              >
                {isProcessingApproval ? 'Đang lưu...' : 'Xác nhận thao tác'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Composer Modal (S7-01) */}
      {isComposerOpen && (
        <QuoteComposerModal
          isOpen={isComposerOpen}
          opportunity={opportunity}
          existingQuote={editingQuote}
          onClose={() => setIsComposerOpen(false)}
          onSaved={() => {
            loadQuotes()
          }}
        />
      )}

      {/* Quote Comparison Modal (S7-03) */}
      {isComparisonOpen && (
        <QuoteComparisonModal
          isOpen={isComparisonOpen}
          allVersions={quotes}
          initialQuoteA={compareQuoteA}
          initialQuoteB={compareQuoteB}
          onClose={() => setIsComparisonOpen(false)}
          onSetActiveVersion={(qId) => {
            handleSetActiveVersion(qId)
          }}
        />
      )}

      {/* S7-04: Convert to Contract Modal */}
      {convertToContractQuote && (
        <ConvertToContractModal
          isOpen={true}
          quote={convertToContractQuote}
          onClose={() => setConvertToContractQuote(null)}
          onSuccess={async (contractNumber) => {
            alert(`🎉 Chúc mừng! Đã chuyển đổi thành công Hợp đồng số ${contractNumber}.\nCơ hội đã tự động chuyển sang Đóng Thắng (Closed Won)!`)
            loadQuotes()
            const refreshedOpp = await opportunityService.getOpportunityById(opportunity.id)
            if (refreshedOpp && onOpportunityUpdated) {
              onOpportunityUpdated(refreshedOpp)
            }
          }}
        />
      )}

      {/* S7-05: PDF Export Modal */}
      {pdfExportQuote && (
        <PdfExportModal
          isOpen={true}
          mode="QUOTE"
          quote={pdfExportQuote}
          onClose={() => setPdfExportQuote(null)}
        />
      )}
    </div>
  )
}
