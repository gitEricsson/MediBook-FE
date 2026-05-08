import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBooking } from '../useBooking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useBooking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    queryClient.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should secure a slot hold and start countdown', async () => {
    const { result } = renderHook(() => useBooking(), { wrapper });

    await act(async () => {
      await result.current.holdSlot({ doctorId: 1, scheduledAt: new Date().toISOString(), type: 'IN_PERSON' });
    });

    expect(result.current.activeHold).not.toBe(null);
    expect(result.current.holdTimer).toBe(600); // 10 minutes in MSW handler
    
    // Fast forward 1 minute
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    
    expect(result.current.holdTimer).toBe(540);
  });

  it('should expire the hold when timer reaches zero', async () => {
    const { result } = renderHook(() => useBooking(), { wrapper });

    await act(async () => {
      await result.current.holdSlot({ doctorId: 1, scheduledAt: new Date().toISOString(), type: 'IN_PERSON' });
    });

    // Fast forward 11 minutes
    act(() => {
      vi.advanceTimersByTime(660000);
    });
    
    expect(result.current.activeHold).toBe(null);
    expect(result.current.holdTimer).toBe(null);
  });
});
