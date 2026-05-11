import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  VITE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_NAME: z.string().default('MediBook'),
});

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  VITE_API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS || 15000,
  VITE_ENV: import.meta.env.VITE_ENV || 'development',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'MediBook',
});

export const env = _env.data || {
  VITE_API_URL: 'http://localhost:8080',
  VITE_API_TIMEOUT_MS: 15000,
  VITE_ENV: 'development',
  VITE_APP_NAME: 'MediBook',
};
