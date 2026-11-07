import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import {
  getRefreshToken,
  getToken,
  removeRefreshToken,
  removeToken,
  setRefreshToken,
  setToken,
} from '../api/token'
import { logoutApi } from '../api/user'
import { useUser } from '../hooks/useUser'

// 1. Crear el contexto
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({
  auth: undefined,
  login: () => null,
  logout: () => null,
})

// 2. Crear el provider
export function AuthProvider({ children }) {
  // undefined: verificando la sesión · null: sin sesión · { token, me }: sesión activa
  const [auth, setAuth] = useState(undefined)
  const { getMe } = useUser()

  const clearSession = useCallback(() => {
    removeToken()
    removeRefreshToken()
    setAuth(null)
  }, [])

  const login = useCallback(
    async (token, refresh) => {
      setToken(token)
      if (refresh) setRefreshToken(refresh)
      try {
        const me = await getMe(token)
        setAuth({ token: getToken(), me })
        return me
      } catch (error) {
        if (error.status === 401) clearSession()
        else setAuth(null)
        throw error
      }
    },
    // getMe es una función nueva en cada render, pero no depende del estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearSession],
  )

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    clearSession()
    if (refresh) {
      try {
        await logoutApi(refresh)
      } catch {
        // La sesión local se cierra aunque el servidor no responda.
      }
    }
  }, [clearSession])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setAuth(null)
    } else {
      login(token).catch(() => null)
    }
  }, [login])

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, clearSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, clearSession)
  }, [clearSession])

  const valueContext = useMemo(() => ({ auth, login, logout }), [auth, login, logout])

  return <AuthContext.Provider value={valueContext}>{children}</AuthContext.Provider>
}
