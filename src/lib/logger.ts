// Observability — lightweight structured logger.
// In production swap the console calls for your monitoring SDK (Sentry, Datadog, etc.)
// without touching any call-sites.

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

function emit(entry: LogEntry): void {
  const prefix = `[MediBook][${entry.level.toUpperCase()}]`
  const msg = `${prefix} ${entry.timestamp} — ${entry.message}`
  if (entry.level === 'error') {
    console.error(msg, entry.context ?? '')
  } else if (entry.level === 'warn') {
    console.warn(msg, entry.context ?? '')
  } else {
    // debug / info suppressed in production
    if (import.meta.env.DEV) console.log(msg, entry.context ?? '')
  }
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  emit({ level, message, context, timestamp: new Date().toISOString() })
}

export const logger = {
  debug: (message: string, ctx?: Record<string, unknown>) => log('debug', message, ctx),
  info:  (message: string, ctx?: Record<string, unknown>) => log('info',  message, ctx),
  warn:  (message: string, ctx?: Record<string, unknown>) => log('warn',  message, ctx),
  error: (message: string, ctx?: Record<string, unknown>) => log('error', message, ctx),
}
