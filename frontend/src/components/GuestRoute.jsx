import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from './Loader'
import useAuth from '../hooks/useAuth'

/** Rutas solo para visitantes (login y registro). Al autenticarse se
 *  redirige a la página privada solicitada originalmente o al perfil. */
export default function GuestRoute() {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <Loader label="Verificando sesión..." fullPage />
  if (isAuthenticated) {
    const from = location.state?.from
    const target = typeof from === 'string' && from.startsWith('/') ? from : '/perfil'
    return <Navigate to={target} replace />
  }
  return <Outlet />
}
