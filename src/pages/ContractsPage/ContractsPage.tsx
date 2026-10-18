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
import PageHeader from '../../components/ui/PageHeader.tsx'
import Button from '../../components/ui/Button.tsx'
import Card from '../../components/ui/Card.tsx'
import Pagination from '../../components/ui/Pagination.tsx'

type FilterTab = 'ALL' | 'EXPIRING_SOON' | 'EXPIRED' | 'ACTIVE' | 'RENEWED'

export default function ContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [thresholdDays, setThresholdDays] = useState<number>(() =>
    contractService.getWarningThreshold()
  )
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

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
  useEffect(() => { setCurrentPage(1) }, [activeTab, searchQuery])
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

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize))
  const pagedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredContracts.slice(start, start + pageSize)
  }, [filteredContracts, currentPage, pageSize])

  // Open Renewal Modal
  const handleOpenRenewalModal = (c: Contract) => {
    setRenewalContract(c)
    setRenewalTitleInput(`[Gia háº¡n HÄ ${c.contract_number}] ${c.opportunity_title || c.customer_name}`)
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
        `ÄÃ£ khá»Ÿi táº¡o thÃ nh cÃ´ng cÆ¡ há»™i gia háº¡n: "${res.opportunity.title}"!\nKáº¿ thá»«a khÃ¡ch hÃ ng vÃ  giÃ¡ trá»‹ há»£p Ä‘á»“ng cÅ© sang Pipeline bÃ¡n hÃ ng.`
      )
      setRenewalContract(null)
    } catch (err: any) {
      alert(err.message || 'Lá»—i khi táº¡o cÆ¡ há»™i gia háº¡n.')
    } finally {
      setIsCreatingRenewal(false)
    }
  }

  const renderStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="status-badge active">Äang hiá»‡u lá»±c</span>
      case 'EXPIRING_SOON':
        return <span className="status-badge expiring_soon">Sáº¯p háº¿t háº¡n</span>
      case 'EXPIRED':
        return <span className="status-badge expired">ÄÃ£ háº¿t háº¡n</span>
      case 'RENEWED':
        return <span className="status-badge renewed">ÄÃ£ gia háº¡n</span>
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  const renderCountdownPill = (c: Contract) => {
    if (c.status === 'RENEWED') {
      return <span className="countdown-pill renewed">ÄÃ£ táº¡o gia háº¡n</span>
    }
    const days = calculateRemainingDays(c.expiration_date)
    if (days < 0) {
      return (
        <span className="countdown-pill expired">
          QuÃ¡ háº¡n {Math.abs(days)} ngÃ y
        </span>
      )
    }
    if (days === 0) {
      return <span className="countdown-pill warning">Háº¿t háº¡n hÃ´m nay</span>
    }
    if (days <= thresholdDays) {
      return (
        <span className="countdown-pill warning">
          CÃ²n {days} ngÃ y
        </span>
      )
    }
    return <span className="countdown-pill active">CÃ²n {days} ngÃ y</span>
  }

  return (
    <div className="contracts-page-container" id="contracts-page-container">
      {/* Header bar */}
      <PageHeader
        title="Quáº£n lÃ½ Hiá»‡u lá»±c & Gia háº¡n Há»£p Ä‘á»“ng"
        className="contracts-header-bar"
        actions={
          <div className="threshold-control-box">
            <label htmlFor="select-threshold">NgÆ°á»¡ng cáº£nh bÃ¡o sáº¯p háº¿t háº¡n:</label>
            <select
              id="select-threshold"
              value={thresholdDays}
              onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))}
            >
              <option value={15}>TrÆ°á»›c 15 ngÃ y</option>
              <option value={30}>TrÆ°á»›c 30 ngÃ y (Chuáº©n)</option>
              <option value={45}>TrÆ°á»›c 45 ngÃ y</option>
              <option value={60}>TrÆ°á»›c 60 ngÃ y</option>
              <option value={90}>TrÆ°á»›c 90 ngÃ y (QuÃ½)</option>
            </select>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="contracts-stats-grid">
        <div className="contract-stat-card" onClick={() => setActiveTab('ALL')} style={{ cursor: 'pointer' }}>
          
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <span>Tá»•ng sá»‘ há»£p Ä‘á»“ng</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('ACTIVE')} style={{ cursor: 'pointer' }}>
          
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <span>Äang hiá»‡u lá»±c</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('EXPIRING_SOON')} style={{ cursor: 'pointer' }}>
          
          <div className="stat-info">
            <h3 style={{ color: '#ea580c' }}>{stats.expiring}</h3>
            <span>Sáº¯p háº¿t háº¡n (&le; {thresholdDays} ngÃ y)</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('EXPIRED')} style={{ cursor: 'pointer' }}>
          
          <div className="stat-info">
            <h3 style={{ color: '#dc2626' }}>{stats.expired}</h3>
            <span>ÄÃ£ háº¿t háº¡n</span>
          </div>
        </div>

        <div className="contract-stat-card" onClick={() => setActiveTab('RENEWED')} style={{ cursor: 'pointer' }}>
          
          <div className="stat-info">
            <h3 style={{ color: '#7c3aed' }}>{stats.renewed}</h3>
            <span>ÄÃ£ táº¡o cÆ¡ há»™i gia háº¡n</span>
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
            Táº¥t cáº£ ({stats.total})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'EXPIRING_SOON' ? 'active' : ''}`}
            onClick={() => setActiveTab('EXPIRING_SOON')}
          >
            Sáº¯p háº¿t háº¡n ({stats.expiring})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'EXPIRED' ? 'active' : ''}`}
            onClick={() => setActiveTab('EXPIRED')}
          >
            ÄÃ£ háº¿t háº¡n ({stats.expired})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Äang hiá»‡u lá»±c ({stats.active})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'RENEWED' ? 'active' : ''}`}
            onClick={() => setActiveTab('RENEWED')}
          >
            ÄÃ£ gia háº¡n ({stats.renewed})
          </button>
        </div>

        <div className="search-input-box">
          <input
            type="text"
            placeholder="TÃ¬m sá»‘ HÄ, khÃ¡ch hÃ ng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contracts Table (S7-07 AC 1) */}
      <Card className="contracts-table-card">
        {filteredContracts.length === 0 ? (
          <div className="contracts-empty-state">
            
            <h4>KhÃ´ng cÃ³ há»£p Ä‘á»“ng nÃ o trong danh má»¥c nÃ y</h4>
            <p>Táº¥t cáº£ há»£p Ä‘á»“ng Ä‘Æ°á»£c chuyá»ƒn Ä‘á»•i tá»« BÃ¡o giÃ¡ thÃ nh cÃ´ng (S7-04) sáº½ xuáº¥t hiá»‡n táº¡i Ä‘Ã¢y.</p>
          </div>
        ) : (
          <table className="contracts-table">
            <thead>
              <tr>
                <th>Sá»‘ há»£p Ä‘á»“ng</th>
                <th>KhÃ¡ch hÃ ng & CÆ¡ há»™i</th>
                <th style={{ textAlign: 'right' }}>GiÃ¡ trá»‹ há»£p Ä‘á»“ng</th>
                <th>NgÃ y hiá»‡u lá»±c</th>
                <th>NgÃ y háº¿t háº¡n</th>
                <th style={{ textAlign: 'center' }}>Sá»‘ ngÃ y cÃ²n láº¡i</th>
                <th>Tráº¡ng thÃ¡i</th>
                <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
              </tr>
            </thead>
            <tbody>
              {pagedContracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="contract-code-tag">{c.contract_number}</span>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      BÃ¡o giÃ¡: {c.quote_number}
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
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {!c.renewal_opportunity_id && (
                        <Button
                          type="button"
                          variant="primary"
                          className="btn btn-primary"
                          id={`btn-create-renewal-${c.id}`}
                          onClick={() => handleOpenRenewalModal(c)}
                          title="Táº¡o cÆ¡ há»™i gia háº¡n trong Pipeline bÃ¡n hÃ ng (S7-07 AC)"
                        >
                          Gia háº¡n
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        className="btn btn-secondary"
                        onClick={() => setPdfContract(c)}
                        title="Xuáº¥t Há»£p Ä‘á»“ng ra PDF (S7-05)"
                      >
                        Xuáº¥t PDF
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        className="btn btn-secondary"
                        onClick={() => setDetailContract(c)}
                        title="Xem chi tiáº¿t há»£p Ä‘á»“ng"
                      >
                        Xem chi tiáº¿t
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filteredContracts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredContracts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
            itemName="hợp đồng"
          />
        )}
      </Card>

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
                Táº¡o cÆ¡ há»™i gia háº¡n há»£p Ä‘á»“ng (S7-07)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Há»‡ thá»‘ng tá»± Ä‘á»™ng káº¿ thá»«a thÃ´ng tin khÃ¡ch hÃ ng, sá»‘ liá»‡u dÃ²ng sáº£n pháº©m vÃ  giÃ¡ trá»‹ Ä‘á»ƒ Ä‘Æ°a vÃ o Pipeline bÃ¡n hÃ ng
              </p>
            </div>

            <form onSubmit={handleConfirmRenewal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  <div>Sá»‘ HÄ nguá»“n: <strong>{renewalContract.contract_number}</strong></div>
                  <div>KhÃ¡ch hÃ ng: <strong>{renewalContract.customer_name}</strong></div>
                  <div>NgÃ y háº¿t háº¡n HÄ cÅ©: <strong>{renewalContract.expiration_date}</strong></div>
                  <div>
                    GiÃ¡ trá»‹ há»£p Ä‘á»“ng: <strong>{formatCurrencyVND(renewalContract.total_value)}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    TÃªn cÆ¡ há»™i gia háº¡n má»›i (*):
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
                    Há»§y
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="btn btn-primary"
                    id="btn-confirm-submit-renewal"
                    disabled={isCreatingRenewal}
                  >
                    {isCreatingRenewal ? 'Äang táº¡o...' : 'XÃ¡c nháº­n táº¡o cÆ¡ há»™i gia háº¡n'}
                  </Button>
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
                Chi tiáº¿t Há»£p Ä‘á»“ng: {detailContract.contract_number}
              </h3>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setDetailContract(null)}
              >
                âœ•
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>KhÃ¡ch hÃ ng: <strong>{detailContract.customer_name}</strong></div>
                <div>CÆ¡ há»™i liÃªn káº¿t: <strong>{detailContract.opportunity_title}</strong></div>
                <div>CÄƒn cá»© bÃ¡o giÃ¡: <strong>{detailContract.quote_number}</strong></div>
                <div>Tá»•ng giÃ¡ trá»‹: <strong style={{ color: '#0284c7' }}>{formatCurrencyVND(detailContract.total_value)}</strong></div>
                <div>NgÃ y kÃ½: {detailContract.sign_date}</div>
                <div>NgÃ y hiá»‡u lá»±c: {detailContract.effective_date}</div>
                <div>NgÃ y háº¿t háº¡n: <strong>{detailContract.expiration_date}</strong></div>
                <div>Tráº¡ng thÃ¡i: {renderStatusBadge(detailContract.status)}</div>
              </div>

              <div>
                <strong>Äiá»u khoáº£n thanh toÃ¡n: </strong>
                {detailContract.payment_terms}
              </div>

              <div>
                <strong>Danh má»¥c sáº£n pháº©m káº¿ thá»«a ({detailContract.items.length}):</strong>
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
                  Xuáº¥t PDF
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDetailContract(null)}
                >
                  ÄÃ³ng
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
