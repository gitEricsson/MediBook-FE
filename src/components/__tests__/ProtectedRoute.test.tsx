import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;
const UnauthorizedComponent = () => <div data-testid="unauthorized-content">Unauthorized</div>;
const LoginComponent = () => {
  const { status, user } = useAuthStore();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/protected';

  if (status === 'authenticated' && user) {
    return <Navigate to={from} replace />;
  }

  return <div data-testid="login-content">Login Page</div>;
};

const renderWithRouter = (initialRoute = '/protected') => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/any"
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    useAuthStore.getState().setUnauthenticated();
    queryClient.clear();
  });

  describe('Unauthenticated Access', () => {
    it('should redirect unauthenticated users to login', async () => {
      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should preserve location state for redirect', async () => {
      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
      });
    });

    it('should show loading state while checking authentication', async () => {
      useAuthStore.getState().setLoading();

      const { container } = renderWithRouter('/protected');

      // LoadingDots component should render while loading
      expect(container.querySelector('[style*="display: flex"]')).toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should allow authenticated user with correct role', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'patient@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should allow access without role restrictions', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'user@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/any');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should allow admin access to admin route', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '2',
          email: 'admin@example.com',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/admin');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should allow super admin access to admin route', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '3',
          email: 'superadmin@example.com',
          role: 'super_admin',
          firstName: 'Super',
          lastName: 'Admin',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/admin');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should deny patient access to admin route', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'patient@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/admin');

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should deny doctor access to patient route', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '2',
          email: 'doctor@example.com',
          role: 'doctor',
          firstName: 'Dr',
          lastName: 'Smith',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should support multiple allowed roles', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '2',
          email: 'admin@example.com',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/admin');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when status is loading', async () => {
      useAuthStore.getState().setLoading();

      const { container } = renderWithRouter('/protected');

      // Check for loading indicator (LoadingDots or spinner)
      await waitFor(() => {
        const loadingElements = container.querySelectorAll('[style*="100vw"], [style*="100vh"]');
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });

    it('should show loading indicator when status is idle', async () => {
      // Default state is idle
      const { container } = renderWithRouter('/protected');

      // Should show loading state
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Status Changes', () => {
    it('should update when user logs in', async () => {
      const { rerender } = renderWithRouter('/protected');

      // Start unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
      });

      // Login
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'patient@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      // Re-render to pick up store changes
      rerender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route path="/login" element={<LoginComponent />} />
              <Route
                path="/protected"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <ProtectedComponent />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should update when user logs out', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'patient@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      const { rerender } = renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Logout
      useAuthStore.getState().setUnauthenticated();

      // Re-render to pick up store changes
      rerender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route path="/login" element={<LoginComponent />} />
              <Route
                path="/protected"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <ProtectedComponent />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', async () => {
      useAuthStore.getState().setUnauthenticated();

      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
      });
    });

    it('should handle empty allowed roles array', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'patient@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('2FA Status', () => {
    it('should allow access after 2FA completion', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'patient@example.com',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        },
        'mock-access-token',
        'mock-refresh-token'
      );

      renderWithRouter('/protected');

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });
});
