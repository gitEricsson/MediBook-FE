import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().default(''),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  VITE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_NAME: z.string().default('MediBook'),
});

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL ?? '',
  VITE_API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS || 15000,
  VITE_ENV: import.meta.env.VITE_ENV || 'development',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'MediBook',
});

if (!_env.success) {
  if (import.meta.env.MODE === 'production') {
    throw new Error('Invalid environment configuration: ' + JSON.stringify(_env.error));
  }
  console.warn('Using dev defaults because env validation failed');
}

export const env = _env.data || {
  VITE_API_URL: '',
  VITE_API_TIMEOUT_MS: 15000,
  VITE_ENV: 'development',
  VITE_APP_NAME: 'MediBook',
};
