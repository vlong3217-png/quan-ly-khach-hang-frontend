import { useState, useRef, useEffect, type ReactNode } from 'react'

export interface ActionMenuItem {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  title?: string
}

interface TableActionMenuProps {
  items: ActionMenuItem[]
  align?: 'left' | 'right'
  title?: string
  buttonId?: string
}

const IconMoreHorizontal = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
    <circle cx="5" cy="12" r="1.5" />
  </svg>
)

export default function TableActionMenu({
  items,
  align = 'right',
  title = 'Thao tác khác',
  buttonId,
}: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const visibleItems = items.filter((item) => !item.disabled)
  if (visibleItems.length === 0) return null

  return (
    <div className="action-dropdown-wrapper" ref={menuRef}>
      <button
        type="button"
        className="action-dropdown-btn"
        id={buttonId}
        title={title}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        aria-expanded={isOpen}
      >
        <IconMoreHorizontal />
      </button>

      {isOpen && (
        <div
          className={`action-dropdown-menu ${align === 'left' ? 'align-left' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {visibleItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`action-dropdown-item ${item.danger ? 'danger' : ''}`}
              title={item.title}
              onClick={() => {
                setIsOpen(false)
                item.onClick()
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
