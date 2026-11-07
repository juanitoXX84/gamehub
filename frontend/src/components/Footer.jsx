import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'

export default function Footer() {
  const { auth } = useAuth()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo />
          <p>Descubre, busca y explora miles de videojuegos en un solo lugar.</p>
        </div>
        <nav className="footer__links" aria-label="Enlaces del pie de página">
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          {auth ? (
            <Link to="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Crear cuenta</Link>
            </>
          )}
        </nav>
        <p className="footer__credit">
          Datos e imágenes de videojuegos proporcionados por{' '}
          <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">
            RAWG
          </a>
          . © {new Date().getFullYear()} GameHub.
        </p>
      </div>
    </footer>
  )
}
