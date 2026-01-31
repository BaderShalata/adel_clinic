import { DoctorSchedule } from '../models/Doctor';

/**
 * Generate schedule for Dr. Yosef
 * - Every day: 8 AM - 12 PM (10 min slots)
 * - Sunday, Tuesday, Wednesday, Thursday: 4 PM - 8 PM (10 min slots)
 */
export function generateDrYosefSchedule(): DoctorSchedule[] {
  const schedule: DoctorSchedule[] = [];

  // Morning shift: Every day 8 AM - 12 PM (10 min slots)
  for (let day = 0; day <= 6; day++) {
    schedule.push({
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '12:00',
      slotDuration: 10,
    });
  }

  // Evening shift: Sunday, Tuesday, Wednesday, Thursday 4 PM - 8 PM (10 min slots)
  const eveningDays = [0, 2, 3, 4]; // Sunday, Tuesday, Wednesday, Thursday
  for (const day of eveningDays) {
    schedule.push({
      dayOfWeek: day,
      startTime: '16:00',
      endTime: '20:00',
      slotDuration: 10,
    });
  }

  return schedule;
}

/**
 * Generate schedule for Dr. Ali Abid
 * - Sunday, Monday, Tuesday: 5 PM - 8 PM (15 min slots)
 * - Friday: 11 AM - 1 PM (15 min slots)
 */
export function generateDrAliAbidSchedule(): DoctorSchedule[] {
  const schedule: DoctorSchedule[] = [];

  // Sunday, Monday, Tuesday: 5 PM - 8 PM (15 min slots)
  const eveningDays = [0, 1, 2]; // Sunday, Monday, Tuesday
  for (const day of eveningDays) {
    schedule.push({
      dayOfWeek: day,
      startTime: '17:00',
      endTime: '20:00',
      slotDuration: 15,
    });
  }

  // Friday: 11 AM - 1 PM (15 min slots)
  schedule.push({
    dayOfWeek: 5, // Friday
    startTime: '11:00',
    endTime: '13:00',
    slotDuration: 15,
  });

  return schedule;
}

/**
 * Generate schedule for Dr. Adel Shalata
 * - Sunday, Monday, Wednesday, Thursday: 5 PM - 8 PM (10 min slots)
 * - Friday: 2 PM - 4 PM (10 min slots)
 */
export function generateDrAdelShalataSchedule(): DoctorSchedule[] {
  const schedule: DoctorSchedule[] = [];

  // Sunday, Monday, Wednesday, Thursday: 5 PM - 8 PM (10 min slots)
  const eveningDays = [0, 1, 3, 4]; // Sunday, Monday, Wednesday, Thursday
  for (const day of eveningDays) {
    schedule.push({
      dayOfWeek: day,
      startTime: '17:00',
      endTime: '20:00',
      slotDuration: 10,
    });
  }

  // Friday: 2 PM - 4 PM (10 min slots)
  schedule.push({
    dayOfWeek: 5, // Friday
    startTime: '14:00',
    endTime: '16:00',
    slotDuration: 10,
  });

  return schedule;
}

/**
 * Generate all available time slots for a given schedule entry
 * Returns array of time strings in HH:MM format
 */
export function generateTimeSlots(scheduleEntry: DoctorSchedule): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = scheduleEntry.startTime.split(':').map(Number);
  const [endHour, endMinute] = scheduleEntry.endTime.split(':').map(Number);

  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  let currentTimeInMinutes = startTimeInMinutes;

  while (currentTimeInMinutes < endTimeInMinutes) {
    const hour = Math.floor(currentTimeInMinutes / 60);
    const minute = currentTimeInMinutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    currentTimeInMinutes += scheduleEntry.slotDuration;
  }

  return slots;
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}
