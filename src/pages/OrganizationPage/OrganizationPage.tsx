import React, { useState } from 'react'
import type { DepartmentNode, Region } from '../../types/organization.ts'
import { organizationService } from '../../services/organizationService.ts'
import Card from '../../components/ui/Card.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Button from '../../components/ui/Button.tsx'
import './OrganizationPage.css'

export default function OrganizationPage() {
  const [tree, setTree] = useState<DepartmentNode[]>(() => organizationService.getDepartmentTree())
  const [regions, setRegions] = useState<Region[]>(() => organizationService.getRegions())
  const [selectedNode, setSelectedNode] = useState<DepartmentNode | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Trạng thái thu gọn/mở rộng từng node nhánh
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Record<string, boolean>>({})

  // Modal Thêm phòng ban
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false)
  const [parentIdForNewDept, setParentIdForNewDept] = useState<string | null>(null)
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    leader_name: '',
    region_id: regions[0]?.id || '',
    description: '',
  })

  // Modal thêm khu vực
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
  const [regionForm, setRegionForm] = useState({
    name: '',
    code: '',
    description: '',
  })

  // Modal xác nhận xóa phòng ban
  const [deletingDept, setDeletingDept] = useState<DepartmentNode | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const reloadData = () => {
    setTree(organizationService.getDepartmentTree())
    setRegions(organizationService.getRegions())
  }

  // Thu gọn / Mở rộng node
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsedNodeIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Mở rộng tất cả / Thu gọn tất cả
  const handleExpandAll = () => {
    setCollapsedNodeIds({})
  }

  const handleCollapseAll = () => {
    const allIds: Record<string, boolean> = {}
    const collect = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          allIds[n.id] = true
          collect(n.children)
        }
      })
    }
    collect(tree)
    setCollapsedNodeIds(allIds)
  }

  const handleOpenAddDept = (parentId: string | null) => {
    setParentIdForNewDept(parentId)
    setDeptForm({
      name: '',
      code: `PB-${Math.floor(100 + Math.random() * 900)}`,
      leader_name: '',
      region_id: regions[0]?.id || '',
      description: '',
    })
    setIsDeptModalOpen(true)
  }

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptForm.name.trim() || !deptForm.leader_name.trim()) {
      showToast('Vui lòng điền tên phòng ban và tên trưởng nhóm!', 'error')
      return
    }
    const reg = regions.find((r) => r.id === deptForm.region_id)
    organizationService.addDepartment(parentIdForNewDept, {
      name: deptForm.name,
      code: deptForm.code,
      parent_id: parentIdForNewDept,
      leader_id: Date.now(),
      leader_name: deptForm.leader_name,
      region_id: deptForm.region_id,
      region_name: reg ? reg.name : 'Chưa phân vùng',
      description: deptForm.description,
    })
    showToast(`Đã thêm cơ cấu phòng ban "${deptForm.name}" thành công!`, 'success')
    setIsDeptModalOpen(false)
    // Tự động mở rộng node cha để thấy nhánh mới vừa tạo
    if (parentIdForNewDept) {
      setCollapsedNodeIds((prev) => ({ ...prev, [parentIdForNewDept]: false }))
    }
    reloadData()
  }

  const handleSaveRegion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regionForm.name.trim() || !regionForm.code.trim()) {
      showToast('Vui lòng nhập tên và mã khu vực!', 'error')
      return
    }
    organizationService.addRegion({
      name: regionForm.name,
      code: regionForm.code,
      description: regionForm.description,
    })
    showToast(`Đã thêm khu vực địa lý "${regionForm.name}" thành công!`, 'success')
    setIsRegionModalOpen(false)
    reloadData()
  }

  const handleConfirmDeleteDept = () => {
    if (!deletingDept) return
    const result = organizationService.deleteDepartment(deletingDept.id)
    if (!result.success) {
      showToast(result.message || 'Không thể xóa phòng ban!', 'error')
      setDeletingDept(null)
      return
    }

    showToast(`Đã xóa "${deletingDept.name}" thành công!`, 'success')
    if (selectedNode?.id === deletingDept.id) {
      setSelectedNode(null)
    }
    setDeletingDept(null)
    reloadData()
  }

  // Render đệ quy cây tổ chức dạng đường nối phân cấp (Tree Connector Lines)
  const renderTreeNodes = (nodes: DepartmentNode[], depth = 0) => {
    return (
      <ul className={`tree-branch depth-${depth}`}>
        {nodes.map((node, index) => {
          const isSelected = selectedNode?.id === node.id
          const hasChildren = node.children && node.children.length > 0
          const isCollapsed = !!collapsedNodeIds[node.id]
          const isLastChild = index === nodes.length - 1

          return (
            <li key={node.id} className={`tree-leaf ${isLastChild ? 'is-last' : ''}`}>
              {/* Connector line horizontal stub */}
              {depth > 0 && <span className="tree-connector-stub" />}

              <div
                className={`tree-node-card depth-level-${depth} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedNode(node)}
              >
                {/* Nút thu gọn / mở rộng */}
                {hasChildren ? (
                  <button
                    type="button"
                    className={`tree-toggle-btn ${isCollapsed ? 'collapsed' : 'expanded'}`}
                    onClick={(e) => toggleCollapse(node.id, e)}
                    title={isCollapsed ? 'Mở rộng nhánh con' : 'Thu gọn nhánh con'}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                ) : (
                  <span className="tree-leaf-bullet" />
                )}
                {/* Ẩn mã PB cho gọn theo yêu cầu */}
                <div className="node-content">
                  <div className="node-title">
                    <strong>{node.name}</strong>
                    {depth === 0 && <span className="root-badge">Khối gốc</span>}
                  </div>
                  <div className="node-meta">
                    <span className="meta-leader">Trưởng nhóm: <strong>{node.leader_name}</strong></span>
                    <span className="region-tag">{node.region_name}</span>
                    <span className="member-count-tag">{node.members?.length || 0} nhân sự</span>
                    {hasChildren && (
                      <span className="children-count-tag">
                        {node.children!.length} nhánh trực thuộc
                      </span>
                    )}
                  </div>
                </div>

                <div className="node-actions-group" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="add-sub-dept-btn"
                    title="Thêm nhóm con trực thuộc"
                    onClick={() => handleOpenAddDept(node.id)}
                  >
                    + Nhánh con
                  </button>
                  <button
                    type="button"
                    className="delete-dept-btn"
                    title="Xóa phòng ban / đội nhóm này"
                    onClick={() => setDeletingDept(node)}
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {hasChildren && !isCollapsed && renderTreeNodes(node.children!, depth + 1)}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="org-page-container">
      {toast && (
        <div className={`org-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Cơ cấu Tổ chức Kinh doanh & Khu vực địa lý"
        className="org-header"
        actions={
          <div className="org-header-actions">
            <Button type="button" variant="secondary" className="btn btn-secondary" onClick={() => setIsRegionModalOpen(true)}>
              Khai báo Khu vực
            </Button>
            <Button type="button" variant="primary" className="btn btn-primary" onClick={() => handleOpenAddDept(null)}>
              + Thêm Khối / Phòng ban gốc
            </Button>
          </div>
        }
      />

      <div className="org-layout">
        {/* Cột trái: Cây cấu trúc tổ chức */}
        <div className="org-tree-panel">
          <div className="panel-title-bar">
            <div>
              <span className="panel-title-text">Cây sơ đồ tổ chức phân cấp</span>
              <small className="panel-subtitle-text">Nhấp vào nhánh để xem chi tiết & danh sách nhân sự</small>
            </div>
            <div className="tree-global-actions">
              <button
                type="button"
                className="btn-tree-action"
                onClick={handleExpandAll}
                title="Mở rộng tất cả các nhánh con"
              >
                Mở rộng tất cả
              </button>
              <button
                type="button"
                className="btn-tree-action"
                onClick={handleCollapseAll}
                title="Thu gọn các nhánh con"
              >
                Thu gọn tất cả
              </button>
            </div>
          </div>

          <div className="tree-scroll-wrapper">
            {tree.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                Chưa có sơ đồ tổ chức phòng ban. Nhấp "+ Thêm Khối / Phòng ban gốc" để khởi tạo.
              </div>
            ) : (
              renderTreeNodes(tree)
            )}
          </div>
        </div>

        {/* Cột phải: Chi tiết nhóm & Phân bổ nhân sự */}
        <div className="org-details-panel">
          {selectedNode ? (
            <Card className="node-detail-card">
              <div className="node-detail-header">
                <div>
                  <h3>{selectedNode.name}</h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-danger-outline"
                  onClick={() => setDeletingDept(selectedNode)}
                >
                  Xóa Khối / Phòng này
                </Button>
              </div>
              <p className="detail-desc">{selectedNode.description || 'Không có mô tả chi tiết.'}</p>

              <div className="detail-props-grid">
                <div className="prop-item">
                  <span className="prop-label">Khu vực địa lý:</span>
                  <span className="prop-value">{selectedNode.region_name}</span>
                </div>
                <div className="prop-item">
                  <span className="prop-label">Trưởng nhóm phụ trách:</span>
                  <span className="prop-value">{selectedNode.leader_name}</span>
                </div>
                <div className="prop-item">
                  <span className="prop-label">Phạm vi dữ liệu:</span>
                  <span className="prop-value scope-badge">TEAM (Bao gồm các nhóm con trực thuộc)</span>
                </div>
              </div>

              <div className="members-section">
                <h4>Danh sách thành viên thuộc nhóm ({selectedNode.members?.length || 0})</h4>
                <div className="members-table-wrapper">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedNode.members?.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.name}</strong></td>
                          <td>{m.email}</td>
                          <td><span className="role-tag">{m.role}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </Card>
          ) : (
            <div className="no-selection-placeholder">
              <h4>Chọn một phòng ban hoặc đội nhóm trên sơ đồ</h4>
              <p>Xem thông tin chi tiết khu vực địa lý, người phụ trách và danh sách thành viên trực thuộc.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm phòng ban */}
      {isDeptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeptModalOpen(false)}>
          <div className="modal-content org-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{parentIdForNewDept ? 'Thêm Đội nhóm / Phòng ban con' : 'Thêm Phòng ban gốc'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsDeptModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveDept}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Tên phòng ban / đội nhóm *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    placeholder="VD: Đội Kinh Doanh B2B Miền Bắc"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mã phòng ban *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Trưởng nhóm phụ trách *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.leader_name}
                    onChange={(e) => setDeptForm({ ...deptForm, leader_name: e.target.value })}
                    placeholder="Họ tên người phụ trách"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Khu vực địa lý phụ trách</label>
                  <select
                    value={deptForm.region_id}
                    onChange={(e) => setDeptForm({ ...deptForm, region_id: e.target.value })}
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Mô tả nhiệm vụ</label>
                  <textarea
                    rows={3}
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    placeholder="Mô tả chức năng, đối tượng khách hàng mục tiêu..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="secondary" onClick={() => setIsDeptModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Lưu phòng ban
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm khu vực */}
      {isRegionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegionModalOpen(false)}>
          <div className="modal-content org-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Khai báo Khu vực Địa lý mới</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsRegionModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRegion}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Tên khu vực *</label>
                  <input
                    type="text"
                    required
                    value={regionForm.name}
                    onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                    placeholder="VD: Khu vực Tây Nguyên"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mã khu vực *</label>
                  <input
                    type="text"
                    required
                    value={regionForm.code}
                    onChange={(e) => setRegionForm({ ...regionForm, code: e.target.value })}
                    placeholder="VD: KV-TN"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mô tả phạm vi các tỉnh thành</label>
                  <textarea
                    rows={3}
                    value={regionForm.description}
                    onChange={(e) => setRegionForm({ ...regionForm, description: e.target.value })}
                    placeholder="Gia Lai, Đắk Lắk, Lâm Đồng..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="secondary" onClick={() => setIsRegionModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Lưu khu vực
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa phòng ban */}
      {deletingDept && (
        <div className="modal-overlay" onClick={() => setDeletingDept(null)}>
          <div className="modal-content org-modal modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận xóa Khối / Phòng ban</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeletingDept(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px 0', fontSize: '14.5px', color: '#1e293b', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa phòng ban/đội nhóm:
              </p>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{deletingDept.name}</strong>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: 4 }}>
                  Mã: <code>{deletingDept.code}</code> | Trưởng nhóm: {deletingDept.leader_name}
                </div>
              </div>
              {deletingDept.children && deletingDept.children.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}>
                  Lưu ý: Phòng ban này đang có <strong>{deletingDept.children.length}</strong> nhánh con trực thuộc. Hệ thống sẽ chặn xóa cho tới khi các nhánh con được giải phóng hoặc chuyển đi.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setDeletingDept(null)}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                onClick={handleConfirmDeleteDept}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
