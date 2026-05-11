import { env } from '@/config/env';

/**
 * Production-Grade Logger with PHI Sanitization
 */

const PHI_KEYS = [
  'notes', 
  'medicalHistory', 
  'conditions', 
  'medications', 
  'assessment', 
  'plan', 
  'chiefComplaint',
  'ssn',
  'address',
  'phone'
];

const sanitize = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: Record<string, unknown> | unknown[] = Array.isArray(obj)
    ? [...obj]
    : { ...(obj as Record<string, unknown>) };
  
  for (const key in sanitized as Record<string, unknown>) {
    const record = sanitized as Record<string, unknown>;
    if (PHI_KEYS.includes(key.toLowerCase())) {
      record[key] = '[REDACTED]';
    } else if (typeof record[key] === 'object') {
      record[key] = sanitize(record[key]);
    }
  }
  
  return sanitized;
};

export const logger = {
  info: (message: string, context?: unknown) => {
    if (env.VITE_ENV !== 'production' || message.includes('auth')) {
      console.info(`[INFO] ${message}`, sanitize(context));
    }
    // In production, send to structured log service (e.g. Datadog, Sentry)
  },
  
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${message}`, sanitize(context));
  },
  
  error: (message: string, context?: unknown) => {
    console.error(`[ERROR] ${message}`, sanitize(context));
    // Always send errors to Sentry
  },
  
  debug: (message: string, context?: unknown) => {
    if (env.VITE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, sanitize(context));
    }
  }
};
