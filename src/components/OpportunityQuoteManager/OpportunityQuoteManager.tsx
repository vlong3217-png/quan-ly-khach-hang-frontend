import { useState, useEffect } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import type { Quote, QuoteStatus } from '../../types/quote.ts'
import { quoteService } from '../../services/quoteService.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import QuoteComposerModal from './QuoteComposerModal.tsx'
import './OpportunityQuoteManager.css'

interface OpportunityQuoteManagerProps {
  opportunity: Opportunity
  onOpportunityUpdated?: (updated: Opportunity) => void
  readOnly?: boolean
}

export default function OpportunityQuoteManager({
  opportunity,
  readOnly = false,
}: OpportunityQuoteManagerProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<Quote | null>(null)

  const loadQuotes = () => {
    const list = quoteService.getQuotes(opportunity.id)
    setQuotes(list)
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

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa báo giá "${number}" không?`)) {
      quoteService.deleteQuote(id)
      loadQuotes()
    }
  }

  return (
    <div className="opportunity-quote-manager-container" id="opportunity-quote-manager">
      {/* Header bar */}
      <div className="quote-manager-header">
        <div>
          <h4>Danh sách báo giá ({quotes.length})</h4>
          <span className="sub-hint">
            Soạn thảo, quản lý chiết khấu và phê duyệt báo giá liên kết trực tiếp với cơ hội này
          </span>
        </div>
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
                    {q.requires_approval && (
                      <span className="approval-req-tag" title={q.approval_reason}>
                        ⚠️ Cần duyệt ({q.approval_level})
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

      {/* Quote Detail Drawer / Modal Preview */}
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
            </div>

            <div className="preview-modal-footer">
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
    </div>
  )
}
