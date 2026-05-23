import { apiClient } from '@/lib/api/client';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export type PaymentProvider = 'PAYSTACK' | 'FLUTTERWAVE' | 'STRIPE' | 'MONNIFY';
export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentResponse {
  id: number;
  appointmentId: number;
  patientId: number;
  idempotencyKey?: string;
  provider: PaymentProvider;
  providerRef?: string;
  authorizationUrl?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
}

export interface InitiatePaymentRequest {
  appointmentId: number;
  provider: PaymentProvider;
  amount: number;
  currency?: string;
  callbackUrl?: string;
  idempotencyKey?: string;
}

export const PaymentsService = {
  initiate: async (payload: InitiatePaymentRequest): Promise<PaymentResponse> => {
    const response = await apiClient.post('/api/v1/payments', payload);
    return unwrapApiResponse<PaymentResponse>(response.data);
  },

  verify: async (id: string): Promise<PaymentResponse> => {
    const response = await apiClient.post(`/api/v1/payments/${id}/verify`);
    return unwrapApiResponse<PaymentResponse>(response.data);
  },

  refund: async (id: string, amount?: number, reason?: string): Promise<PaymentResponse> => {
    const response = await apiClient.post(`/api/v1/payments/${id}/refund`, null, {
      params: { ...(amount !== undefined && { amount }), ...(reason && { reason }) },
    });
    return unwrapApiResponse<PaymentResponse>(response.data);
  },

  getMyPayments: async (page = 0, size = 20) => {
    const response = await apiClient.get('/api/v1/payments/my', {
      params: toPageableParams({ page, size }),
    });
    return unwrapApiResponse<PageResponse<PaymentResponse>>(response.data);
  },

  /**
   * Returns the payment gateways currently wired into the backend. Each provider
   * class is `@ConditionalOnProperty`-gated server-side, so this is effectively
   * the deployment's enabled-providers allow-list. Pull this first to avoid
   * rendering a gateway that would 503 with PROVIDER_NOT_CONFIGURED on click.
   */
  listProviders: async (): Promise<PaymentProvider[]> => {
    const response = await apiClient.get('/api/v1/payments/providers');
    return unwrapApiResponse<PaymentProvider[]>(response.data);
  },
};
