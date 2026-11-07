const dateFormatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatDate(value, fallback = 'Sin fecha') {
  if (!value) return fallback
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date)
}

export function formatYear(value) {
  return value ? value.slice(0, 4) : 'TBA'
}

export function formatRating(value) {
  return Number(value || 0).toFixed(1)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es').format(value || 0)
}

/** RAWG ofrece versiones recortadas de sus imágenes para cargar más rápido. */
export function cropImage(url, width = 600, height = 400) {
  if (!url || !url.includes('media.rawg.io/media/')) return url
  if (url.includes('/media/crop/') || url.includes('/media/resize/')) return url
  return url.replace('/media/', `/media/crop/${width}/${height}/`)
}

const RATING_TITLES = {
  exceptional: 'Excepcional',
  recommended: 'Recomendado',
  meh: 'Regular',
  skip: 'Evitar',
}

export function translateRatingTitle(title) {
  return RATING_TITLES[title] ?? title
}
