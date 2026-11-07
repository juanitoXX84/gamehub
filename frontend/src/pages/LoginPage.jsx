import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../utils/errors'
import { validateLoginForm } from '../utils/validators'

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const notice = location.state?.message

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateLoginForm(values)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setSubmitting(true)
    setFormError('')
    try {
      await login({ email: values.email.trim(), password: values.password })
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getErrorMessage(error, 'No se pudo iniciar sesión.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Bienvenido de nuevo" subtitle="Inicia sesión con tu correo electrónico para continuar.">
      {notice && !formError && (
        <div className="alert alert--info" role="status">
          <Icon name="alert" size={18} /> {notice}
        </div>
      )}
      {formError && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert" size={18} /> {formError}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="email"
          label="Correo electrónico"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          autoFocus
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          icon="key"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? <span className="btn__spinner" /> : <Icon name="arrowRight" size={20} />}
          {submitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="auth__switch">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" state={location.state?.from ? { from: location.state.from } : undefined}>
          Regístrate gratis
        </Link>
      </p>
    </AuthLayout>
  )
}
