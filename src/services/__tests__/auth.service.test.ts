import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  it('should log in successfully and return user data', async () => {
    const data = await AuthService.login({ email: 'test@example.com', password: 'password' });
    
    expect(data.accessToken).toBe('mock-access-token');
    expect(data.user?.id).toBe('user-1');
  });

  it('should handle refresh token correctly', async () => {
    const data = await AuthService.refresh();
    expect(data.accessToken).toBe('new-mock-token');
  });
});
