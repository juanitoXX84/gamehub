import { useCallback, useEffect, useState } from 'react'
import { isCancelled } from '../utils/errors'

/**
 * Ejecuta `fetcher(signal)` cada vez que cambia y cancela la petición anterior.
 * `fetcher` debe estar memorizado con useCallback.
 */
export default function useFetch(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((prev) => ({ data: prev.data, loading: true, error: null }))
    fetcher(controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (controller.signal.aborted || isCancelled(error)) return
        setState({ data: null, loading: false, error })
      })
    return () => controller.abort()
  }, [fetcher, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { ...state, reload }
}
