import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { cropImage, formatRating, formatYear } from '../utils/formatters'

export default function GameCard({ game, rank }) {
  const [imageFailed, setImageFailed] = useState(false)
  const genres = game.genres.slice(0, 2)
  const showImage = game.background_image && !imageFailed

  return (
    <Link to={`/juegos/${game.id}`} className="game-card" aria-label={`Ver detalles de ${game.name}`}>
      <div className="game-card__media">
        {showImage ? (
          <img
            src={cropImage(game.background_image)}
            alt={`Portada de ${game.name}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="game-card__placeholder">
            <Icon name="gamepad" size={40} />
          </div>
        )}
        <div className="game-card__shade" />
        {rank && <span className="game-card__rank">#{rank}</span>}
        {game.metacritic && (
          <span
            className={`metascore ${game.metacritic >= 75 ? 'metascore--high' : game.metacritic >= 50 ? 'metascore--mid' : 'metascore--low'}`}
            title="Metacritic"
          >
            {game.metacritic}
          </span>
        )}
      </div>

      <div className="game-card__body">
        <h3 className="game-card__title">{game.name}</h3>
        <div className="game-card__meta">
          <span className="game-card__rating">
            <Icon name="star" size={15} filled strokeWidth={0} />
            {formatRating(game.rating)}
          </span>
          <span className="game-card__year">
            <Icon name="calendar" size={14} />
            {formatYear(game.released)}
          </span>
        </div>
        <div className="game-card__genres">
          {genres.length > 0 ? (
            genres.map((genre) => (
              <span key={genre.id} className="chip chip--sm">
                {genre.name}
              </span>
            ))
          ) : (
            <span className="chip chip--sm chip--muted">Sin género</span>
          )}
        </div>
      </div>
      <span className="game-card__cta">
        Ver detalles <Icon name="arrowRight" size={15} />
      </span>
    </Link>
  )
}
