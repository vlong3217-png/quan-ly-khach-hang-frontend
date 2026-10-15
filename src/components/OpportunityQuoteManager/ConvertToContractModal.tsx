import { useState, useMemo } from 'react'
import type { Quote } from '../../types/quote.ts'
import type { CreateContractPayload } from '../../types/contract.ts'
import { contractService } from '../../services/contractService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import './ConvertToContractModal.css'

interface ConvertToContractModalProps {
  isOpen: boolean
  quote: Quote
  onClose: () => void
  onSuccess: (contractNumber: string) => void
}

export default function ConvertToContractModal({
  isOpen,
  quote,
  onClose,
  onSuccess,
}: ConvertToContractModalProps) {
  const { user } = useAuth()

  // Generate suggested contract number: HD-YYYY-XXX
  const suggestedNumber = useMemo(() => {
    const existingCount = contractService.getContracts().length
    return `HD-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`
  }, [])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const oneYearLaterStr = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  const [contractNumber, setContractNumber] = useState<string>(suggestedNumber)
  const [signDate, setSignDate] = useState<string>(todayStr)
  const [effectiveDate, setEffectiveDate] = useState<string>(todayStr)
  const [expirationDate, setExpirationDate] = useState<string>(oneYearLaterStr)
  const [paymentTerms, setPaymentTerms] = useState<string>(
    quote.payment_terms || 'Thanh toán 50% khi ký hợp đồng, 50% sau khi nghiệm thu.'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (!isOpen) return null

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractNumber.trim()) {
      setErrorMsg('Vui lòng nhập số hợp đồng!')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const payload: CreateContractPayload = {
        contract_number: contractNumber.trim().toUpperCase(),
        quote_id: quote.id,
        quote_number: quote.quote_number,
        opportunity_id: quote.opportunity_id,
        opportunity_title: quote.opportunity_title,
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        sign_date: signDate,
        effective_date: effectiveDate,
        expiration_date: expirationDate,
        payment_terms: paymentTerms.trim(),
        total_value: quote.grand_total,
        items: quote.items, // Kế thừa toàn bộ dòng sản phẩm và giá đã chốt
      }

      const created = await contractService.createContract(payload, user)
      onSuccess(created.contract_number)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi chuyển đổi thành hợp đồng.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="convert-contract-modal-overlay" onClick={onClose}>
      <div
        className="convert-contract-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-contract-title"
      >
        <div className="modal-header">
          <div className="title-group">
            <span className="icon-badge">📑➔📜</span>
            <div>
              <h3 id="convert-contract-title">Chuyển báo giá thành Hợp đồng (S7-04)</h3>
              <span className="sub-title">
                Chuyển từ báo giá: <strong>{quote.quote_number} (v{quote.version})</strong>
              </span>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <form onSubmit={handleConvert}>
          <div className="modal-body">
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            <div className="quote-inherited-summary-banner">
              <div className="inherited-row">
                <span>Khách hàng ký kết:</span>
                <strong>{quote.customer_name}</strong>
              </div>
              <div className="inherited-row">
                <span>Cơ hội bán hàng:</span>
                <strong>{quote.opportunity_title}</strong>
              </div>
              <div className="inherited-row">
                <span>Số dòng sản phẩm kế thừa:</span>
                <strong>{quote.items.length} dòng (Giá đã chốt sau chiết khấu)</strong>
              </div>
              <div className="inherited-row total-highlight">
                <span>Tổng giá trị hợp đồng:</span>
                <span className="val">{formatCurrencyVND(quote.grand_total)}</span>
              </div>
              <div className="auto-won-hint">
                🎯 <em>Lưu ý: Cơ hội sẽ tự động chuyển sang trạng thái <strong>Đóng Thắng (Closed Won)</strong> với doanh số thực tế đúng bằng {formatCurrencyVND(quote.grand_total)}.</em>
              </div>
            </div>

            {/* Contract Inputs (S7-04 AC) */}
            <div className="contract-form-grid">
              <div className="form-group">
                <label htmlFor="ct-number">Số hợp đồng (* Duy nhất):</label>
                <input
                  type="text"
                  id="ct-number"
                  className="form-control"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value.toUpperCase())}
                  placeholder="VD: HD-2025-001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ct-sign-date">Ngày ký hợp đồng (*):</label>
                <input
                  type="date"
                  id="ct-sign-date"
                  className="form-control"
                  value={signDate}
                  onChange={(e) => setSignDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ct-effective-date">Ngày bắt đầu hiệu lực (*):</label>
                <input
                  type="date"
                  id="ct-effective-date"
                  className="form-control"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ct-expiration-date">Ngày hết hạn (*):</label>
                <input
                  type="date"
                  id="ct-expiration-date"
                  className="form-control"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group terms-full-width">
                <label htmlFor="ct-payment-terms">Điều khoản thanh toán hợp đồng (*):</label>
                <textarea
                  id="ct-payment-terms"
                  className="form-control"
                  rows={2}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Inherited Items Preview */}
            <div className="inherited-items-preview">
              <h5>Danh mục sản phẩm kế thừa ({quote.items.length}):</h5>
              <div className="items-list-box">
                {quote.items.map((it) => (
                  <div key={it.id} className="item-line">
                    <div className="name-col">
                      <strong>{it.product_name}</strong>
                      <span className="code">{it.product_code || ''}</span>
                    </div>
                    <div className="qty-price">
                      {it.quantity} {it.unit} × {formatCurrencyVND(it.unit_price)}
                    </div>
                    <div className="total-col">{formatCurrencyVND(it.line_total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-confirm-convert-contract"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang chuyển đổi...' : '✓ Xác nhận chuyển thành Hợp đồng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
