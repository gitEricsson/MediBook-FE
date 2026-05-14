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
 * Sanitizes HTML input by encoding dangerous characters and stripping tags.
 * Prevents stored XSS attacks.
 */
export function sanitizeHtml(input: string): string {
  // First strip all HTML tags using DOMPurify
  const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  // Then encode HTML entities for extra safety
  return stripHtmlEntities(stripped)
}

/**
 * Sanitizes user input before sending to API:
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 * - Removes null bytes and other control characters
 * Prevents injection attacks and malformed data
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''

  // Trim leading/trailing whitespace
  let sanitized = input.trim()

  // Collapse multiple spaces into one
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Remove null bytes and control characters (except newline, tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

  return sanitized
}

/**
 * Helper: encode HTML entities to prevent injection
 */
function stripHtmlEntities(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
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
