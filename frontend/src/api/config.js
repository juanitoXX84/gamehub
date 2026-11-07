const BASE_URL = (import.meta.env.VITE_BASE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

export const API_URL = `${BASE_URL}/api`

export const REQUEST_TIMEOUT_MS = 20000
