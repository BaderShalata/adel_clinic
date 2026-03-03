import { useEffect, useRef, useCallback, useState, useSyncExternalStore } from 'react';

export interface NotificationAppointment {
  id: string;
  status: string;
  patientName?: string;
  doctorName?: string;
  serviceType?: string;
  appointmentDate?: { _seconds: number } | string;
  appointmentTime?: string;
}

// ── Singleton audio ──────────────────────────────────────────────────
let sharedAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio('/sounds/notification.mp3');
    sharedAudio.volume = 0.7;
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

function unlockAudio() {
  if (audioUnlocked) return;
  const audio = getSharedAudio();
  const originalVolume = audio.volume;
  audio.volume = 0;
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = originalVolume;
    audioUnlocked = true;
  }).catch(() => {
    audio.volume = originalVolume;
  });
}

if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'keydown'] as const;
  const handler = () => {
    unlockAudio();
    if (audioUnlocked) {
      events.forEach(e => document.removeEventListener(e, handler));
    }
  };
  events.forEach(e => document.addEventListener(e, handler));
}

// ── Global new-pending-IDs store (reactive via useSyncExternalStore) ─
let newPendingIds = new Set<string>();
let storeVersion = 0;
const listeners = new Set<() => void>();

function emitChange() {
  storeVersion++;
  listeners.forEach(fn => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return storeVersion;
}

function addNewPendingIds(ids: string[]) {
  let changed = false;
  ids.forEach(id => {
    if (!newPendingIds.has(id)) {
      newPendingIds.add(id);
      changed = true;
    }
  });
  if (changed) emitChange();
}

/** React hook — returns true if this appointment ID is "new" (arrived since page load). */
export function useIsNewPending(id: string): boolean {
  useSyncExternalStore(subscribe, getSnapshot);
  return newPendingIds.has(id);
}

/** Non-hook check (for render-time only, won't trigger re-render on its own). */
export function isNewPendingAppointment(id: string): boolean {
  return newPendingIds.has(id);
}

// ── Main hook ────────────────────────────────────────────────────────
export function useAppointmentNotification(
  appointments: NotificationAppointment[] | undefined,
  enabled: boolean = true
) {
  const previousAppointmentIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const [latestNewAppointments, setLatestNewAppointments] = useState<NotificationAppointment[]>([]);

  const playNotificationSound = useCallback(() => {
    const audio = getSharedAudio();
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.log('Could not play notification sound:', error.message);
    });
  }, []);

  const dismissNotification = useCallback(() => {
    setLatestNewAppointments([]);
  }, []);

  useEffect(() => {
    if (!enabled || !appointments) return;

    if (isFirstLoad.current) {
      const currentIds = new Set(appointments.map(a => a.id));
      previousAppointmentIds.current = currentIds;
      isFirstLoad.current = false;
      return;
    }

    const currentPendingAppointments = appointments.filter(a => a.status === 'pending');

    const freshPending = currentPendingAppointments.filter(
      a => !previousAppointmentIds.current.has(a.id)
    );

    if (freshPending.length > 0) {
      // Sound
      playNotificationSound();

      // Update global reactive store
      addNewPendingIds(freshPending.map(a => a.id));

      // Toast data
      setLatestNewAppointments(freshPending);
      setTimeout(() => setLatestNewAppointments([]), 15000);

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Appointment Request', {
          body: `${freshPending.length} new appointment(s) awaiting approval`,
          icon: '/vite.svg',
        });
      }
    }

    previousAppointmentIds.current = new Set(appointments.map(a => a.id));
  }, [appointments, enabled, playNotificationSound]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    playNotificationSound,
    requestNotificationPermission,
    latestNewAppointments,
    dismissNotification,
  };
}

export default useAppointmentNotification;
