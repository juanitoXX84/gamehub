import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from './Loader'
import useAuth from '../hooks/useAuth'

export const LOGOUT_MESSAGE = 'Has cerrado sesión correctamente.'

export default function PrivateRoute() {
  const { isAuthenticated, initializing, loggedOut } = useAuth()
  const location = useLocation()

  if (initializing) return <Loader label="Verificando sesión..." fullPage />
  if (!isAuthenticated) {
    const state = loggedOut
      ? { message: LOGOUT_MESSAGE }
      : { from: location.pathname, message: 'Inicia sesión para acceder a esta sección.' }
    return <Navigate to="/login" replace state={state} />
  }
  return <Outlet />
}
