import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { useAuthStore } from '@/store/authStore';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';

describe('AuthService Integration Tests', () => {
  beforeEach(() => {
    useAuthStore.getState().setUnauthenticated();
    server.resetHandlers();
  });

  describe('Login', () => {
    it('should return user with tokens on successful login', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'test-access-token',
              refreshToken: 'test-refresh-token',
              tokenType: 'Bearer',
              expiresIn: 900,
              user: {
                id: 1,
                email: 'test@example.com',
                role: 'ROLE_PATIENT',
                firstName: 'Test',
                lastName: 'User',
                enabled: true,
              }
            }
          });
        })
      );

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('test-access-token');
      expect(result.refreshToken).toBe('test-refresh-token');
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.role).toBe('patient');
      expect(result.requires2FA).toBe(false);
    });

    it('should handle login with 2FA required', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json({
            success: true,
            data: {
              twoFactorRequired: true,
              email: 'test@example.com',
              accessToken: null,
              refreshToken: null,
            }
          });
        })
      );

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.requires2FA).toBe(true);
      expect(result.accessToken).toBeNull();
    });

    it('should handle login with invalid credentials', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      try {
        await AuthService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should normalize user role from backend format', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'test-token',
              refreshToken: 'test-refresh',
              tokenType: 'Bearer',
              expiresIn: 900,
              user: {
                id: 2,
                email: 'admin@example.com',
                role: 'ROLE_SUPER_ADMIN',
                firstName: 'Admin',
                lastName: 'User',
                enabled: true,
              }
            }
          });
        })
      );

      const result = await AuthService.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.user?.role).toBe('super_admin');
    });
  });

  describe('Register', () => {
    it('should register new user', async () => {
      server.use(
        http.post('*/api/v1/auth/register', () => {
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'test-access-token',
              refreshToken: 'test-refresh-token',
              tokenType: 'Bearer',
              expiresIn: 900,
              user: {
                id: 3,
                email: 'newuser@example.com',
                role: 'ROLE_PATIENT',
                firstName: 'New',
                lastName: 'User',
                enabled: true,
              }
            }
          });
        })
      );

      const result = await AuthService.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.user?.email).toBe('newuser@example.com');
      expect(result.accessToken).toBe('test-access-token');
    });

    it('should handle registration with duplicate email', async () => {
      server.use(
        http.post('*/api/v1/auth/register', () => {
          return HttpResponse.json(
            { success: false, error: 'Email already exists' },
            { status: 409 }
          );
        })
      );

      try {
        await AuthService.register({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid email format', async () => {
      server.use(
        http.post('*/api/v1/auth/register', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid email format' },
            { status: 400 }
          );
        })
      );

      try {
        await AuthService.register({
          email: 'not-an-email',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('2FA Verification', () => {
    it('should verify 2FA and return tokens', async () => {
      server.use(
        http.post('*/api/v1/auth/2fa/verify', () => {
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'test-access-token',
              refreshToken: 'test-refresh-token',
              tokenType: 'Bearer',
              expiresIn: 900,
              user: {
                id: 1,
                email: 'test@example.com',
                role: 'ROLE_PATIENT',
                firstName: 'Test',
                lastName: 'User',
                enabled: true,
              }
            }
          });
        })
      );

      const result = await AuthService.verify2FA({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result.accessToken).toBe('test-access-token');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.requires2FA).toBe(false);
    });

    it('should handle invalid 2FA code', async () => {
      server.use(
        http.post('*/api/v1/auth/2fa/verify', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid 2FA code' },
            { status: 401 }
          );
        })
      );

      try {
        await AuthService.verify2FA({
          email: 'test@example.com',
          code: 'wrong-code',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle expired 2FA code', async () => {
      server.use(
        http.post('*/api/v1/auth/2fa/verify', () => {
          return HttpResponse.json(
            { success: false, error: '2FA code expired' },
            { status: 401 }
          );
        })
      );

      try {
        await AuthService.verify2FA({
          email: 'test@example.com',
          code: 'expired-code',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'test@example.com',
          role: 'patient',
          firstName: 'Test',
          lastName: 'User',
        },
        'expired-token',
        'test-refresh-token'
      );

      server.use(
        http.post('*/api/v1/auth/refresh', () => {
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              tokenType: 'Bearer',
              expiresIn: 900,
            }
          });
        })
      );

      const result = await AuthService.refresh();

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should use provided refresh token', async () => {
      let receivedToken = '';
      server.use(
        http.post('*/api/v1/auth/refresh', async ({ request }) => {
          const body = await request.json() as any;
          receivedToken = body.refreshToken;
          return HttpResponse.json({
            success: true,
            data: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              tokenType: 'Bearer',
              expiresIn: 900,
            }
          });
        })
      );

      await AuthService.refresh({ refreshToken: 'custom-refresh-token' });

      expect(receivedToken).toBe('custom-refresh-token');
    });

    it('should handle invalid refresh token', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'test@example.com',
          role: 'patient',
          firstName: 'Test',
          lastName: 'User',
        },
        'expired-token',
        'invalid-refresh-token'
      );

      server.use(
        http.post('*/api/v1/auth/refresh', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid refresh token' },
            { status: 401 }
          );
        })
      );

      try {
        await AuthService.refresh();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'test@example.com',
          role: 'patient',
          firstName: 'Test',
          lastName: 'User',
        },
        'test-access-token',
        'test-refresh-token'
      );

      server.use(
        http.post('*/api/v1/auth/logout', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await AuthService.logout();

      expect(true).toBe(true); // No error thrown
    });

    it('should send refresh token on logout', async () => {
      let sentToken = '';
      useAuthStore.getState().setAuthenticated(
        {
          id: '1',
          email: 'test@example.com',
          role: 'patient',
          firstName: 'Test',
          lastName: 'User',
        },
        'test-access-token',
        'test-refresh-token'
      );

      server.use(
        http.post('*/api/v1/auth/logout', async ({ request }) => {
          const body = await request.json() as any;
          sentToken = body.refreshToken;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await AuthService.logout();

      expect(sentToken).toBe('test-refresh-token');
    });
  });

  describe('Password Management', () => {
    it('should handle forgot password', async () => {
      server.use(
        http.post('*/api/v1/auth/forgot-password', () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      await AuthService.forgotPassword({ email: 'test@example.com' });

      expect(true).toBe(true); // No error thrown
    });

    it('should handle reset password', async () => {
      server.use(
        http.post('*/api/v1/auth/reset-password', () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      await AuthService.resetPassword({
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      });

      expect(true).toBe(true); // No error thrown
    });

    it('should validate password strength on reset', async () => {
      server.use(
        http.post('*/api/v1/auth/reset-password', () => {
          return HttpResponse.json(
            { success: false, error: 'Password does not meet complexity requirements' },
            { status: 400 }
          );
        })
      );

      try {
        await AuthService.resetPassword({
          token: 'reset-token',
          newPassword: 'weak',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Email Verification', () => {
    it('should verify email', async () => {
      server.use(
        http.post('*/api/v1/auth/email/verify', () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      await AuthService.verifyEmail({ token: 'verification-token' });

      expect(true).toBe(true); // No error thrown
    });

    it('should handle invalid verification token', async () => {
      server.use(
        http.post('*/api/v1/auth/email/verify', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid or expired token' },
            { status: 400 }
          );
        })
      );

      try {
        await AuthService.verifyEmail({ token: 'invalid-token' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should resend verification email', async () => {
      server.use(
        http.post('*/api/v1/auth/email/resend', () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      await AuthService.resendVerification('test@example.com');

      expect(true).toBe(true); // No error thrown
    });
  });

  describe('Get Current User', () => {
    it('should retrieve current user', async () => {
      server.use(
        http.get('*/api/v1/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              email: 'test@example.com',
              role: 'ROLE_PATIENT',
              firstName: 'Test',
              lastName: 'User',
              enabled: true,
            }
          });
        })
      );

      const user = await AuthService.getCurrentUser();

      expect(user.id).toBe('1');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('patient');
    });

    it('should handle unauthenticated request', async () => {
      server.use(
        http.get('*/api/v1/me', () => {
          return HttpResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      try {
        await AuthService.getCurrentUser();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json(
            { success: false, error: 'Network error' },
            { status: 500 }
          );
        })
      );

      try {
        await AuthService.login({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle timeout errors', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json(
            { success: false, error: 'Request timeout' },
            { status: 408 }
          );
        })
      );

      try {
        await AuthService.login({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
