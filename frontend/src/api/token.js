const TOKEN = import.meta.env.VITE_LOCAL_STORAGE_ITEM_NAME || 'gamehub_token'
const REFRESH_TOKEN = `${TOKEN}_refresh`

export function setToken(token) {
  window.localStorage.setItem(TOKEN, token)
}

export function getToken() {
  return window.localStorage.getItem(TOKEN)
}

export function removeToken() {
  window.localStorage.removeItem(TOKEN)
}

export function setRefreshToken(token) {
  window.localStorage.setItem(REFRESH_TOKEN, token)
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN)
}

export function removeRefreshToken() {
  window.localStorage.removeItem(REFRESH_TOKEN)
}
