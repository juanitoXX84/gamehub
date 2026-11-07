import axios from 'axios'

export const RAWG_NOT_CONFIGURED = 'rawg_not_configured'

export function isCancelled(error) {
  return axios.isCancel(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED'
}

export function getErrorCode(error) {
  return error?.response?.data?.code ?? null
}

function firstMessage(value) {
  if (Array.isArray(value)) return firstMessage(value[0])
  if (value && typeof value === 'object') return firstMessage(Object.values(value)[0])
  return typeof value === 'string' ? value : null
}

export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.') {
  if (!error) return fallback
  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor de GameHub. Verifica que el backend de Django esté en ejecución.'
  }
  const { status, data } = error.response
  if (data?.detail) return data.detail
  if (data?.non_field_errors) return firstMessage(data.non_field_errors)
  if (status >= 500) return 'El servidor tuvo un problema al procesar la solicitud.'
  return firstMessage(data) ?? fallback
}

export function getFieldErrors(error) {
  const data = error?.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  const result = {}
  for (const [field, value] of Object.entries(data)) {
    if (['detail', 'code', 'non_field_errors'].includes(field)) continue
    const message = Array.isArray(value) ? value.join(' ') : firstMessage(value)
    if (message) result[field] = message
  }
  return result
}
