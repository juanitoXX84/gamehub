import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import useDebounce from '../hooks/useDebounce'
import { searchGames } from '../services/gamesService'
import { getErrorMessage, isCancelled } from '../utils/errors'
import { cropImage, formatYear } from '../utils/formatters'

export default function SearchBar({ onNavigate }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState({ items: [], loading: false, error: null, query: '' })
  const debounced = useDebounce(query.trim(), 350)
  const containerRef = useRef(null)

  useEffect(() => {
    if (debounced.length < 2) return
    const controller = new AbortController()
    setResults((prev) => ({ ...prev, loading: true, error: null }))
    searchGames(debounced, { page_size: 6 }, controller.signal)
      .then((data) => setResults({ items: data.results, loading: false, error: null, query: debounced }))
      .catch((error) => {
        if (isCancelled(error)) return
        setResults({ items: [], loading: false, error: getErrorMessage(error), query: debounced })
      })
    return () => controller.abort()
  }, [debounced])

  useEffect(() => {
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const close = () => {
    setOpen(false)
    setQuery('')
    onNavigate?.()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    navigate(`/catalogo?search=${encodeURIComponent(value)}`)
    close()
  }

  const showPanel = open && debounced.length >= 2 && query.trim().length >= 2

  return (
    <div className="searchbar" ref={containerRef}>
      <form onSubmit={handleSubmit} role="search">
        <Icon name="search" size={18} className="searchbar__icon" />
        <input
          type="search"
          value={query}
          placeholder="Buscar juegos..."
          aria-label="Buscar juegos"
          maxLength={100}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
        />
      </form>

      {showPanel && (
        <div className="searchbar__panel" role="listbox">
          {results.loading && <p className="searchbar__hint">Buscando...</p>}
          {!results.loading && results.error && <p className="searchbar__hint searchbar__hint--error">{results.error}</p>}
          {!results.loading && !results.error && results.query === debounced && results.items.length === 0 && (
            <p className="searchbar__hint">Sin resultados para “{debounced}”.</p>
          )}
          {!results.loading &&
            results.items.map((game) => (
              <Link key={game.id} to={`/juegos/${game.id}`} className="searchbar__item" onClick={close}>
                {game.background_image ? (
                  <img src={cropImage(game.background_image, 200, 130)} alt="" loading="lazy" />
                ) : (
                  <span className="searchbar__thumb-fallback"><Icon name="gamepad" size={16} /></span>
                )}
                <span className="searchbar__item-text">
                  <strong>{game.name}</strong>
                  <small>
                    {formatYear(game.released)} · ★ {Number(game.rating).toFixed(1)}
                  </small>
                </span>
              </Link>
            ))}
          {!results.loading && results.items.length > 0 && (
            <button type="button" className="searchbar__all" onClick={handleSubmit}>
              Ver todos los resultados <Icon name="arrowRight" size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
