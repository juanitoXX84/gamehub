import { useFormik } from 'formik'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Form } from 'semantic-ui-react'
import * as Yup from 'yup'
import { registerApi } from '../../api/user'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'

export function Register() {
  const { auth } = useAuth()
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: initialValues(),
    validationSchema: validationSchema(),
    onSubmit: async (formValues, { setErrors }) => {
      try {
        const response = await registerApi({
          ...formValues,
          username: formValues.username.trim(),
          email: formValues.email.trim(),
          matricula: formValues.matricula.trim().toUpperCase(),
          first_name: formValues.first_name.trim(),
          last_name: formValues.last_name.trim(),
        })
        toast.success(`Cuenta creada para ${response.user.username}. Ya puedes iniciar sesión.`)
        navigate('/login')
      } catch (error) {
        const fieldErrors = getFieldErrors(error)
        setErrors(fieldErrors)
        toast.error(
          Object.keys(fieldErrors).length
            ? 'No se puede crear el usuario: revisa los campos marcados.'
            : getErrorMessage(error, 'No se puede crear el usuario'),
        )
      }
    },
  })

  if (auth) return <Navigate to="/dashboard" replace />

  const fieldError = (name) => (formik.touched[name] && formik.errors[name]) || null
  const field = (name) => ({
    id: name,
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: fieldError(name),
  })

  return (
    <div className="register-admin">
      <div className="register-admin__content">
        <h1>Crear cuenta</h1>
        <p className="register-admin__subtitle">Únete a GameHub y empieza a descubrir videojuegos.</p>
        <Form className="register-form-admin" onSubmit={formik.handleSubmit} noValidate>
          <Form.Group widths="equal">
            <Form.Input {...field('first_name')} label="Nombre" placeholder="Juan" autoComplete="given-name" />
            <Form.Input {...field('last_name')} label="Apellidos" placeholder="Pérez" autoComplete="family-name" />
          </Form.Group>
          <label htmlFor="username">Nombre de usuario</label>
          <Form.Input
            {...field('username')}
            onChange={(e) => {
              const value = e.target.value.replace(/\s+/g, '')
              formik.setFieldValue('username', value)
            }}
            icon="user"
            iconPosition="left"
            placeholder="jugador_pro"
            autoComplete="username"
          />
          <label htmlFor="email">Correo electrónico</label>
          <Form.Input
            {...field('email')}
            type="email"
            icon="mail"
            iconPosition="left"
            placeholder="tu@correo.com"
            autoComplete="email"
          />
          <label htmlFor="matricula">Matrícula</label>
          <Form.Input {...field('matricula')} icon="id card" iconPosition="left" placeholder="A01234567" />
          <label htmlFor="password">Contraseña</label>
          <Form.Input
            {...field('password')}
            type="password"
            icon="lock"
            iconPosition="left"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <label htmlFor="password_confirm">Confirmar contraseña</label>
          <Form.Input
            {...field('password_confirm')}
            type="password"
            icon="lock"
            iconPosition="left"
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            content={formik.isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            primary
            fluid
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
          />
        </Form>
        <p className="register-admin__switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

function initialValues() {
  return {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    matricula: '',
    password: '',
    password_confirm: '',
  }
}

function validationSchema() {
  return Yup.object({
    first_name: Yup.string().max(150, 'Máximo 150 caracteres'),
    last_name: Yup.string().max(150, 'Máximo 150 caracteres'),
    username: Yup.string()
      .required('El username es obligatorio')
      .min(3, 'El username debe tener al menos 3 caracteres')
      .max(30, 'El username no puede superar los 30 caracteres')
      .matches(/^[\w.@+-]+$/, 'Solo letras, números y los caracteres @ . + - _ (sin espacios)'),
    email: Yup.string()
      .trim()
      .email('Correo electrónico no válido')
      .required('El correo electrónico es obligatorio'),
    matricula: Yup.string()
      .trim()
      .required('La matrícula es obligatoria')
      .matches(/^[A-Za-z0-9-]{4,20}$/, 'Entre 4 y 20 caracteres: letras, números o guiones'),
    password: Yup.string()
      .required('La contraseña es obligatoria')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .matches(/\d/, 'La contraseña debe contener al menos un número')
      .matches(/[@$!%*?&#\-_.]/, 'La contraseña debe contener al menos un carácter especial (@$!%*?&#-_.)'),
    password_confirm: Yup.string()
      .required('La confirmación de contraseña es obligatoria')
      .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden'),
  })
}
