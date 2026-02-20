import { useEffect, useRef, useCallback } from 'react';

interface Appointment {
  id: string;
  status: string;
}

/**
 * Hook to play notification sound when new pending appointments are detected
 * @param appointments - Current list of appointments
 * @param enabled - Whether notifications are enabled
 */
export function useAppointmentNotification(
  appointments: Appointment[] | undefined,
  enabled: boolean = true
) {
  const previousAppointmentIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoad = useRef(true);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.7;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        // Browser may block autoplay, that's okay
        console.log('Could not play notification sound:', error.message);
      });
    }
  }, []);

  // Check for new pending appointments
  useEffect(() => {
    if (!enabled || !appointments) return;

    // Skip notification on first load to avoid playing sound when page loads
    if (isFirstLoad.current) {
      // Initialize the set with current appointment IDs
      const currentIds = new Set(appointments.map(a => a.id));
      previousAppointmentIds.current = currentIds;
      isFirstLoad.current = false;
      return;
    }

    // Get current pending appointments
    const currentPendingAppointments = appointments.filter(
      a => a.status === 'pending'
    );

    // Check for new pending appointments
    const newPendingAppointments = currentPendingAppointments.filter(
      a => !previousAppointmentIds.current.has(a.id)
    );

    // If there are new pending appointments, play notification sound
    if (newPendingAppointments.length > 0) {
      playNotificationSound();

      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Appointment Request', {
          body: `${newPendingAppointments.length} new appointment(s) awaiting approval`,
          icon: '/vite.svg',
        });
      }
    }

    // Update the set of known appointment IDs
    const currentIds = new Set(appointments.map(a => a.id));
    previousAppointmentIds.current = currentIds;
  }, [appointments, enabled, playNotificationSound]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    playNotificationSound,
    requestNotificationPermission,
  };
}

export default useAppointmentNotification;
