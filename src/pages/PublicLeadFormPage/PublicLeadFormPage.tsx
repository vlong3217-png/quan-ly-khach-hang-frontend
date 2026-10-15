import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { leadFormService } from '../../services/leadFormService.ts'
import type { LeadForm } from '../../types/leadForm.ts'
import './PublicLeadFormPage.css'

export default function PublicLeadFormPage() {
  const { formId } = useParams<{ formId: string }>()

  const [form, setForm] = useState<LeadForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form input state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    requirement: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFormDetail() {
      if (!formId) {
        setLoadError('Không tìm thấy mã biểu mẫu hợp lệ')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await leadFormService.getLeadFormById(formId)
        if (!data) {
          setLoadError('Biểu mẫu không tồn tại hoặc đã bị xóa khỏi hệ thống')
        } else {
          setForm(data)
        }
      } catch {
        setLoadError('Đã xảy ra lỗi khi tải biểu mẫu')
      } finally {
        setIsLoading(false)
      }
    }

    loadFormDetail()
  }, [formId])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.full_name.trim()) {
      errs.full_name = 'Vui lòng nhập họ và tên của bạn'
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại liên hệ'
    } else if (!/(0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone.trim()) && formData.phone.trim().length < 9) {
      errs.phone = 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)'
    }

    if (!formData.email.trim()) {
      errs.email = 'Vui lòng nhập email công việc'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !formId) return
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await leadFormService.submitLead(formId, formData)
      setSubmitSuccess(res.message || 'Cảm ơn bạn! Thông tin đã được gửi thành công.')
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        requirement: '',
      })

      if (res.redirect_url) {
        setTimeout(() => {
          window.location.href = res.redirect_url!
        }, 2000)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="lead-embed-container">
        <div className="lead-embed-card loading-state">
          <div className="lead-spinner" />
          <p>Đang tải biểu mẫu liên hệ...</p>
        </div>
      </div>
    )
  }

  if (loadError || !form) {
    return (
      <div className="lead-embed-container">
        <div className="lead-embed-card error-state">
          <div className="lead-state-icon error">⚠️</div>
          <h3>Không thể mở biểu mẫu</h3>
          <p>{loadError || 'Biểu mẫu không tồn tại.'}</p>
        </div>
      </div>
    )
  }

  if (!form.is_active) {
    return (
      <div className="lead-embed-container">
        <div className="lead-embed-card inactive-state">
          <div className="lead-state-icon info">ℹ️</div>
          <h3>Biểu mẫu tạm dừng nhận đăng ký</h3>
          <p>Biểu mẫu này hiện đang tạm dừng tiếp nhận thông tin mới. Vui lòng quay lại sau hoặc liên hệ trực tiếp với chúng tôi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lead-embed-container">
      <div className="lead-embed-card">
        {/* Brand Badge & Header */}
        <div className="lead-embed-header">
          <div className="lead-badge-pill">
            <span className="badge-sparkle">✨</span>
            <span>Biểu mẫu Tư vấn Trực tuyến</span>
          </div>
          <h2 className="lead-embed-title">{form.title}</h2>
          {form.description ? (
            <p className="lead-embed-desc">{form.description}</p>
          ) : (
            <p className="lead-embed-desc">
              Vui lòng để lại thông tin liên hệ. Chuyên viên tư vấn giải pháp sẽ liên hệ hỗ trợ bạn trong vòng 15 phút làm việc!
            </p>
          )}
        </div>

        {/* Thông báo thành công */}
        {submitSuccess ? (
          <div className="lead-embed-success">
            <div className="lead-state-icon success">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3>Gửi thông tin thành công!</h3>
            <p className="success-msg-text">{submitSuccess}</p>
            <div className="success-timeline-hint">
              <span>Đội ngũ tư vấn đã nhận được thông tin và sẽ liên hệ lại với bạn sớm nhất.</span>
            </div>
            <button
              type="button"
              className="lead-embed-btn secondary"
              onClick={() => setSubmitSuccess(null)}
            >
              ← Gửi thêm biểu mẫu khác
            </button>
          </div>
        ) : (
          <form className="lead-embed-form" onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div className="lead-form-alert error">
                <span className="alert-icon">⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* Họ và tên */}
            <div className="lead-field-group">
              <label className="lead-field-label">
                Họ và tên của bạn <span className="required-star">*</span>
              </label>
              <div className="lead-input-wrap">
                <span className="lead-input-icon">👤</span>
                <input
                  type="text"
                  className={`lead-field-input ${errors.full_name ? 'is-invalid' : ''}`}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value })
                    if (errors.full_name) setErrors({ ...errors, full_name: '' })
                  }}
                  disabled={isSubmitting}
                />
              </div>
              {errors.full_name && <span className="lead-field-error">{errors.full_name}</span>}
            </div>

            {/* Email & Số điện thoại */}
            <div className="lead-field-row">
              <div className="lead-field-group">
                <label className="lead-field-label">
                  Email làm việc <span className="required-star">*</span>
                </label>
                <div className="lead-input-wrap">
                  <span className="lead-input-icon">✉️</span>
                  <input
                    type="email"
                    className={`lead-field-input ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: '' })
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <span className="lead-field-error">{errors.email}</span>}
              </div>

              <div className="lead-field-group">
                <label className="lead-field-label">
                  Số điện thoại <span className="required-star">*</span>
                </label>
                <div className="lead-input-wrap">
                  <span className="lead-input-icon">📞</span>
                  <input
                    type="tel"
                    className={`lead-field-input ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (errors.phone) setErrors({ ...errors, phone: '' })
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && <span className="lead-field-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Tên công ty / Doanh nghiệp */}
            <div className="lead-field-group">
              <label className="lead-field-label">Tên cơ quan / Công ty / Doanh nghiệp</label>
              <div className="lead-input-wrap">
                <span className="lead-input-icon">🏢</span>
                <input
                  type="text"
                  className="lead-field-input"
                  placeholder="Ví dụ: Công ty Cổ phần Công nghệ Alpha"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Nhu cầu tư vấn / Ghi chú */}
            <div className="lead-field-group">
              <label className="lead-field-label">Nhu cầu tư vấn & Bài toán cần giải quyết</label>
              <div className="lead-input-wrap">
                <textarea
                  className="lead-field-textarea"
                  rows={3}
                  placeholder="Mô tả sơ lược về quy mô nhân sự, hệ thống CRM đang dùng hoặc các tính năng mong muốn được triển khai..."
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Nút gửi form */}
            <div className="lead-form-actions">
              <button
                type="submit"
                className="lead-embed-btn primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Đang gửi thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>{form.submit_button_text || 'Gửi yêu cầu tư vấn & Nhận báo giá'}</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="lead-trust-row">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>Bảo mật 100%</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span>Phản hồi &lt; 15 phút</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🎯</span>
                <span>Tư vấn miễn phí</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
