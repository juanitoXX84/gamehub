import Icon from './Icon'

export default function RatingStars({ rating = 0, max = 5, size = 16 }) {
  const value = Math.max(0, Math.min(max, Number(rating) || 0))
  return (
    <span className="stars" role="img" aria-label={`Calificación ${value.toFixed(1)} de ${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const fill = Math.max(0, Math.min(1, value - index)) * 100
        return (
          <span key={index} className="stars__item" style={{ width: size, height: size }}>
            <Icon name="star" size={size} className="stars__empty" filled strokeWidth={0} />
            <span className="stars__fill" style={{ width: `${fill}%` }}>
              <Icon name="star" size={size} filled strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </span>
  )
}
