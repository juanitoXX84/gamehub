import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import GameGrid from '../components/GameGrid'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import StatusMessage from '../components/StatusMessage'
import useDebounce from '../hooks/useDebounce'
import useFetch from '../hooks/useFetch'
import { getGames, getGenres } from '../services/gamesService'
import { formatNumber } from '../utils/formatters'

const PAGE_SIZE = 20
const MAX_PAGES = 500

const ORDERING_OPTIONS = [
  { value: '', label: 'Relevancia' },
  { value: '-added', label: 'Más populares' },
  { value: '-rating', label: 'Mejor calificación' },
  { value: '-metacritic', label: 'Metacritic' },
  { value: '-released', label: 'Más recientes' },
  { value: 'released', label: 'Más antiguos' },
  { value: 'name', label: 'Nombre (A-Z)' },
  { value: '-name', label: 'Nombre (Z-A)' },
]

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const genre = searchParams.get('genre') ?? ''
  const orderingParam = searchParams.get('ordering') ?? ''
  const ordering = ORDERING_OPTIONS.some((o) => o.value === orderingParam) ? orderingParam : ''
  const page = Math.min(MAX_PAGES, Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1))

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput.trim(), 450)

  const updateParams = useCallback(
    (changes, { resetPage = true } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) next.delete(key)
          else next.set(key, String(value))
        })
        if (resetPage && !('page' in changes)) next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  // Sincroniza el campo solo cuando la búsqueda cambia desde fuera (barra de navegación, historial):
  // si el cambio vino de lo que el usuario escribió, se respeta lo que siga tecleando.
  const [lastUrlSearch, setLastUrlSearch] = useState(search)
  if (search !== lastUrlSearch) {
    setLastUrlSearch(search)
    if (search !== debouncedSearch) setSearchInput(search)
  }

  useEffect(() => {
    if (debouncedSearch !== search) updateParams({ search: debouncedSearch })
    // Solo debe reaccionar al texto escrito por el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const games = useFetch(
    useCallback(
      (signal) => getGames({ page, page_size: PAGE_SIZE, search, genres: genre, ordering }, signal),
      [page, search, genre, ordering],
    ),
  )
  const genres = useFetch(useCallback((signal) => getGenres(signal), []))

  const totalPages = Math.min(MAX_PAGES, Math.ceil((games.data?.count ?? 0) / PAGE_SIZE))
  const activeGenre = genres.data?.find((g) => g.slug === genre)
  const hasFilters = Boolean(search || genre || ordering)

  const clearFilters = () => {
    setSearchInput('')
    setSearchParams({})
  }

  const changePage = (nextPage) => {
    updateParams({ page: nextPage > 1 ? nextPage : '' }, { resetPage: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="catalog container">
      <header className="page-header">
        <span className="eyebrow">
          <Icon name="layers" size={16} /> Catálogo
        </span>
        <h1 className="page-header__title">Explora videojuegos</h1>
        <p className="page-header__subtitle">
          Busca por nombre, filtra por género y ordena los resultados como prefieras.
        </p>
      </header>

      <div className="filters">
        <div className="filters__row">
          <label className="filters__search">
            <Icon name="search" size={20} />
            <input
              type="search"
              placeholder="Buscar por nombre, por ejemplo: The Witcher"
              aria-label="Buscar videojuegos por nombre"
              value={searchInput}
              maxLength={100}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput && (
              <button type="button" className="filters__clear" onClick={() => setSearchInput('')} aria-label="Borrar búsqueda">
                <Icon name="close" size={18} />
              </button>
            )}
          </label>

          <label className="filters__select">
            <span>Ordenar por</span>
            <select value={ordering} onChange={(event) => updateParams({ ordering: event.target.value })}>
              {ORDERING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filters__genres" role="group" aria-label="Filtrar por género">
          <button
            type="button"
            className={`chip chip--filter${!genre ? ' is-active' : ''}`}
            onClick={() => updateParams({ genre: '' })}
          >
            Todos
          </button>
          {genres.loading &&
            Array.from({ length: 8 }, (_, i) => <span key={i} className="chip chip--filter skeleton chip--ghost" />)}
          {genres.data?.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip chip--filter${genre === item.slug ? ' is-active' : ''}`}
              onClick={() => updateParams({ genre: genre === item.slug ? '' : item.slug })}
              aria-pressed={genre === item.slug}
            >
              {item.name}
            </button>
          ))}
          {genres.error && !games.error && (
            <span className="filters__note">
              No se pudieron cargar los géneros.{' '}
              <button type="button" className="link-button" onClick={genres.reload}>
                Reintentar
              </button>
            </span>
          )}
        </div>
      </div>

      {!games.error && (
        <div className="results-bar">
          <p>
            {games.loading ? (
              'Buscando juegos...'
            ) : (
              <>
                <strong>{formatNumber(games.data?.count)}</strong> juegos encontrados
                {search && (
                  <>
                    {' '}
                    para <strong>“{search}”</strong>
                  </>
                )}
                {activeGenre && (
                  <>
                    {' '}
                    en <strong>{activeGenre.name}</strong>
                  </>
                )}
              </>
            )}
          </p>
          {hasFilters && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
              <Icon name="close" size={16} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {games.error ? (
        <StatusMessage error={games.error} onRetry={games.reload} />
      ) : !games.loading && games.data?.results.length === 0 ? (
        <StatusMessage
          variant="empty"
          icon="search"
          title="No encontramos juegos"
          message={
            page > 1
              ? 'No hay más resultados en esta página.'
              : 'Prueba con otro nombre o quita algunos filtros para ver más resultados.'
          }
          action={
            hasFilters || page > 1 ? (
              <button type="button" className="btn btn--outline btn--sm" onClick={clearFilters}>
                Ver todo el catálogo
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <GameGrid games={games.data?.results} loading={games.loading} skeletonCount={12} />
          {!games.loading && <Pagination page={page} totalPages={totalPages} onChange={changePage} />}
        </>
      )}
    </div>
  )
}
