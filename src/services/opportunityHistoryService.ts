import { API_BASE_URL } from './authService.ts'
import type { OpportunityFieldChange, RecordChangePayload } from '../types/opportunityHistory.ts'
import type { Opportunity } from '../types/opportunity.ts'

const STORAGE_KEY = 'crm_opportunity_field_history_v1'

function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function getStoredHistory(): OpportunityFieldChange[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveStoredHistory(list: OpportunityFieldChange[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

const formatCurrency = (val: number | string | undefined | null) => {
  const num = Number(val)
  if (isNaN(num)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export const opportunityHistoryService = {
  /**
   * Lấy lịch sử thay đổi của cơ hội (S6-01)
   */
  async getHistory(opportunityId: string): Promise<OpportunityFieldChange[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/history`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          // Lưu cache và trả về
          const allOther = getStoredHistory().filter((h) => h.opportunity_id !== opportunityId)
          saveStoredHistory([...data, ...allOther])
          return data.sort(
            (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
          )
        }
      }
    } catch {}

    const list = getStoredHistory()
    return list
      .filter((h) => h.opportunity_id === opportunityId)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
  },

  /**
   * Ghi nhận 1 dòng thay đổi (S6-01)
   */
  async recordChange(payload: RecordChangePayload): Promise<OpportunityFieldChange> {
    const newEntry: OpportunityFieldChange = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opportunity_id: payload.opportunity_id,
      field: payload.field,
      field_label: payload.field_label,
      old_value: String(payload.old_value ?? ''),
      new_value: String(payload.new_value ?? ''),
      old_display: payload.old_display ?? String(payload.old_value ?? ''),
      new_display: payload.new_display ?? String(payload.new_value ?? ''),
      reason: payload.reason || '',
      changed_by_id: payload.changed_by_id,
      changed_by_name: payload.changed_by_name || 'Hệ thống / Người dùng',
      changed_at: new Date().toISOString(),
    }

    try {
      await fetch(`${API_BASE_URL}/opportunities/${payload.opportunity_id}/history`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newEntry),
      })
    } catch {}

    const list = getStoredHistory()
    const updated = [newEntry, ...list]
    saveStoredHistory(updated)
    return newEntry
  },

  /**
   * Tự động so sánh cơ hội trước và sau thay đổi để ghi nhật ký chi tiết (S6-01)
   */
  async recordOpportunityDiff(
    oldOpp: Opportunity,
    newOpp: Opportunity,
    changedBy: { id?: number; name: string },
    reason?: string
  ): Promise<OpportunityFieldChange[]> {
    const changes: RecordChangePayload[] = []

    // 1. Thay đổi Giai đoạn
    if (oldOpp.stage_id !== newOpp.stage_id || oldOpp.stage_name !== newOpp.stage_name) {
      changes.push({
        opportunity_id: oldOpp.id,
        field: 'stage',
        field_label: 'Giai đoạn Pipeline',
        old_value: oldOpp.stage_id || '',
        new_value: newOpp.stage_id || '',
        old_display: oldOpp.stage_name || oldOpp.stage_id,
        new_display: newOpp.stage_name || newOpp.stage_id,
        reason: reason || 'Chuyển tiến trình bán hàng',
        changed_by_id: changedBy.id,
        changed_by_name: changedBy.name,
      })
    }

    // 2. Thay đổi Giá trị (Doanh số dự kiến)
    const oldRev = Number(oldOpp.expected_revenue) || 0
    const newRev = Number(newOpp.expected_revenue) || 0
    if (oldRev !== newRev) {
      changes.push({
        opportunity_id: oldOpp.id,
        field: 'expected_revenue',
        field_label: 'Doanh số dự kiến',
        old_value: String(oldRev),
        new_value: String(newRev),
        old_display: formatCurrency(oldRev),
        new_display: formatCurrency(newRev),
        reason: reason || (newRev > oldRev ? 'Tăng quy mô đơn hàng / sản phẩm' : 'Điều chỉnh giảm ngân sách'),
        changed_by_id: changedBy.id,
        changed_by_name: changedBy.name,
      })
    }

    // 3. Thay đổi Ngày chốt dự kiến
    const oldClose = oldOpp.expected_close_date ? oldOpp.expected_close_date.split('T')[0] : ''
    const newClose = newOpp.expected_close_date ? newOpp.expected_close_date.split('T')[0] : ''
    if (oldClose && newClose && oldClose !== newClose) {
      changes.push({
        opportunity_id: oldOpp.id,
        field: 'expected_close_date',
        field_label: 'Ngày dự kiến chốt',
        old_value: oldClose,
        new_value: newClose,
        old_display: oldClose,
        new_display: newClose,
        reason: reason || 'Khách hàng dời lịch ký hợp đồng',
        changed_by_id: changedBy.id,
        changed_by_name: changedBy.name,
      })
    }

    // 4. Thay đổi Người sở hữu
    if (
      (oldOpp.owner_id && newOpp.owner_id && oldOpp.owner_id !== newOpp.owner_id) ||
      (oldOpp.owner_name && newOpp.owner_name && oldOpp.owner_name !== newOpp.owner_name)
    ) {
      changes.push({
        opportunity_id: oldOpp.id,
        field: 'owner',
        field_label: 'Người phụ trách (Owner)',
        old_value: String(oldOpp.owner_id || oldOpp.owner_name),
        new_value: String(newOpp.owner_id || newOpp.owner_name),
        old_display: oldOpp.owner_name || `NV #${oldOpp.owner_id}`,
        new_display: newOpp.owner_name || `NV #${newOpp.owner_id}`,
        reason: reason || 'Phân công lại cơ hội bán hàng',
        changed_by_id: changedBy.id,
        changed_by_name: changedBy.name,
      })
    }

    // 5. Thay đổi Xác suất thắng
    if (oldOpp.win_probability !== newOpp.win_probability && typeof newOpp.win_probability === 'number') {
      changes.push({
        opportunity_id: oldOpp.id,
        field: 'win_probability',
        field_label: 'Xác suất thắng',
        old_value: `${oldOpp.win_probability}%`,
        new_value: `${newOpp.win_probability}%`,
        old_display: `${oldOpp.win_probability}%`,
        new_display: `${newOpp.win_probability}%`,
        reason: reason || 'Cập nhật đánh giá khả năng chốt',
        changed_by_id: changedBy.id,
        changed_by_name: changedBy.name,
      })
    }

    const recorded: OpportunityFieldChange[] = []
    for (const c of changes) {
      const res = await this.recordChange(c)
      recorded.push(res)
    }
    return recorded
  },
}
