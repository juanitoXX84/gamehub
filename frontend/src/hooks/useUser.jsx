import { getMeApi } from '../api/user'

export function useUser() {
  const getMe = async (token) => {
    try {
      return await getMeApi(token)
    } catch (error) {
      if (error.status === 401) throw error
      throw new Error('Error al obtener el usuario', { cause: error })
    }
  }

  return { getMe }
}
