import { useState, useEffect, useMemo } from 'react'
import type {
  AutomationRule,
  AutomationExecutionLog,
  AutomationEntity,
  AutomationTriggerType,
  AutomationAction,
} from '../../types/workflowAutomation.ts'
import { workflowAutomationService } from '../../services/workflowAutomationService.ts'
import Button from '../../components/ui/Button.tsx'
import Pagination from '../../components/ui/Pagination.tsx'
import './WorkflowAutomationPage.css'

export default function WorkflowAutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([])
  const [activeTab, setActiveTab] = useState<'RULES' | 'LOGS'>('RULES')
  const [searchTerm, setSearchTerm] = useState('')
  const [rulesPage, setRulesPage] = useState<number>(1)
  const [rulesPageSize, setRulesPageSize] = useState<number>(4)
  const [logsPage, setLogsPage] = useState<number>(1)
  const [logsPageSize, setLogsPageSize] = useState<number>(10)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formEntity, setFormEntity] = useState<AutomationEntity>('OPPORTUNITY')
  const [formTriggerType, setFormTriggerType] = useState<AutomationTriggerType>('STAGE_CHANGED')
  const [formTargetStage, setFormTargetStage] = useState('Báo giá')
  const [formTargetStatus, setFormTargetStatus] = useState('QUALIFIED')
  const [formDays, setFormDays] = useState(3)

  // Actions in modal
  const [enableTask, setEnableTask] = useState(true)
  const [taskTitle, setTaskTitle] = useState('Gọi điện chăm sóc báo giá')
  const [taskType, setTaskType] = useState<'CALL' | 'MEETING' | 'EMAIL' | 'NOTE'>('CALL')
  const [taskDueDays, setTaskDueDays] = useState(3)
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH')

  const [enableNotify, setEnableNotify] = useState(true)
  const [notifyTitle, setNotifyTitle] = useState('Nhắc nhở: Liên hệ khách hàng sau báo giá')
  const [notifyMsg, setNotifyMsg] = useState('Cơ hội đã chuyển sang giai đoạn Báo giá. Vui lòng gọi lại tư vấn phương án.')
  const [notifyTarget, setNotifyTarget] = useState<'CURRENT_OWNER' | 'MANAGER' | 'ALL_MEMBERS'>('CURRENT_OWNER')

  const [enableReassign, setEnableReassign] = useState(false)
  const [reassignName, setReassignName] = useState('Admin (Quản trị viên)')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = () => {
    setRules(workflowAutomationService.getRules())
    setLogs(workflowAutomationService.getLogs())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggle = (id: string, current: boolean) => {
    workflowAutomationService.toggleRuleActive(id, !current)
    loadData()
    showToast(!current ? 'Đã bật kích hoạt quy tắc tự động' : 'Đã tạm dừng quy tắc tự động')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá quy tắc tự động này?')) {
      workflowAutomationService.deleteRule(id)
      loadData()
      showToast('Đã xoá quy tắc thành công')
    }
  }

  const handleTestRun = (rule: AutomationRule) => {
    try {
      const sampleNames: Record<AutomationEntity, string> = {
        OPPORTUNITY: 'Triển khai CRM Doanh nghiệp Demo',
        LEAD: 'Công ty Cổ phần Alpha Global',
        CONTRACT: 'Hợp đồng bảo trì hạ tầng 2026',
      }
      const log = workflowAutomationService.executeRule(rule.id, {
        name: sampleNames[rule.trigger.entity] || 'Đối tượng thử nghiệm',
      })
      loadData()
      showToast(`Chạy thử nghiệm thành công! Đã ghi ${log.actions_taken.length} hành động vào nhật ký.`)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingRuleId(null)
    setFormName('')
    setFormDesc('')
    setFormEntity('OPPORTUNITY')
    setFormTriggerType('STAGE_CHANGED')
    setFormTargetStage('Báo giá')
    setFormTargetStatus('QUALIFIED')
    setFormDays(3)

    setEnableTask(true)
    setTaskTitle('Gọi điện chăm sóc phương án báo giá')
    setTaskType('CALL')
    setTaskDueDays(3)
    setTaskPriority('HIGH')

    setEnableNotify(true)
    setNotifyTitle('Quy tắc tự động: Nhắc gọi lại khách hàng')
    setNotifyMsg('Cơ hội đã chuyển sang Báo giá. Hãy liên hệ lại sau 3 ngày.')
    setNotifyTarget('CURRENT_OWNER')

    setEnableReassign(false)
    setReassignName('Admin (Quản trị viên)')

    setIsModalOpen(true)
  }

  const handleOpenEditModal = (rule: AutomationRule) => {
    setEditingRuleId(rule.id)
    setFormName(rule.name)
    setFormDesc(rule.description || '')
    setFormEntity(rule.trigger.entity)
    setFormTriggerType(rule.trigger.type)
    setFormTargetStage(rule.trigger.target_stage_name || 'Báo giá')
    setFormTargetStatus(rule.trigger.target_status || 'QUALIFIED')
    setFormDays(rule.trigger.days || 3)

    // Check actions
    const taskAct = rule.actions.find((a) => a.type === 'CREATE_TASK')
    if (taskAct && taskAct.task_params) {
      setEnableTask(true)
      setTaskTitle(taskAct.task_params.task_title)
      setTaskType(taskAct.task_params.task_type)
      setTaskDueDays(taskAct.task_params.due_days)
      setTaskPriority(taskAct.task_params.priority)
    } else {
      setEnableTask(false)
    }

    const notifyAct = rule.actions.find((a) => a.type === 'SEND_NOTIFICATION')
    if (notifyAct && notifyAct.notification_params) {
      setEnableNotify(true)
      setNotifyTitle(notifyAct.notification_params.title)
      setNotifyMsg(notifyAct.notification_params.message)
      setNotifyTarget(notifyAct.notification_params.recipient_target)
    } else {
      setEnableNotify(false)
    }

    const reassignAct = rule.actions.find((a) => a.type === 'REASSIGN_OWNER')
    if (reassignAct && reassignAct.reassign_params) {
      setEnableReassign(true)
      setReassignName(reassignAct.reassign_params.new_owner_name)
    } else {
      setEnableReassign(false)
    }

    setIsModalOpen(true)
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      alert('Vui lòng nhập tên quy tắc tự động.')
      return
    }

    if (!enableTask && !enableNotify && !enableReassign) {
      alert('Vui lòng chọn ít nhất 1 hành động (Tạo công việc, Gửi thông báo hoặc Đổi người sở hữu).')
      return
    }

    const actions: AutomationAction[] = []
    if (enableTask) {
      actions.push({
        id: `act-task-${Date.now()}`,
        type: 'CREATE_TASK',
        task_params: {
          task_title: taskTitle.trim() || 'Công việc tự động',
          task_type: taskType,
          due_days: Number(taskDueDays) || 1,
          priority: taskPriority,
        },
      })
    }
    if (enableNotify) {
      actions.push({
        id: `act-notify-${Date.now()}`,
        type: 'SEND_NOTIFICATION',
        notification_params: {
          title: notifyTitle.trim() || 'Thông báo tự động',
          message: notifyMsg.trim() || 'Hệ thống đã kích hoạt quy trình tự động.',
          recipient_target: notifyTarget,
        },
      })
    }
    if (enableReassign) {
      actions.push({
        id: `act-reassign-${Date.now()}`,
        type: 'REASSIGN_OWNER',
        reassign_params: {
          new_owner_id: 'usr-new-assignee',
          new_owner_name: reassignName,
          reason: 'Tự động phân bổ lại theo quy tắc khi-thì',
        },
      })
    }

    workflowAutomationService.saveRule({
      id: editingRuleId || undefined,
      name: formName.trim(),
      description: formDesc.trim(),
      trigger: {
        entity: formEntity,
        type: formTriggerType,
        target_stage_name: formTriggerType === 'STAGE_CHANGED' ? formTargetStage : undefined,
        target_status: formTriggerType === 'STATUS_CHANGED' ? formTargetStatus : undefined,
        days: ['DAYS_AFTER_CREATION', 'DAYS_BEFORE_EXPIRY', 'INACTIVITY_DAYS'].includes(formTriggerType) ? Number(formDays) : undefined,
      },
      actions,
    })

    loadData()
    setIsModalOpen(false)
    showToast(editingRuleId ? 'Cập nhật quy tắc thành công' : 'Đã tạo mới quy tắc tự động thành công')
  }

  // Format relative time helper
  const formatTime = (iso?: string) => {
    if (!iso) return 'Chưa chạy'
    try {
      const d = new Date(iso)
      return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return iso
    }
  }

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      l.rule_name.toLowerCase().includes(term) ||
      l.target_name.toLowerCase().includes(term) ||
      l.trigger_event.toLowerCase().includes(term)
    )
  })

  const totalRulesPages = Math.max(1, Math.ceil(rules.length / rulesPageSize))
  const pagedRules = useMemo(() => {
    const start = (rulesPage - 1) * rulesPageSize
    return rules.slice(start, start + rulesPageSize)
  }, [rules, rulesPage, rulesPageSize])

  const totalLogsPages = Math.max(1, Math.ceil(filteredLogs.length / logsPageSize))
  const pagedLogs = useMemo(() => {
    const start = (logsPage - 1) * logsPageSize
    return filteredLogs.slice(start, start + logsPageSize)
  }, [filteredLogs, logsPage, logsPageSize])

  // Natural language description for modal preview
  const generatePreviewText = () => {
    const entityName = formEntity === 'OPPORTUNITY' ? 'Cơ hội bán hàng' : formEntity === 'LEAD' ? 'Khách hàng tiềm năng (Lead)' : 'Hợp đồng'
    let condStr = ''
    if (formTriggerType === 'STAGE_CHANGED') {
      condStr = `chuyển sang giai đoạn "${formTargetStage}"`
    } else if (formTriggerType === 'STATUS_CHANGED') {
      condStr = `chuyển trạng thái sang "${formTargetStatus}"`
    } else if (formTriggerType === 'DAYS_AFTER_CREATION') {
      condStr = `đã tạo được ${formDays} ngày`
    } else if (formTriggerType === 'DAYS_BEFORE_EXPIRY') {
      condStr = `còn ${formDays} ngày trước khi hết hạn`
    } else if (formTriggerType === 'INACTIVITY_DAYS') {
      condStr = `không có tương tác nào trong ${formDays} ngày liên tiếp`
    }

    const actionParts: string[] = []
    if (enableTask) actionParts.push(`tự động tạo công việc "${taskTitle}" (hạn sau ${taskDueDays} ngày)`)
    if (enableNotify) actionParts.push(`gửi thông báo in-app đến ${notifyTarget === 'CURRENT_OWNER' ? 'Người phụ trách' : 'Quản lý'}`)
    if (enableReassign) actionParts.push(`đổi người phụ trách sang "${reassignName}"`)

    if (actionParts.length === 0) return 'Vui lòng chọn ít nhất một hành động thực thi.'
    return `KHI [${entityName}] [${condStr}] ➔ THÌ hệ thống sẽ ${actionParts.join(' VÀ ')}.`
  }

  return (
    <div className="workflow-automation-page" id="workflow-automation-page">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="action-notice-toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="automation-header">
        <div>
          <h1>
            <span>Quy tắc tự động hoá quy trình</span>
          </h1>
        </div>
        <Button
          type="button"
          variant="primary"
          id="btn-create-automation-rule"
          onClick={handleOpenCreateModal}
        >
          Thêm quy tắc mới
        </Button>
      </div>

      {/* Tabs */}
      <div className="automation-tabs">
        <button
          type="button"
          className={`automation-tab-btn ${activeTab === 'RULES' ? 'active' : ''}`}
          onClick={() => setActiveTab('RULES')}
        >
          <span>Danh sách quy tắc</span>
          <span className="tab-badge">{rules.length}</span>
        </button>
        <button
          type="button"
          className={`automation-tab-btn ${activeTab === 'LOGS' ? 'active' : ''}`}
          onClick={() => setActiveTab('LOGS')}
        >
          <span>Nhật ký thực thi (Audit Logs)</span>
          <span className="tab-badge">{logs.length}</span>
        </button>
      </div>

      {/* TAB 1: RULES BUILDER */}
      {activeTab === 'RULES' && (
        <>
        <div className="rules-grid" id="rules-grid-container">
          {pagedRules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`rule-card ${!rule.is_active ? 'inactive' : ''}`}
                id={`rule-card-${rule.id}`}
              >
                {/* Header of Card */}
                <div className="rule-card-header">
                  <div className="rule-card-title-group">
                    <h3 className="rule-card-title">{rule.name}</h3>
                    {rule.description && <p className="rule-card-desc">{rule.description}</p>}
                  </div>
                  <div className="switch-container">
                    <span className="switch-label">
                      {rule.is_active ? 'Đang bật' : 'Tắt'}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={rule.is_active}
                        onChange={() => handleToggle(rule.id, rule.is_active)}
                        aria-label={`Bật tắt quy tắc ${rule.name}`}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Blueprint Flow */}
                <div className="rule-blueprint">
                  {/* Step 1: WHEN */}
                  <div className="blueprint-step">
                    <span className="blueprint-tag-when">KHI (When)</span>
                    <span className="blueprint-text">
                      {workflowAutomationService.describeTrigger(rule)}
                    </span>
                  </div>

                  {/* Step 2: THEN */}
                  <div className="blueprint-step">
                    <span className="blueprint-tag-then">THÌ (Then)</span>
                    <div className="blueprint-actions-list">
                      {rule.actions.map((act) => {
                        if (act.type === 'CREATE_TASK' && act.task_params) {
                          return (
                            <div key={act.id} className="action-pill">
                              <span className="pill-badge pill-task">Tạo việc</span>
                              <span>
                                <strong>{act.task_params.task_title}</strong> (hạn {act.task_params.due_days} ngày, ưu tiên {act.task_params.priority})
                              </span>
                            </div>
                          )
                        }
                        if (act.type === 'SEND_NOTIFICATION' && act.notification_params) {
                          return (
                            <div key={act.id} className="action-pill">
                              <span className="pill-badge pill-notify">Thông báo</span>
                              <span>
                                {act.notification_params.title} ➔ <em>{act.notification_params.recipient_target === 'CURRENT_OWNER' ? 'Người phụ trách' : 'Quản lý'}</em>
                              </span>
                            </div>
                          )
                        }
                        if (act.type === 'REASSIGN_OWNER' && act.reassign_params) {
                          return (
                            <div key={act.id} className="action-pill">
                              <span className="pill-badge pill-reassign">Đổi phụ trách</span>
                              <span>Chuyển sang: <strong>{act.reassign_params.new_owner_name}</strong></span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="rule-card-footer">
                  <div>
                    <span>Đã chạy: <strong>{rule.execution_count} lần</strong></span>
                    {rule.last_executed_at && (
                      <span style={{ marginLeft: 8 }}>• Lần gần nhất: {formatTime(rule.last_executed_at)}</span>
                    )}
                  </div>
                  <div className="rule-actions-btns">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={() => handleTestRun(rule)}
                      title="Chạy thử quy tắc và ghi nhận vào nhật ký thực thi"
                    >
                      Chạy thử
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={() => handleOpenEditModal(rule)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#ef4444' }}
                      onClick={() => handleDelete(rule.id)}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {rules.length > 0 && (
          <Pagination
            currentPage={rulesPage}
            totalPages={totalRulesPages}
            totalItems={rules.length}
            pageSize={rulesPageSize}
            onPageChange={setRulesPage}
            onPageSizeChange={(sz: number) => {
              setRulesPageSize(sz)
              setRulesPage(1)
            }}
            pageSizeOptions={[2, 4, 8]}
            itemName="quy tắc"
          />
        )}
        </>
      )}

      {/* TAB 2: EXECUTION AUDIT LOGS */}
      {activeTab === 'LOGS' && (
        <div className="logs-container" id="logs-container">
          <div className="logs-toolbar">
            <input
              type="text"
              className="logs-search-input"
              placeholder="Tìm kiếm theo quy tắc, đối tượng áp dụng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn xoá toàn bộ lịch sử chạy quy tắc?')) {
                  workflowAutomationService.clearLogs()
                  loadData()
                  showToast('Đã dọn dẹp nhật ký thực thi')
                }
              }}
            >
              Dọn dẹp nhật ký
            </button>
          </div>

          <table className="logs-table" id="automation-audit-logs-table">
            <thead>
              <tr>
                <th style={{ width: 170 }}>Thời gian</th>
                <th style={{ width: 220 }}>Quy tắc tự động</th>
                <th style={{ width: 220 }}>Đối tượng áp dụng</th>
                <th>Sự kiện kích hoạt & Hành động đã chạy</th>
                <th style={{ width: 110, textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Chưa có lượt chạy quy tắc nào phù hợp.
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log: AutomationExecutionLog) => (
                  <tr key={log.id}>
                    <td style={{ color: '#64748b', fontSize: '0.825rem' }}>
                      {formatTime(log.executed_at)}
                    </td>
                    <td>
                      <strong style={{ color: '#1e293b' }}>{log.rule_name}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>{log.target_name}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Phân hệ: {log.entity}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: 4 }}>
                        <em>{log.trigger_event}</em>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {log.actions_taken.map((actText, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                            ✓ {actText}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${log.status === 'SUCCESS' ? 'success' : 'failed'}`}>
                        {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredLogs.length > 0 && (
            <Pagination
              currentPage={logsPage}
              totalPages={totalLogsPages}
              totalItems={filteredLogs.length}
              pageSize={logsPageSize}
              onPageChange={setLogsPage}
              onPageSizeChange={(sz: number) => {
                setLogsPageSize(sz)
                setLogsPage(1)
              }}
              pageSizeOptions={[5, 10, 20]}
              itemName="nhật ký"
            />
          )}
        </div>
      )}

      {/* MODAL: TẠO / SỬA QUY TẮC KHI - THÌ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>{editingRuleId ? 'Chỉnh sửa quy tắc tự động' : 'Tạo mới quy tắc tự động (Khi - Thì)'}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="modal-body-custom">
                {/* General Info */}
                <div className="form-group-custom">
                  <label>Tên quy tắc tự động (*):</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="Ví dụ: Tự tạo việc nhắc gọi sau 3 ngày khi Cơ hội sang Báo giá"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label>Mô tả quy tắc:</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="Giải thích mục đích và nghiệp vụ của quy tắc..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                {/* Section 1: KHI (WHEN) */}
                <div className="section-box">
                  <div className="section-title">
                    <span style={{ color: '#ef4444' }}>BƯỚC 1: ĐIỀU KIỆN KÍCH HOẠT (KHI - WHEN)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group-custom">
                      <label>Đối tượng áp dụng:</label>
                      <select
                        className="form-select-custom"
                        value={formEntity}
                        onChange={(e) => setFormEntity(e.target.value as AutomationEntity)}
                      >
                        <option value="OPPORTUNITY">Cơ hội bán hàng (Opportunity)</option>
                        <option value="LEAD">Khách hàng tiềm năng (Lead)</option>
                        <option value="CONTRACT">Hợp đồng (Contract)</option>
                      </select>
                    </div>

                    <div className="form-group-custom">
                      <label>Loại điều kiện kích hoạt:</label>
                      <select
                        className="form-select-custom"
                        value={formTriggerType}
                        onChange={(e) => setFormTriggerType(e.target.value as AutomationTriggerType)}
                      >
                        <option value="STAGE_CHANGED">Thay đổi giai đoạn (Stage Changed)</option>
                        <option value="STATUS_CHANGED">Thay đổi trạng thái (Status Changed)</option>
                        <option value="DAYS_AFTER_CREATION">Mốc thời gian sau khi tạo (X ngày)</option>
                        <option value="DAYS_BEFORE_EXPIRY">Mốc thời gian trước khi hết hạn (X ngày)</option>
                        <option value="INACTIVITY_DAYS">Không có tương tác liên tiếp (X ngày)</option>
                      </select>
                    </div>
                  </div>

                  {formTriggerType === 'STAGE_CHANGED' && (
                    <div className="form-group-custom">
                      <label>Khi chuyển sang giai đoạn:</label>
                      <select
                        className="form-select-custom"
                        value={formTargetStage}
                        onChange={(e) => setFormTargetStage(e.target.value)}
                      >
                        <option value="Khảo sát nhu cầu">Khảo sát nhu cầu</option>
                        <option value="Đề xuất giải pháp">Đề xuất giải pháp</option>
                        <option value="Báo giá">Báo giá</option>
                        <option value="Đàm phán & Pháp lý">Đàm phán & Pháp lý</option>
                        <option value="Chốt đơn thành công">Chốt đơn thành công</option>
                      </select>
                    </div>
                  )}

                  {formTriggerType === 'STATUS_CHANGED' && (
                    <div className="form-group-custom">
                      <label>Khi chuyển sang trạng thái:</label>
                      <select
                        className="form-select-custom"
                        value={formTargetStatus}
                        onChange={(e) => setFormTargetStatus(e.target.value)}
                      >
                        <option value="NEW">Mới (NEW)</option>
                        <option value="CONTACTED">Đã liên hệ (CONTACTED)</option>
                        <option value="QUALIFIED">Đã thẩm định - Tiềm năng cao (QUALIFIED)</option>
                        <option value="UNQUALIFIED">Không tiềm năng (UNQUALIFIED)</option>
                        <option value="ACTIVE">Hiệu lực (ACTIVE)</option>
                        <option value="EXPIRING">Sắp hết hạn (EXPIRING)</option>
                      </select>
                    </div>
                  )}

                  {['DAYS_AFTER_CREATION', 'DAYS_BEFORE_EXPIRY', 'INACTIVITY_DAYS'].includes(formTriggerType) && (
                    <div className="form-group-custom">
                      <label>Số ngày định mức mốc thời gian:</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="form-input-custom"
                        value={formDays}
                        onChange={(e) => setFormDays(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                {/* Section 2: THÌ (THEN) */}
                <div className="section-box">
                  <div className="section-title">
                    <span style={{ color: '#10b981' }}>BƯỚC 2: HÀNH ĐỘNG TỰ ĐỘNG THỰC THI (THÌ - THEN)</span>
                  </div>

                  {/* Action 1: Create Task */}
                  <div className={`action-checkbox-card ${enableTask ? 'active' : ''}`}>
                    <label className="action-checkbox-header">
                      <input
                        type="checkbox"
                        checked={enableTask}
                        onChange={(e) => setEnableTask(e.target.checked)}
                      />
                      <span>1. Tự động tạo công việc (Task / Activity)</span>
                    </label>

                    {enableTask && (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                        <div className="form-group-custom">
                          <label>Tiêu đề công việc:</label>
                          <input
                            type="text"
                            className="form-input-custom"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Tiêu đề việc..."
                          />
                        </div>
                        <div className="form-group-custom">
                          <label>Loại việc:</label>
                          <select
                            className="form-select-custom"
                            value={taskType}
                            onChange={(e) => setTaskType(e.target.value as 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE')}
                          >
                            <option value="CALL">Cuộc gọi</option>
                            <option value="MEETING">Cuộc gặp</option>
                            <option value="EMAIL">Gửi Email</option>
                            <option value="NOTE">Ghi chú</option>
                          </select>
                        </div>
                        <div className="form-group-custom">
                          <label>Hạn sau (ngày):</label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            className="form-input-custom"
                            value={taskDueDays}
                            onChange={(e) => setTaskDueDays(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group-custom">
                          <label>Ưu tiên:</label>
                          <select
                            className="form-select-custom"
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                          >
                            <option value="LOW">Thấp</option>
                            <option value="MEDIUM">Trung bình</option>
                            <option value="HIGH">Cao</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action 2: Send Notification */}
                  <div className={`action-checkbox-card ${enableNotify ? 'active' : ''}`}>
                    <label className="action-checkbox-header">
                      <input
                        type="checkbox"
                        checked={enableNotify}
                        onChange={(e) => setEnableNotify(e.target.checked)}
                      />
                      <span>2. Gửi thông báo in-app cho nhân viên / Quản lý</span>
                    </label>

                    {enableNotify && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr', gap: 10, marginTop: 8 }}>
                        <div className="form-group-custom">
                          <label>Tiêu đề thông báo:</label>
                          <input
                            type="text"
                            className="form-input-custom"
                            value={notifyTitle}
                            onChange={(e) => setNotifyTitle(e.target.value)}
                          />
                        </div>
                        <div className="form-group-custom">
                          <label>Nội dung:</label>
                          <input
                            type="text"
                            className="form-input-custom"
                            value={notifyMsg}
                            onChange={(e) => setNotifyMsg(e.target.value)}
                          />
                        </div>
                        <div className="form-group-custom">
                          <label>Người nhận:</label>
                          <select
                            className="form-select-custom"
                            value={notifyTarget}
                            onChange={(e) => setNotifyTarget(e.target.value as 'CURRENT_OWNER' | 'MANAGER' | 'ALL_MEMBERS')}
                          >
                            <option value="CURRENT_OWNER">Người phụ trách</option>
                            <option value="MANAGER">Quản lý trực tiếp</option>
                            <option value="ALL_MEMBERS">Toàn đội nhóm</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action 3: Reassign Owner */}
                  <div className={`action-checkbox-card ${enableReassign ? 'active' : ''}`}>
                    <label className="action-checkbox-header">
                      <input
                        type="checkbox"
                        checked={enableReassign}
                        onChange={(e) => setEnableReassign(e.target.checked)}
                      />
                      <span>3. Tự động đổi người sở hữu / phụ trách (Reassign)</span>
                    </label>

                    {enableReassign && (
                      <div style={{ marginTop: 8 }}>
                        <div className="form-group-custom">
                          <label>Chuyển giao cho nhân viên / Trưởng nhóm:</label>
                          <select
                            className="form-select-custom"
                            value={reassignName}
                            onChange={(e) => setReassignName(e.target.value)}
                          >
                            <option value="Admin (Quản trị viên)">Admin (Quản trị viên)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Natural language preview */}
                <div className="live-preview-box">
                  <strong>Trực quan hoá quy tắc:</strong>
                  <div style={{ marginTop: 4 }}>{generatePreviewText()}</div>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-save-automation-rule"
                >
                  {editingRuleId ? 'Lưu thay đổi' : 'Tạo quy tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
