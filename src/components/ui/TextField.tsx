import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export default function TextField({ label, id, className = '', ...props }: TextFieldProps) {
  const inputId = id ?? props.name
  return (
    <label className="crm-ui-field" htmlFor={inputId}>
      <span className="crm-ui-field__label">{label}</span>
      <input
        id={inputId}
        className={['crm-ui-field__input', className].filter(Boolean).join(' ')}
        {...props}
      />
    </label>
  )
}
