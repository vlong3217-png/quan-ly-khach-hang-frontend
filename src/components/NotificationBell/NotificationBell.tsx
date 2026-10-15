import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import type { AppNotification, NotificationType } from '../../types/notification.ts'
import { notificationService } from '../../services/notificationService.ts'
import './NotificationBell.css'

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Vừa xong'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} giờ trước`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} ngày trước`
    return new Date(isoString).toLocaleDateString('vi-VN')
  } catch {
    return ''
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'LEAD_ASSIGNED':
      return '🎯'
    case 'QUOTE_PENDING_APPROVAL':
      return '⚖️'
    case 'CUSTOMER_FEEDBACK':
      return '💬'
    case 'TASK_ASSIGNED':
      return '📋'
    case 'STALLED_OPPORTUNITY':
      return '⚠️'
    case 'CONTRACT_EXPIRING':
      return '📜'
    default:
      return '🔔'
  }
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL')
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const popoverRef = useRef<HTMLDivElement>(null)

  const loadNotifications = () => {
    const list = notificationService.getNotifications(user?.id, user?.role)
    setNotifications(list)
  }

  useEffect(() => {
    loadNotifications()

    const handleUpdate = () => {
      loadNotifications()
    }
    window.addEventListener('crm-notifications-updated', handleUpdate)
    return () => {
      window.removeEventListener('crm-notifications-updated', handleUpdate)
    }
  }, [user?.id, user?.role])

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filteredList = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.is_read
    return true
  })

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(user?.id, user?.role)
    loadNotifications()
  }

  const handleItemClick = (n: AppNotification) => {
    if (!n.is_read) {
      notificationService.markAsRead(n.id)
      loadNotifications()
    }
    setIsOpen(false)
    if (n.link_path) {
      navigate(n.link_path)
    }
  }

  return (
    <div className="notification-bell-wrapper" ref={popoverRef}>
      <button
        type="button"
        className="notification-bell-btn"
        id="btn-header-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo hệ thống (S7-08)"
        aria-label="Thông báo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge-count" id="notification-unread-count-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popover" role="dialog" aria-modal="true">
          <div className="notification-popover-header">
            <h4>
              <span>🔔 Thông báo</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                  ({unreadCount} mới)
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                id="btn-mark-all-notifications-read"
                onClick={handleMarkAllRead}
              >
                ✓ Đã đọc tất cả
              </button>
            )}
          </div>

          <div className="notification-popover-tabs">
            <button
              type="button"
              className={`notif-tab ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-tab ${activeTab === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setActiveTab('UNREAD')}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          <div className="notification-list">
            {filteredList.length === 0 ? (
              <div className="notif-empty-state">
                <span>🎉 Bạn không có thông báo nào mới!</span>
              </div>
            ) : (
              filteredList.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className={`notif-icon-circle ${n.type.toLowerCase()}`}>
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="notif-content-col">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-msg">{n.message}</span>
                    <span className="notif-time">{formatRelativeTime(n.created_at)}</span>
                  </div>

                  {!n.is_read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
