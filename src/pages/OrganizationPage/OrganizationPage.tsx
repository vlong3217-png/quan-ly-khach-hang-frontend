import { useState } from 'react'
import { organizationService } from '../../services/organizationService.ts'
import type { DepartmentNode, Region } from '../../types/organization.ts'
import './OrganizationPage.css'

export default function OrganizationPage() {
  const [tree, setTree] = useState<DepartmentNode[]>(() => organizationService.getDepartmentTree())
  const [regions, setRegions] = useState<Region[]>(() => organizationService.getRegions())
  const [selectedNode, setSelectedNode] = useState<DepartmentNode | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal tạo nhóm mới
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const reloadData = () => {
    setTree(organizationService.getDepartmentTree())
    setRegions(organizationService.getRegions())
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

  // Render đệ quy cây tổ chức
  const renderTreeNodes = (nodes: DepartmentNode[], depth = 0) => {
    return (
      <ul className={`tree-branch depth-${depth}`}>
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id
          return (
            <li key={node.id} className="tree-leaf">
              <div
                className={`tree-node-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="node-badge-code">{node.code}</div>
                <div className="node-content">
                  <div className="node-title">
                    <strong>{node.name}</strong>
                  </div>
                  <div className="node-meta">
                    <span>Trưởng nhóm: <strong>{node.leader_name}</strong></span>
                    <span className="region-tag">{node.region_name}</span>
                    <span className="member-count-tag">{node.members?.length || 0} nhân sự</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="add-sub-dept-btn"
                  title="Thêm nhóm con trực thuộc"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenAddDept(node.id)
                  }}
                >
                  + Nhánh con
                </button>
              </div>

              {node.children && node.children.length > 0 && renderTreeNodes(node.children, depth + 1)}
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

      <div className="org-header">
        <div>
          <h2>Cơ cấu Tổ chức Kinh doanh & Khu vực địa lý</h2>
        </div>
        <div className="org-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setIsRegionModalOpen(true)}>
            Khai báo Khu vực
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleOpenAddDept(null)}>
            + Thêm Khối / Phòng ban gốc
          </button>
        </div>
      </div>

      <div className="org-layout">
        {/* Cột trái: Cây cấu trúc tổ chức */}
        <div className="org-tree-panel">
          <div className="panel-title">
            <span>Cây sơ đồ tổ chức (Organization Hierarchy)</span>
            <small>Click vào nhóm để xem danh sách nhân sự</small>
          </div>
          <div className="tree-scroll-wrapper">{renderTreeNodes(tree)}</div>
        </div>

        {/* Cột phải: Chi tiết nhóm & Phân bổ nhân sự */}
        <div className="org-details-panel">
          {selectedNode ? (
            <div className="node-detail-card">
              <div className="node-detail-header">
                <h3>{selectedNode.name}</h3>
                <span className="detail-code">{selectedNode.code}</span>
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
            </div>
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
                    placeholder="VD: Trần Thị Bình"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Gán Khu vực địa lý *</label>
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
                    rows={2}
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDeptModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo phòng ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khai báo Khu vực địa lý */}
      {isRegionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegionModalOpen(false)}>
          <div className="modal-content org-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Khai báo Khu vực địa lý mới</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsRegionModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRegion}>
              <div className="modal-body">
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
                  <label>Tên khu vực địa lý *</label>
                  <input
                    type="text"
                    required
                    value={regionForm.name}
                    onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                    placeholder="VD: Khu vực Tây Nguyên"
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mô tả phạm vi</label>
                  <textarea
                    rows={2}
                    value={regionForm.description}
                    onChange={(e) => setRegionForm({ ...regionForm, description: e.target.value })}
                    placeholder="Các tỉnh thành thuộc địa bàn..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRegionModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Thêm khu vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
