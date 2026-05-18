import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AuthService } from '@/services/auth.service'

/**
 * Restore the auth session on app start.
 *
 * The auth store only persists `refreshToken` (user + access token are in memory for
 * XSS hardening). On a page refresh the store starts in `status: 'idle'` with
 * `user: null` — without this bootstrap, `ProtectedRoute` either flashes the loader
 * forever (idle) or bounces the user to /login (unauthenticated).
 *
 * Behaviour:
 *   - no refreshToken in storage → mark unauthenticated.
 *   - refreshToken present       → set loading, swap it for a fresh access token + user
 *                                  via /auth/refresh, then mark authenticated. On
 *                                  failure (token revoked / expired) → unauthenticated.
 *
 * Runs exactly once per mount. Mount at the App root inside <BrowserRouter>.
 */
export function useAuthBootstrap() {
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const { status, refreshToken, setLoading, setAuthenticated, setUnauthenticated } =
      useAuthStore.getState()

    if (status === 'authenticated') return       // HMR / fast refresh — already hydrated
    if (!refreshToken) { setUnauthenticated(); return }

    setLoading()
    // Backend's /auth/refresh returns only {accessToken, refreshToken} — no user — so
    // we have to fetch /me with the fresh access token to rebuild the profile in store.
    AuthService.refresh({ refreshToken })
      .then((res) => {
        if (!res.accessToken || !res.refreshToken) throw new Error('refresh missing tokens')
        // Push tokens first so the apiClient interceptor attaches the new Bearer.
        useAuthStore.getState().setTokens(res.accessToken, res.refreshToken)
        if (res.user) {
          setAuthenticated(res.user, res.accessToken, res.refreshToken)
          return
        }
        return AuthService.getCurrentUser().then((user) => {
          setAuthenticated(user, res.accessToken, res.refreshToken)
        })
      })
      .catch(() => {
        // Refresh token revoked / expired, or /me failed — clear state, send to login.
        setUnauthenticated()
      })
  }, [])
}
