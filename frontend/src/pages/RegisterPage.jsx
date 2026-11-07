import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../utils/errors'
import { getPasswordStrength, validateRegisterForm } from '../utils/validators'

const INITIAL = { username: '', email: '', matricula: '', password: '', passwordConfirm: '' }

const SERVER_FIELD_MAP = { password_confirm: 'passwordConfirm' }

export default function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const strength = getPasswordStrength(values.password)

  const revalidate = (nextValues, nextTouched) => {
    const validation = validateRegisterForm(nextValues)
    setErrors(Object.fromEntries(Object.entries(validation).filter(([field]) => nextTouched[field])))
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    setFormError('')
    revalidate(next, touched)
  }

  const handleBlur = (event) => {
    const nextTouched = { ...touched, [event.target.name]: true }
    setTouched(nextTouched)
    revalidate(values, nextTouched)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const allTouched = Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true]))
    setTouched(allTouched)
    const validation = validateRegisterForm(values)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setSubmitting(true)
    setFormError('')
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        matricula: values.matricula.trim().toUpperCase(),
        password: values.password,
        passwordConfirm: values.passwordConfirm,
      })
    } catch (error) {
      const serverErrors = getFieldErrors(error)
      const mapped = Object.fromEntries(
        Object.entries(serverErrors).map(([field, message]) => [SERVER_FIELD_MAP[field] ?? field, message]),
      )
      setErrors(mapped)
      setFormError(
        Object.keys(mapped).length
          ? 'Revisa los campos marcados para continuar.'
          : getErrorMessage(error, 'No se pudo crear la cuenta.'),
      )
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Únete a GameHub y empieza a descubrir videojuegos.">
      {formError && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert" size={18} /> {formError}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="username"
          label="Nombre de usuario"
          icon="user"
          autoComplete="username"
          placeholder="jugador_pro"
          maxLength={30}
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          hint="Entre 3 y 30 caracteres. Letras, números y @ . + - _"
          autoFocus
        />
        <FormField
          id="email"
          label="Correo electrónico"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
        />
        <FormField
          id="matricula"
          label="Matrícula"
          icon="shield"
          autoComplete="off"
          placeholder="A01234567"
          maxLength={20}
          value={values.matricula}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.matricula}
          hint="Entre 4 y 20 caracteres: letras, números o guiones."
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          icon="key"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          maxLength={128}
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        >
          {values.password && (
            <div className={`strength strength--${strength.score}`} aria-live="polite">
              <div className="strength__bars">
                {[1, 2, 3, 4].map((level) => (
                  <span key={level} className={level <= strength.score ? 'is-on' : ''} />
                ))}
              </div>
              <span className="strength__label">Seguridad: {strength.label}</span>
            </div>
          )}
        </FormField>
        <FormField
          id="passwordConfirm"
          label="Confirmar contraseña"
          type="password"
          icon="key"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          maxLength={128}
          value={values.passwordConfirm}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.passwordConfirm}
        />
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? <span className="btn__spinner" /> : <Icon name="user" size={20} />}
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth__switch">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" state={location.state?.from ? { from: location.state.from } : undefined}>
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
