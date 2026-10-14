import { useState, useEffect, useMemo } from 'react'
import type { Opportunity, OpportunityProductItem, OpportunityBillingCycle } from '../../types/opportunity.ts'
import type { Product } from '../../types/product.ts'
import { productService } from '../../services/productService.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import './OpportunityProductManager.css'

interface OpportunityProductManagerProps {
  opportunity: Opportunity
  onOpportunityUpdated: (updated: Opportunity) => void
  readOnly?: boolean
}

export default function OpportunityProductManager({
  opportunity,
  onOpportunityUpdated,
  readOnly = false,
}: OpportunityProductManagerProps) {
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([])
  const [items, setItems] = useState<OpportunityProductItem[]>(
    opportunity.product_items || []
  )
  const [isAdding, setIsAdding] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [billingCycle, setBillingCycle] = useState<OpportunityBillingCycle>('ANNUAL')
  const [billingPeriods, setBillingPeriods] = useState<number>(1)
  const [discountRate, setDiscountRate] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const prods = productService.getProducts({ status: 'ACTIVE' })
    setProductsCatalog(prods)
  }, [])

  useEffect(() => {
    setItems(opportunity.product_items || [])
  }, [opportunity.product_items])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Khi chọn một sản phẩm từ danh mục, tự động điền đơn giá từ bảng giá niêm yết
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId)
    const found = productsCatalog.find((p) => p.id === prodId)
    if (found) {
      setUnitPrice(found.list_price)
      if (found.type === 'SUBSCRIPTION') {
        setBillingCycle('MONTHLY')
        setBillingPeriods(12) // Mặc định 1 năm = 12 tháng
      } else {
        setBillingCycle('ONE_TIME')
        setBillingPeriods(1)
      }
    }
  }

  // Tính toán nhanh thành tiền của dòng đang thêm
  const previewCalculation = useMemo(() => {
    const selectedProd = productsCatalog.find((p) => p.id === selectedProductId)
    const isSub = selectedProd?.type === 'SUBSCRIPTION'
    const periods = isSub ? Math.max(1, billingPeriods) : 1
    const subtotal = unitPrice * Math.max(1, quantity) * periods
    const discount = (subtotal * (discountRate || 0)) / 100
    const finalAmount = Math.max(0, subtotal - discount)

    // Tính giá trị hợp đồng năm (ACV)
    let annualValue = finalAmount
    if (isSub) {
      if (billingCycle === 'MONTHLY') {
        annualValue = (finalAmount / periods) * 12
      } else if (billingCycle === 'QUARTERLY') {
        annualValue = (finalAmount / periods) * 4
      }
    }

    return {
      subtotal,
      finalAmount,
      annualValue,
      isSub,
    }
  }, [selectedProductId, unitPrice, quantity, billingPeriods, discountRate, billingCycle, productsCatalog])

  // Thêm dòng sản phẩm mới
  const handleAddItem = async () => {
    const prod = productsCatalog.find((p) => p.id === selectedProductId)
    if (!prod) {
      alert('Vui lòng chọn sản phẩm / dịch vụ từ danh mục!')
      return
    }
    if (quantity <= 0) {
      alert('Số lượng phải lớn hơn 0!')
      return
    }

    const newItem: OpportunityProductItem = {
      id: `item-${Date.now()}`,
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      product_type: prod.type,
      unit: prod.unit,
      list_price: prod.list_price,
      unit_price: unitPrice,
      quantity,
      billing_cycle: prod.type === 'SUBSCRIPTION' ? billingCycle : undefined,
      billing_periods: prod.type === 'SUBSCRIPTION' ? billingPeriods : undefined,
      annual_value: previewCalculation.annualValue,
      discount_rate: discountRate,
      total_amount: previewCalculation.finalAmount,
      notes: notes.trim() || undefined,
    }

    const updatedItems = [...items, newItem]
    await saveItemsToOpportunity(updatedItems)

    // Reset form
    setIsAdding(false)
    setSelectedProductId('')
    setQuantity(1)
    setUnitPrice(0)
    setDiscountRate(0)
    setNotes('')
  }

  // Xóa một dòng sản phẩm
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi cơ hội?')) return
    const updated = items.filter((it) => it.id !== itemId)
    await saveItemsToOpportunity(updated)
  }

  // Tự động tính lại tổng doanh thu cơ hội và lưu vào Opportunity
  const saveItemsToOpportunity = async (newItems: OpportunityProductItem[]) => {
    try {
      setIsSaving(true)
      const totalRevenue = newItems.reduce((acc, curr) => acc + curr.total_amount, 0)
      const totalAcv = newItems.reduce((acc, curr) => acc + (curr.annual_value || curr.total_amount), 0)

      const updated = await opportunityService.updateOpportunity(opportunity.id, {
        product_items: newItems,
        expected_revenue: totalRevenue,
        annual_contract_value: totalAcv,
      })

      setItems(newItems)
      onOpportunityUpdated(updated)
      setNotice(`Đã cập nhật lại giá trị cơ hội: ${formatCurrency(totalRevenue)}`)
      setTimeout(() => setNotice(null), 3000)
    } catch {
      alert('Có lỗi xảy ra khi lưu dòng sản phẩm')
    } finally {
      setIsSaving(false)
    }
  }

  // Tổng kết các chỉ số
  const summary = useMemo(() => {
    const totalAmount = items.reduce((acc, it) => acc + it.total_amount, 0)
    const subscriptionItems = items.filter((it) => it.product_type === 'SUBSCRIPTION')
    const oneTimeItems = items.filter((it) => it.product_type === 'ONE_TIME')
    const totalAcv = items.reduce((acc, it) => acc + (it.annual_value || it.total_amount), 0)

    return {
      totalAmount,
      totalAcv,
      subscriptionCount: subscriptionItems.length,
      oneTimeCount: oneTimeItems.length,
    }
  }, [items])

  return (
    <div className="opp-product-manager">
      {notice && <div className="opp-product-notice">{notice}</div>}

      {/* Header Panel */}
      <div className="opp-product-header">
        <div>
          <h4 className="opp-product-title">
            Danh mục Sản phẩm & Dịch vụ trong Cơ hội
          </h4>
          <p className="opp-product-subtitle">
            Giá trị cơ hội được tự động tính căn cứ từ các dòng sản phẩm và bảng giá niêm yết chuẩn.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? 'Hủy thêm' : '+ Thêm sản phẩm / dịch vụ'}
          </button>
        )}
      </div>

      {/* Form Thêm sản phẩm mới */}
      {isAdding && !readOnly && (
        <div className="opp-product-add-card">
          <h5>Thêm dòng sản phẩm / dịch vụ mới</h5>
          <div className="opp-product-form-grid">
            {/* Chọn sản phẩm */}
            <div className="form-group full-col">
              <label>Sản phẩm / Dịch vụ (Từ bảng giá niêm yết) *</label>
              <select
                className="form-control"
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">-- Chọn sản phẩm trong danh mục --</option>
                {productsCatalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} — {p.type === 'SUBSCRIPTION' ? 'Thuê bao' : 'Gói một lần'} ({formatCurrency(p.list_price)} / {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Số lượng & Đơn giá */}
            <div className="form-group">
              <label>Số lượng *</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Đơn giá áp dụng (VNĐ) *</label>
              <input
                type="number"
                min={0}
                step={100000}
                className="form-control"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>

            {/* Chiết khấu */}
            <div className="form-group">
              <label>Chiết khấu (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="form-control"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
              />
            </div>

            {/* Dành riêng cho dịch vụ thuê bao */}
            {previewCalculation.isSub && (
              <>
                <div className="form-group">
                  <label>Chu kỳ tính phí</label>
                  <select
                    className="form-control"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as OpportunityBillingCycle)}
                  >
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="QUARTERLY">Hàng quý (3 tháng)</option>
                    <option value="ANNUAL">Hàng năm</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Số kỳ thuê bao (VD: 12 tháng, 4 quý, 2 năm)</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={billingPeriods}
                    onChange={(e) => setBillingPeriods(Number(e.target.value))}
                  />
                </div>
              </>
            )}

            <div className="form-group full-col">
              <label>Ghi chú yêu cầu kỹ thuật / cấu hình</label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: Bản quyền cho 50 users kinh doanh, tích hợp tổng đài VoIP"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Xem trước thành tiền dòng này */}
          <div className="opp-product-preview-bar">
            <span>
              Thành tiền dự kiến: <strong>{formatCurrency(previewCalculation.finalAmount)}</strong>
              {previewCalculation.isSub && (
                <span className="text-muted" style={{ marginLeft: '12px' }}>
                  (Giá trị hợp đồng theo năm ACV: {formatCurrency(previewCalculation.annualValue)})
                </span>
              )}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isSaving || !selectedProductId}
              onClick={handleAddItem}
            >
              {isSaving ? 'Đang lưu...' : 'Xác nhận thêm'}
            </button>
          </div>
        </div>
      )}

      {/* Bảng danh sách sản phẩm */}
      {items.length === 0 ? (
        <div className="opp-product-empty">
          <p>Chưa có sản phẩm hoặc dịch vụ nào được gán vào cơ hội bán hàng này.</p>
          {!readOnly && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAdding(true)}
            >
              + Chọn sản phẩm từ danh mục niêm yết
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="opp-product-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sản phẩm / Dịch vụ</th>
                <th>Loại</th>
                <th>Đơn vị</th>
                <th className="text-right">Đơn giá niêm yết</th>
                <th className="text-right">Đơn giá bán</th>
                <th className="text-center">Số lượng</th>
                <th>Kỳ hạn thuê bao</th>
                <th className="text-right">Chiết khấu</th>
                <th className="text-right">Thành tiền</th>
                {!readOnly && <th className="text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.product_name}</strong>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      Mã: {item.product_code}
                      {item.notes ? ` — ${item.notes}` : ''}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge-type ${
                        item.product_type === 'SUBSCRIPTION' ? 'sub' : 'one-time'
                      }`}
                    >
                      {item.product_type === 'SUBSCRIPTION' ? 'Thuê bao' : 'Một lần'}
                    </span>
                  </td>
                  <td>{item.unit}</td>
                  <td className="text-right font-mono text-muted">
                    {formatCurrency(item.list_price)}
                  </td>
                  <td className="text-right font-mono font-bold">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td>
                    {item.product_type === 'SUBSCRIPTION' ? (
                      <span style={{ fontSize: '12px' }}>
                        {item.billing_periods} kỳ ({item.billing_cycle === 'MONTHLY' ? 'Tháng' : item.billing_cycle === 'QUARTERLY' ? 'Quý' : 'Năm'})
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-right">
                    {item.discount_rate ? `${item.discount_rate}%` : '0%'}
                  </td>
                  <td className="text-right font-mono font-bold text-primary">
                    {formatCurrency(item.total_amount)}
                  </td>
                  {!readOnly && (
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn-delete-item"
                        title="Xóa dòng sản phẩm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Thẻ Tổng kết Doanh thu cơ hội tự động (S5-03) */}
      <div className="opp-product-summary-card">
        <div className="summary-col">
          <span className="summary-label">Số dòng sản phẩm:</span>
          <span className="summary-value">{items.length} mặt hàng</span>
        </div>
        <div className="summary-col">
          <span className="summary-label">Giá trị theo năm (ACV / ARR):</span>
          <span className="summary-value text-info font-mono">
            {formatCurrency(summary.totalAcv)}
          </span>
        </div>
        <div className="summary-col highlight">
          <span className="summary-label">Tổng giá trị cơ hội tự động:</span>
          <span className="summary-value text-success font-mono font-bold" style={{ fontSize: '1.2rem' }}>
            {formatCurrency(summary.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}
