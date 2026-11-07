export default function Loader({ label = 'Cargando...', fullPage = false }) {
  return (
    <div className={`loader${fullPage ? ' loader--page' : ''}`} role="status">
      <span className="loader__spinner" aria-hidden="true" />
      <span className="loader__label">{label}</span>
    </div>
  )
}
