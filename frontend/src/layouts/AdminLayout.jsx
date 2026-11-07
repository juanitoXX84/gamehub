import Loader from '../components/Loader'
import { useAuth } from '../hooks/useAuth'
import { Login } from '../pages/common'
import { ClientLayout } from './ClientLayout'
import { CommonLayout } from './CommonLayout'

export function AdminLayout({ children }) {
  const { auth } = useAuth()

  if (auth === undefined) return <Loader label="Verificando sesión..." fullPage />
  if (!auth) {
    return (
      <CommonLayout>
        <Login />
      </CommonLayout>
    )
  }
  return <ClientLayout>{children}</ClientLayout>
}
