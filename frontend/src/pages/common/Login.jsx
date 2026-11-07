import { useFormik } from 'formik'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Form } from 'semantic-ui-react'
import * as Yup from 'yup'
import { loginApi } from '../../api/user'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../utils/errors'

export function Login() {
  const { auth, login } = useAuth()
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: initialValues(),
    validationSchema: validationSchema(),
    onSubmit: async (formValues) => {
      try {
        const response = await loginApi({
          email: formValues.email.trim(),
          password: formValues.password,
        })
        const { access, refresh } = response
        if (import.meta.env.DEV) console.log('Token de acceso (JWT) obtenido:', access)
        const me = await login(access, refresh)
        toast.success(`¡Bienvenido, ${me.first_name || me.username}!`)
        navigate('/dashboard')
      } catch (error) {
        toast.error(getErrorMessage(error, 'Error al iniciar sesión'))
      }
    },
  })

  if (auth) return <Navigate to="/dashboard" replace />

  const fieldError = (name) => (formik.touched[name] && formik.errors[name]) || null

  return (
    <div className="login-admin">
      <div className="login-admin__content">
        <h1>Iniciar sesión</h1>
        <p className="login-admin__subtitle">Usa tu correo y contraseña de GameHub.</p>
        <Form className="login-form-admin" onSubmit={formik.handleSubmit} noValidate>
          <label htmlFor="email">Correo electrónico</label>
          <Form.Input
            id="email"
            name="email"
            type="email"
            icon="mail"
            iconPosition="left"
            placeholder="tu@correo.com"
            autoComplete="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={fieldError('email')}
          />
          <label htmlFor="password">Contraseña</label>
          <Form.Input
            id="password"
            name="password"
            type="password"
            icon="lock"
            iconPosition="left"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={fieldError('password')}
          />
          <Button
            type="submit"
            content={formik.isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            primary
            fluid
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
          />
        </Form>
        <p className="login-admin__switch">
          ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  )
}

function initialValues() {
  return {
    email: '',
    password: '',
  }
}

function validationSchema() {
  return Yup.object({
    email: Yup.string()
      .trim()
      .email('Correo electrónico no válido')
      .required('El correo electrónico es obligatorio'),
    password: Yup.string().required('La contraseña es obligatoria'),
  })
}
