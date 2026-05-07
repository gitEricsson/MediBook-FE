import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

/**
 * Resilient localStorage hook — reads/writes are wrapped in try/catch so
 * storage quota errors or private-mode restrictions never crash the UI.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (err) {
      logger.warn('useLocalStorage read failed', { key, err: String(err) })
      return initialValue
    }
  })

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      logger.warn('useLocalStorage write failed', { key, err: String(err) })
    }
  }, [key])

  return [storedValue, setValue]
}
