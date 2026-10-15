import { useState, useEffect, useMemo } from 'react'
import type { Contract, ContractStatus } from '../../types/contract.ts'
import {
  contractService,
  calculateRemainingDays,
} from '../../services/contractService.ts'
import { formatCurrencyVND } from '../../utils/formatCurrency.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import PdfExportModal from '../../components/PdfExportModal/PdfExportModal.tsx'
import './ContractsPage.css'

type FilterTab = 'ALL' | 'EXPIRING_SOON' | 'EXPIRED' | 'ACTIVE' | 'RENEWED'

export default function ContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [thresholdDays, setThresholdDays] = useState<number>(() =>
    contractService.getWarningThreshold()
  )
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [pdfContract, setPdfContract] = useState<Contract | null>(null)
  const [renewalContract, setRenewalContract] = useState<Contract | null>(null)
  const [renewalTitleInput, setRenewalTitleInput] = useState<string>('')
  const [isCreatingRenewal, setIsCreatingRenewal] = useState<boolean>(false)
  const [detailContract, setDetailContract] = useState<Contract | null>(null)

  const loadContracts = () => {
    const list = contractService.getContracts()
    setContracts(list)
  }

  useEffect(() => {
    loadContracts()
  }, [thresholdDays])

  const handleThresholdChange = (days: number) => {
    setThresholdDays(days)
    contractService.setWarningThreshold(days)
  }

  // Statistics
  const stats = useMemo(() => {
    let active = 0
    let expiring = 0
    let expired = 0
    let renewed = 0

    contracts.forEach((c) => {
      if (c.status === 'RENEWED') renewed++
      else if (c.status === 'EXPIRED') expired++
      else if (c.status === 'EXPIRING_SOON') expiring++
      else if (c.status === 'ACTIVE') active++
    })

    return {
      total: contracts.length,
      active,
      expiring,
      expired,
      renewed,
    }
  }, [contracts])

  // Filtered List
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && c.status !== 'ACTIVE') return false
      if (activeTab === 'EXPIRING_SOON' && c.status !== 'EXPIRING_SOON') return false
      if (activeTab === 'EXPIRED' && c.status !== 'EXPIRED') return false
      if (activeTab === 'RENEWED' && c.status !== 'RENEWED') return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNum = c.contract_number.toLowerCase().includes(q)
        const matchCust = c.customer_name.toLowerCase().includes(q)
        const matchOpp = (c.opportunity_title || '').toLowerCase().includes(q)
        if (!matchNum && !matchCust && !matchOpp) return false
      }

      return true
    })
  }, [contracts, activeTab, searchQuery])

  // Open Renewal Modal
  const handleOpenRenewalModal = (c: Contract) => {
    setRenewalContract(c)
    setRenewalTitleInput(`[Gia hạn HĐ ${c.contract_number}] ${c.opportunity_title || c.customer_name}`)
  }

  // Confirm Create Renewal Opportunity (S7-07 AC 3)
  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renewalContract) return

    setIsCreatingRenewal(true)
    try {
      const res = await contractService.createRenewalOpportunity(
        renewalContract.id,
        user,
        renewalTitleInput
      )
      loadContracts()
      alert(
        `🎉 Đã khởi tạo thành công cơ hội gia hạn: "${res.opportunity.title}"!\nKế thừa khách hàng và giá trị hợp đồng cũ sang Pipeline bán hàng.`
      )
      setRenewalContract(null)
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo cơ hội gia hạn.')
    } finally {
      setIsCreatingRenewal(false)
    }
  }

  const renderStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="status-badge active">🟢 Đang hiệu lực</span>
      case 'EXPIRING_SOON':
        return <span className="status-badge expiring_soon">🟠 Sắp hết hạn</span>
      case 'EXPIRED':
        return <span className="status-badge expired">🔴 Đã hết hạn</span>
      case 'RENEWED':
        return <span className="status-badge renewed">🟣 Đã gia hạn</span>
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  const renderCountdownPill = (c: Contract) => {
    if (c.status === 'RENEWED') {
      return <span className="countdown-pill renewed">✓ Đã tạo gia hạn</span>
    }
    const days = calculateRemainingDays(c.expiration_date)
    if (days < 0) {
      return (
        <span className="countdown-pill expired">
          Quá hạn {Math.abs(days)} ngày
        </span>
      )
    }
    if (days === 0) {
      return <span className="countdown-pill warning">⚠️ Hết hạn hôm nay</span>
    }
    if (days <= thresholdDays) {
      return (
        <span className="countdown-pill warning">
          ⏳ Còn {days} ngày
        </span>
      )
    }
    return <span className="countdown-pill active">Còn {days} ngày</span>
  }

  return (
    <div className="contracts-page-container" id="contracts-page-container">
      {/* Header bar */}
      <div className="contracts-header-bar">
        <div>
          <h2>Quản lý Hiệu lực & Gia hạn Hợp đồng (S7-07)</h2>
          <p className="sub-text">
            Theo dõi thời hạn kết thúc hợp đồng, cảnh báo mất doanh thu và 1-click tạo cơ hội gia hạn
          </p>
        </div>

        {/* AC 2: Ngưỡng cảnh báo cấu hình được */}
        <div className="threshold-control-box">
          <label htmlFor="select-threshold">⚠️ Ngưỡng cảnh báo sắp hết hạn:</label>
          <select
            id="select-threshold"
            value={thresholdDays}
            onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))}
          >
            <option value={15}>Trước 15 ngày</option>
            <option value={30}>Trước 30 ngày (Chuẩn)</option>
            <option value={45}>Trước 45 ngày</option>
            <option value={60}>Trước 60 ngày</option>
            <option value={90}>Trước 90 ngày (Quý)</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="contracts-stats-grid">
        <div className="contract-stat-card" onClick={() => setActiveTab('ALL')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon total">📜</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <span>Tổng số hợp đồng</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('ACTIVE')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon active">🟢</div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <span>Đang hiệu lực</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('EXPIRING_SOON')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon expiring">⚠️</div>
          <div className="stat-info">
            <h3 style={{ color: '#ea580c' }}>{stats.expiring}</h3>
            <span>Sắp hết hạn (&le; {thresholdDays} ngày)</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('EXPIRED')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon expired">❌</div>
          <div className="stat-info">
            <h3 style={{ color: '#dc2626' }}>{stats.expired}</h3>
            <span>Đã hết hạn</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('RENEWED')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon renewed">🔄</div>
          <div className="stat-info">
            <h3 style={{ color: '#7c3aed' }}>{stats.renewed}</h3>
            <span>Đã tạo cơ hội gia hạn</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="contracts-toolbar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả ({stats.total})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'EXPIRING_SOON' ? 'active' : ''}`}
            onClick={() => setActiveTab('EXPIRING_SOON')}
          >
            ⚠️ Sắp hết hạn ({stats.expiring})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'EXPIRED' ? 'active' : ''}`}
            onClick={() => setActiveTab('EXPIRED')}
          >
            ❌ Đã hết hạn ({stats.expired})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            🟢 Đang hiệu lực ({stats.active})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'RENEWED' ? 'active' : ''}`}
            onClick={() => setActiveTab('RENEWED')}
          >
            🔄 Đã gia hạn ({stats.renewed})
          </button>
        </div>

        <div className="search-input-box">
          <input
            type="text"
            placeholder="🔍 Tìm số HĐ, khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contracts Table (S7-07 AC 1) */}
      <div className="contracts-table-card">
        {filteredContracts.length === 0 ? (
          <div className="contracts-empty-state">
            <span className="empty-icon">📂</span>
            <h4>Không có hợp đồng nào trong danh mục này</h4>
            <p>Tất cả hợp đồng được chuyển đổi từ Báo giá thành công (S7-04) sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <table className="contracts-table">
            <thead>
              <tr>
                <th>Số hợp đồng</th>
                <th>Khách hàng & Cơ hội</th>
                <th style={{ textAlign: 'right' }}>Giá trị hợp đồng</th>
                <th>Ngày hiệu lực</th>
                <th>Ngày hết hạn</th>
                <th style={{ textAlign: 'center' }}>Số ngày còn lại</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="contract-code-tag">{c.contract_number}</span>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Báo giá: {c.quote_number}
                    </div>
                  </td>
                  <td>
                    <strong>{c.customer_name}</strong>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      {c.opportunity_title}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrencyVND(c.total_value)}
                  </td>
                  <td>{c.effective_date}</td>
                  <td>
                    <strong>{c.expiration_date}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {renderCountdownPill(c)}
                  </td>
                  <td>{renderStatusBadge(c.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* AC 3: Tạo cơ hội gia hạn từ hợp đồng sắp hết hạn */}
                      {!c.renewal_opportunity_id && (
                        <button
                          type="button"
                          className="btn-renew-action"
                          id={`btn-create-renewal-${c.id}`}
                          onClick={() => handleOpenRenewalModal(c)}
                          title="Tạo cơ hội gia hạn trong Pipeline bán hàng (S7-07 AC)"
                        >
                          🔄 Gia hạn
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => setPdfContract(c)}
                        title="Xuất Hợp đồng ra PDF (S7-05)"
                      >
                        🖨️ PDF
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setDetailContract(c)}
                        title="Xem chi tiết hợp đồng"
                      >
                        👁️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Renewal Opportunity Modal (S7-07 AC 3) */}
      {renewalContract && (
        <div className="response-modal-overlay" onClick={() => setRenewalContract(null)}>
          <div
            className="response-modal-card"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="dialog-header">
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                🔄 Tạo cơ hội gia hạn hợp đồng (S7-07)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Hệ thống tự động kế thừa thông tin khách hàng, số liệu dòng sản phẩm và giá trị để đưa vào Pipeline bán hàng
              </p>
            </div>

            <form onSubmit={handleConfirmRenewal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  <div>Số HĐ nguồn: <strong>{renewalContract.contract_number}</strong></div>
                  <div>Khách hàng: <strong>{renewalContract.customer_name}</strong></div>
                  <div>Ngày hết hạn HĐ cũ: <strong>{renewalContract.expiration_date}</strong></div>
                  <div>
                    Giá trị hợp đồng: <strong>{formatCurrencyVND(renewalContract.total_value)}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    Tên cơ hội gia hạn mới (*):
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={renewalTitleInput}
                    onChange={(e) => setRenewalTitleInput(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRenewalContract(null)}
                    disabled={isCreatingRenewal}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    id="btn-confirm-submit-renewal"
                    disabled={isCreatingRenewal}
                  >
                    {isCreatingRenewal ? 'Đang tạo...' : '✓ Xác nhận tạo cơ hội gia hạn'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {detailContract && (
        <div className="response-modal-overlay" onClick={() => setDetailContract(null)}>
          <div
            className="response-modal-card"
            style={{ maxWidth: '700px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                Chi tiết Hợp đồng: {detailContract.contract_number}
              </h3>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setDetailContract(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>Khách hàng: <strong>{detailContract.customer_name}</strong></div>
                <div>Cơ hội liên kết: <strong>{detailContract.opportunity_title}</strong></div>
                <div>Căn cứ báo giá: <strong>{detailContract.quote_number}</strong></div>
                <div>Tổng giá trị: <strong style={{ color: '#0284c7' }}>{formatCurrencyVND(detailContract.total_value)}</strong></div>
                <div>Ngày ký: {detailContract.sign_date}</div>
                <div>Ngày hiệu lực: {detailContract.effective_date}</div>
                <div>Ngày hết hạn: <strong>{detailContract.expiration_date}</strong></div>
                <div>Trạng thái: {renderStatusBadge(detailContract.status)}</div>
              </div>

              <div>
                <strong>Điều khoản thanh toán: </strong>
                {detailContract.payment_terms}
              </div>

              <div>
                <strong>Danh mục sản phẩm kế thừa ({detailContract.items.length}):</strong>
                <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '6px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  {detailContract.items.map((it, idx) => (
                    <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      <span>{it.product_name} ({it.quantity} {it.unit})</span>
                      <strong>{formatCurrencyVND(it.line_total)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => {
                    const c = detailContract
                    setDetailContract(null)
                    setPdfContract(c)
                  }}
                >
                  🖨️ Xuất PDF
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDetailContract(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal (S7-05) */}
      {pdfContract && (
        <PdfExportModal
          isOpen={true}
          mode="CONTRACT"
          contract={pdfContract}
          onClose={() => setPdfContract(null)}
        />
      )}
    </div>
  )
}
