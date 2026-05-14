/**
 * @deprecated No backend endpoint exists yet.
 * TODO: Implement /api/v1/contact endpoint on backend before using this service.
 */

import { apiClient } from '@/lib/api/client'

export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  await apiClient.post('/contact', payload)
}
