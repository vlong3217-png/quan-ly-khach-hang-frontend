import type {
  Lead,
  LeadScoreTier,
  LeadSegment,
  LeadScoreBreakdown,
  LeadScoringRule,
  UpdateLeadScorePayload,
  ScoreReasonItem,
} from '../types/lead.ts'
import { API_BASE_URL } from './authService.ts'

const STORAGE_KEY_LEADS = 'crm_leads_master_data'

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
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

function getStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveStoredLeads(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads))
}

/**
 * Các quy tắc chấm điểm Lead hệ thống (Scoring Rules Engine)
 */
export const DEFAULT_SCORING_RULES: LeadScoringRule[] = [
  {
    id: 'rule-demo-company',
    name: 'Có tên công ty / doanh nghiệp',
    category: 'DEMOGRAPHIC',
    condition_label: 'Hồ sơ có khai báo tên công ty hoặc doanh nghiệp hợp lệ',
    points: 15,
    is_active: true,
  },
  {
    id: 'rule-demo-corp-email',
    name: 'Email định danh doanh nghiệp',
    category: 'DEMOGRAPHIC',
    condition_label: 'Sử dụng email tên miền riêng (không phải @gmail, @yahoo, @outlook...)',
    points: 10,
    is_active: true,
  },
  {
    id: 'rule-demo-target-industry',
    name: 'Ngành nghề ưu tiên trọng điểm',
    category: 'DEMOGRAPHIC',
    condition_label: 'Thuộc lĩnh vực CNTT, Sản xuất, Vận tải, Tài chính, Bất động sản, Y tế',
    points: 10,
    is_active: true,
  },
  {
    id: 'rule-eng-req-detail',
    name: 'Nhu cầu cụ thể & chi tiết',
    category: 'ENGAGEMENT',
    condition_label: 'Nhu cầu tư vấn được mô tả rõ ràng (từ 15 ký tự trở lên)',
    points: 20,
    is_active: true,
  },
  {
    id: 'rule-eng-high-intent',
    name: 'Từ khóa ý định mua cao',
    category: 'ENGAGEMENT',
    condition_label: 'Có từ khóa: triển khai, báo giá, demo, hợp đồng, tích hợp, chi phí, dùng thử',
    points: 10,
    is_active: true,
  },
  {
    id: 'rule-eng-campaign',
    name: 'Chuyển đổi từ Chiến dịch Tiếp thị',
    category: 'ENGAGEMENT',
    condition_label: 'Gắn liền với chiến dịch Marketing cụ thể đang triển khai',
    points: 10,
    is_active: true,
  },
  {
    id: 'rule-src-referral',
    name: 'Nguồn giới thiệu (Referral)',
    category: 'SOURCE',
    condition_label: 'Được giới thiệu từ khách hàng cũ hoặc đối tác tin cậy',
    points: 25,
    is_active: true,
  },
  {
    id: 'rule-src-event',
    name: 'Nguồn Sự kiện / Hội thảo (Event)',
    category: 'SOURCE',
    condition_label: 'Thu thập từ hội thảo, triển lãm ngành',
    points: 20,
    is_active: true,
  },
  {
    id: 'rule-src-webform',
    name: 'Biểu mẫu Website chính thức (Web Form)',
    category: 'SOURCE',
    condition_label: 'Khách chủ động điền form liên hệ trên website',
    points: 15,
    is_active: true,
  },
  {
    id: 'rule-deduct-no-company',
    name: 'Khách hàng cá nhân không công ty',
    category: 'DEMOGRAPHIC',
    condition_label: 'Thiếu tên doanh nghiệp hoặc mua dạng đơn lẻ',
    points: -10,
    is_active: true,
  },
  {
    id: 'rule-deduct-no-req',
    name: 'Không để lại nhu cầu',
    category: 'ENGAGEMENT',
    condition_label: 'Bỏ trống nhu cầu tư vấn hoặc thông tin rất sơ sài',
    points: -10,
    is_active: true,
  },
]

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'mail.com']
const PRIORITY_INDUSTRIES = [
  'công nghệ thông tin',
  'cntt',
  'phần mềm',
  'sản xuất',
  'vận tải',
  'logistics',
  'tài chính',
  'ngân hàng',
  'bảo hiểm',
  'bất động sản',
  'y tế',
  'giáo dục',
]
const HIGH_INTENT_KEYWORDS = [
  'triển khai',
  'báo giá',
  'hợp đồng',
  'demo',
  'dùng thử',
  'tích hợp',
  'chi phí',
  'tư vấn gói',
  'mua bản quyền',
  'quy mô',
  'nhân sự',
]

