import { useState, useCallback } from 'react'

type Edits = Record<string, unknown>

/**
 * Single source of truth for tweak values. setTweak persists via the host
 * (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
 * Accepts either setTweak('key', value) or setTweak({ key: value, ... }).
 */
export function useTweaks<T extends Edits>(defaults: T): [T, (keyOrEdits: keyof T | Partial<T>, val?: T[keyof T]) => void] {
  const [values, setValues] = useState<T>(defaults)

  const setTweak = useCallback((keyOrEdits: keyof T | Partial<T>, val?: T[keyof T]) => {
    const edits: Partial<T> =
      typeof keyOrEdits === 'object' && keyOrEdits !== null
        ? (keyOrEdits as Partial<T>)
        : { [keyOrEdits]: val } as Partial<T>
    setValues((prev) => ({ ...prev, ...edits }))
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*')
  }, [])

  return [values, setTweak]
}
