import Icon from './Icon'

function pageWindow(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = pageWindow(page, totalPages)

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <Icon name="arrowLeft" size={18} />
      </button>
      {pages.map((p, index) => (
        <span key={p} className="pagination__group">
          {index > 0 && p - pages[index - 1] > 1 && <span className="pagination__dots">…</span>}
          <button
            type="button"
            className={`pagination__btn${p === page ? ' is-active' : ''}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
      >
        <Icon name="arrowRight" size={18} />
      </button>
    </nav>
  )
}