/**
 * Thuật toán tính toán điểm số Lead tự động
 */
export function calculateLeadScore(lead: Partial<Lead>): LeadScoreBreakdown {
  let demoScore = 0
  let engScore = 0
  let srcScore = 0
  const reasons: ScoreReasonItem[] = []

  // 1. Phân tích Demographic (Tối đa 35đ)
  const company = lead.company?.trim() || ''
  if (company && company.length > 2) {
    demoScore += 15
    reasons.push({
      criterion: 'Tên Công ty / Doanh nghiệp',
      points: 15,
      type: 'ADD',
      description: `Đã khai báo công ty: "${company}" (+15đ)`,
    })
  } else {
    demoScore -= 10
    reasons.push({
      criterion: 'Thiếu Tên Công ty',
      points: -10,
      type: 'DEDUCT',
      description: 'Chưa có thông tin công ty/doanh nghiệp (-10đ)',
    })
  }

  const email = (lead.email || '').toLowerCase().trim()
  if (email.includes('@')) {
    const domain = email.split('@')[1]
    if (domain && !FREE_EMAIL_DOMAINS.includes(domain)) {
      demoScore += 10
      reasons.push({
        criterion: 'Email Doanh nghiệp',
        points: 10,
        type: 'ADD',
        description: `Sử dụng email tên miền doanh nghiệp: @${domain} (+10đ)`,
      })
    }
  }

  const industry = (lead.industry || '').toLowerCase().trim()
  if (industry && PRIORITY_INDUSTRIES.some((k) => industry.includes(k))) {
    demoScore += 10
    reasons.push({
      criterion: 'Ngành nghề Trọng điểm',
      points: 10,
      type: 'ADD',
      description: `Thuộc ngành nghề mục tiêu: ${lead.industry} (+10đ)`,
    })
  }

  // 2. Phân tích Engagement & Requirement (Tối đa 40đ)
  const req = (lead.requirement || '').trim()
  if (req.length >= 15) {
    engScore += 20
    reasons.push({
      criterion: 'Mô tả Nhu cầu Rõ ràng',
      points: 20,
      type: 'ADD',
      description: 'Nhu cầu được mô tả chi tiết cụ thể (+20đ)',
    })
  } else if (!req) {
    engScore -= 10
    reasons.push({
      criterion: 'Bỏ trống Nhu cầu',
      points: -10,
      type: 'DEDUCT',
      description: 'Chưa có mô tả nhu cầu tư vấn (-10đ)',
    })
  }

  const reqLower = req.toLowerCase()
  if (HIGH_INTENT_KEYWORDS.some((kw) => reqLower.includes(kw))) {
    engScore += 10
    reasons.push({
      criterion: 'Ý định Mua hàng Cao',
      points: 10,
      type: 'ADD',
      description: 'Nội dung chứa từ khóa nhu cầu triển khai/demo/báo giá (+10đ)',
    })
  }

  if (lead.campaign_id || lead.campaign_name) {
    engScore += 10
    reasons.push({
      criterion: 'Gắn liền Chiến dịch Marketing',
      points: 10,
      type: 'ADD',
      description: `Thu hút qua chiến dịch: ${lead.campaign_name || 'Chiến dịch Q4'} (+10đ)`,
    })
  }

  // 3. Phân tích Source (Tối đa 25đ)
  const source = lead.source || 'OTHER'
  if (source === 'REFERRAL') {
    srcScore += 25
    reasons.push({
      criterion: 'Nguồn Giới thiệu (Referral)',
      points: 25,
      type: 'ADD',
      description: 'Được giới thiệu từ đối tác / khách hàng thân thiết (+25đ)',
    })
  } else if (source === 'EVENT') {
    srcScore += 20
    reasons.push({
      criterion: 'Nguồn Hội thảo / Triển lãm (Event)',
      points: 20,
      type: 'ADD',
      description: 'Thu thập từ hội nghị triển lãm ngành (+20đ)',
    })
  } else if (source === 'WEB_FORM') {
    srcScore += 15
    reasons.push({
      criterion: 'Biểu mẫu Website (Web Form)',
      points: 15,
      type: 'ADD',
      description: 'Khách hàng chủ động đăng ký qua form website (+15đ)',
    })
  } else if (source === 'GOOGLE' || source === 'FACEBOOK') {
    srcScore += 10
    reasons.push({
      criterion: 'Quảng cáo Số (Digital Ads)',
      points: 10,
      type: 'ADD',
      description: `Đến từ kênh tiếp thị quảng cáo trực tuyến ${source} (+10đ)`,
    })
  } else if (source === 'MANUAL') {
    srcScore += 10
    reasons.push({
      criterion: 'Nhân viên Khảo sát & Tạo mới',
      points: 10,
      type: 'ADD',
      description: 'Được nhân viên kinh doanh tiếp cận trực tiếp (+10đ)',
    })
  } else {
    srcScore += 5
    reasons.push({
      criterion: 'Nguồn Khác / Chưa xác định',
      points: 5,
      type: 'ADD',
      description: 'Nguồn thông thường (+5đ)',
    })
  }

  // Giới hạn điểm thành phần
  const boundedDemo = Math.max(0, Math.min(35, demoScore))
  const boundedEng = Math.max(0, Math.min(40, engScore))
  const boundedSrc = Math.max(0, Math.min(25, srcScore))

  // Tính tổng điểm (0 - 100)
  const rawTotal = demoScore + engScore + srcScore
  const totalScore = Math.max(0, Math.min(100, rawTotal))

  return {
    demographic_score: boundedDemo,
    engagement_score: boundedEng,
    source_score: boundedSrc,
    total_score: totalScore,
    reasons,
  }
}

