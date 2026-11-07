import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

export function CommonLayout({ children }) {
  return (
    <div className="common-layout">
      <header className="common-layout__header container">
        <Logo />
        <Link to="/" className="btn btn--ghost btn--sm">
          <Icon name="arrowLeft" size={16} /> Volver al inicio
        </Link>
      </header>
      <main className="common-layout__main">{children}</main>
    </div>
  )
}
