import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getGameDetail } from '../../api/games'
import Icon from '../../components/Icon'
import Loader from '../../components/Loader'
import RatingStars from '../../components/RatingStars'
import StatusMessage from '../../components/StatusMessage'
import useFetch from '../../hooks/useFetch'
import { getErrorCode } from '../../utils/errors'
import { cropImage, formatDate, formatNumber, formatRating, translateRatingTitle } from '../../utils/formatters'

const DESCRIPTION_LIMIT = 700

function InfoRow({ label, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null
  return (
    <div className="info-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Lightbox({ images, index, onClose, onChange }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange((index + 1) % images.length)
      if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [index, images.length, onClose, onChange])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Captura de pantalla" onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Cerrar">
        <Icon name="close" size={26} />
      </button>
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          aria-label="Anterior"
          onClick={(e) => {
            e.stopPropagation()
            onChange((index - 1 + images.length) % images.length)
          }}
        >
          <Icon name="arrowLeft" size={24} />
        </button>
      )}
      <img src={images[index].image} alt={`Captura ${index + 1} de ${images.length}`} onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          aria-label="Siguiente"
          onClick={(e) => {
            e.stopPropagation()
            onChange((index + 1) % images.length)
          }}
        >
          <Icon name="arrowRight" size={24} />
        </button>
      )}
      <span className="lightbox__counter">
        {index + 1} / {images.length}
      </span>
    </div>
  )
}