/**
 * Xác định phân hạng điểm (Score Tier: Hot, Warm, Cold)
 */
export function determineScoreTier(score: number): LeadScoreTier {
  if (score >= 70) return 'HOT'
  if (score >= 40) return 'WARM'
  return 'COLD'
}

/**
 * Tự động phân nhóm / phân loại lead (Lead Segment)
 */
export function determineLeadSegment(lead: Partial<Lead>, score: number): LeadSegment {
  if (lead.status === 'JUNK' || lead.status === 'UNQUALIFIED') {
    return 'UNQUALIFIED'
  }
  if (score >= 75 && Boolean(lead.company)) {
    return 'ENTERPRISE_VIP'
  }
  if (score >= 60) {
    return 'HIGH_POTENTIAL'
  }
  if (score >= 40) {
    return 'NURTURE'
  }
  return 'UNQUALIFIED'
}

/* ──────────── Service Implementation ──────────── */
export const leadScoringService = {
  /**
   * Lấy danh mục luật chấm điểm
   */
  getScoringRules(): LeadScoringRule[] {
    return DEFAULT_SCORING_RULES
  },

  /**
   * Tính toán điểm và cập nhật cho 1 Lead cụ thể
   */
  async recalculateLeadScore(leadId: string): Promise<Lead> {
    const leads = getStoredLeads()
    const index = leads.findIndex((l) => l.id === leadId)
    if (index === -1) throw new Error('Không tìm thấy Lead để chấm điểm')

    const currentLead = leads[index]
    const breakdown = calculateLeadScore(currentLead)
    const score = breakdown.total_score
    const tier = determineScoreTier(score)
    const segment = determineLeadSegment(currentLead, score)

    const updatedLead: Lead = {
      ...currentLead,
      score,
      score_tier: tier,
      segment,
      score_breakdown: breakdown,
      is_manually_scored: false,
      scoring_notes: `Hệ thống tự động chấm điểm vào ${new Date().toLocaleString('vi-VN')}`,
      last_scored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/score`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedLead),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          leads[index] = data
          saveStoredLeads(leads)
          return data
        }
      }
    } catch {}

    leads[index] = updatedLead
    saveStoredLeads(leads)
    return updatedLead
  },

  /**
   * Chấm điểm lại toàn bộ danh sách Lead trong hệ thống
   */
  async recalculateAllLeads(): Promise<Lead[]> {
    const leads = getStoredLeads()
    const updatedList = leads.map((l) => {
      // Nếu đã được can thiệp thủ công, giữ nguyên điểm thủ công trừ khi forced
      if (l.is_manually_scored && typeof l.score === 'number') {
        return l
      }
      const breakdown = calculateLeadScore(l)
      const score = breakdown.total_score
      const tier = determineScoreTier(score)
      const segment = l.segment || determineLeadSegment(l, score)

      return {
        ...l,
        score,
        score_tier: tier,
        segment,
        score_breakdown: breakdown,
        last_scored_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    try {
      await fetch(`${API_BASE_URL}/leads/recalculate-scores`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedList),
      })
    } catch {}

    saveStoredLeads(updatedList)
    return updatedList
  },

  /**
   * Điều chỉnh điểm hoặc phân loại nhóm thủ công (Dành cho Quản lý / Quản trị viên)
   */
  async updateManualScore(leadId: string, payload: UpdateLeadScorePayload): Promise<Lead> {
    const leads = getStoredLeads()
    const index = leads.findIndex((l) => l.id === leadId)
    if (index === -1) throw new Error('Không tìm thấy Lead để cập nhật')

    const existing = leads[index]
    const clampedScore = Math.max(0, Math.min(100, Math.round(payload.score)))
    const tier = determineScoreTier(clampedScore)
    const segment = payload.segment || determineLeadSegment(existing, clampedScore)

    const updatedLead: Lead = {
      ...existing,
      score: clampedScore,
      score_tier: tier,
      segment,
      is_manually_scored: payload.is_manually_scored ?? true,
      scoring_notes: payload.scoring_notes?.trim() || existing.scoring_notes,
      last_scored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/score`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedLead),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          leads[index] = data
          saveStoredLeads(leads)
          return data
        }
      }
    } catch {}

    leads[index] = updatedLead
    saveStoredLeads(leads)
    return updatedLead
  },

  /**
   * Thống kê ma trận điểm số
   */
  getScoringStats(leads: Lead[]) {
    const total = leads.length
    if (total === 0) {
      return {
        totalLeads: 0,
        averageScore: 0,
        hotCount: 0,
        warmCount: 0,
        coldCount: 0,
        vipCount: 0,
        potentialCount: 0,
        nurtureCount: 0,
        highQualityRate: 0,
      }
    }

    let sumScore = 0
    let hotCount = 0
    let warmCount = 0
    let coldCount = 0
    let vipCount = 0
    let potentialCount = 0
    let nurtureCount = 0

    leads.forEach((l) => {
      const s = l.score ?? 0
      sumScore += s
      if (s >= 70) hotCount++
      else if (s >= 40) warmCount++
      else coldCount++

      if (l.segment === 'ENTERPRISE_VIP') vipCount++
      else if (l.segment === 'HIGH_POTENTIAL') potentialCount++
      else if (l.segment === 'NURTURE') nurtureCount++
    })

    const avg = Math.round(sumScore / total)
    const highQualityRate = Math.round(((hotCount + potentialCount) / total) * 100)

    return {
      totalLeads: total,
      averageScore: avg,
      hotCount,
      warmCount,
      coldCount,
      vipCount,
      potentialCount,
      nurtureCount,
      highQualityRate,
    }
  },
}
