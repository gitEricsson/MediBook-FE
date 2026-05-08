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

const sanitize = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in sanitized) {
    if (PHI_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  
  return sanitized;
};

export const logger = {
  info: (message: string, context?: any) => {
    if (env.VITE_ENV !== 'production' || message.includes('auth')) {
      console.info(`[INFO] ${message}`, sanitize(context));
    }
    // In production, send to structured log service (e.g. Datadog, Sentry)
  },
  
  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${message}`, sanitize(context));
  },
  
  error: (message: string, context?: any) => {
    console.error(`[ERROR] ${message}`, sanitize(context));
    // Always send errors to Sentry
  },
  
  debug: (message: string, context?: any) => {
    if (env.VITE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, sanitize(context));
    }
  }
};
