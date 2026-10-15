import { API_BASE_URL } from './authService.ts'
import type { OpportunityAttachment, UploadAttachmentPayload } from '../types/opportunityAttachment.ts'
import type { Opportunity } from '../types/opportunity.ts'

const STORAGE_KEY = 'crm_opportunity_attachments_v1'

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

function getStoredAttachments(): OpportunityAttachment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveStoredAttachments(list: OpportunityAttachment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

export const opportunityAttachmentService = {
  /**
   * Lấy danh sách tài liệu đính kèm của một cơ hội (S6-04)
   */
  async getAttachments(opportunityId: string): Promise<OpportunityAttachment[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/attachments`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          const others = getStoredAttachments().filter((a) => a.opportunity_id !== opportunityId)
          saveStoredAttachments([...data, ...others])
          return data.sort(
            (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
          )
        }
      }
    } catch {}

    const all = getStoredAttachments()
    return all
      .filter((a) => a.opportunity_id === opportunityId)
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
  },

  /**
   * Tải lên tài liệu (S6-04 AC: Tối đa 20MB / tệp)
   */
  async uploadAttachment(payload: UploadAttachmentPayload): Promise<OpportunityAttachment> {
    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (payload.file_size > MAX_SIZE) {
      throw new Error(`Tệp "${payload.file_name}" vượt quá giới hạn dung lượng 20MB cho phép!`)
    }

    const newAttachment: OpportunityAttachment = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opportunity_id: payload.opportunity_id,
      file_name: payload.file_name,
      file_size: payload.file_size,
      file_type: payload.file_type,
      category: payload.category || 'Tài liệu khác',
      notes: payload.notes || '',
      uploaded_by_id: payload.uploaded_by_id,
      uploaded_by_name: payload.uploaded_by_name,
      uploaded_at: new Date().toISOString(),
    }

    try {
      await fetch(`${API_BASE_URL}/opportunities/${payload.opportunity_id}/attachments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAttachment),
      })
    } catch {}

    const list = getStoredAttachments()
    const updated = [newAttachment, ...list]
    saveStoredAttachments(updated)
    return newAttachment
  },

  /**
   * Xóa tài liệu đính kèm
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

    const list = getStoredAttachments().filter((a) => a.id !== attachmentId)
    saveStoredAttachments(list)
  },

  /**
   * Kiểm tra quyền tải xuống tài liệu (S6-04 AC2: Chỉ người sở hữu và người được chia sẻ mới tải xuống được)
   */
  canDownload(opportunity: Opportunity, user: any): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Vui lòng đăng nhập để tải xuống tài liệu.' }
    }

    // Quản trị viên và Quản lý luôn có quyền
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      return { allowed: true }
    }

    // Người sở hữu chính
    const currentUserId = Number(user.id)
    if (opportunity.owner_id === currentUserId) {
      return { allowed: true }
    }

    // Thành viên được chia sẻ cơ hội (S6-03)
    const isShared = (opportunity.shared_members || []).some(
      (m) => m.user_id === currentUserId
    )
    if (isShared) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: 'Chỉ người sở hữu cơ hội và thành viên được chia sẻ mới có quyền tải xuống tài liệu này.',
    }
  },
}
