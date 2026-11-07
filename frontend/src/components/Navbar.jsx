import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'
import { LOGOUT_MESSAGE } from './PrivateRoute'
import SearchBar from './SearchBar'
import useAuth from '../hooks/useAuth'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menuOpen)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = async () => {
    closeMenu()
    await logout()
    navigate('/login', { replace: true, state: { message: LOGOUT_MESSAGE } })
  }

  const linkClass = ({ isActive }) => `navbar__link${isActive ? ' is-active' : ''}`

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}${menuOpen ? ' navbar--open' : ''}`}>
      <div className="navbar__inner container">
        <Logo onClick={closeMenu} />

        <nav className="navbar__menu" aria-label="Navegación principal">
          <div className="navbar__links">
            <NavLink to="/" end className={linkClass} onClick={closeMenu}>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={linkClass} onClick={closeMenu}>
              Catálogo
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/perfil" className={linkClass} onClick={closeMenu}>
                Perfil
              </NavLink>
            )}
          </div>

          <SearchBar onNavigate={closeMenu} />

          <div className="navbar__actions">
            {isAuthenticated ? (
              <>
                <NavLink to="/perfil" className="navbar__user" onClick={closeMenu} title="Mi perfil">
                  <span className="avatar avatar--sm">{user.username.charAt(0).toUpperCase()}</span>
                  <span className="navbar__username">{user.username}</span>
                </NavLink>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                  <Icon name="logout" size={16} /> Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn--ghost btn--sm" onClick={closeMenu}>
                  Iniciar sesión
                </NavLink>
                <NavLink to="/registro" className="btn btn--primary btn--sm" onClick={closeMenu}>
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </nav>

        <button
          type="button"
          className="navbar__toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
        </button>
      </div>
    </header>
  )
}
