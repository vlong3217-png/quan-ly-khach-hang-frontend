import { useState, useMemo } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import type { Quote, QuoteItem, CreateQuotePayload, DiscountType } from '../../types/quote.ts'
import { productService } from '../../services/productService.ts'
import {
  quoteService,
  calculateQuoteFinancials,
} from '../../services/quoteService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import './QuoteComposerModal.css'

interface QuoteComposerModalProps {
  isOpen: boolean
  opportunity: Opportunity
  existingQuote?: Quote | null // Nếu đang sửa bản nháp
  onClose: () => void
  onSaved: (quote: Quote) => void
}

export default function QuoteComposerModal({
  isOpen,
  opportunity,
  existingQuote,
  onClose,
  onSaved,
}: QuoteComposerModalProps) {
  const { user } = useAuth()
  const productsCatalog = useMemo(() => productService.getProducts({ status: 'ACTIVE' }), [])

  // Inherit product items from opportunity (S7-01 AC: Dòng sản phẩm kế thừa từ cơ hội, sửa lại được)
  const initialItems = useMemo<QuoteItem[]>(() => {
    if (existingQuote) {
      return existingQuote.items
    }
    if (opportunity.product_items && opportunity.product_items.length > 0) {
      return opportunity.product_items.map((it, idx) => ({
        id: `q-it-${Date.now()}-${idx}`,
        product_id: it.product_id,
        product_code: it.product_code,
        product_name: it.product_name,
        unit: it.unit || 'Gói',
        unit_price: it.unit_price || it.list_price || 0,
        quantity: it.quantity || 1,
        discount_type: 'PERCENT' as DiscountType,
        discount_value: it.discount_rate || 0,
        line_discount_amount: 0,
        vat_rate: 10,
        line_total: 0,
      }))
    }
    return []
  }, [existingQuote, opportunity])

  const [items, setItems] = useState<QuoteItem[]>(initialItems)
  const [overallDiscountType, setOverallDiscountType] = useState<DiscountType>(
    existingQuote?.overall_discount_type || 'PERCENT'
  )
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(
    existingQuote?.overall_discount_value || 0
  )

  // Validity and Terms (S7-01 AC: Khai báo hiệu lực báo giá, điều khoản thanh toán & giao hàng)
  const defaultValidUntil = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30) // Mặc định hiệu lực 30 ngày
    return d.toISOString().split('T')[0]
  }, [])

  const [validUntil, setValidUntil] = useState<string>(
    existingQuote?.valid_until || defaultValidUntil
  )
  const [paymentTerms, setPaymentTerms] = useState<string>(
    existingQuote?.payment_terms ||
      'Thanh toán 50% giá trị hợp đồng khi ký, 50% còn lại sau khi nghiệm thu bàn giao.'
  )
  const [deliveryTerms, setDeliveryTerms] = useState<string>(
    existingQuote?.delivery_terms ||
      'Bàn giao và triển khai hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.'
  )
  const [notes, setNotes] = useState<string>(existingQuote?.notes || '')
  const [selectedAddProductId, setSelectedAddProductId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Real-time Financial Calculations (S7-01 AC: Hệ thống tính lại thành tiền ngay & cảnh báo ngưỡng)
  const financials = useMemo(() => {
    return calculateQuoteFinancials(items, overallDiscountType, overallDiscountValue)
  }, [items, overallDiscountType, overallDiscountValue])

  if (!isOpen) return null

  // Add product from catalog
  const handleAddProduct = () => {
    if (!selectedAddProductId) return
    const prod = productsCatalog.find((p) => p.id === selectedAddProductId)
    if (!prod) return

    const newItem: QuoteItem = {
      id: `q-it-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      unit: prod.unit || 'Gói',
      unit_price: prod.list_price || 0,
      quantity: 1,
      discount_type: 'PERCENT',
      discount_value: 0,
      line_discount_amount: 0,
      vat_rate: 10,
      line_total: prod.list_price ? Math.round(prod.list_price * 1.1) : 0,
    }

    setItems([...items, newItem])
    setSelectedAddProductId('')
  }

  // Update item field
  const handleUpdateItem = (index: number, field: keyof QuoteItem, val: any) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: val }
    setItems(next)
  }

  // Remove item
  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    setItems(next)
  }

  // Save handler (isDraft = true / false)
  const handleSave = async (isDraft: boolean) => {
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất một dòng sản phẩm vào báo giá.')
      return
    }
    if (!validUntil) {
      alert('Vui lòng chọn ngày hết hạn hiệu lực báo giá.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateQuotePayload = {
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        customer_id: opportunity.customer_id || '',
        customer_name: opportunity.customer_name || 'Khách hàng',
        customer_contact_name: opportunity.contact_name,
        customer_contact_email: opportunity.contact_email,
        customer_contact_phone: opportunity.contact_phone,
        items,
        overall_discount_type: overallDiscountType,
        overall_discount_value: Number(overallDiscountValue) || 0,
        valid_until: validUntil,
        payment_terms: paymentTerms.trim(),
        delivery_terms: deliveryTerms.trim(),
        notes: notes.trim(),
        is_draft: isDraft,
      }

      let saved: Quote
      if (existingQuote) {
        saved = quoteService.updateQuote(existingQuote.id, payload, user)
      } else {
        saved = quoteService.createQuote(payload, user)
      }

      onSaved(saved)
      onClose()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu báo giá')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="quote-composer-modal-overlay" onClick={onClose}>
      <div
        className="quote-composer-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-composer-title"
      >
        {/* Header */}
        <div className="quote-modal-header">
          <div className="title-group">
            <span className="icon-badge">📑</span>
            <div>
              <h3 id="quote-composer-title">
                {existingQuote ? `Sửa báo giá: ${existingQuote.quote_number}` : 'Soạn báo giá từ cơ hội (S7-01)'}
              </h3>
              <span className="sub-title">
                Cơ hội: <strong>{opportunity.title}</strong> — Khách: <strong>{opportunity.customer_name}</strong>
              </span>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="quote-modal-body">
          {/* 1. Header Information & Terms Grid */}
          <div className="quote-terms-grid">
            <div className="form-group">
              <label htmlFor="quote-valid-until">Hiệu lực đến ngày (*):</label>
              <input
                type="date"
                id="quote-valid-until"
                className="form-control"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group terms-wide">
              <label htmlFor="quote-payment-terms">Điều khoản thanh toán (*):</label>
              <input
                type="text"
                id="quote-payment-terms"
                className="form-control"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="VD: 50% khi ký hợp đồng, 50% sau nghiệm thu..."
              />
              <div className="quick-term-chips">
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setPaymentTerms('Thanh toán 100% trước khi bàn giao hệ thống.')}
                >
                  100% trước
                </button>
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setPaymentTerms('Thanh toán 50% khi ký, 50% sau nghiệm thu.')}
                >
                  50% - 50%
                </button>
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setPaymentTerms('30% khi ký, 40% khi bàn giao, 30% sau 30 ngày nghiệm thu.')}
                >
                  30% - 40% - 30%
                </button>
              </div>
            </div>

            <div className="form-group terms-wide">
              <label htmlFor="quote-delivery-terms">Điều khoản giao hàng / bàn giao (*):</label>
              <input
                type="text"
                id="quote-delivery-terms"
                className="form-control"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="VD: Bàn giao trong vòng 10 ngày làm việc..."
              />
              <div className="quick-term-chips">
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setDeliveryTerms('Bàn giao trong vòng 3 ngày làm việc kể từ ngày ký.')}
                >
                  Trong 3 ngày
                </button>
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setDeliveryTerms('Triển khai và bàn giao trong 15 ngày làm việc.')}
                >
                  Trong 15 ngày
                </button>
                <button
                  type="button"
                  className="term-chip"
                  onClick={() => setDeliveryTerms('Kích hoạt tài khoản người dùng ngay sau khi thanh toán.')}
                >
                  Kích hoạt ngay
                </button>
              </div>
            </div>
          </div>

          {/* 2. Product Lines Table (S7-01 AC: Kế thừa từ cơ hội, sửa lại được, nhập CK theo % hoặc số tiền) */}
          <div className="quote-items-section">
            <div className="section-head">
              <h4>Danh mục sản phẩm / dịch vụ ({items.length} dòng):</h4>
              <div className="add-prod-inline">
                <select
                  className="form-select form-select-sm"
                  value={selectedAddProductId}
                  onChange={(e) => setSelectedAddProductId(e.target.value)}
                >
                  <option value="">-- Chọn sản phẩm từ Bảng giá niêm yết --</option>
                  {productsCatalog.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} ({formatCurrencyVND(p.list_price)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleAddProduct}
                  disabled={!selectedAddProductId}
                >
                  + Thêm dòng
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="quote-items-empty">
                Chưa có dòng sản phẩm nào. Vui lòng thêm sản phẩm từ bảng giá ở trên.
              </div>
            ) : (
              <div className="quote-table-wrapper">
                <table className="table quote-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>Sản phẩm / Dịch vụ</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>ĐVT</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ width: '16%', textAlign: 'right' }}>Đơn giá (VNĐ)</th>
                      <th style={{ width: '18%', textAlign: 'center' }}>Chiết khấu</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>VAT</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>Thành tiền</th>
                      <th style={{ width: '6%', textAlign: 'center' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financials.calculatedItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.product_name}</strong>
                          {item.product_code && <span className="item-code-txt">{item.product_code}</span>}
                          {item.floor_price && (
                            <span className="floor-price-hint">
                              Giá sàn: {formatCurrencyVND(item.floor_price)}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min={1}
                            className="form-control form-control-sm text-center"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                            }
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min={0}
                            step={50000}
                            className="form-control form-control-sm text-right"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'unit_price', Math.max(0, parseInt(e.target.value) || 0))
                            }
                          />
                        </td>
                        <td>
                          {/* S7-01 AC: Mỗi dòng nhập chiết khấu theo % hoặc số tiền */}
                          <div className="discount-input-group">
                            <select
                              className="form-select form-select-sm dc-type-select"
                              value={item.discount_type}
                              onChange={(e) =>
                                handleUpdateItem(idx, 'discount_type', e.target.value as DiscountType)
                              }
                            >
                              <option value="PERCENT">%</option>
                              <option value="AMOUNT">VNĐ</option>
                            </select>
                            <input
                              type="number"
                              min={0}
                              className="form-control form-control-sm dc-val-input text-right"
                              value={item.discount_value}
                              onChange={(e) =>
                                handleUpdateItem(idx, 'discount_value', Math.max(0, parseFloat(e.target.value) || 0))
                              }
                            />
                          </div>
                          {item.line_discount_amount > 0 && (
                            <div className="discount-calc-hint">
                              - {formatCurrencyVND(item.line_discount_amount)}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <select
                            className="form-select form-select-sm"
                            value={item.vat_rate}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'vat_rate', parseInt(e.target.value) || 0)
                            }
                          >
                            <option value={0}>0%</option>
                            <option value={8}>8%</option>
                            <option value={10}>10%</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {formatCurrencyVND(item.line_total)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-trash-item"
                            onClick={() => handleRemoveItem(idx)}
                            title="Xóa dòng này"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Overall Discount & Financial Summary Card */}
          <div className="quote-financial-summary-grid">
            <div className="overall-discount-box">
              <label>Chiết khấu thêm toàn báo giá (Tùy chọn):</label>
              <div className="overall-dc-row">
                <select
                  className="form-select form-select-sm"
                  value={overallDiscountType}
                  onChange={(e) => setOverallDiscountType(e.target.value as DiscountType)}
                >
                  <option value="PERCENT">% Toàn bộ</option>
                  <option value="AMOUNT">Số tiền (VNĐ)</option>
                </select>
                <input
                  type="number"
                  min={0}
                  className="form-control form-control-sm text-right"
                  value={overallDiscountValue}
                  onChange={(e) => setOverallDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
              <span className="text-muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Chiết khấu thêm sẽ được áp dụng trên tổng tiền sau khi đã trừ chiết khấu từng dòng.
              </span>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="quote-notes">Ghi chú kèm theo báo giá:</label>
                <textarea
                  id="quote-notes"
                  className="form-control"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về phạm vi công việc, cam kết SLA..."
                />
              </div>
            </div>

            {/* Total calculation panel */}
            <div className="totals-calculation-panel">
              <div className="calc-row">
                <span>Tổng tiền hàng (Chưa thuế & CK):</span>
                <strong>{formatCurrencyVND(financials.subtotal)}</strong>
              </div>
              <div className="calc-row text-danger">
                <span>
                  Tổng chiết khấu ({financials.discount_percentage}%):
                </span>
                <strong>- {formatCurrencyVND(financials.total_discount_amount)}</strong>
              </div>
              <div className="calc-row">
                <span>Thuế GTGT (VAT):</span>
                <span>+ {formatCurrencyVND(financials.vat_amount)}</span>
              </div>
              <div className="calc-row grand-total-row">
                <span>TỔNG TIỀN THANH TOÁN:</span>
                <span className="grand-total-val">{formatCurrencyVND(financials.grand_total)}</span>
              </div>

              {/* S7-01 & S7-02 AC: Hiển thị mức chiết khấu tổng và cảnh báo khi chạm ngưỡng cần duyệt */}
              <div className="approval-threshold-alert-box">
                {financials.approval_level === 'DIRECTOR' && (
                  <div className="threshold-alert-card danger">
                    <span className="alert-icon">🚨</span>
                    <div>
                      <strong>CẦN DUYỆT CẤP GIÁM ĐỐC KINH DOANH</strong>
                      <p>{financials.approval_reason}</p>
                    </div>
                  </div>
                )}
                {financials.approval_level === 'MANAGER' && (
                  <div className="threshold-alert-card warning">
                    <span className="alert-icon">⚠️</span>
                    <div>
                      <strong>CẦN DUYỆT CẤP TRƯỞNG NHÓM</strong>
                      <p>{financials.approval_reason}</p>
                    </div>
                  </div>
                )}
                {financials.approval_level === 'NONE' && (
                  <div className="threshold-alert-card success">
                    <span className="alert-icon">✅</span>
                    <div>
                      <strong>TỰ ĐỘNG THÔNG QUA</strong>
                      <p>Mức chiết khấu tổng ({financials.discount_percentage}%) dưới ngưỡng 10%. Không cần duyệt.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (S7-01 AC: Lưu nháp và sửa tiếp được) */}
        <div className="quote-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <div className="save-actions-group">
            <button
              type="button"
              className="btn btn-outline-primary"
              id="btn-save-quote-draft"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
            >
              💾 Lưu bản nháp (Sửa tiếp sau)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              id="btn-submit-quote-final"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              {financials.requires_approval
                ? '🚀 Hoàn tất & Gửi duyệt chiết khấu'
                : '🚀 Hoàn tất & Thông qua báo giá'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
