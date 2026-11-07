import apiClient from './apiClient'

export async function registerUser({ username, email, password, passwordConfirm }) {
  const { data } = await apiClient.post(
    '/auth/register/',
    { username, email, password, password_confirm: passwordConfirm },
    { skipAuth: true },
  )
  return data
}

export async function loginUser({ email, password }) {
  const { data } = await apiClient.post('/auth/login/', { email, password }, { skipAuth: true })
  return data
}

export async function logoutUser(refresh) {
  const { data } = await apiClient.post('/auth/logout/', { refresh }, { skipAuth: true })
  return data
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me/')
  return data
}
