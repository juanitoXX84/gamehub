const STORAGE_KEY = 'gamehub.tokens'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const tokenStorage = {
  getAccess: () => read()?.access ?? null,
  getRefresh: () => read()?.refresh ?? null,
  hasTokens: () => Boolean(read()?.refresh),
  set: ({ access, refresh }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ access, refresh }))
  },
  clear: () => localStorage.removeItem(STORAGE_KEY),
}

export default tokenStorage
