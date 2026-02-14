import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { doctorService } from '../services/doctorService';
import { lockedSlotService } from '../services/lockedSlotService';
import { CreateDoctorInput, UpdateDoctorInput } from '../models/Doctor';
import {
  generateDrYosefSchedule,
  generateDrAliAbidSchedule,
  generateDrAdelShalataSchedule,
  generateTimeSlots,
  getDayName
} from '../utils/scheduleHelpers';

export class DoctorController {
  /**
   * Create a new doctor with schedule
   * Expects:
   * {
   *   userId: string,
   *   fullName: string,
   *   specialty: string,
   *   qualifications: string[],
   *   schedule: DoctorSchedule[]  // Array of schedule entries
   * }
   */
  async createDoctor(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateDoctorInput = req.body;
      const doctor = await doctorService.createDoctor(data);
      res.status(201).json(doctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Create a doctor with a UI-friendly schedule format
   * Expects:
   * {
   *   userId: string,
   *   fullName: string,
   *   specialty: string,
   *   qualifications: string[],
   *   scheduleEntries: [
   *     {
   *       days: [0, 1, 2],  // Array of day numbers (0=Sunday, 6=Saturday)
   *       startTime: "08:00",
   *       endTime: "12:00",
   *       slotDuration: 10
   *     }
   *   ]
   * }
   */
  async createDoctorWithSchedule(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        fullName,
        fullNameEn,
        fullNameHe,
        specialties,
        specialtiesEn,
        specialtiesHe,
        qualifications,
        qualificationsEn,
        qualificationsHe,
        scheduleEntries
      } = req.body;

      if (!scheduleEntries || !Array.isArray(scheduleEntries)) {
        res.status(400).json({ error: 'scheduleEntries array is required' });
        return;
      }

      // Convert UI-friendly format to DoctorSchedule format
      const schedule = [];
      for (const entry of scheduleEntries) {
        if (!entry.days || !Array.isArray(entry.days)) {
          res.status(400).json({ error: 'Each schedule entry must have a days array' });
          return;
        }

        for (const day of entry.days) {
          schedule.push({
            dayOfWeek: day,
            startTime: entry.startTime,
            endTime: entry.endTime,
            slotDuration: entry.slotDuration,
            type: entry.type || (specialties.length === 1 ? specialties[0] : undefined)
          });
        }
      }

      const doctorData: CreateDoctorInput = {
        userId,
        fullName,
        fullNameEn,
        fullNameHe,
        specialties: specialties || [],
        specialtiesEn: specialtiesEn || [],
        specialtiesHe: specialtiesHe || [],
        qualifications: qualifications || [],
        qualificationsEn: qualificationsEn || [],
        qualificationsHe: qualificationsHe || [],
        schedule
      };

      const doctor = await doctorService.createDoctor(doctorData);
      res.status(201).json(doctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getDoctorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await doctorService.getDoctorById(id as string);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }
      res.status(200).json(doctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllDoctors(req: Request, res: Response): Promise<void> {
    try {
      const { activeOnly } = req.query;
      const doctors = await doctorService.getAllDoctors(activeOnly === 'true');
      res.status(200).json(doctors);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduleEntries, specialties, ...otherData } = req.body;

      // If scheduleEntries is provided, convert to DoctorSchedule format
      let schedule;
      if (scheduleEntries && Array.isArray(scheduleEntries)) {
        schedule = [];
        for (const entry of scheduleEntries) {
          if (entry.days && Array.isArray(entry.days)) {
            for (const day of entry.days) {
              schedule.push({
                dayOfWeek: day,
                startTime: entry.startTime,
                endTime: entry.endTime,
                slotDuration: entry.slotDuration,
                type: entry.type || (specialties && specialties.length === 1 ? specialties[0] : undefined)
              });
            }
          }
        }
      }

      const updateData: UpdateDoctorInput = {
        ...otherData,
        specialties,
        ...(schedule && { schedule })
      };

      const doctor = await doctorService.updateDoctor(id as string, updateData);
      res.status(200).json(doctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await doctorService.deleteDoctor(id as string);
      res.status(200).json({ message: 'Doctor deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getDoctorsBySpecialty(req: Request, res: Response): Promise<void> {
    try {
      const { specialty } = req.params;
      const doctors = await doctorService.getDoctorsBySpecialty(specialty as string);
      res.status(200).json(doctors);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update doctor schedule using predefined templates
   * Expects body: { doctorName: 'yosef' | 'ali_abid' | 'adel_shalata' }
   */
  async updateDoctorSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { doctorName } = req.body;

      let schedule;
      switch (doctorName?.toLowerCase()) {
        case 'yosef':
          schedule = generateDrYosefSchedule();
          break;
        case 'ali_abid':
        case 'ali abid':
          schedule = generateDrAliAbidSchedule();
          break;
        case 'adel_shalata':
        case 'adel shalata':
          schedule = generateDrAdelShalataSchedule();
          break;
        default:
          res.status(400).json({ error: 'Invalid doctor name. Use: yosef, ali_abid, or adel_shalata' });
          return;
      }

      const updatedDoctor = await doctorService.updateDoctor(id as string, { schedule });
      res.status(200).json(updatedDoctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get available time slots for a doctor on a specific day
   * Query params: dayOfWeek (0-6, where 0 is Sunday)
   */
  async getDoctorAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { dayOfWeek } = req.query;

      if (dayOfWeek === undefined) {
        res.status(400).json({ error: 'dayOfWeek query parameter is required (0-6)' });
        return;
      }

      const day = parseInt(dayOfWeek as string);
      if (isNaN(day) || day < 0 || day > 6) {
        res.status(400).json({ error: 'dayOfWeek must be a number between 0 and 6' });
        return;
      }

      const doctor = await doctorService.getDoctorById(id as string);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }

      // Filter schedules for the requested day
      const daySchedules = doctor.schedule.filter(s => s.dayOfWeek === day);

      if (daySchedules.length === 0) {
        res.status(200).json({
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          dayOfWeek: day,
          dayName: getDayName(day),
          slots: [],
          message: 'Doctor is not available on this day'
        });
        return;
      }

      // Generate time slots for each schedule period on this day
      const allSlots: string[] = [];
      for (const schedule of daySchedules) {
        const slots = generateTimeSlots(schedule);
        allSlots.push(...slots);
      }

      res.status(200).json({
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        dayOfWeek: day,
        dayName: getDayName(day),
        schedules: daySchedules,
        slots: allSlots
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get complete weekly schedule with all time slots for a doctor
   */
  async getDoctorWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const doctor = await doctorService.getDoctorById(id as string);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }

      // Group schedules by day and generate slots
      const weeklySchedule = [];
      for (let day = 0; day <= 6; day++) {
        const daySchedules = doctor.schedule.filter(s => s.dayOfWeek === day);
        const allSlots: string[] = [];

        for (const schedule of daySchedules) {
          const slots = generateTimeSlots(schedule);
          allSlots.push(...slots);
        }

        weeklySchedule.push({
          dayOfWeek: day,
          dayName: getDayName(day),
          schedules: daySchedules,
          totalSlots: allSlots.length,
          slots: allSlots
        });
      }

      res.status(200).json({
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialties: doctor.specialties,
        weeklySchedule
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   * Query params: date (YYYY-MM-DD), serviceType (optional)
   * Returns slots with availability status based on existing appointments
   */
  async getAvailableSlotsForDate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, serviceType } = req.query;

      if (!date) {
        res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
        return;
      }

      // Parse the date
      const dateStr = date as string;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
        return;
      }

      // Parse date parts directly to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const requestedDate = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(requestedDate.getTime())) {
        res.status(400).json({ error: 'Invalid date' });
        return;
      }

      // Get the day of week using UTC to avoid timezone issues (0 = Sunday, 6 = Saturday)
      const dayOfWeek = requestedDate.getUTCDay();

      const doctor = await doctorService.getDoctorById(id as string);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }

      // Debug logging
      console.log('Available slots request:', {
        doctorId: id,
        dateStr,
        dayOfWeek,
        serviceType,
        doctorSchedule: doctor.schedule.map(s => ({ dayOfWeek: s.dayOfWeek, type: s.type }))
      });

      // Filter schedules for the requested day
      let daySchedules = doctor.schedule.filter(s => s.dayOfWeek === dayOfWeek);
      console.log('Day schedules found:', daySchedules.length);

      // If serviceType is provided, filter schedules by type
      // But include schedules without a type (they're available for all services)
      if (serviceType && daySchedules.length > 0) {
        daySchedules = daySchedules.filter(s => !s.type || s.type === serviceType);
        console.log('After serviceType filter:', daySchedules.length);
      }

      if (daySchedules.length === 0) {
        res.status(200).json({
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          date: dateStr,
          dayOfWeek,
          dayName: getDayName(dayOfWeek),
          serviceType: serviceType || null,
          slots: [],
          totalSlots: 0,
          availableSlots: 0,
          bookedSlots: 0,
          message: serviceType
            ? `Doctor is not available for ${serviceType} on this day`
            : 'Doctor is not available on this day'
        });
        return;
      }

      // Generate all time slots for this day
      const allSlots: string[] = [];
      for (const schedule of daySchedules) {
        const slots = generateTimeSlots(schedule);
        allSlots.push(...slots);
      }

      // Remove duplicates and sort
      const uniqueSlots = [...new Set(allSlots)].sort();

      // Get existing appointments for this doctor
      // Query only by doctorId to avoid needing composite index
      // Filter date and status in memory
      const db = admin.firestore();
      const appointmentsSnapshot = await db.collection('appointments')
        .where('doctorId', '==', id)
        .get();

      // Get booked time slots for this specific date
      const bookedSlots = new Set<string>();
      appointmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Check if appointment is on the same date
        if (data.appointmentDate) {
          // Handle different date formats
          let appointmentDate: Date;
          const dateVal = data.appointmentDate as any;
          if (typeof dateVal.toDate === 'function') {
            appointmentDate = dateVal.toDate();
          } else if (typeof dateVal._seconds === 'number') {
            appointmentDate = new Date(dateVal._seconds * 1000);
          } else if (typeof dateVal === 'string') {
            appointmentDate = new Date(dateVal);
          } else {
            return;
          }
          const aptDateStr = appointmentDate.toISOString().split('T')[0];
          // Only count active appointments on this date as booked
          if (aptDateStr === dateStr && data.appointmentTime && ['scheduled', 'completed'].includes(data.status)) {
            bookedSlots.add(data.appointmentTime);
          }
        }
      });

      // Get locked slots for this doctor and date (wrapped in try-catch for graceful handling)
      let lockedTimes = new Set<string>();
      try {
        const lockedSlots = await lockedSlotService.getLockedSlotsByDate(id as string, requestedDate);
        lockedTimes = new Set(lockedSlots.map(slot => slot.time));
      } catch (lockedSlotsError) {
        // If locked slots query fails (e.g., missing index), continue without locked info
        console.warn('Failed to fetch locked slots:', lockedSlotsError);
      }

      // Build slots with availability status (including locked status)
      const slotsWithAvailability = uniqueSlots.map(time => ({
        time,
        available: !bookedSlots.has(time) && !lockedTimes.has(time),
        locked: lockedTimes.has(time)
      }));

      res.status(200).json({
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        date: dateStr,
        dayOfWeek,
        dayName: getDayName(dayOfWeek),
        serviceType: serviceType || null,
        totalSlots: uniqueSlots.length,
        availableSlots: slotsWithAvailability.filter(s => s.available).length,
        bookedSlots: slotsWithAvailability.filter(s => !s.available).length,
        slots: slotsWithAvailability
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const doctorController = new DoctorController();
