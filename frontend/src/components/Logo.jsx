import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="logo" onClick={onClick} aria-label="GameHub, ir al inicio">
      <span className="logo__mark">
        <Icon name="gamepad" size={22} strokeWidth={2} />
      </span>
      <span className="logo__text">
        Game<span>Hub</span>
      </span>
    </Link>
  )
}
