import { useState, useMemo } from 'react'
import type { Quote } from '../../types/quote.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import './QuoteComparisonModal.css'

interface QuoteComparisonModalProps {
  isOpen: boolean
  allVersions: Quote[]
  initialQuoteA?: Quote | null
  initialQuoteB?: Quote | null
  onClose: () => void
  onSetActiveVersion: (quoteId: string) => void
}

export default function QuoteComparisonModal({
  isOpen,
  allVersions,
  initialQuoteA,
  initialQuoteB,
  onClose,
  onSetActiveVersion,
}: QuoteComparisonModalProps) {
  // Sort versions descending
  const sortedVersions = useMemo(() => {
    return [...allVersions].sort((a, b) => (b.version || 1) - (a.version || 1))
  }, [allVersions])

  const [versionAId, setVersionAId] = useState<string>(() => {
    if (initialQuoteA) return initialQuoteA.id
    return sortedVersions[1]?.id || sortedVersions[0]?.id || ''
  })

  const [versionBId, setVersionBId] = useState<string>(() => {
    if (initialQuoteB) return initialQuoteB.id
    return sortedVersions[0]?.id || ''
  })

  const quoteA = useMemo(() => {
    return allVersions.find((q) => q.id === versionAId) || null
  }, [allVersions, versionAId])

  const quoteB = useMemo(() => {
    return allVersions.find((q) => q.id === versionBId) || null
  }, [allVersions, versionBId])

  if (!isOpen || !quoteA || !quoteB) return null

  // Delta financials
  const deltaTotal = quoteB.grand_total - quoteA.grand_total
  const deltaDiscountPct = Number((quoteB.discount_percentage - quoteA.discount_percentage).toFixed(1))

  // Merge items from both versions to compare row-by-row
  const comparisonItems = useMemo(() => {
    const map = new Map<string, { key: string; itemA?: any; itemB?: any }>()

    quoteA.items.forEach((it) => {
      const key = it.product_code || it.product_id || it.product_name
      map.set(key, { key, itemA: it })
    })

    quoteB.items.forEach((it) => {
      const key = it.product_code || it.product_id || it.product_name
      const existing = map.get(key)
      if (existing) {
        existing.itemB = it
      } else {
        map.set(key, { key, itemB: it })
      }
    })

    return Array.from(map.values())
  }, [quoteA, quoteB])

  const getItemChangeStatus = (itemA?: any, itemB?: any) => {
    if (!itemA && itemB) return { label: '🟢 Thêm mới', class: 'added' }
    if (itemA && !itemB) return { label: '🔴 Đã xóa', class: 'removed' }
    if (itemA && itemB) {
      const isPriceDiff = itemA.unit_price !== itemB.unit_price
      const isQtyDiff = itemA.quantity !== itemB.quantity
      const isDcDiff = itemA.discount_value !== itemB.discount_value || itemA.discount_type !== itemB.discount_type
      if (isPriceDiff || isQtyDiff || isDcDiff) {
        return { label: '🟡 Điều chỉnh giá/CK', class: 'modified' }
      }
      return { label: '⚪ Giữ nguyên', class: 'same' }
    }
    return { label: '—', class: 'same' }
  }

  return (
    <div className="quote-comparison-overlay" onClick={onClose}>
      <div
        className="quote-comparison-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
      >
        {/* Header */}
        <div className="compare-header">
          <div className="title-area">
            <span className="icon-badge">⚖️</span>
            <div>
              <h3 id="compare-modal-title">
                So sánh cạnh nhau các phiên bản báo giá: {quoteA.quote_number} (S7-03)
              </h3>
              <span className="sub-txt">
                Đối chiếu chi tiết thay đổi về giá, chiết khấu và điều khoản cam kết giữa 2 lần báo giá
              </span>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Version Pickers Bar */}
        <div className="version-selector-bar">
          <div className="picker-col">
            <label htmlFor="select-version-a">Phiên bản gốc (Bản A):</label>
            <select
              id="select-version-a"
              className="form-select form-select-sm"
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
            >
              {sortedVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} — {v.status} ({formatCurrencyVND(v.grand_total)}) {v.is_active_version ? '★ Đang hiệu lực' : ''}
                </option>
              ))}
            </select>
            {quoteA.is_active_version ? (
              <span className="active-tag active">★ Phiên bản đang hiệu lực</span>
            ) : (
              <button
                type="button"
                className="btn-set-active"
                onClick={() => onSetActiveVersion(quoteA.id)}
              >
                Đặt làm hiệu lực
              </button>
            )}
          </div>

          <div className="versus-badge">VS</div>

          <div className="picker-col">
            <label htmlFor="select-version-b">Phiên bản đối chiếu (Bản B):</label>
            <select
              id="select-version-b"
              className="form-select form-select-sm"
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
            >
              {sortedVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} — {v.status} ({formatCurrencyVND(v.grand_total)}) {v.is_active_version ? '★ Đang hiệu lực' : ''}
                </option>
              ))}
            </select>
            {quoteB.is_active_version ? (
              <span className="active-tag active">★ Phiên bản đang hiệu lực</span>
            ) : (
              <button
                type="button"
                className="btn-set-active"
                onClick={() => onSetActiveVersion(quoteB.id)}
              >
                Đặt làm hiệu lực
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="compare-body">
          {/* 1. Comparison Summary Cards */}
          <div className="summary-compare-grid">
            <div className="compare-card">
              <span className="card-lbl">Tổng giá trị thanh toán</span>
              <div className="values-row">
                <span className="val-a">{formatCurrencyVND(quoteA.grand_total)}</span>
                <span className="arrow">➔</span>
                <span className="val-b">{formatCurrencyVND(quoteB.grand_total)}</span>
              </div>
              <div className={`delta-tag ${deltaTotal < 0 ? 'text-success' : deltaTotal > 0 ? 'text-danger' : ''}`}>
                Chênh lệch: {deltaTotal > 0 ? `+${formatCurrencyVND(deltaTotal)}` : deltaTotal < 0 ? `-${formatCurrencyVND(Math.abs(deltaTotal))}` : '0 đ'}
              </div>
            </div>

            <div className="compare-card">
              <span className="card-lbl">Mức chiết khấu tổng</span>
              <div className="values-row">
                <span className="val-a">{quoteA.discount_percentage}%</span>
                <span className="arrow">➔</span>
                <span className="val-b">{quoteB.discount_percentage}%</span>
              </div>
              <div className="delta-tag">
                Biến động: {deltaDiscountPct > 0 ? `+${deltaDiscountPct}%` : `${deltaDiscountPct}%`}
              </div>
            </div>

            <div className="compare-card">
              <span className="card-lbl">Trạng thái</span>
              <div className="values-row">
                <span className="val-a badge-status">{quoteA.status}</span>
                <span className="arrow">➔</span>
                <span className="val-b badge-status">{quoteB.status}</span>
              </div>
            </div>

            <div className="compare-card">
              <span className="card-lbl">Hiệu lực báo giá</span>
              <div className="values-row">
                <span className="val-a">{quoteA.valid_until}</span>
                <span className="arrow">➔</span>
                <span className={`val-b ${quoteA.valid_until !== quoteB.valid_until ? 'highlight-changed' : ''}`}>
                  {quoteB.valid_until}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Terms Comparison */}
          <div className="terms-comparison-box">
            <h5>Điều khoản thanh toán & giao hàng:</h5>
            <div className="terms-columns">
              <div className="term-col">
                <strong>Phiên bản v{quoteA.version}:</strong>
                <p><strong>Thanh toán:</strong> {quoteA.payment_terms}</p>
                <p><strong>Giao hàng:</strong> {quoteA.delivery_terms}</p>
              </div>
              <div className="term-col">
                <strong>Phiên bản v{quoteB.version}:</strong>
                <p className={quoteA.payment_terms !== quoteB.payment_terms ? 'highlight-changed' : ''}>
                  <strong>Thanh toán:</strong> {quoteB.payment_terms}
                </p>
                <p className={quoteA.delivery_terms !== quoteB.delivery_terms ? 'highlight-changed' : ''}>
                  <strong>Giao hàng:</strong> {quoteB.delivery_terms}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Items Side-by-Side Diff Table */}
          <div className="items-diff-section">
            <h5>Chi tiết thay đổi từng dòng sản phẩm ({comparisonItems.length}):</h5>
            <div className="diff-table-wrapper">
              <table className="table diff-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Sản phẩm / Dịch vụ</th>
                    <th style={{ width: '30%' }}>Phiên bản v{quoteA.version} (Bản A)</th>
                    <th style={{ width: '30%' }}>Phiên bản v{quoteB.version} (Bản B)</th>
                    <th style={{ width: '18%', textAlign: 'center' }}>Thay đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonItems.map((row) => {
                    const statusObj = getItemChangeStatus(row.itemA, row.itemB)
                    const prodName = row.itemB?.product_name || row.itemA?.product_name || row.key

                    return (
                      <tr key={row.key} className={`row-diff-${statusObj.class}`}>
                        <td>
                          <strong>{prodName}</strong>
                          <span className="sub-code">({row.key})</span>
                        </td>
                        <td>
                          {row.itemA ? (
                            <div className="item-spec">
                              <span>SL: <strong>{row.itemA.quantity}</strong> {row.itemA.unit}</span> |{' '}
                              <span>Giá: <strong>{formatCurrencyVND(row.itemA.unit_price)}</strong></span> |{' '}
                              <span>CK: <strong>{row.itemA.discount_value > 0 ? (row.itemA.discount_type === 'PERCENT' ? `${row.itemA.discount_value}%` : formatCurrencyVND(row.itemA.discount_value)) : '0%'}</strong></span>
                              <div className="total-hint">Thành tiền: <strong>{formatCurrencyVND(row.itemA.line_total)}</strong></div>
                            </div>
                          ) : (
                            <span className="text-muted italic">Không có trong bản A</span>
                          )}
                        </td>
                        <td>
                          {row.itemB ? (
                            <div className="item-spec">
                              <span>SL: <strong>{row.itemB.quantity}</strong> {row.itemB.unit}</span> |{' '}
                              <span>Giá: <strong>{formatCurrencyVND(row.itemB.unit_price)}</strong></span> |{' '}
                              <span>CK: <strong>{row.itemB.discount_value > 0 ? (row.itemB.discount_type === 'PERCENT' ? `${row.itemB.discount_value}%` : formatCurrencyVND(row.itemB.discount_value)) : '0%'}</strong></span>
                              <div className="total-hint">Thành tiền: <strong>{formatCurrencyVND(row.itemB.line_total)}</strong></div>
                            </div>
                          ) : (
                            <span className="text-muted italic">Đã xóa trong bản B</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`diff-pill ${statusObj.class}`}>{statusObj.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="compare-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng so sánh
          </button>
        </div>
      </div>
    </div>
  )
}
