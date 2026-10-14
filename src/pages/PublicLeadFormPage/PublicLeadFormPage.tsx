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
        {/* Header form */}
        <div className="lead-embed-header">
          <h2 className="lead-embed-title">{form.title}</h2>
          {form.description && <p className="lead-embed-desc">{form.description}</p>}
        </div>

        {/* Thông báo thành công */}
        {submitSuccess ? (
          <div className="lead-embed-success">
            <div className="lead-state-icon success">✓</div>
            <h3>Gửi thành công!</h3>
            <p>{submitSuccess}</p>
            <button
              type="button"
              className="lead-embed-btn secondary"
              onClick={() => setSubmitSuccess(null)}
            >
              Gửi biểu mẫu khác
            </button>
          </div>
        ) : (
          <form className="lead-embed-form" onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div className="lead-form-alert error">
                <span>{submitError}</span>
              </div>
            )}

            {/* Họ và tên */}
            <div className="lead-field-group">
              <label className="lead-field-label">
                Họ và tên <span className="required-star">*</span>
              </label>
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
              {errors.full_name && <span className="lead-field-error">{errors.full_name}</span>}
            </div>

            {/* Email & Số điện thoại */}
            <div className="lead-field-row">
              <div className="lead-field-group">
                <label className="lead-field-label">
                  Email làm việc <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  className={`lead-field-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="contact@company.vn"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: '' })
                  }}
                  disabled={isSubmitting}
                />
                {errors.email && <span className="lead-field-error">{errors.email}</span>}
              </div>

              <div className="lead-field-group">
                <label className="lead-field-label">
                  Số điện thoại <span className="required-star">*</span>
                </label>
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
                {errors.phone && <span className="lead-field-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Tên công ty / Doanh nghiệp */}
            <div className="lead-field-group">
              <label className="lead-field-label">Tên công ty / Doanh nghiệp</label>
              <input
                type="text"
                className="lead-field-input"
                placeholder="Ví dụ: Công ty Cổ phần Công nghệ Alpha"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Nhu cầu tư vấn / Ghi chú */}
            <div className="lead-field-group">
              <label className="lead-field-label">Nhu cầu tư vấn & Bài toán cần giải quyết</label>
              <textarea
                className="lead-field-textarea"
                rows={3}
                placeholder="Mô tả sơ lược về quy mô đội ngũ, phần mềm đang dùng hoặc nhu cầu tính năng cần tìm..."
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                disabled={isSubmitting}
              />
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
                  <span>{form.submit_button_text || 'Gửi thông tin tư vấn'}</span>
                )}
              </button>
            </div>

            <div className="lead-embed-footer-privacy">
              🔒 Thông tin của bạn được cam kết bảo mật theo chính sách bảo vệ dữ liệu.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
