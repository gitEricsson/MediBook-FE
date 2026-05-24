import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Global post-payment verifier.
 *
 * MobPayment stashes `mb_pending_payment_id` in sessionStorage right before redirecting
 * to the gateway. When the gateway redirects the user back into the app — anywhere —
 * this hook fires once, asks the backend to verify the payment, toasts the outcome,
 * and clears the stash.
 *
 * Mounted at the App shell so it works regardless of which page the gateway picked as
 * its `callback_url`. Without this, a gateway that lands on `/` instead of
 * `/patient/appts` would silently lose the verify step.
 */
export function usePostPaymentVerify() {
  const queryClient = useQueryClient()
  const location = useLocation()

  useEffect(() => {
    const paymentId = (() => {
      try { return sessionStorage.getItem('mb_pending_payment_id') } catch { return null }
    })()
    if (!paymentId) return
    try { sessionStorage.removeItem('mb_pending_payment_id') } catch { /* private mode */ }

    import('@/services/payments.service').then(({ PaymentsService }) => {
      PaymentsService.verify(paymentId)
        .then((p) => {
          if (p.status === 'SUCCESSFUL')      toast.success('Payment confirmed. Your appointment is booked.')
          else if (p.status === 'FAILED'
                || p.status === 'CANCELLED')  toast.error('Payment did not go through. You can retry from My Visits.')
          else                                toast.info('Payment is being processed. Refresh in a moment to see the latest status.')
          queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] })
          queryClient.invalidateQueries({ queryKey: ['appointments', 'detail'] })
          queryClient.invalidateQueries({ queryKey: ['appointment'] })
        })
        .catch(() => {
          toast.warning('Could not confirm payment status. Please open My Visits to refresh.')
        })
    })
    // Re-check on every location change so a user who lands on `/` and then navigates
    // to `/patient/appts` still gets verified if their first landing happened before
    // session restore.
  }, [location.pathname, queryClient])
}
