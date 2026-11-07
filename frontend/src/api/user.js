import { apiRequest } from './client'

export async function loginApi(formData) {
  try {
    return await apiRequest('/token/', { method: 'POST', body: formData })
  } catch (error) {
    if (error.status === 401) throw new Error('Correo o contraseña incorrectos.', { cause: error })
    throw error
  }
}

export function registerApi({ first_name, last_name, username, email, matricula, password, password_confirm }) {
  return apiRequest('/auth/register/', {
    method: 'POST',
    body: { first_name, last_name, username, email, matricula, password, password_confirm },
  })
}

export function getMeApi(token) {
  return apiRequest('/auth/me/', { auth: true, token })
}

export function logoutApi(refresh) {
  return apiRequest('/auth/logout/', { method: 'POST', body: { refresh } })
}
