import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'

export function Error404() {
  return (
    <div className="not-found container">
      <span className="not-found__code text-gradient">404</span>
      <h1>Nivel no encontrado</h1>
      <p>La página que buscas no existe o fue movida.</p>
      <div className="not-found__actions">
        <Link to="/" className="btn btn--primary">
          <Icon name="arrowLeft" size={18} /> Volver al inicio
        </Link>
        <Link to="/catalogo" className="btn btn--outline">
          Explorar catálogo
        </Link>
      </div>
    </div>
  )
}
