import { useCallback, useState } from 'react'
import { Icon, Label, Loader } from 'semantic-ui-react'
import { CITIES, describeWeather, getWeatherApi } from '../../api/weather'
import useFetch from '../../hooks/useFetch'

const weekday = new Intl.DateTimeFormat('es-MX', { weekday: 'short' })

export default function WeatherWidget() {
  const [cityId, setCityId] = useState(CITIES[0].id)
  const city = CITIES.find((item) => item.id === cityId)
  const { data, loading, error, reload } = useFetch(useCallback((signal) => getWeatherApi(city, signal), [city]))

  const current = data?.current
  const weather = current && describeWeather(current.weather_code, current.is_day)
  const forecast = data
    ? data.daily.time.slice(1, 4).map((date, index) => ({
        date,
        max: data.daily.temperature_2m_max[index + 1],
        min: data.daily.temperature_2m_min[index + 1],
        ...describeWeather(data.daily.weather_code[index + 1]),
      }))
    : []

  return (
    <section className="panel widget widget--weather" aria-labelledby="weather-title">
      <header className="widget__header">
        <div>
          <h2 id="weather-title" className="panel__title">
            <Icon name="cloud" /> Clima actual
          </h2>
          <Label size="tiny" className="widget__badge">
            API de terceros · Open-Meteo (fetch)
          </Label>
        </div>
        <select
          className="widget__select"
          aria-label="Ciudad"
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
        >
          {CITIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </header>

      {loading && !data && <Loader active inline="centered" inverted content="Consultando el clima..." />}
      {error && (
        <div className="widget__error">
          <p>{error.message}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={reload}>
            Reintentar
          </button>
        </div>
      )}
      {current && !error && (
        <>
          <div className={`weather__now${loading ? ' is-loading' : ''}`}>
            <Icon name={weather.icon} size="huge" className="weather__icon" />
            <div>
              <p className="weather__temp">{Math.round(current.temperature_2m)}°C</p>
              <p className="weather__label">
                {weather.label} · {city.name}
              </p>
            </div>
          </div>
          <dl className="weather__details">
            <div>
              <dt>Sensación</dt>
              <dd>{Math.round(current.apparent_temperature)}°C</dd>
            </div>
            <div>
              <dt>Humedad</dt>
              <dd>{current.relative_humidity_2m}%</dd>
            </div>
            <div>
              <dt>Viento</dt>
              <dd>{Math.round(current.wind_speed_10m)} km/h</dd>
            </div>
          </dl>
          <ul className="weather__forecast">
            {forecast.map((day) => (
              <li key={day.date}>
                <span>{weekday.format(new Date(`${day.date}T12:00:00`))}</span>
                <Icon name={day.icon} />
                <strong>{Math.round(day.max)}°</strong>
                <small>{Math.round(day.min)}°</small>
              </li>
            ))}
          </ul>
          <p className="widget__source">
            Datos de{' '}
            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
              open-meteo.com
            </a>{' '}
            · actualizado {current.time.replace('T', ' ')}
          </p>
        </>
      )}
    </section>
  )
}
