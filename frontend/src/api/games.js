import { apiRequest } from './client'

const get = (path, params, signal) => apiRequest(path, { params, signal })

export const getGames = (params, signal) => get('/games/', params, signal)

export const searchGames = (query, params, signal) => get('/games/search/', { ...params, q: query }, signal)

export const getGameDetail = (gameId, signal) => get(`/games/${encodeURIComponent(gameId)}/`, undefined, signal)

export const getGenres = (signal) => get('/games/genres/', undefined, signal).then((data) => data.results)
