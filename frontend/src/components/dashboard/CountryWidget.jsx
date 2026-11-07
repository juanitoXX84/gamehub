import { useCallback, useState } from 'react'
import { Icon, Label, Loader } from 'semantic-ui-react'
import { getCountriesApi, getCountryApi } from '../../api/countries'
import useFetch from '../../hooks/useFetch'
import { getErrorMessage } from '../../utils/errors'

const CONTINENTS = {
  AF: 'África',
  AM: 'América',
  AN: 'Antártida',
  AS: 'Asia',
  EU: 'Europa',
  OC: 'Oceanía',
}

export default function CountryWidget() {
  const [code, setCode] = useState('MX')
  const countries = useFetch(useCallback((signal) => getCountriesApi(signal), []))
  const country = useFetch(useCallback((signal) => getCountryApi(code, signal), [code]))
  const info = country.data

  return (
    <section className="panel widget widget--soap" aria-labelledby="soap-title">
      <header className="widget__header">
        <div>
          <h2 id="soap-title" className="panel__title">
            <Icon name="globe" /> Países del mundo
          </h2>
          <Label size="tiny" className="widget__badge">
            Web Service SOAP · Django + zeep
          </Label>
        </div>
        <select
          className="widget__select"
          aria-label="País"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={!countries.data}
        >
          {(countries.data?.results ?? [{ code: 'MX', name: 'Mexico' }]).map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </header>

      {country.loading && !info && <Loader active inline="centered" inverted content="Consultando el servicio SOAP..." />}
      {country.error && (
        <div className="widget__error">
          <p>{getErrorMessage(country.error)}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={country.reload}>
            Reintentar
          </button>
        </div>
      )}
      {info && !country.error && (
        <>
          <div className={`country__head${country.loading ? ' is-loading' : ''}`}>
            {info.flag && <img src={info.flag} alt={`Bandera de ${info.name}`} className="country__flag" />}
            <div>
              <p className="country__name">{info.name}</p>
              <p className="country__code">
                Código ISO {info.code} · {CONTINENTS[info.continent_code] ?? info.continent_code}
              </p>
            </div>
          </div>
          <dl className="country__details">
            <div>
              <dt>Capital</dt>
              <dd>{info.capital || '—'}</dd>
            </div>
            <div>
              <dt>Moneda</dt>
              <dd>
                {info.currency_code} {info.currency_name && `(${info.currency_name})`}
              </dd>
            </div>
            <div>
              <dt>Lada internacional</dt>
              <dd>+{info.phone_code}</dd>
            </div>
            <div>
              <dt>Idiomas</dt>
              <dd>{info.languages.join(', ') || '—'}</dd>
            </div>
          </dl>
          <p className="widget__source">
            <code>GET /api/soap/countries/{info.code}/</code> · operaciones SOAP {info.soap.operations.join(' y ')}
          </p>
        </>
      )}
    </section>
  )
}
