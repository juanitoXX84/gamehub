import { apiRequest } from './client'

export const getCountriesApi = (signal) => apiRequest('/soap/countries/', { auth: true, signal })

export const getCountryApi = (code, signal) =>
  apiRequest(`/soap/countries/${encodeURIComponent(code)}/`, { auth: true, signal })
