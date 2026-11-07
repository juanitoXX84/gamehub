const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_REGEX = /^[\w.@+-]+$/

export function validateEmail(email) {
  const value = email.trim()
  if (!value) return 'El correo electrónico es obligatorio.'
  if (!EMAIL_REGEX.test(value)) return 'Introduce un correo electrónico válido.'
  return null
}

export function validateUsername(username) {
  const value = username.trim()
  if (!value) return 'El nombre de usuario es obligatorio.'
  if (value.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres.'
  if (value.length > 30) return 'El nombre de usuario no puede superar los 30 caracteres.'
  if (!USERNAME_REGEX.test(value)) {
    return 'Solo se permiten letras, números y los caracteres @ . + - _ (sin espacios).'
  }
  return null
}

export function validatePassword(password) {
  if (!password) return 'La contraseña es obligatoria.'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (/^\d+$/.test(password)) return 'La contraseña no puede ser solo numérica.'
  if (!/[A-Za-z]/.test(password)) return 'La contraseña debe incluir al menos una letra.'
  return null
}

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const level = Math.min(4, Math.max(1, score - 1))
  const labels = ['', 'Débil', 'Aceptable', 'Buena', 'Excelente']
  return { score: level, label: labels[level] }
}

export function validateRegisterForm(values) {
  const errors = {
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    passwordConfirm: !values.passwordConfirm
      ? 'Confirma tu contraseña.'
      : values.password !== values.passwordConfirm
        ? 'Las contraseñas no coinciden.'
        : null,
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v))
}

export function validateLoginForm(values) {
  const errors = {
    email: validateEmail(values.email),
    password: values.password ? null : 'La contraseña es obligatoria.',
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v))
}
