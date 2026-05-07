import DOMPurify from 'dompurify'

/**
 * Strips all HTML tags from a string, preventing XSS when rendering
 * user-supplied content. Uses DOMPurify with ALLOWED_TAGS: [] so only
 * plain text survives.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Sanitizes an object's string values shallowly.
 * Use before rendering any form data received from the network.
 */
export function sanitizeRecord<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj }
  for (const key in out) {
    if (typeof out[key] === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(out as any)[key] = sanitizeText(out[key] as string)
    }
  }
  return out
}
