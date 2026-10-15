import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { Quote } from '../../types/quote.ts'
import { quoteService } from '../../services/quoteService.ts'
import { templateConfigService } from '../../services/templateConfigService.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import { numberToVietnameseWords } from '../../utils/numberToVietnameseWords.ts'
import './PublicQuoteViewPage.css'

export default function PublicQuoteViewPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || undefined

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Decision Modal State
  const [decisionType, setDecisionType] = useState<'ACCEPT' | 'DECLINE' | null>(null)
  const [contactName, setContactName] = useState<string>('')
  const [feedbackNotes, setFeedbackNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)

  const templateConfig = templateConfigService.getConfig()

  const loadQuote = () => {
    if (!quoteId) {
      setError('Đường dẫn không hợp lệ. Vui lòng kiểm tra lại liên kết báo giá.')
      setLoading(false)
      return
    }

    try {
      const found = quoteService.getQuoteByToken(quoteId, token)
      if (!found) {
        setError('Báo giá không tồn tại hoặc liên kết đã bị hủy.')
      } else {
        setQuote(found)
        if (found.customer_contact_name) {
          setContactName(found.customer_contact_name)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải thông tin báo giá.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuote()
  }, [quoteId, token])

  const handleOpenDecision = (type: 'ACCEPT' | 'DECLINE') => {
    setDecisionType(type)
    setFeedbackNotes('')
    setError(null)
  }

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote || !decisionType) return

    if (decisionType === 'DECLINE' && !feedbackNotes.trim()) {
      alert('Vui lòng nêu rõ lý do hoặc ý kiến để chúng tôi có phương án hỗ trợ tốt hơn.')
      return
    }

    if (!contactName.trim()) {
      alert('Vui lòng nhập tên người xác nhận đại diện.')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await quoteService.customerRespondQuote(
        quote.id,
        decisionType,
        feedbackNotes,
        contactName
      )
      setQuote(updated)
      setDecisionType(null)
      setSubmissionSuccess(
        decisionType === 'ACCEPT'
          ? '🎉 Cảm ơn Quý khách đã chấp thuận báo giá! Đội ngũ kinh doanh sẽ liên hệ ngay để hoàn tất hợp đồng.'
          : 'Chúng tôi đã ghi nhận phản hồi từ chối của Quý khách. Xin chân thành cảm ơn sự quan tâm của Quý khách!'
      )
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi phản hồi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="public-quote-page-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>⏳ Đang tải thông tin báo giá trực tuyến...</h3>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="public-quote-page-wrapper">
        <div className="public-quote-container">
          <div className="quote-status-banner declined" style={{ justifyContent: 'center' }}>
            <span>⚠️ {error || 'Không tìm thấy báo giá.'}</span>
          </div>
        </div>
      </div>
    )
  }

  const canDecide = quote.status === 'SENT' || quote.status === 'APPROVED'

  return (
    <div className="public-quote-page-wrapper">
      <div className="public-quote-container">
        {/* Top Branding Portal Header */}
        <div className="public-portal-header">
          <div className="portal-brand-left">
            {templateConfig.logo_url ? (
              <img
                src={templateConfig.logo_url}
                alt="Logo"
                style={{ maxHeight: '54px', objectFit: 'contain' }}
              />
            ) : (
              <div
                className="portal-logo-box"
                style={{ backgroundColor: templateConfig.primary_color }}
              >
                CRM
              </div>
            )}
            <div>
              <h2>{templateConfig.company_name}</h2>
              <p>
                Hotline: <strong>{templateConfig.phone}</strong> | Email:{' '}
                {templateConfig.email}
              </p>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => window.print()}
              title="In tài liệu"
            >
              🖨️ In tài liệu
            </button>
          </div>
        </div>

        {/* Success Alert if just responded */}
        {submissionSuccess && (
          <div className="quote-status-banner accepted" style={{ fontSize: '1rem' }}>
            <div>{submissionSuccess}</div>
          </div>
        )}

        {/* Status Callout Banner */}
        <div className={`quote-status-banner ${quote.status.toLowerCase()}`}>
          <div>
            <strong>Trạng thái báo giá: </strong>
            {quote.status === 'ACCEPTED' && '🟢 ĐÃ CHẤP THUẬN'}
            {quote.status === 'DECLINED' && '🔴 ĐÃ TỪ CHỐI'}
            {quote.status === 'EXPIRED' && '⚫ ĐÃ HẾT HẠN HIỆU LỰC'}
            {(quote.status === 'SENT' || quote.status === 'APPROVED') &&
              '🔵 ĐANG CHỜ PHẢN HỒI TỪ QUÝ KHÁCH'}
            {quote.status === 'DRAFT' && '🟡 BẢN NHÁP'}
            {quote.status === 'PENDING_APPROVAL' && '🟠 ĐANG CHỜ PHÊ DUYỆT NỘI BỘ'}
          </div>
          <div style={{ fontSize: '0.85rem' }}>
            Hiệu lực đến ngày: <strong>{quote.valid_until}</strong>
          </div>
        </div>

        {/* Main Document Details */}
        <div className="quote-document-card">
          <div className="doc-top-bar">
            <div>
              <h1>{templateConfig.quote_header_title}</h1>
              <div className="meta-badge">
                Số báo giá: <strong>{quote.quote_number}</strong> | Phiên bản:{' '}
                <strong>v{quote.version}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#64748b' }}>
              <div>
                Ngày ban hành: <strong>{quote.created_at.split('T')[0]}</strong>
              </div>
              <div>
                Chuyên viên phụ trách: <strong>{quote.created_by_name}</strong>
              </div>
            </div>
          </div>

          {/* Party info */}
          <div className="doc-party-info-grid">
            <div className="party-col">
              <h4>Bên cung cấp dịch vụ</h4>
              <p>
                <strong>{templateConfig.company_name}</strong>
              </p>
              <p>Mã số thuế: {templateConfig.tax_id}</p>
              <p>Địa chỉ: {templateConfig.address}</p>
              <p>Điện thoại: {templateConfig.phone}</p>
            </div>
            <div className="party-col">
              <h4>Kính gửi khách hàng</h4>
              <p>
                <strong>{quote.customer_name}</strong>
              </p>
              {quote.customer_contact_name && (
                <p>Người đại diện: {quote.customer_contact_name}</p>
              )}
              {quote.customer_contact_phone && (
                <p>Số điện thoại: {quote.customer_contact_phone}</p>
              )}
              {quote.customer_contact_email && (
                <p>Email: {quote.customer_contact_email}</p>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="portal-table-wrapper">
            <table className="portal-items-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                  <th>Tên sản phẩm / Dịch vụ</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>SL</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Chiết khấu</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <strong>{it.product_name}</strong>
                      {it.product_code && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>
                          ({it.product_code})
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{it.unit || 'Gói'}</td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrencyVND(it.unit_price)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {it.discount_value
                        ? it.discount_type === 'PERCENT'
                          ? `${it.discount_value}%`
                          : formatCurrencyVND(it.discount_value)
                        : '0%'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrencyVND(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="portal-totals-box">
            <div className="total-line">
              <span>Cộng tiền hàng:</span>
              <strong>{formatCurrencyVND(quote.subtotal)}</strong>
            </div>
            {quote.total_discount_amount > 0 && (
              <div className="total-line" style={{ color: '#dc2626' }}>
                <span>Tổng chiết khấu ({quote.discount_percentage}%):</span>
                <strong>- {formatCurrencyVND(quote.total_discount_amount)}</strong>
              </div>
            )}
            {quote.vat_amount > 0 && (
              <div className="total-line">
                <span>Thuế GTGT (VAT):</span>
                <strong>+ {formatCurrencyVND(quote.vat_amount)}</strong>
              </div>
            )}
            <div className="total-line grand">
              <span>TỔNG TIỀN THANH TOÁN:</span>
              <span className="val">{formatCurrencyVND(quote.grand_total)}</span>
            </div>
          </div>

          {/* In Words */}
          <div className="in-words-callout">
            <strong>Số tiền viết bằng chữ: </strong>
            <em>{numberToVietnameseWords(quote.grand_total)}</em>
          </div>

          {/* Terms and notes */}
          <div className="portal-terms-card">
            <h4>ĐIỀU KHOẢN KÈM THEO:</h4>
            {quote.payment_terms && (
              <p>
                • <strong>Điều khoản thanh toán:</strong> {quote.payment_terms}
              </p>
            )}
            {quote.delivery_terms && (
              <p>
                • <strong>Điều khoản giao hàng:</strong> {quote.delivery_terms}
              </p>
            )}
            {quote.notes && (
              <p>
                • <strong>Ghi chú bổ sung:</strong> {quote.notes}
              </p>
            )}
            <p>
              • <strong>Hiệu lực văn bản:</strong> Báo giá có hiệu lực đến hết ngày{' '}
              <strong>{quote.valid_until}</strong>.
            </p>
          </div>
        </div>

        {/* Existing Feedback Banner if already decided */}
        {quote.customer_decided_at && (
          <div
            className={`quote-status-banner ${quote.status === 'ACCEPTED' ? 'accepted' : 'declined'}`}
          >
            <div>
              <strong>
                {quote.status === 'ACCEPTED'
                  ? '✓ Quý khách đã chấp nhận báo giá này'
                  : '✕ Quý khách đã từ chối báo giá này'}
              </strong>
              {quote.customer_feedback && <p>Ý kiến phản hồi: "{quote.customer_feedback}"</p>}
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Người phản hồi: {quote.customer_contact_name || quote.customer_name} lúc{' '}
                {new Date(quote.customer_decided_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        )}

        {/* Customer Interactive Decision Card */}
        {canDecide && (
          <div className="customer-decision-card" id="customer-decision-card">
            <h3 style={{ margin: 0, color: '#0f172a' }}>Phản hồi về Báo giá này</h3>
            <p style={{ margin: 0, color: '#64748b', maxWidth: '600px' }}>
              Quý khách vui lòng bấm nút xác nhận chấp thuận hoặc gửi lý do từ chối để chuyên viên
              chúng tôi hỗ trợ tốt nhất.
            </p>
            <div className="decision-actions-row">
              <button
                type="button"
                className="btn-accept-quote"
                id="btn-customer-accept-quote"
                onClick={() => handleOpenDecision('ACCEPT')}
              >
                ✓ Đồng ý / Chấp nhận báo giá
              </button>
              <button
                type="button"
                className="btn-decline-quote"
                id="btn-customer-decline-quote"
                onClick={() => handleOpenDecision('DECLINE')}
              >
                ✕ Từ chối báo giá
              </button>
            </div>
          </div>
        )}

        {/* Decision Response Modal */}
        {decisionType && (
          <div className="response-modal-overlay" onClick={() => setDecisionType(null)}>
            <div
              className="response-modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h3>
                {decisionType === 'ACCEPT'
                  ? '✅ Xác nhận chấp nhận báo giá'
                  : '❌ Xác nhận từ chối báo giá'}
              </h3>

              <form onSubmit={handleSubmitDecision}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Tên người đại diện xác nhận (*):
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A - Trưởng phòng Mua hàng"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Ý kiến phản hồi / Ghi chú {decisionType === 'DECLINE' ? '(* Bắt buộc)' : '(Tùy chọn)'}:
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder={
                        decisionType === 'ACCEPT'
                          ? 'VD: Đồng ý phương án triển khai này, đề nghị chuẩn bị hợp đồng...'
                          : 'VD: Mức giá chưa phù hợp ngân sách, cần giảm thêm hoặc chia giai đoạn...'
                      }
                      required={decisionType === 'DECLINE'}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setDecisionType(null)}
                      disabled={isSubmitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className={`btn ${decisionType === 'ACCEPT' ? 'btn-success' : 'btn-danger'}`}
                      id="btn-submit-customer-response"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Đang gửi...' : 'Gửi quyết định'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
