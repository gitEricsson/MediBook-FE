import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_NAME: z.string().default('MediBook'),
});

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  VITE_ENV: import.meta.env.VITE_ENV || 'development',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'MediBook',
});

if (!_env.success) {
  console.warn('⚠️ Some environment variables are invalid, using defaults:', _env.error.format());
}

export const env = _env.data || {
  VITE_API_URL: 'http://localhost:3000',
  VITE_ENV: 'development',
  VITE_APP_NAME: 'MediBook',
};
