import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string
  children: ReactNode
}

export default function Card({ title, className = '', children, ...props }: CardProps) {
  return (
    <section className={['crm-ui-card', className].filter(Boolean).join(' ')} {...props}>
      {title ? <div className="crm-ui-card__header">{title}</div> : null}
      <div className="crm-ui-card__body">{children}</div>
    </section>
  )
}
