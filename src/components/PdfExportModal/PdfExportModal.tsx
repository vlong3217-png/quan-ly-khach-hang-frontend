import { useState } from 'react'
import type { Quote } from '../../types/quote.ts'
import type { Contract } from '../../types/contract.ts'
import type { CompanyTemplateConfig } from '../../types/templateConfig.ts'
import { templateConfigService } from '../../services/templateConfigService.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import { numberToVietnameseWords } from '../../utils/numberToVietnameseWords.ts'
import './PdfExportModal.css'

interface PdfExportModalProps {
  isOpen: boolean
  mode: 'QUOTE' | 'CONTRACT'
  quote?: Quote | null
  contract?: Contract | null
  onClose: () => void
}

export default function PdfExportModal({
  isOpen,
  mode,
  quote,
  contract,
  onClose,
}: PdfExportModalProps) {
  const [config, setConfig] = useState<CompanyTemplateConfig>(() =>
    templateConfigService.getConfig()
  )
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false)
  const [editConfig, setEditConfig] = useState<CompanyTemplateConfig>(config)

  if (!isOpen) return null

  const isQuote = mode === 'QUOTE' && !!quote
  const docNumber = isQuote ? quote.quote_number : contract?.contract_number || 'HD-2025'
  const docDate = isQuote ? quote.created_at.split('T')[0] : contract?.sign_date || ''
  const customerName = isQuote ? quote.customer_name : contract?.customer_name || ''
  const grandTotal = isQuote ? quote.grand_total : contract?.total_value || 0
  const items = isQuote ? quote.items : contract?.items || []
  const subtotal = isQuote ? quote.subtotal : grandTotal
  const totalDiscount = isQuote ? quote.total_discount_amount : 0
  const paymentTerms = isQuote ? quote.payment_terms : contract?.payment_terms || ''
  const deliveryTerms = isQuote ? quote.delivery_terms : ''
  const docNotes = isQuote ? quote.notes : ''

  const wordsAmount = numberToVietnameseWords(grandTotal)

  const handlePrint = () => {
    window.print()
  }

  const handleSaveConfig = () => {
    const saved = templateConfigService.updateConfig(editConfig)
    setConfig(saved)
    setIsConfigDrawerOpen(false)
  }

  const handleResetConfig = () => {
    if (window.confirm('Khôi phục mẫu công ty về mặc định?')) {
      const reset = templateConfigService.resetToDefault()
      setConfig(reset)
      setEditConfig(reset)
      setIsConfigDrawerOpen(false)
    }
  }

  return (
    <div className="pdf-export-modal-overlay" onClick={onClose}>
      <div
        className="pdf-export-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-modal-title"
      >
        <div className="pdf-export-modal-header">
          <div className="header-left">
            <div>
              <h4 id="pdf-modal-title">
                {isQuote ? 'Xuất Báo giá ra PDF (S7-05)' : 'Xuất Hợp đồng ra PDF (S7-05)'}
              </h4>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Số tài liệu: <strong>{docNumber}</strong> | Mẫu chuẩn hóa doanh nghiệp
              </span>
            </div>
          </div>

          <div className="actions-right">
            <button
              type="button"
              className="btn-config-toggle"
              id="btn-toggle-template-config"
              onClick={() => {
                setEditConfig(config)
                setIsConfigDrawerOpen(!isConfigDrawerOpen)
              }}
              title="Cấu hình thông tin công ty và mẫu in (S7-05 AC)"
            >
              {isConfigDrawerOpen ? 'Đóng cấu hình' : 'Tùy chỉnh mẫu'}
            </button>
            <button
              type="button"
              className="btn-print-action"
              id="btn-print-pdf-export"
              onClick={handlePrint}
              title="In hoặc Lưu dưới dạng PDF (Ctrl + P)"
            >
              In / Tải PDF
            </button>
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', marginLeft: '8px' }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="pdf-export-modal-body">
          {/* Side Drawer for Template Customization */}
          {isConfigDrawerOpen && (
            <div className="template-config-drawer">
              <h5>Cấu hình mẫu tài liệu (S7-05)</h5>
              <div className="config-form-group">
                <label>Tên công ty:</label>
                <input
                  type="text"
                  value={editConfig.company_name}
                  onChange={(e) => setEditConfig({ ...editConfig, company_name: e.target.value })}
                />
              </div>
              <div className="config-form-group">
                <label>Mã số thuế:</label>
                <input
                  type="text"
                  value={editConfig.tax_id}
                  onChange={(e) => setEditConfig({ ...editConfig, tax_id: e.target.value })}
                />
              </div>
              <div className="config-form-group">
                <label>Địa chỉ công ty:</label>
                <textarea
                  rows={2}
                  value={editConfig.address}
                  onChange={(e) => setEditConfig({ ...editConfig, address: e.target.value })}
                />
              </div>
              <div className="config-form-group">
                <label>Hotline / SĐT:</label>
                <input
                  type="text"
                  value={editConfig.phone}
                  onChange={(e) => setEditConfig({ ...editConfig, phone: e.target.value })}
                />
              </div>
              <div className="config-form-group">
                <label>Email & Website:</label>
                <input
                  type="text"
                  value={editConfig.email}
                  onChange={(e) => setEditConfig({ ...editConfig, email: e.target.value })}
                />
              </div>
              <div className="config-form-group">
                <label>Tài khoản ngân hàng:</label>
                <input
                  type="text"
                  value={editConfig.bank_name}
                  onChange={(e) => setEditConfig({ ...editConfig, bank_name: e.target.value })}
                  placeholder="Tên ngân hàng"
                />
                <input
                  type="text"
                  value={editConfig.bank_account_number}
                  onChange={(e) =>
                    setEditConfig({ ...editConfig, bank_account_number: e.target.value })
                  }
                  placeholder="Số tài khoản"
                  style={{ marginTop: '4px' }}
                />
              </div>
              <div className="config-form-group">
                <label>URL Logo (Tùy chọn):</label>
                <input
                  type="text"
                  value={editConfig.logo_url}
                  onChange={(e) => setEditConfig({ ...editConfig, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="config-form-group">
                <label>Màu sắc chủ đạo (Accent Color):</label>
                <input
                  type="color"
                  value={editConfig.primary_color}
                  onChange={(e) => setEditConfig({ ...editConfig, primary_color: e.target.value })}
                  style={{ height: '36px', padding: '2px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, padding: '6px' }}
                  onClick={handleSaveConfig}
                >
                  Lưu mẫu
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  style={{ padding: '6px' }}
                  onClick={handleResetConfig}
                >
                  Mặc định
                </button>
              </div>
            </div>
          )}

          {/* The A4 Printable Paper */}
          <div className="print-document-sheet" id="print-document-sheet">
            {/* Header / Brand block */}
            <div className="doc-header" style={{ borderBottomColor: config.primary_color }}>
              <div className="company-brand">
                {config.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="doc-logo-img" />
                ) : (
                  <div className="doc-logo-fallback" style={{ backgroundColor: config.primary_color }}>
                    CRM
                  </div>
                )}
                <div className="doc-company-info">
                  <h3 style={{ color: config.primary_color }}>{config.company_name}</h3>
                  <p>
                    <strong>Mã số thuế:</strong> {config.tax_id} | <strong>Hotline:</strong>{' '}
                    {config.phone}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong> {config.address}
                  </p>
                  <p>
                    <strong>Email:</strong> {config.email} | <strong>Website:</strong>{' '}
                    {config.website}
                  </p>
                  {config.bank_account_number && (
                    <p>
                      <strong>TK Ngân hàng:</strong> {config.bank_account_number} -{' '}
                      {config.bank_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="doc-title-block">
              <h2 style={{ color: config.primary_color }}>
                {isQuote ? config.quote_header_title : 'HỢP ĐỒNG KINH TẾ DỊCH VỤ & HÀNG HÓA'}
              </h2>
              <div className="doc-meta">
                Số: <strong>{docNumber}</strong> | Ngày ban hành: {docDate}
                {isQuote && quote && ` | Phiên bản: v${quote.version}`}
              </div>
            </div>

            {/* Customer Information */}
            <div className="doc-customer-info">
              <div className="info-row">
                <span className="info-label">Kính gửi (Khách hàng):</span>
                <strong>{customerName}</strong>
              </div>
              {isQuote && quote && (
                <>
                  <div className="info-row">
                    <span className="info-label">Cơ hội bán hàng:</span>
                    <span>{quote.opportunity_title}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Người lập báo giá:</span>
                    <span>{quote.created_by_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Thời hạn hiệu lực:</span>
                    <span>Đến ngày {quote.valid_until}</span>
                  </div>
                </>
              )}
              {!isQuote && contract && (
                <>
                  <div className="info-row">
                    <span className="info-label">Thời hạn hợp đồng:</span>
                    <span>
                      Từ {contract.effective_date} đến {contract.expiration_date}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Căn cứ báo giá số:</span>
                    <span>{contract.quote_number}</span>
                  </div>
                </>
              )}
            </div>

            {/* Line Items Table (AC: Bảng dòng sản phẩm) */}
            <table className="doc-items-table">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>STT</th>
                  <th>Tên sản phẩm / Dịch vụ</th>
                  <th style={{ width: '45px' }}>ĐVT</th>
                  <th style={{ width: '45px' }}>SL</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Đơn giá niêm yết</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Chiết khấu</th>
                  <th style={{ width: '105px', textAlign: 'right' }}>Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '12px' }}>
                      Không có dòng sản phẩm nào.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <strong>{it.product_name}</strong>
                        {it.product_code && (
                          <span style={{ fontSize: '8.5pt', color: '#555', marginLeft: '6px' }}>
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
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrencyVND(it.line_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Financial Summary */}
            <table className="doc-totals-summary">
              <tbody>
                {isQuote && (
                  <>
                    <tr>
                      <td className="sum-label">Cộng tiền hàng (Subtotal):</td>
                      <td className="sum-val">{formatCurrencyVND(subtotal)}</td>
                    </tr>
                    {totalDiscount > 0 && (
                      <tr>
                        <td className="sum-label">Tổng tiền chiết khấu giảm trừ:</td>
                        <td className="sum-val" style={{ color: '#dc2626' }}>
                          - {formatCurrencyVND(totalDiscount)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
                <tr className="grand-total-row">
                  <td className="sum-label" style={{ color: config.primary_color }}>
                    TỔNG CỘNG TIỀN THANH TOÁN:
                  </td>
                  <td className="sum-val" style={{ color: config.primary_color }}>
                    {formatCurrencyVND(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* AC: Tổng tiền bằng số và bằng chữ */}
            <div className="words-amount-box">
              <strong>Số tiền viết bằng chữ: </strong>
              <em>{wordsAmount}</em>
            </div>

            {/* Terms and notes */}
            <div className="doc-terms-section">
              <h5>ĐIỀU KHOẢN & QUY ĐỊNH KÈM THEO:</h5>
              {paymentTerms && (
                <p>
                  • <strong>Điều khoản thanh toán:</strong> {paymentTerms}
                </p>
              )}
              {deliveryTerms && (
                <p>
                  • <strong>Điều khoản giao hàng / triển khai:</strong> {deliveryTerms}
                </p>
              )}
              {docNotes && (
                <p>
                  • <strong>Ghi chú bổ sung:</strong> {docNotes}
                </p>
              )}
              <p>
                • <strong>Quy định chung:</strong>{' '}
                {isQuote ? config.default_quote_notes : config.default_contract_terms}
              </p>
            </div>

            {/* Signatures block */}
            <div className="doc-signature-block">
              <div className="sign-col">
                <div className="sign-title">{config.signatory_customer_title}</div>
                <div className="sign-space"></div>
                <div className="sign-name">(Đại diện ký tên)</div>
              </div>

              <div className="sign-col">
                <div className="sign-title">{config.signatory_company_title}</div>
                <div className="sign-space"></div>
                <div className="sign-name">
                  {isQuote && quote ? quote.created_by_name : 'Giám đốc đại diện'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
