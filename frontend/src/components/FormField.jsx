import { useState } from 'react'
import Icon from './Icon'

export default function FormField({ id, label, type = 'text', error, icon, hint, children, ...inputProps }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const errorId = `${id}-error`

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <div className="field__control">
        {icon && <Icon name={icon} size={18} className="field__icon" />}
        <input
          id={id}
          name={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={icon ? 'has-icon' : ''}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {children}
      {error ? (
        <p id={errorId} className="field__error">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  )
}
