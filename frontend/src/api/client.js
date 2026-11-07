import { API_URL, REQUEST_TIMEOUT_MS } from './config'
import { getRefreshToken, getToken, removeRefreshToken, removeToken, setRefreshToken, setToken } from './token'

export const SESSION_EXPIRED_EVENT = 'gamehub:session-expired'

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, timeout = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.timeout = timeout
  }
}

function buildUrl(path, params) {
  const url = new URL(`${API_URL}${path}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  return url
}

async function send(url, { method = 'GET', body, token, signal }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS)
  const abort = () => controller.abort(signal.reason)
  signal?.addEventListener('abort', abort)

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    return await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    if (controller.signal.reason === 'timeout') {
      throw new ApiError('El servidor tardó demasiado en responder.', { timeout: true })
    }
    throw new ApiError('No se pudo conectar con el servidor.')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

async function parse(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

let refreshPromise = null

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) throw new ApiError('No hay sesión activa.', { status: 401 })
  const response = await send(buildUrl('/token/refresh/'), { method: 'POST', body: { refresh } })
  const data = await parse(response)
  if (!response.ok) throw new ApiError('La sesión expiró.', { status: response.status, data })
  setToken(data.access)
  if (data.refresh) setRefreshToken(data.refresh)
  return data.access
}

/**
 * Petición a la API de Django. Con `auth: true` envía el token JWT guardado
 * (o `token`, si se indica) y, si el servidor responde 401, renueva el token
 * con el refresh y repite la petición una sola vez.
 */
export async function apiRequest(path, { method, body, params, auth = false, token, signal } = {}) {
  const url = buildUrl(path, params)
  const accessToken = auth ? (token ?? getToken()) : null
  let response = await send(url, { method, body, token: accessToken, signal })

  if (response.status === 401 && auth && getRefreshToken()) {
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const renewed = await refreshPromise
      response = await send(url, { method, body, token: renewed, signal })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        removeToken()
        removeRefreshToken()
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
      throw error
    }
  }

  const data = await parse(response)
  if (!response.ok) {
    throw new ApiError(data?.detail ?? `Error ${response.status}`, { status: response.status, data })
  }
  return data
}
