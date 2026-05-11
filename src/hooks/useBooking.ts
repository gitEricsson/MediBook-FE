import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';
import { AppointmentsService } from '@/services/appointments.service';
import { AppointmentHoldRequest, AppointmentHoldResponse } from '@/types/api';

/**
 * useBooking Hook
 * 
 * Handles the production-grade booking state machine:
 * 1. Holding a slot (Temporary lock)
 * 2. Managing the expiration timer
 * 3. Confirming the booking
 * 4. Handling concurrency failures
 */
export const useBooking = () => {
  const [activeHold, setActiveHold] = useState<AppointmentHoldResponse | null>(null);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Clear hold if timer expires
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeHold) {
      const expiry = new Date(activeHold.expiresAt).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setHoldTimer(remaining);
        
        if (remaining === 0) {
          setActiveHold(null);
          setHoldTimer(null);
          if (interval) clearInterval(interval);
          // Dispatch a global event or notify the UI of expiration
          window.dispatchEvent(new CustomEvent('booking:hold-expired'));
        }
      };

      updateTimer(); // Set immediately
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeHold]);

  const [activeHoldContext, setActiveHoldContext] = useState<AppointmentHoldRequest | null>(null);

  const holdMutation = useMutation({
    mutationFn: BookingService.holdSlot,
    onSuccess: (data, variables) => {
      setActiveHold(data);
      setActiveHoldContext(variables);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: BookingService.confirmBooking,
    onSuccess: () => {
      setActiveHold(null);
      setActiveHoldContext(null);
      setHoldTimer(null);
      queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] });
      // Invalidate doctor availability as a slot is now taken
      queryClient.invalidateQueries({ queryKey: ['doctors', 'availability'] });
    }
  });

  const cancelHold = useCallback(async () => {
    if (activeHold && activeHoldContext) {
      await AppointmentsService.releaseHold(activeHold.holdId, activeHoldContext.doctorId, activeHoldContext.scheduledAt).catch(() => undefined);
    }
    setActiveHold(null);
    setHoldTimer(null);
    setActiveHoldContext(null);
  }, [activeHold, activeHoldContext]);

  return {
    holdSlot: holdMutation.mutateAsync,
    isHolding: holdMutation.isPending,
    confirmBooking: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    activeHold,
    holdTimer,
    cancelHold,
    holdError: holdMutation.error,
    confirmError: confirmMutation.error,
  };
};
