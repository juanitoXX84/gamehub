import axios from 'axios'
import { API_URL, REQUEST_TIMEOUT_MS } from '../config/api'
import tokenStorage from './tokenStorage'

export const SESSION_EXPIRED_EVENT = 'gamehub:session-expired'

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess()
  if (access && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

let refreshPromise = null

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh()
  const { data } = await axios.post(
    `${API_URL}/auth/refresh/`,
    { refresh },
    { timeout: REQUEST_TIMEOUT_MS },
  )
  tokenStorage.set({ access: data.access, refresh: data.refresh ?? refresh })
  return data.access
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const canRetry =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.skipAuth &&
      tokenStorage.getRefresh()

    if (!canRetry) return Promise.reject(error)

    original._retry = true
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const access = await refreshPromise
      original.headers.Authorization = `Bearer ${access}`
      return apiClient(original)
    } catch {
      tokenStorage.clear()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      return Promise.reject(error)
    }
  },
)

export default apiClient
