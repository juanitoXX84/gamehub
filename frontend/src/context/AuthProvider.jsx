import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { SESSION_EXPIRED_EVENT } from '../services/apiClient'
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../services/authService'
import tokenStorage from '../services/tokenStorage'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(() => tokenStorage.hasTokens())
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    if (!tokenStorage.hasTokens()) return
    let active = true
    fetchCurrentUser()
      .then((data) => active && setUser(data))
      .catch((error) => {
        if (!active) return
        if (error.response?.status === 401) tokenStorage.clear()
        setUser(null)
      })
      .finally(() => active && setInitializing(false))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [])

  const startSession = useCallback(({ user: account, tokens }) => {
    tokenStorage.set(tokens)
    setLoggedOut(false)
    setUser(account)
    return account
  }, [])

  const login = useCallback(
    async (credentials) => startSession(await loginUser(credentials)),
    [startSession],
  )

  const register = useCallback(
    async (values) => startSession(await registerUser(values)),
    [startSession],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh()
    try {
      if (refresh) await logoutUser(refresh)
    } catch {
      // La sesión local se cierra aunque el servidor no responda.
    } finally {
      tokenStorage.clear()
      setLoggedOut(true)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), initializing, loggedOut, login, register, logout }),
    [user, initializing, loggedOut, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
