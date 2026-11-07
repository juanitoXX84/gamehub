const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

export const CITIES = [
  { id: 'slrc', name: 'San Luis Río Colorado', latitude: 32.4561, longitude: -114.7719 },
  { id: 'mexicali', name: 'Mexicali', latitude: 32.6245, longitude: -115.4523 },
  { id: 'hermosillo', name: 'Hermosillo', latitude: 29.0729, longitude: -110.9559 },
  { id: 'cdmx', name: 'Ciudad de México', latitude: 19.4326, longitude: -99.1332 },
  { id: 'monterrey', name: 'Monterrey', latitude: 25.6866, longitude: -100.3161 },
]

/** API de terceros gratuita (Open-Meteo): se consulta directamente desde el navegador con fetch. */
export async function getWeatherApi({ latitude, longitude }, signal) {
  const url = new URL(WEATHER_URL)
  url.search = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '4',
  })
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('No se pudo obtener el clima en este momento.')
  return response.json()
}

const WEATHER_CODES = [
  [[0], 'Despejado', 'sun'],
  [[1, 2], 'Parcialmente nublado', 'cloud'],
  [[3], 'Nublado', 'cloud'],
  [[45, 48], 'Niebla', 'cloud'],
  [[51, 53, 55, 56, 57], 'Llovizna', 'tint'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Lluvia', 'umbrella'],
  [[71, 73, 75, 77, 85, 86], 'Nieve', 'snowflake'],
  [[95, 96, 99], 'Tormenta', 'lightning'],
]

export function describeWeather(code, isDay = 1) {
  const match = WEATHER_CODES.find(([codes]) => codes.includes(code))
  const [, label, icon] = match ?? [null, 'Sin datos', 'question']
  return { label, icon: icon === 'sun' && !isDay ? 'moon' : icon }
}
