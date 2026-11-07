import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Label } from 'semantic-ui-react'
import CountryWidget from '../../components/dashboard/CountryWidget'
import WeatherWidget from '../../components/dashboard/WeatherWidget'
import Icon from '../../components/Icon'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatters'

export function Dashboard() {
  const { logout, auth } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const user = auth.me
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    toast.info('Has cerrado sesión correctamente.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard container">
      <section className="dashboard__hero">
        <div className="dashboard__identity">
          <span className="avatar avatar--xl">{(user.first_name || user.username).charAt(0).toUpperCase()}</span>
          <div>
            <p className="dashboard__eyebrow">Dashboard</p>
            <h1 className="dashboard__title">
              Bienvenido, <span className="text-gradient">{fullName || user.username}</span>
            </h1>
            <div className="dashboard__tags">
              <Label size="small">@{user.username}</Label>
              <Label size="small">{user.email}</Label>
              <Label size="small">Matrícula {user.matricula}</Label>
            </div>
          </div>
        </div>
        <Button
          basic
          inverted
          color="red"
          icon="sign-out"
          content={loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          onClick={handleLogout}
          loading={loggingOut}
          disabled={loggingOut}
        />
      </section>

      <div className="dashboard__grid">
        <section className="panel" aria-labelledby="me-title">
          <h2 id="me-title" className="panel__title">
            Mis datos
          </h2>
          <p className="dashboard__hint">
            Web Service propio protegido con JWT: <code>GET /api/auth/me/</code>
          </p>
          <dl>
            <div className="info-row">
              <dt>Nombre</dt>
              <dd>{fullName || 'Sin registrar'}</dd>
            </div>
            <div className="info-row">
              <dt>Nombre de usuario</dt>
              <dd>{user.username}</dd>
            </div>
            <div className="info-row">
              <dt>Correo electrónico</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="info-row">
              <dt>Matrícula</dt>
              <dd>{user.matricula}</dd>
            </div>
            <div className="info-row">
              <dt>Miembro desde</dt>
              <dd>{formatDate(user.date_joined)}</dd>
            </div>
            <div className="info-row">
              <dt>Último acceso</dt>
              <dd>{formatDate(user.last_login, 'Primer acceso')}</dd>
            </div>
          </dl>
        </section>

        <WeatherWidget />
        <CountryWidget />

        <section className="panel dashboard__explore">
          <h2 className="panel__title">Sigue explorando</h2>
          <p>Descubre nuevos lanzamientos y los juegos mejor calificados de la comunidad.</p>
          <div className="dashboard__links">
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
