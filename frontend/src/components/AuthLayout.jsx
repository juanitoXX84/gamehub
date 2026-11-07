import Icon from './Icon'

const PERKS = [
  { icon: 'layers', text: 'Accede a un catálogo de más de 500.000 videojuegos.' },
  { icon: 'star', text: 'Consulta calificaciones, géneros y fechas de lanzamiento.' },
  { icon: 'shield', text: 'Tu cuenta está protegida con autenticación JWT.' },
]

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth container">
      <aside className="auth__aside" aria-hidden="true">
        <div className="auth__aside-glow" />
        <h2>
          Juega más, <span className="text-gradient">busca menos</span>.
        </h2>
        <ul>
          {PERKS.map((perk) => (
            <li key={perk.text}>
              <span className="feature__icon feature__icon--sm">
                <Icon name={perk.icon} size={18} />
              </span>
              {perk.text}
            </li>
          ))}
        </ul>
      </aside>

      <section className="auth__card">
        <header className="auth__header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
      </section>
    </div>
  )
}