export function GameDetail() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { data: game, loading, error, reload } = useFetch(
    useCallback((signal) => getGameDetail(gameId, signal), [gameId]),
  )
  const [expanded, setExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  useEffect(() => {
    if (game?.name) document.title = `${game.name} · GameHub`
    return () => {
      document.title = 'GameHub'
    }
  }, [game?.name])

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/catalogo'))

  if (loading && !game) return <Loader label="Cargando videojuego..." fullPage />

  if (error) {
    const notFound = getErrorCode(error) === 'game_not_found'
    return (
      <div className="container detail-error">
        <StatusMessage
          error={notFound ? null : error}
          title={notFound ? 'Juego no encontrado' : undefined}
          message={notFound ? 'El videojuego que buscas no existe o fue retirado del catálogo.' : undefined}
          icon={notFound ? 'gamepad' : 'alert'}
          onRetry={notFound ? undefined : reload}
          action={
            <Link to="/catalogo" className="btn btn--outline btn--sm">
              Ir al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  if (!game) return null

  const description = game.description || 'Este juego todavía no tiene una descripción disponible.'
  const isLong = description.length > DESCRIPTION_LIMIT
  const visibleDescription = expanded || !isLong ? description : `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
  const totalRatings = game.ratings.reduce((sum, r) => sum + r.count, 0)

  return (
    <article className="detail">
      <div className="detail__backdrop" aria-hidden="true">
        {game.background_image && <img src={game.background_image} alt="" />}
      </div>

      <div className="container detail__inner">
        <button type="button" className="btn btn--ghost btn--sm detail__back" onClick={goBack}>
          <Icon name="arrowLeft" size={16} /> Volver
        </button>

        <header className="detail__hero">
          <div className="detail__cover">
            {game.background_image ? (
              <img src={cropImage(game.background_image, 600, 400)} alt={`Portada de ${game.name}`} />
            ) : (
              <div className="game-card__placeholder">
                <Icon name="image" size={48} />
              </div>
            )}
          </div>

          <div className="detail__headline">
            <div className="detail__genres">
              {game.genres.map((genre) => (
                <Link key={genre.id} to={`/catalogo?genre=${genre.slug}`} className="chip">
                  {genre.name}
                </Link>
              ))}
            </div>
            <h1 className="detail__title">{game.name}</h1>

            <div className="detail__stats">
              <div className="stat">
                <span className="stat__label">Calificación</span>
                <span className="stat__value">
                  {formatRating(game.rating)}
                  <small>/ {game.rating_top}</small>
                </span>
                <RatingStars rating={game.rating} max={game.rating_top} />
                <span className="stat__hint">{formatNumber(game.ratings_count)} votos</span>
              </div>
              <div className="stat">
                <span className="stat__label">Metacritic</span>
                <span
                  className={`stat__value ${game.metacritic ? (game.metacritic >= 75 ? 'text-green' : game.metacritic >= 50 ? 'text-yellow' : 'text-red') : ''}`}
                >
                  {game.metacritic ?? '—'}
                </span>
                <span className="stat__hint">{game.metacritic ? 'Puntuación de la crítica' : 'Sin puntuación'}</span>
              </div>
              <div className="stat">
                <span className="stat__label">Lanzamiento</span>
                <span className="stat__value stat__value--sm">
                  {game.tba ? 'Por anunciar' : formatDate(game.released)}
                </span>
                <span className="stat__hint">
                  <Icon name="calendar" size={14} /> Fecha de lanzamiento
                </span>
              </div>
            </div>

            <div className="detail__actions">
              {game.website && (
                <a href={game.website} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
                  Sitio oficial <Icon name="external" size={16} />
                </a>
              )}
              <Link to="/catalogo" className="btn btn--outline">
                <Icon name="layers" size={16} /> Explorar más juegos
              </Link>
            </div>
          </div>
        </header>

        <div className="detail__body">
          <div className="detail__main">
            <section className="panel">
              <h2 className="panel__title">Descripción</h2>
              <p className="detail__description">{visibleDescription}</p>
              {isLong && (
                <button type="button" className="link-button" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? 'Mostrar menos' : 'Leer más'}
                </button>
              )}
            </section>

            {game.screenshots.length > 0 && (
              <section className="panel">
                <h2 className="panel__title">Capturas de pantalla</h2>
                <div className="screenshots">
                  {game.screenshots.map((shot, index) => (
                    <button
                      key={shot.id ?? shot.image}
                      type="button"
                      className="screenshots__item"
                      onClick={() => setLightboxIndex(index)}
                      aria-label={`Ampliar captura ${index + 1}`}
                    >
                      <img src={cropImage(shot.image, 600, 400)} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {totalRatings > 0 && (
              <section className="panel">
                <h2 className="panel__title">Opiniones de la comunidad</h2>
                <div className="ratings">
                  {game.ratings.map((rating) => (
                    <div key={rating.title} className={`ratings__row ratings__row--${rating.title}`}>
                      <span className="ratings__label">{translateRatingTitle(rating.title)}</span>
                      <span className="ratings__bar">
                        <span style={{ width: `${rating.percent}%` }} />
                      </span>
                      <span className="ratings__value">{Math.round(rating.percent)}%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {game.tags.length > 0 && (
              <section className="panel">
                <h2 className="panel__title">Etiquetas</h2>
                <div className="tag-list">
                  {game.tags.map((tag) => (
                    <span key={tag.id} className="chip chip--muted">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="panel detail__info">
            <h2 className="panel__title">Información adicional</h2>
            <dl>
              <InfoRow label="Plataformas">{game.platforms.join(', ')}</InfoRow>
              <InfoRow label="Géneros">{game.genres.map((g) => g.name).join(', ')}</InfoRow>
              <InfoRow label="Desarrolladores">{game.developers.map((d) => d.name).join(', ')}</InfoRow>
              <InfoRow label="Editores">{game.publishers.map((p) => p.name).join(', ')}</InfoRow>
              <InfoRow label="Clasificación ESRB">{game.esrb_rating}</InfoRow>
              <InfoRow label="Tiempo de juego promedio">{game.playtime ? `${game.playtime} horas` : null}</InfoRow>
              <InfoRow label="Logros">{game.achievements_count ? formatNumber(game.achievements_count) : null}</InfoRow>
              <InfoRow label="Disponible en">{game.stores.join(', ')}</InfoRow>
              <InfoRow label="También conocido como">{game.alternative_names.join(', ')}</InfoRow>
            </dl>
          </aside>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={game.screenshots}
          index={lightboxIndex}
          onClose={closeLightbox}
          onChange={setLightboxIndex}
        />
      )}
    </article>
  )
}
