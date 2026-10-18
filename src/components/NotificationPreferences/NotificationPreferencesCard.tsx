import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import type { NotificationChannelConfig, NotificationType } from '../../types/notification.ts'
import { notificationService } from '../../services/notificationService.ts'
import './NotificationPreferencesCard.css'

export default function NotificationPreferencesCard() {
  const { user } = useAuth()
  const [configs, setConfigs] = useState<NotificationChannelConfig[]>([])
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const list = notificationService.getUserPreferences(user?.id)
    setConfigs(list)
  }, [user?.id])

  const handleToggle = (type: NotificationType, channel: 'in_app' | 'email') => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.type === type) {
          // Mandatory check
          if (c.is_mandatory) return c
          return {
            ...c,
            [channel]: !c[channel],
          }
        }
        return c
      })
    )
    setIsSaved(false)
  }

  const handleSave = () => {
    notificationService.saveUserPreferences(user?.id, configs)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="notification-preferences-card" id="notification-preferences-card">
      <div className="notif-pref-header">
        <div>
          <h3 className="notif-pref-title">
            <span>Cấu hình kênh nhận thông báo cá nhân</span>
          </h3>
          <p className="notif-pref-desc">
            Tùy chỉnh bật/tắt từng loại thông báo cho riêng bạn qua 2 kênh: Trong ứng dụng (In-app) và Thư điện tử (Email).
            Các thông báo trọng yếu như Báo giá chờ duyệt được bảo vệ theo chính sách kiểm soát.
          </p>
        </div>
      </div>

      <table className="notif-pref-table" id="notif-pref-table">
        <thead>
          <tr>
            <th>Loại thông báo hệ thống</th>
            <th style={{ width: 140, textAlign: 'center' }}>Trong ứng dụng</th>
            <th style={{ width: 140, textAlign: 'center' }}>Gửi qua Email</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((cfg) => (
            <tr key={cfg.type}>
              <td>
                <div className="notif-item-title-group">
                  <div className="notif-item-name">
                    <span>{cfg.label}</span>
                    {cfg.is_mandatory && (
                      <span className="mandatory-badge" title="Thông báo bắt buộc theo quy định xét duyệt chiết khấu và giá sàn">
                        🔒 Bắt buộc
                      </span>
                    )}
                  </div>
                  <div className="notif-item-desc">{cfg.description}</div>
                </div>
              </td>

              {/* Kênh In-App */}
              <td style={{ textAlign: 'center' }}>
                <label className={`toggle-switch-small ${cfg.is_mandatory ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={cfg.in_app}
                    disabled={cfg.is_mandatory}
                    onChange={() => handleToggle(cfg.type, 'in_app')}
                    aria-label={`Bật tắt thông báo trong ứng dụng cho ${cfg.label}`}
                  />
                  <span className="toggle-slider-small"></span>
                </label>
              </td>

              {/* Kênh Email */}
              <td style={{ textAlign: 'center' }}>
                <label className={`toggle-switch-small ${cfg.is_mandatory ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={cfg.email}
                    disabled={cfg.is_mandatory}
                    onChange={() => handleToggle(cfg.type, 'email')}
                    aria-label={`Bật tắt thông báo email cho ${cfg.label}`}
                  />
                  <span className="toggle-slider-small"></span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="notif-pref-footer">
        <div>
          {isSaved && (
            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
              ✓ Đã lưu cài đặt kênh thông báo thành công!
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          id="btn-save-notif-pref"
          onClick={handleSave}
          style={{ fontWeight: 600 }}
        >
          Lưu cài đặt thông báo
        </button>
      </div>
    </div>
  )
}
