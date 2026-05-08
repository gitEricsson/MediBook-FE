# MediBook Security & Compliance Architecture

This document outlines the security controls and PHI (Protected Health Information) handling boundaries implemented in the MediBook frontend.

## 1. PHI Data Boundaries

### No Persistence Rule
*   **PHI is NEVER stored in `localStorage` or `sessionStorage`.** This includes medical history, consultation notes, conditions, and medications.
*   **Tokens:** Access tokens are kept strictly in-memory (Zustand). Refresh tokens are managed via HTTP-only, SameSite=Strict cookies to mitigate XSS and CSRF.

### Secure State Management
*   **Memory-Only:** Sensitive clinical state (e.g., the content of a SOAP note currently being drafted) resides in React/Zustand state and is wiped on browser refresh or logout.
*   **Cache TTL:** TanStack Query `gcTime` for PHI-heavy endpoints is restricted to 5 minutes to prevent stale medical data from lingering in RAM.

## 2. Session & Access Control

### Role-Based Access Control (RBAC)
*   Routes are guarded by the `ProtectedRoute` component, which validates the user's role against the required permissions for that path.
*   The API client automatically triggers a logout event on `401 Unauthorized` responses, ensuring the UI remains in sync with the session state.

### Inactivity Safeguards
*   **Idle Timeout:** The `useIdleTimeout` hook monitors user activity (mouse, keyboard, touch) and automatically revokes the session after 15 minutes of inactivity.

## 3. Data Protection

### Sanitization
*   **Log Sanitization:** The `logger` utility automatically redacts PHI keys before printing to the console or sending to external monitoring services.
*   **XSS Prevention:** All clinical notes are rendered through the `SafeHtml` component, which utilizes `DOMPurify` to strip malicious scripts.

### Transport Security
*   **TLS/SSL:** All communication with the API is assumed to occur over HTTPS.
*   **Request Integrity:** Interceptors ensure that sensitive headers are only attached to requests directed at our own secure domain.

## 4. Audit & Observability

### Traceability
*   Every critical action (Login, Note Creation, Hold Placement) is logged with a correlation ID, allowing for full auditability on the backend.
*   **Error Boundaries:** Uncaught exceptions are captured by the `GlobalErrorBoundary` and reported (sanitized) to Sentry.

---
*Last Updated: May 8, 2026*
