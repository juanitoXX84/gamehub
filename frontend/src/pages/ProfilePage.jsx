import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { LOGOUT_MESSAGE } from '../components/PrivateRoute'
import useAuth from '../hooks/useAuth'
import useFetch from '../hooks/useFetch'
import { fetchCurrentUser } from '../services/authService'
import { formatDate } from '../utils/formatters'

export default function ProfilePage() {
  const { user: sessionUser, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const { data: freshUser } = useFetch(useCallback(() => fetchCurrentUser(), []))
  const user = freshUser ?? sessionUser

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login', { replace: true, state: { message: LOGOUT_MESSAGE } })
  }

  return (
    <div className="profile container">
      <section className="profile__card">
        <div className="profile__banner" aria-hidden="true" />
        <div className="profile__identity">
          <span className="avatar avatar--xl">{user.username.charAt(0).toUpperCase()}</span>
          <div>
            <h1 className="profile__name">{user.username}</h1>
            <p className="profile__email">
              <Icon name="mail" size={16} /> {user.email}
            </p>
          </div>
          <button type="button" className="btn btn--danger profile__logout" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <span className="btn__spinner" /> : <Icon name="logout" size={18} />}
            {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      </section>

      <div className="profile__grid">
        <section className="panel">
          <h2 className="panel__title">Información de la cuenta</h2>
          <dl>
            <div className="info-row">
              <dt>Nombre de usuario</dt>
              <dd>{user.username}</dd>
            </div>
            <div className="info-row">
              <dt>Correo electrónico</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="info-row">
              <dt>Miembro desde</dt>
              <dd>{formatDate(user.date_joined)}</dd>
            </div>
            <div className="info-row">
              <dt>Último acceso</dt>
              <dd>{formatDate(user.last_login, 'Primer acceso')}</dd>
            </div>
            <div className="info-row">
              <dt>ID de jugador</dt>
              <dd>#{String(user.id).padStart(5, '0')}</dd>
            </div>
          </dl>
        </section>

        <section className="panel profile__security">
          <h2 className="panel__title">Seguridad</h2>
          <ul className="check-list">
            <li>
              <Icon name="shield" size={18} /> Sesión protegida con tokens JWT.
            </li>
            <li>
              <Icon name="key" size={18} /> Contraseña almacenada con hash seguro (PBKDF2).
            </li>
            <li>
              <Icon name="logout" size={18} /> Al cerrar sesión, tu token se invalida en el servidor.
            </li>
          </ul>
        </section>

        <section className="panel profile__explore">
          <h2 className="panel__title">Sigue explorando</h2>
          <p>Descubre nuevos lanzamientos y los juegos mejor calificados de la comunidad.</p>
          <div className="profile__links">
            <Link to="/catalogo?ordering=-added" className="btn btn--outline btn--sm">
              <Icon name="fire" size={16} /> Populares
            </Link>
            <Link to="/catalogo?ordering=-metacritic" className="btn btn--outline btn--sm">
              <Icon name="trophy" size={16} /> Mejor calificados
            </Link>
            <Link to="/catalogo?ordering=-released" className="btn btn--outline btn--sm">
              <Icon name="calendar" size={16} /> Recientes
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
