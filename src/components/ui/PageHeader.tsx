import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={['crm-ui-page-header', className].filter(Boolean).join(' ')}>
      <div className="crm-ui-page-header__copy">
        <h1 className="crm-ui-page-header__title">{title}</h1>
        {description ? (
          <p className="crm-ui-page-header__description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="crm-ui-page-header__actions">{actions}</div> : null}
    </header>
  )
}
