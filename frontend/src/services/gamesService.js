import apiClient from './apiClient'

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

async function get(url, params, signal) {
  const { data } = await apiClient.get(url, { params: cleanParams(params), signal, skipAuth: true })
  return data
}

export const getGames = (params, signal) => get('/games/', params, signal)

export const searchGames = (query, params, signal) =>
  get('/games/search/', { ...params, q: query }, signal)

export const getGameDetail = (gameId, signal) =>
  get(`/games/${encodeURIComponent(gameId)}/`, undefined, signal)

export const getGenres = (signal) => get('/games/genres/', undefined, signal).then((data) => data.results)

export const getRawgStatus = (signal) => get('/games/status/', undefined, signal)
