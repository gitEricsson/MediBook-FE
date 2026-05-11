/**
 * PHI Security & Compliance Implementation Note
 * 
 * In accordance with Phase 4 of Endpoints.md, the following rules are enforced:
 * 
 * 1. NO SENSITIVE DATA IN LOCALSTORAGE:
 *    User role and non-PHI preferences may be stored, but medical history, 
 *    consultation notes, and patient identifiers are memory-only or 
 *    fetched strictly via authenticated API calls.
 * 
 * 2. SECURE STATE MANAGEMENT:
 *    The `authStore` and `notificationStore` reside in RAM. Refreshing the browser
 *    requires a secure session re-hydration via HTTP-only cookies.
 * 
 * 3. NO LEAKING IN LOGS:
 *    The production logger (to be implemented) must sanitize any object 
 *    containing keys like 'notes', 'medicalHistory', or 'ssn'.
 * 
 * 4. SAFE CACHING:
 *    TanStack Query `gcTime` for PHI-heavy queries (like PatientSummary) 
 *    should be kept short to prevent stale data remaining in memory.
 */

export const sanitizePHI = <T extends Record<string, unknown>>(data: T): T => {
  // Logic to strip PII/PHI from objects before logging
  const sensitiveKeys = ['notes', 'assessment', 'plan', 'chiefComplaint'];
  const sanitized: Record<string, unknown> = { ...data };
  sensitiveKeys.forEach(key => {
    if (key in sanitized) sanitized[key] = '[REDACTED]';
  });
  return sanitized as T;
};
