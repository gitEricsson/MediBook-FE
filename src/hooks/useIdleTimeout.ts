import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * useIdleTimeout Hook
 * 
 * Automatically logs out the user after a period of inactivity.
 * Essential for healthcare compliance (PHI protection).
 */
export const useIdleTimeout = (timeoutMs: number = 1000 * 60 * 15) => { // Default 15 mins
  const { logout, isAuthenticated } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isAuthenticated) {
      timerRef.current = setTimeout(() => {
        console.warn('Session timed out due to inactivity.');
        logout();
      }, timeoutMs);
    }
  }, [isAuthenticated, logout, timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => resetTimer();

    if (isAuthenticated) {
      resetTimer();
      events.forEach(event => window.addEventListener(event, handleActivity));
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, resetTimer]);
};
