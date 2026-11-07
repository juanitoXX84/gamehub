import Icon from './Icon'
import { getErrorCode, getErrorMessage, RAWG_NOT_CONFIGURED } from '../utils/errors'

export function RawgSetupNotice({ compact = false }) {
  return (
    <div className={`status status--config${compact ? ' status--compact' : ''}`} role="status">
      <span className="status__icon">
        <Icon name="key" size={28} />
      </span>
      <h3>Conecta GameHub con RAWG</h3>
      <p>
        El catálogo de videojuegos todavía no está activado porque falta la API KEY de RAWG en el servidor.
        La clave nunca se envía al navegador: se configura únicamente en Django.
      </p>
      {!compact && (
        <ol className="status__steps">
          <li>
            Crea una cuenta gratuita y obtén tu clave en{' '}
            <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer">
              rawg.io/apidocs
            </a>
            .
          </li>
          <li>
            Abre <code>backend/.env</code> y escribe <code>RAWG_API_KEY=tu_clave</code>.
          </li>
          <li>Reinicia el servidor de Django y recarga esta página.</li>
        </ol>
      )}
    </div>
  )
}

export default function StatusMessage({ error, title, message, icon = 'alert', onRetry, action, variant = 'error' }) {
  if (error && getErrorCode(error) === RAWG_NOT_CONFIGURED) {
    return <RawgSetupNotice />
  }

  const text = message ?? (error ? getErrorMessage(error) : '')
  const heading = title ?? (variant === 'empty' ? 'Sin resultados' : 'Algo salió mal')

  return (
    <div className={`status status--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="status__icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{heading}</h3>
      {text && <p>{text}</p>}
      <div className="status__actions">
        {onRetry && (
          <button type="button" className="btn btn--primary btn--sm" onClick={onRetry}>
            <Icon name="refresh" size={16} /> Reintentar
          </button>
        )}
        {action}
      </div>
    </div>
  )
}
