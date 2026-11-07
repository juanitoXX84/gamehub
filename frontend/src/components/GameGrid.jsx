import GameCard from './GameCard'

function SkeletonCard() {
  return (
    <div className="game-card game-card--skeleton" aria-hidden="true">
      <div className="game-card__media skeleton" />
      <div className="game-card__body">
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--short" />
      </div>
    </div>
  )
}

export default function GameGrid({ games = [], loading = false, skeletonCount = 8, ranked = false, startRank = 1 }) {
  if (loading) {
    return (
      <div className="game-grid" aria-busy="true" aria-label="Cargando juegos">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="game-grid">
      {games.map((game, index) => (
        <GameCard key={game.id} game={game} rank={ranked ? startRank + index : undefined} />
      ))}
    </div>
  )
}
