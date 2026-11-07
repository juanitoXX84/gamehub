import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import GameGrid from '../components/GameGrid'
import Icon from '../components/Icon'
import StatusMessage, { RawgSetupNotice } from '../components/StatusMessage'
import useAuth from '../hooks/useAuth'
import useFetch from '../hooks/useFetch'
import { getGames, getGenres } from '../services/gamesService'
import { getErrorCode, RAWG_NOT_CONFIGURED } from '../utils/errors'
import { formatNumber } from '../utils/formatters'

function GameSection({ id, eyebrow, title, description, icon, link, state, ranked }) {
  return (
    <section className="section container" id={id} aria-labelledby={`${id}-title`}>
      <div className="section__header">
        <div>
          <span className="eyebrow">
            <Icon name={icon} size={16} /> {eyebrow}
          </span>
          <h2 id={`${id}-title`} className="section__title">
            {title}
          </h2>
          <p className="section__description">{description}</p>
        </div>
        <Link to={link} className="btn btn--ghost btn--sm">
          Ver todos <Icon name="arrowRight" size={16} />
        </Link>
      </div>
      {state.error ? (
        <StatusMessage error={state.error} onRetry={state.reload} />
      ) : !state.loading && state.data?.results.length === 0 ? (
        <StatusMessage variant="empty" icon="gamepad" message="No hay juegos disponibles en este momento." />
      ) : (
        <GameGrid games={state.data?.results} loading={state.loading} ranked={ranked} skeletonCount={8} />
      )}
    </section>
  )
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  const popular = useFetch(useCallback((signal) => getGames({ ordering: '-added', page_size: 8 }, signal), []))
  const topRated = useFetch(
    useCallback((signal) => getGames({ ordering: '-metacritic', page_size: 8 }, signal), []),
  )
  const genres = useFetch(useCallback((signal) => getGenres(signal), []))

  const notConfigured = [popular.error, topRated.error].some((e) => getErrorCode(e) === RAWG_NOT_CONFIGURED)
  const heroGame = popular.data?.results.find((game) => game.background_image)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          {heroGame && <img src={heroGame.background_image} alt="" />}
          <div className="hero__glow hero__glow--one" />
          <div className="hero__glow hero__glow--two" />
          <div className="hero__grid" />
        </div>

        <div className="container hero__content">
          <span className="eyebrow eyebrow--pill">
            <Icon name="fire" size={16} /> Más de 500.000 videojuegos
          </span>
          <h1 className="hero__title">
            {isAuthenticated ? (
              <>
                Hola, <span className="text-gradient">{user.username}</span>. ¿A qué jugamos hoy?
              </>
            ) : (
              <>
                Tu próximo juego favorito <span className="text-gradient">empieza aquí</span>
              </>
            )}
          </h1>
          <p className="hero__subtitle">
            Explora el catálogo más completo de videojuegos, descubre los títulos mejor calificados y encuentra
            información detallada de cada lanzamiento.
          </p>
          <div className="hero__actions">
            <Link to="/catalogo" className="btn btn--primary btn--lg">
              <Icon name="layers" size={20} /> Explorar catálogo
            </Link>
            {isAuthenticated ? (
              <Link to="/perfil" className="btn btn--outline btn--lg">
                <Icon name="user" size={20} /> Mi perfil
              </Link>
            ) : (
              <Link to="/registro" className="btn btn--outline btn--lg">
                <Icon name="user" size={20} /> Crear cuenta gratis
              </Link>
            )}
          </div>

          {heroGame && (
            <Link to={`/juegos/${heroGame.id}`} className="hero__featured">
              <span className="hero__featured-label">Destacado</span>
              <strong>{heroGame.name}</strong>
              <span className="hero__featured-meta">
                <Icon name="star" size={14} filled strokeWidth={0} /> {Number(heroGame.rating).toFixed(1)}
                <span>·</span>
                {heroGame.genres.map((g) => g.name).slice(0, 2).join(', ') || 'Videojuego'}
              </span>
            </Link>
          )}
        </div>
      </section>

      {genres.data?.length > 0 && (
        <section className="container genre-strip" aria-label="Géneros">
          {genres.data.slice(0, 12).map((genre) => (
            <Link key={genre.id} to={`/catalogo?genre=${genre.slug}`} className="genre-tile">
              {genre.image_background && <img src={genre.image_background} alt="" loading="lazy" />}
              <span className="genre-tile__name">{genre.name}</span>
              <span className="genre-tile__count">{formatNumber(genre.games_count)} juegos</span>
            </Link>
          ))}
        </section>
      )}

      {notConfigured ? (
        <section className="section container">
          <RawgSetupNotice />
        </section>
      ) : (
        <>
          <GameSection
            id="populares"
            eyebrow="Tendencia"
            title="Juegos populares"
            description="Los títulos que más jugadores han añadido a sus bibliotecas."
            icon="fire"
            link="/catalogo?ordering=-added"
            state={popular}
          />
          <GameSection
            id="mejor-calificados"
            eyebrow="Crítica"
            title="Mejor calificados"
            description="Los juegos con las puntuaciones más altas en Metacritic."
            icon="trophy"
            link="/catalogo?ordering=-metacritic"
            state={topRated}
            ranked
          />
        </>
      )}

      <section className="container">
        <div className="features">
          <article className="feature">
            <span className="feature__icon">
              <Icon name="search" size={22} />
            </span>
            <h3>Búsqueda instantánea</h3>
            <p>Encuentra cualquier juego por su nombre y filtra el catálogo por género u orden.</p>
          </article>
          <article className="feature">
            <span className="feature__icon">
              <Icon name="star" size={22} />
            </span>
            <h3>Calificaciones reales</h3>
            <p>Puntuaciones de la comunidad y de Metacritic para decidir qué jugar a continuación.</p>
          </article>
          <article className="feature">
            <span className="feature__icon">
              <Icon name="shield" size={22} />
            </span>
            <h3>Cuenta segura</h3>
            <p>Autenticación con JWT y contraseñas protegidas con hash. Tus datos están a salvo.</p>
          </article>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="container">
          <div className="cta-band">
            <div>
              <h2>Únete a la comunidad GameHub</h2>
              <p>Crea tu cuenta en segundos y lleva tu perfil de jugador a todas partes.</p>
            </div>
            <div className="cta-band__actions">
              <Link to="/registro" className="btn btn--primary btn--lg">
                Registrarse
              </Link>
              <Link to="/login" className="btn btn--ghost btn--lg">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
