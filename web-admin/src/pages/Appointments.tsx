import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Tabs,
  Tab,
  alpha,
  Select,
  TableSortLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { healthcareColors, glassStyles, shadows, gradients } from '../theme/healthcareTheme';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  HourglassEmpty as WaitingListIcon,
  PersonAdd as PersonAddIcon,
  ViewKanban as ViewKanbanIcon,
  TableRows as TableRowsIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  Archive as ArchiveIcon,
  EventAvailable as ActiveIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppointmentNotification } from '../hooks/useAppointmentNotification';
import dayjs from 'dayjs';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientIdNumber?: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: { _seconds: number } | string;
  appointmentTime: string;
  serviceType: string;
  duration: number;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialties: string[];
}

interface Patient {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  idNumber?: string;
}

interface SlotInfo {
  time: string;
  available: boolean;
}

interface AvailableSlotsResponse {
  doctorId: string;
  doctorName: string;
  date: string;
  slots: SlotInfo[];
  availableSlots: number;
  totalSlots: number;
}

type ViewMode = 'list' | 'kanban' | 'calendar' | 'day';

export const Appointments: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [listTab, setListTab] = useState<'active' | 'archive'>('active');
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs>(dayjs());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [noSlotsAvailable, setNoSlotsAvailable] = useState(false);
  const [dayViewDoctorSlots, setDayViewDoctorSlots] = useState<Record<string, { doctorId: string; doctorName: string; time: string }[]>>({});
  const [loadingDayViewSlots, setLoadingDayViewSlots] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
  });
  const [formData, setFormData] = useState<{
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    notes: string;
  }>({
    status: 'scheduled',
    notes: '',
  });

  // Sorting state for list view
  const [sortField, setSortField] = useState<'dateTime' | 'status'>('dateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Scheduling dialog state (for pending -> scheduled drag)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [appointmentToSchedule, setAppointmentToSchedule] = useState<Appointment | null>(null);
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);
  const [scheduleService, setScheduleService] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleSlots, setScheduleSlots] = useState<SlotInfo[]>([]);
  const [loadingScheduleSlots, setLoadingScheduleSlots] = useState(false);

  const { getToken } = useAuth();
  const { t, direction } = useLanguage();
  const isRtl = direction === 'rtl';

  // RTL-aware styles for select dropdowns
  const selectRtlSx = {
    ...(isRtl && {
      '& .MuiSelect-icon': {
        right: 'auto',
        left: 7,
      },
      '& .MuiOutlinedInput-input': {
        paddingRight: '14px !important',
        paddingLeft: '32px !important',
      },
    }),
  };

  // RTL-aware styles for Autocomplete
  const autocompleteRtlSx = {
    ...(isRtl && {
      '& .MuiAutocomplete-endAdornment': {
        right: 'auto',
        left: 9,
      },
      '& .MuiOutlinedInput-root': {
        paddingRight: '14px !important',
        paddingLeft: '65px !important',
      },
    }),
  };
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/appointments');
      return response.data;
    },
    // Poll every 30 seconds to check for new appointments
    refetchInterval: 500000,
    refetchIntervalInBackground: true,
  });

  // Play notification sound when new pending appointments are detected
  useAppointmentNotification(appointments, true);

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/doctors');
      return response.data;
    },
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/patients');
      return response.data;
    },
  });

  // Load available slots when doctor and date change
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setNoSlotsAvailable(false);
      try {
        const token = await getToken();
        if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams({ date: selectedDate });
        if (selectedService) {
          params.append('serviceType', selectedService);
        }

        const response = await apiClient.get<AvailableSlotsResponse>(
          `/doctors/${selectedDoctor.id}/available-slots?${params.toString()}`
        );

        setAvailableSlots(response.data.slots || []);
        setNoSlotsAvailable(response.data.availableSlots === 0);
      } catch (error) {
        console.error('Failed to load slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDoctor, selectedDate, selectedService, getToken]);

  // Load all doctors' available slots for day view
  useEffect(() => {
    const loadDayViewSlots = async () => {
      if (viewMode !== 'day' || !doctors || doctors.length === 0) {
        return;
      }

      setLoadingDayViewSlots(true);
      try {
        const token = await getToken();
        if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const dateStr = selectedDay.format('YYYY-MM-DD');
        const slotsByHour: Record<string, { doctorId: string; doctorName: string; time: string }[]> = {};

        // Initialize all hours
        for (let h = 8; h <= 20; h++) {
          slotsByHour[h.toString()] = [];
        }

        // Fetch availability for all doctors in parallel
        await Promise.all(
          doctors.map(async (doctor) => {
            try {
              const response = await apiClient.get<AvailableSlotsResponse>(
                `/doctors/${doctor.id}/available-slots?date=${dateStr}`
              );
              const slots = response.data.slots || [];

              slots.forEach(slot => {
                if (slot.available) {
                  const hour = parseInt(slot.time.split(':')[0], 10);
                  if (slotsByHour[hour.toString()]) {
                    slotsByHour[hour.toString()].push({
                      doctorId: doctor.id,
                      doctorName: doctor.fullName,
                      time: slot.time,
                    });
                  }
                }
              });
            } catch {
              // Ignore errors for individual doctors
            }
          })
        );

        setDayViewDoctorSlots(slotsByHour);
      } catch (error) {
        console.error('Failed to load day view slots:', error);
      } finally {
        setLoadingDayViewSlots(false);
      }
    };

    loadDayViewSlots();
  }, [viewMode, selectedDay, doctors, getToken]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post('/appointments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.put(`/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.delete(`/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    },
  });

  // Helper to check if appointment is before today (yesterday or earlier)
  // EXCEPTION: Pending appointments are NEVER archived - admins need to see them
  const isAppointmentArchived = (appointment: Appointment) => {
    // Pending appointments always stay in active view, even if from past dates
    if (appointment.status === 'pending') {
      return false;
    }
    const aptDate = typeof appointment.appointmentDate === 'string'
      ? dayjs(appointment.appointmentDate)
      : dayjs(appointment.appointmentDate._seconds * 1000);
    // Archive = before today (yesterday and earlier)
    return aptDate.isBefore(dayjs().startOf('day'));
  };

  // Filter appointments for active/archive tabs
  // Active: today and future appointments (shown in Kanban)
  // Archive: yesterday and earlier (shown in list)
  const activeAppointments = appointments?.filter(apt => {
    return !isAppointmentArchived(apt); // Today and future
  }) || [];

  const archivedAppointments = appointments?.filter(apt => {
    return isAppointmentArchived(apt); // Yesterday and before
  }).sort((a, b) => {
    // Sort archive by date descending (newest first)
    const dateA = typeof a.appointmentDate === 'string'
      ? dayjs(a.appointmentDate)
      : dayjs(a.appointmentDate._seconds * 1000);
    const dateB = typeof b.appointmentDate === 'string'
      ? dayjs(b.appointmentDate)
      : dayjs(b.appointmentDate._seconds * 1000);
    return dateB.valueOf() - dateA.valueOf();
  }) || [];

  // Delete confirmation handlers
  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (appointmentToDelete) {
      deleteMutation.mutate(appointmentToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  // Drag and drop state
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Track expanded Kanban columns (show all vs max 5)
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const MAX_VISIBLE_APPOINTMENTS = 5;

  // Status update mutation for drag and drop
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.put(`/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverStatus(null);
    if (draggedAppointment && draggedAppointment.status !== newStatus) {
      // If moving from pending to scheduled, check if appointment already has all required data
      if (draggedAppointment.status === 'pending' && newStatus === 'scheduled') {
        // If appointment already has doctor, date, time, and service - schedule directly
        if (draggedAppointment.doctorId && draggedAppointment.appointmentDate &&
            draggedAppointment.appointmentTime && draggedAppointment.serviceType) {
          // Schedule directly with existing data - no dialog needed
          updateStatusMutation.mutate({ id: draggedAppointment.id, status: 'scheduled' });
        } else {
          // Missing data - show scheduling dialog to fill in
          setAppointmentToSchedule(draggedAppointment);
          const doctor = doctors?.find(d => d.id === draggedAppointment.doctorId);
          setScheduleDoctor(doctor || null);
          setScheduleService(draggedAppointment.serviceType || '');
          setScheduleDate(dayjs().format('YYYY-MM-DD'));
          setScheduleTime('');
          setScheduleSlots([]);
          setScheduleDialogOpen(true);
        }
      } else {
        // For other status changes, update directly
        updateStatusMutation.mutate({ id: draggedAppointment.id, status: newStatus });
      }
    }
    setDraggedAppointment(null);
  };

  // Handle scheduling dialog close
  const handleScheduleDialogClose = () => {
    setScheduleDialogOpen(false);
    setAppointmentToSchedule(null);
    setScheduleDoctor(null);
    setScheduleService('');
    setScheduleDate('');
    setScheduleTime('');
    setScheduleSlots([]);
  };

  // Fetch available slots for scheduling dialog
  useEffect(() => {
    const fetchScheduleSlots = async () => {
      if (!scheduleDoctor || !scheduleDate) {
        setScheduleSlots([]);
        return;
      }

      setLoadingScheduleSlots(true);
      try {
        const token = await getToken();
        if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const params = new URLSearchParams({ date: scheduleDate });
        if (scheduleService) params.append('serviceType', scheduleService);
        const response = await apiClient.get<AvailableSlotsResponse>(
          `/doctors/${scheduleDoctor.id}/available-slots?${params.toString()}`
        );
        setScheduleSlots(response.data.slots || []);
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
        setScheduleSlots([]);
      } finally {
        setLoadingScheduleSlots(false);
      }
    };

    fetchScheduleSlots();
  }, [scheduleDoctor, scheduleDate, scheduleService, getToken]);

  // Schedule appointment mutation
  const scheduleAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.put(`/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      handleScheduleDialogClose();
    },
  });

  // Handle scheduling dialog submit
  const handleScheduleSubmit = () => {
    if (!appointmentToSchedule || !scheduleDoctor || !scheduleDate || !scheduleTime || !scheduleService) {
      return;
    }

    scheduleAppointmentMutation.mutate({
      id: appointmentToSchedule.id,
      data: {
        status: 'scheduled',
        doctorId: scheduleDoctor.id,
        doctorName: scheduleDoctor.fullName,
        serviceType: scheduleService,
        appointmentDate: scheduleDate,
        appointmentTime: scheduleTime,
      },
    });
  };

  const availableScheduleSlots = scheduleSlots.filter(s => s.available);

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.post('/patients', data);
      return response.data;
    },
  });

  const addToWaitingListMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post('/waiting-list', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitingList'] });
      handleClose();
    },
  });

  const handleOpen = (appointment?: Appointment) => {
    if (appointment) {
      setEditingId(appointment.id);
      const doctor = doctors?.find(d => d.id === appointment.doctorId);
      const patient = patients?.find(p => p.id === appointment.patientId);
      setSelectedDoctor(doctor || null);
      setSelectedPatient(patient || null);
      // Handle both Firestore Timestamp format and ISO string format
      const appointmentDate = appointment.appointmentDate;
      let dateValue: string;
      if (appointmentDate && typeof (appointmentDate as any)._seconds === 'number') {
        dateValue = dayjs((appointmentDate as any)._seconds * 1000).format('YYYY-MM-DD');
      } else if (typeof appointmentDate === 'string') {
        dateValue = dayjs(appointmentDate).format('YYYY-MM-DD');
      } else {
        dateValue = dayjs().format('YYYY-MM-DD');
      }
      setSelectedDate(dateValue);
      setSelectedTime(appointment.appointmentTime || '');
      setSelectedService(appointment.serviceType || '');
      setIsNewPatient(false);
      setNewPatientData({ fullName: '', idNumber: '', phoneNumber: '' });
      setFormData({
        status: appointment.status,
        notes: appointment.notes || '',
      });
    } else {
      setEditingId(null);
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setSelectedDate('');
      setSelectedTime('');
      setSelectedService('');
      setAvailableSlots([]);
      setIsNewPatient(false);
      setNewPatientData({ fullName: '', idNumber: '', phoneNumber: '' });
      setFormData({
        status: 'scheduled',
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setNoSlotsAvailable(false);
    setIsNewPatient(false);
    setNewPatientData({ fullName: '', idNumber: '', phoneNumber: '' });
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !selectedService) {
      return;
    }

    // Check if we have a patient (either selected or new patient data)
    if (!isNewPatient && !selectedPatient) {
      return;
    }
    if (isNewPatient && !newPatientData.fullName) {
      return;
    }

    try {
      let patientId = selectedPatient?.id;

      // If creating a new patient, create them first
      if (isNewPatient && newPatientData.fullName) {
        const newPatient = await createPatientMutation.mutateAsync({
          fullName: newPatientData.fullName,
          idNumber: newPatientData.idNumber || undefined,
          phoneNumber: newPatientData.phoneNumber || undefined,
          dateOfBirth: new Date(2000, 0, 1), // Default
          gender: 'other', // Default
        });
        patientId = newPatient.id;
        // Refresh patients list
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      }

      if (!patientId) {
        return;
      }

      const appointmentData = {
        patientId,
        doctorId: selectedDoctor.id,
        appointmentDate: new Date(selectedDate + 'T' + selectedTime).toISOString(),
        appointmentTime: selectedTime,
        serviceType: selectedService,
        duration: 15, // Default duration
        status: formData.status,
        notes: formData.notes,
      };

      if (editingId) {
        updateMutation.mutate({ id: editingId, data: appointmentData });
      } else {
        createMutation.mutate(appointmentData);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleAddToWaitingList = async () => {
    if (!selectedDoctor || !selectedDate || !selectedService) {
      return;
    }

    // Check if we have a patient (either selected or new patient data)
    if (!isNewPatient && !selectedPatient) {
      return;
    }
    if (isNewPatient && !newPatientData.fullName) {
      return;
    }

    try {
      let patientId = selectedPatient?.id;
      let patientName = selectedPatient?.fullName;

      // If creating a new patient, create them first
      if (isNewPatient && newPatientData.fullName) {
        const newPatient = await createPatientMutation.mutateAsync({
          fullName: newPatientData.fullName,
          idNumber: newPatientData.idNumber || undefined,
          phoneNumber: newPatientData.phoneNumber || undefined,
          dateOfBirth: new Date(2000, 0, 1),
          gender: 'other',
        });
        patientId = newPatient.id;
        patientName = newPatientData.fullName;
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      }

      if (!patientId) {
        return;
      }

      addToWaitingListMutation.mutate({
        patientId,
        patientName,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        serviceType: selectedService,
        preferredDate: selectedDate,
        notes: formData.notes,
      });
    } catch (error) {
      console.error('Error adding to waiting list:', error);
    }
  };

  const getStatusColor = (status: string): 'warning' | 'primary' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'default';
      default: return 'default';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FEF3C7';      // Warm amber background
      case 'scheduled': return '#CCFBF1';    // Teal surface (primary)
      case 'completed': return '#DCFCE7';    // Fresh green background
      case 'cancelled': return '#FEE2E2';    // Soft red background
      case 'no-show': return '#F1F5F9';      // Neutral gray background
      default: return '#F1F5F9';
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';      // Vibrant amber
      case 'scheduled': return '#0D9488';    // Teal (matches primary)
      case 'completed': return '#22C55E';    // Fresh green
      case 'cancelled': return '#EF4444';    // Vibrant red
      case 'no-show': return '#64748B';      // Slate gray
      default: return '#64748B';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'pending': return '#B45309';      // Darker amber for text
      case 'scheduled': return '#0F766E';    // Darker teal for text
      case 'completed': return '#16A34A';    // Darker green for text
      case 'cancelled': return '#DC2626';    // Darker red for text
      case 'no-show': return '#475569';      // Darker gray for text
      default: return '#475569';
    }
  };

  const availableTimeSlots = availableSlots.filter(s => s.available);

  // Calendar helper functions
  const getDaysInMonth = (date: dayjs.Dayjs) => {
    const startOfMonth = date.startOf('month');
    const startDay = startOfMonth.day(); // 0 = Sunday
    const daysInMonth = date.daysInMonth();

    const days: (dayjs.Dayjs | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(date.date(i));
    }

    // Fill remaining slots to complete the grid (6 rows x 7 days = 42)
    while (days.length < 42) {
      days.push(null);
    }

    return days;
  };

  const getAppointmentsForDate = (date: dayjs.Dayjs) => {
    return appointments?.filter(apt => {
      // Exclude cancelled appointments from calendar view (they appear in Kanban)
      if (apt.status === 'cancelled') return false;
      const aptDate = typeof apt.appointmentDate === 'string'
        ? dayjs(apt.appointmentDate)
        : dayjs(apt.appointmentDate._seconds * 1000);
      return aptDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    }) || [];
  };

  const calendarDays = getDaysInMonth(calendarDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: gradients.info,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 14px ${alpha(healthcareColors.info, 0.4)}`,
            }}
          >
            <CalendarIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {t('appointments')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('manageAppointments')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newView) => newView && setViewMode(newView)}
            size="small"
          >
            <ToggleButton value="list">
              <Tooltip title={t('tableView')}>
                <TableRowsIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="kanban">
              <Tooltip title={t('kanbanView')}>
                <ViewKanbanIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="calendar">
              <Tooltip title={t('calendarView')}>
                <CalendarIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: gradients.info,
              color: 'white',
              boxShadow: `0 4px 14px ${alpha(healthcareColors.info, 0.4)}`,
              '&:hover': {
                background: gradients.info,
                filter: 'brightness(0.95)',
                boxShadow: `0 6px 20px ${alpha(healthcareColors.info, 0.5)}`,
              },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            {t('addAppointment')}
          </Button>
        </Box>
      </Box>

      {viewMode === 'list' ? (
        /* Table List View */
        <Box>
          {/* Active/Archive Tabs */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={listTab}
              onChange={(_, newTab) => setListTab(newTab)}
              sx={{ px: 2 }}
            >
              <Tab
                value="active"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActiveIcon fontSize="small" />
                    {t('active')} ({activeAppointments.length})
                  </Box>
                }
              />
              <Tab
                value="archive"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArchiveIcon fontSize="small" />
                    {t('archive')} ({archivedAppointments.length})
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('patient')}</TableCell>
                    <TableCell>{t('idNumber')}</TableCell>
                    <TableCell>{t('doctor')}</TableCell>
                    <TableCell>{t('service')}</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'dateTime'}
                        direction={sortField === 'dateTime' ? sortDirection : 'asc'}
                        onClick={() => {
                          if (sortField === 'dateTime') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField('dateTime');
                            setSortDirection('asc');
                          }
                        }}
                      >
                        {t('dateTime')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'status'}
                        direction={sortField === 'status' ? sortDirection : 'asc'}
                        onClick={() => {
                          if (sortField === 'status') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortField('status');
                            setSortDirection('asc');
                          }
                        }}
                      >
                        {t('status')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(listTab === 'active' ? activeAppointments : archivedAppointments).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {listTab === 'active' ? t('noAppointments') : t('noArchivedAppointments')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (listTab === 'active' ? activeAppointments : archivedAppointments)
                      .sort((a, b) => {
                        if (sortField === 'dateTime') {
                          const dateA = typeof a.appointmentDate === 'string'
                            ? dayjs(a.appointmentDate)
                            : dayjs(a.appointmentDate._seconds * 1000);
                          const dateB = typeof b.appointmentDate === 'string'
                            ? dayjs(b.appointmentDate)
                            : dayjs(b.appointmentDate._seconds * 1000);
                          let dateCompare = dateA.valueOf() - dateB.valueOf();
                          if (dateCompare === 0) {
                            dateCompare = (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
                          }
                          return sortDirection === 'asc' ? dateCompare : -dateCompare;
                        } else {
                          // Sort by status
                          const statusOrder = ['pending', 'scheduled', 'completed', 'cancelled', 'no-show'];
                          const statusCompare = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
                          return sortDirection === 'asc' ? statusCompare : -statusCompare;
                        }
                      })
                      .map((appointment) => {
                        // Get patient idNumber from patients list
                        const patient = patients?.find(p => p.id === appointment.patientId);
                        const patientIdNumber = appointment.patientIdNumber || patient?.idNumber || '-';

                        return (
                          <TableRow key={appointment.id} hover>
                            <TableCell>{appointment.patientName}</TableCell>
                            <TableCell>{patientIdNumber}</TableCell>
                            <TableCell>{appointment.doctorName}</TableCell>
                            <TableCell>{appointment.serviceType || '-'}</TableCell>
                            <TableCell>
                              {typeof appointment.appointmentDate === 'string'
                                ? dayjs(appointment.appointmentDate).format('MMM DD, YYYY')
                                : dayjs(appointment.appointmentDate._seconds * 1000).format('MMM DD, YYYY')}
                              {appointment.appointmentTime && ` at ${appointment.appointmentTime}`}
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={appointment.status}
                                onChange={(e: SelectChangeEvent) => {
                                  const newStatus = e.target.value as Appointment['status'];
                                  if (newStatus !== appointment.status) {
                                    updateStatusMutation.mutate({ id: appointment.id, status: newStatus });
                                  }
                                }}
                                sx={{
                                  minWidth: 140,
                                  borderRadius: '20px',
                                  backgroundColor: getStatusBgColor(appointment.status),
                                  fontWeight: 600,
                                  fontSize: '0.8125rem',
                                  transition: 'all 0.2s ease',
                                  '& .MuiSelect-select': {
                                    py: 0.75,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: getStatusBorderColor(appointment.status),
                                    borderWidth: '1.5px',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: getStatusBorderColor(appointment.status),
                                    borderWidth: '2px',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: getStatusBorderColor(appointment.status),
                                    borderWidth: '2px',
                                  },
                                  '&:hover': {
                                    boxShadow: `0 2px 8px ${alpha(getStatusBorderColor(appointment.status), 0.25)}`,
                                  },
                                  ...selectRtlSx,
                                }}
                                renderValue={(value) => (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: getStatusBorderColor(value as string),
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: getStatusTextColor(value as string),
                                        fontWeight: 600,
                                        fontSize: '0.8125rem',
                                      }}
                                    >
                                      {t(value === 'no-show' ? 'noShow' : value as string)}
                                    </Typography>
                                  </Box>
                                )}
                              >
                                <MenuItem value="pending" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#FEF3C7' } }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                                  <Typography sx={{ color: '#B45309', fontWeight: 600 }}>{t('pending')}</Typography>
                                </MenuItem>
                                <MenuItem value="scheduled" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#CCFBF1' } }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0D9488' }} />
                                  <Typography sx={{ color: '#0F766E', fontWeight: 600 }}>{t('scheduled')}</Typography>
                                </MenuItem>
                                <MenuItem value="completed" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#DCFCE7' } }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22C55E' }} />
                                  <Typography sx={{ color: '#16A34A', fontWeight: 600 }}>{t('completed')}</Typography>
                                </MenuItem>
                                <MenuItem value="cancelled" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#FEE2E2' } }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444' }} />
                                  <Typography sx={{ color: '#DC2626', fontWeight: 600 }}>{t('cancelled')}</Typography>
                                </MenuItem>
                                <MenuItem value="no-show" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#F1F5F9' } }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#64748B' }} />
                                  <Typography sx={{ color: '#475569', fontWeight: 600 }}>{t('noShow')}</Typography>
                                </MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <Tooltip title={t('edit')}>
                                  <IconButton size="small" onClick={() => handleOpen(appointment)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('delete')}>
                                  <IconButton size="small" color="error" onClick={() => handleDeleteClick(appointment)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <Box>
          {/* Active/Archive Tabs */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={listTab}
              onChange={(_, newTab) => setListTab(newTab)}
              sx={{ px: 2 }}
            >
              <Tab
                value="active"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActiveIcon fontSize="small" />
                    {t('active')} ({activeAppointments.length})
                  </Box>
                }
              />
              <Tab
                value="archive"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArchiveIcon fontSize="small" />
                    {t('archive')} ({archivedAppointments.length})
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : listTab === 'archive' ? (
            /* Archive List View */
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('patient')}</TableCell>
                    <TableCell>{t('idNumber')}</TableCell>
                    <TableCell>{t('doctor')}</TableCell>
                    <TableCell>{t('service')}</TableCell>
                    <TableCell>{t('dateTime')}</TableCell>
                    <TableCell>{t('status')}</TableCell>
                    <TableCell align="right">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {archivedAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {t('noArchivedAppointments')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    archivedAppointments.map((appointment) => {
                      const patient = patients?.find(p => p.id === appointment.patientId);
                      const patientIdNumber = appointment.patientIdNumber || patient?.idNumber || '-';

                      return (
                        <TableRow key={appointment.id} hover>
                          <TableCell>{appointment.patientName}</TableCell>
                          <TableCell>{patientIdNumber}</TableCell>
                          <TableCell>{appointment.doctorName}</TableCell>
                          <TableCell>{appointment.serviceType || '-'}</TableCell>
                          <TableCell>
                            {typeof appointment.appointmentDate === 'string'
                              ? dayjs(appointment.appointmentDate).format('MMM DD, YYYY')
                              : dayjs(appointment.appointmentDate._seconds * 1000).format('MMM DD, YYYY')}
                            {appointment.appointmentTime && ` at ${appointment.appointmentTime}`}
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={appointment.status}
                              onChange={(e: SelectChangeEvent) => {
                                const newStatus = e.target.value as Appointment['status'];
                                if (newStatus !== appointment.status) {
                                  updateStatusMutation.mutate({ id: appointment.id, status: newStatus });
                                }
                              }}
                              sx={{
                                minWidth: 130,
                                backgroundColor: getStatusBgColor(appointment.status),
                                borderColor: getStatusBorderColor(appointment.status),
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: getStatusBorderColor(appointment.status),
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: getStatusBorderColor(appointment.status),
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: getStatusBorderColor(appointment.status),
                                },
                              }}
                            >
                              <MenuItem value="pending" sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600, '&:hover': { backgroundColor: '#FDE68A' } }}>{t('pending')}</MenuItem>
                              <MenuItem value="scheduled" sx={{ backgroundColor: '#CCFBF1', color: '#0F766E', fontWeight: 600, '&:hover': { backgroundColor: '#99F6E4' } }}>{t('scheduled')}</MenuItem>
                              <MenuItem value="completed" sx={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 600, '&:hover': { backgroundColor: '#BBF7D0' } }}>{t('completed')}</MenuItem>
                              <MenuItem value="cancelled" sx={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 600, '&:hover': { backgroundColor: '#FECACA' } }}>{t('cancelled')}</MenuItem>
                              <MenuItem value="no-show" sx={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600, '&:hover': { backgroundColor: '#E2E8F0' } }}>{t('noShow')}</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title={t('edit')}>
                                <IconButton size="small" onClick={() => handleOpen(appointment)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('delete')}>
                                <IconButton size="small" color="error" onClick={() => handleDeleteClick(appointment)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* Kanban Columns for Active Tab */
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 2,
                height: 'calc(100vh - 250px)',
                minHeight: 400,
              }}
            >
              {(['pending', 'scheduled', 'completed', 'cancelled', 'no-show'] as const).map((status) => {
                const statusAppointments = activeAppointments.filter(apt => apt.status === status);
                const statusLabels: Record<string, string> = {
                  'pending': t('pending'),
                  'scheduled': t('scheduled'),
                  'completed': t('completed'),
                  'cancelled': t('cancelled'),
                  'no-show': t('noShow'),
                };

                return (
                  <Paper
                    key={status}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                    sx={{
                      p: 1.5,
                      bgcolor: dragOverStatus === status ? 'action.hover' : 'grey.50',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      overflow: 'hidden',
                      transition: 'background-color 0.2s',
                      outline: dragOverStatus === status ? '2px dashed' : 'none',
                      outlineColor: dragOverStatus === status ? getStatusBorderColor(status) : 'transparent',
                    }}
                  >
                    {/* Column Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                        pb: 1,
                        borderBottom: '2px solid',
                        borderColor: getStatusBorderColor(status),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: getStatusBorderColor(status),
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {statusLabels[status]}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusAppointments.length}
                        size="small"
                        sx={{
                          height: 20,
                          minWidth: 20,
                          fontSize: '0.7rem',
                          bgcolor: getStatusBgColor(status),
                          color: getStatusBorderColor(status),
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: 0.5,
                            display: 'flex',
                            justifyContent: 'center',
                          },
                        }}
                      />
                    </Box>

                    {/* Column Cards */}
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}
                    >
                      {statusAppointments.length === 0 ? (
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.disabled',
                          }}
                        >
                          <Typography variant="body2">{t('noAppointments')}</Typography>
                        </Box>
                      ) : (
                        <>
                          {(() => {
                            const sortedAppointments = statusAppointments.sort((a, b) => {
                              const dateA = typeof a.appointmentDate === 'string'
                                ? dayjs(a.appointmentDate)
                                : dayjs(a.appointmentDate._seconds * 1000);
                              const dateB = typeof b.appointmentDate === 'string'
                                ? dayjs(b.appointmentDate)
                                : dayjs(b.appointmentDate._seconds * 1000);
                              // First compare by date
                              const dateCompare = dateA.startOf('day').valueOf() - dateB.startOf('day').valueOf();
                              if (dateCompare !== 0) return dateCompare;
                              // If same date, compare by time
                              const timeA = a.appointmentTime || '00:00';
                              const timeB = b.appointmentTime || '00:00';
                              return timeA.localeCompare(timeB);
                            });

                            const isExpanded = expandedColumns.has(status);
                            const hasMore = sortedAppointments.length > MAX_VISIBLE_APPOINTMENTS;
                            const visibleAppointments = isExpanded
                              ? sortedAppointments
                              : sortedAppointments.slice(0, MAX_VISIBLE_APPOINTMENTS);

                            return (
                              <>
                                {visibleAppointments.map((appointment) => (
                                  <Paper
                                    key={appointment.id}
                                    elevation={1}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, appointment)}
                                    onDragEnd={handleDragEnd}
                                    sx={{
                                      p: 1.5,
                                      cursor: 'grab',
                                      transition: 'all 0.2s',
                                      borderLeft: '3px solid',
                                      borderColor: getStatusBorderColor(appointment.status),
                                      opacity: draggedAppointment?.id === appointment.id ? 0.5 : 1,
                                      // Virtual scroll optimization - skip rendering off-screen items
                                      contentVisibility: 'auto',
                                      containIntrinsicSize: '0 100px',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                      },
                                      '&:active': {
                                        cursor: 'grabbing',
                                      },
                                    }}
                                    onClick={() => handleOpen(appointment)}
                                  >
                                    {/* Patient Name */}
                                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                                      {appointment.patientName}
                                    </Typography>

                                    {/* Doctor */}
                                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                      Dr. {appointment.doctorName}
                                    </Typography>

                                    {/* Date & Time */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                      <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {typeof appointment.appointmentDate === 'string'
                                          ? dayjs(appointment.appointmentDate).format('MMM DD')
                                          : dayjs(appointment.appointmentDate._seconds * 1000).format('MMM DD')}
                                        {appointment.appointmentTime && ` • ${appointment.appointmentTime}`}
                                      </Typography>
                                    </Box>

                                    {/* Service Type */}
                                    {appointment.serviceType && (
                                      <Chip
                                        label={appointment.serviceType}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          mt: 1,
                                          height: 20,
                                          fontSize: '0.65rem',
                                        }}
                                      />
                                    )}

                                    {/* Quick Actions */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 0.5 }}>
                                      <Tooltip title={t('edit')}>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpen(appointment);
                                          }}
                                          sx={{ p: 0.5 }}
                                        >
                                          <EditIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title={t('delete')}>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(appointment);
                                          }}
                                          sx={{ p: 0.5 }}
                                        >
                                          <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Paper>
                                ))}

                                {/* Show more/less button */}
                                {hasMore && (
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                      setExpandedColumns(prev => {
                                        const next = new Set(prev);
                                        if (isExpanded) {
                                          next.delete(status);
                                        } else {
                                          next.add(status);
                                        }
                                        return next;
                                      });
                                    }}
                                    sx={{
                                      mt: 0.5,
                                      py: 0.5,
                                      fontSize: '0.75rem',
                                      color: 'text.secondary',
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      },
                                    }}
                                  >
                                    {isExpanded
                                      ? t('showLess')
                                      : `${t('showMore').replace('{count}', String(sortedAppointments.length - MAX_VISIBLE_APPOINTMENTS))}`}
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Paper sx={{ p: 3, ...glassStyles.card, boxShadow: shadows.md }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton
              onClick={() => setCalendarDate(calendarDate.subtract(1, 'month'))}
              sx={{
                bgcolor: healthcareColors.neutral[100],
                '&:hover': { bgcolor: healthcareColors.neutral[200] }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700} color={healthcareColors.neutral[800]}>
                {calendarDate.format('MMMM YYYY')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('upcomingAppointmentsCount').replace('{count}', String(activeAppointments.length))}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setCalendarDate(calendarDate.add(1, 'month'))}
              sx={{
                bgcolor: healthcareColors.neutral[100],
                '&:hover': { bgcolor: healthcareColors.neutral[200] }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* Week Days Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
            {weekDays.map((day, idx) => (
              <Box
                key={day}
                sx={{
                  textAlign: 'center',
                  py: 1.5,
                  bgcolor: idx === 0 || idx === 6 ? alpha(healthcareColors.neutral[500], 0.05) : 'transparent',
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={idx === 0 || idx === 6 ? healthcareColors.neutral[400] : healthcareColors.neutral[600]}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <Box key={`empty-${index}`} sx={{ minHeight: 110, bgcolor: healthcareColors.neutral[50], borderRadius: 2 }} />;
              }

              const dayAppointments = getAppointmentsForDate(day);
              const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
              const isPast = day.isBefore(dayjs(), 'day');
              const isWeekend = day.day() === 0 || day.day() === 6;

              return (
                <Box
                  key={day.format('YYYY-MM-DD')}
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode('day');
                  }}
                  sx={{
                    minHeight: 110,
                    border: '2px solid',
                    borderColor: isToday ? healthcareColors.primary.main : 'transparent',
                    borderRadius: 2,
                    p: 1,
                    bgcolor: isToday
                      ? alpha(healthcareColors.primary.main, 0.08)
                      : isPast
                        ? healthcareColors.neutral[50]
                        : isWeekend
                          ? alpha(healthcareColors.neutral[500], 0.03)
                          : '#fff',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isToday ? `0 4px 12px ${alpha(healthcareColors.primary.main, 0.2)}` : shadows.sm,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: shadows.md,
                      borderColor: healthcareColors.primary.light,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      fontWeight={isToday ? 700 : 500}
                      sx={{
                        color: isToday ? healthcareColors.primary.main : isPast ? healthcareColors.neutral[400] : healthcareColors.neutral[700],
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: isToday ? healthcareColors.primary.main : 'transparent',
                        ...(isToday && { color: '#fff' }),
                      }}
                    >
                      {day.date()}
                    </Typography>
                    {dayAppointments.length > 0 && (
                      <Chip
                        label={dayAppointments.length}
                        size="small"
                        sx={{
                          height: 20,
                          minWidth: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: alpha(healthcareColors.info, 0.15),
                          color: healthcareColors.info,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {dayAppointments.slice(0, 2).map(apt => (
                      <Box
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(apt);
                        }}
                        sx={{
                          bgcolor: alpha(getStatusBorderColor(apt.status), 0.12),
                          borderLeft: `3px solid ${getStatusBorderColor(apt.status)}`,
                          borderRadius: 1,
                          px: 0.75,
                          py: 0.25,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': {
                            bgcolor: alpha(getStatusBorderColor(apt.status), 0.2),
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: getStatusBorderColor(apt.status),
                            display: 'block',
                            lineHeight: 1.2,
                          }}
                        >
                          {apt.appointmentTime}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            color: healthcareColors.neutral[600],
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {apt.patientName}
                        </Typography>
                      </Box>
                    ))}
                    {dayAppointments.length > 2 && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          color: healthcareColors.primary.main,
                          fontWeight: 500,
                        }}
                      >
                        +{dayAppointments.length - 2} {t('more')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>
      ) : (
        /* Day View */
        <Paper sx={{ p: 2 }}>
          {/* Day View Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => setViewMode('calendar')}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {selectedDay.format('dddd, MMMM D, YYYY')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('appointmentsCount').replace('{count}', String(getAppointmentsForDate(selectedDay).length))}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton onClick={() => setSelectedDay(selectedDay.subtract(1, 'day'))}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={() => setSelectedDay(selectedDay.add(1, 'day'))}>
                <ChevronRightIcon />
              </IconButton>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedDate(selectedDay.format('YYYY-MM-DD'));
                  handleOpen();
                }}
              >
                {t('add')}
              </Button>
            </Box>
          </Box>

          {/* Timeline */}
          <Box sx={{ position: 'relative' }}>
            {(() => {
              const hours = [];
              for (let h = 8; h <= 20; h++) {
                hours.push(h);
              }

              const dayAppts = getAppointmentsForDate(selectedDay);

              return hours.map(hour => {
                const hourAppts = dayAppts.filter(apt => {
                  if (!apt.appointmentTime) return false;
                  const aptHour = parseInt(apt.appointmentTime.split(':')[0], 10);
                  return aptHour === hour;
                });

                return (
                  <Box
                    key={hour}
                    sx={{
                      display: 'flex',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      minHeight: 60,
                    }}
                  >
                    {/* Time Label */}
                    <Box
                      sx={{
                        width: 80,
                        flexShrink: 0,
                        pr: 2,
                        pt: 1,
                        textAlign: 'right',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                      </Typography>
                    </Box>

                    {/* Appointments and available doctors for this hour */}
                    <Box sx={{ flex: 1, p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {/* Show existing appointments */}
                      {hourAppts.length > 0 && (
                        hourAppts
                          .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''))
                          .map(apt => (
                            <Paper
                              key={apt.id}
                              elevation={0}
                              sx={{
                                p: 1.5,
                                bgcolor: getStatusBgColor(apt.status),
                                borderLeft: '3px solid',
                                borderColor: getStatusBorderColor(apt.status),
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'scale(1.02)', boxShadow: 1 },
                              }}
                              onClick={() => handleOpen(apt)}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="caption" fontWeight={700} sx={{ color: getStatusBorderColor(apt.status) }}>
                                    {apt.appointmentTime}
                                  </Typography>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {apt.patientName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {apt.doctorName} • {apt.serviceType || t('general')}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  <Chip
                                    label={t(apt.status === 'no-show' ? 'noShow' : apt.status)}
                                    color={getStatusColor(apt.status)}
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMutation.mutate(apt.id);
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Paper>
                          ))
                      )}

                      {/* Show available doctors for this hour */}
                      {loadingDayViewSlots ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                          <CircularProgress size={14} />
                          <Typography variant="caption" color="text.secondary">{t('loading')}</Typography>
                        </Box>
                      ) : (
                        (() => {
                          const availableDoctors = dayViewDoctorSlots[hour.toString()] || [];
                          // Get unique doctors (remove duplicates from different time slots in same hour)
                          const uniqueDoctors = availableDoctors.reduce((acc, slot) => {
                            if (!acc.find(d => d.doctorId === slot.doctorId)) {
                              acc.push(slot);
                            }
                            return acc;
                          }, [] as { doctorId: string; doctorName: string; time: string }[]);

                          if (uniqueDoctors.length === 0) {
                            return (
                              <Typography variant="caption" color="text.disabled" sx={{ py: 1 }}>
                                {t('noDoctorsAvailable')}
                              </Typography>
                            );
                          }

                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {uniqueDoctors.map(slot => (
                                <Chip
                                  key={slot.doctorId}
                                  label={slot.doctorName}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  onClick={() => {
                                    const doctor = doctors?.find(d => d.id === slot.doctorId);
                                    if (doctor) {
                                      // Open dialog with pre-filled values
                                      setEditingId(null);
                                      setSelectedDoctor(doctor);
                                      setSelectedPatient(null);
                                      setSelectedDate(selectedDay.format('YYYY-MM-DD'));
                                      setSelectedTime(slot.time);
                                      setSelectedService('');
                                      setIsNewPatient(false);
                                      setNewPatientData({ fullName: '', idNumber: '', phoneNumber: '' });
                                      setFormData({ status: 'scheduled', notes: '' });
                                      setOpen(true);
                                    }
                                  }}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'success.50' },
                                  }}
                                />
                              ))}
                            </Box>
                          );
                        })()
                      )}
                    </Box>
                  </Box>
                );
              });
            })()}
          </Box>
        </Paper>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {editingId ? t('editAppointment') : t('newAppointment')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Patient Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('patientInformation')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isNewPatient}
                    onChange={(e) => {
                      setIsNewPatient(e.target.checked);
                      if (e.target.checked) {
                        setSelectedPatient(null);
                      } else {
                        setNewPatientData({ fullName: '', idNumber: '', phoneNumber: '' });
                      }
                    }}
                    disabled={!!editingId}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonAddIcon fontSize="small" />
                    <Typography variant="body2">{t('newPatient')}</Typography>
                  </Box>
                }
                sx={{ mb: 1.5 }}
              />
              {!isNewPatient ? (
                <Autocomplete
                  options={patients || []}
                  getOptionLabel={(option) => {
                    const parts = [option.fullName];
                    if (option.idNumber) parts.push(option.idNumber);
                    else if (option.phoneNumber) parts.push(option.phoneNumber);
                    return parts.length > 1 ? `${parts[0]} (${parts[1]})` : parts[0];
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter((option) =>
                      option.fullName.toLowerCase().includes(searchTerm) ||
                      (option.phoneNumber && option.phoneNumber.includes(searchTerm)) ||
                      (option.idNumber && option.idNumber.includes(searchTerm))
                    );
                  }}
                  value={selectedPatient}
                  onChange={(_, newValue) => setSelectedPatient(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label={t('selectPatient')} size="small" required fullWidth />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.idNumber && `${t('idNumber')}: ${option.idNumber}`}
                          {option.idNumber && option.phoneNumber && ' | '}
                          {option.phoneNumber && `${t('phone')}: ${option.phoneNumber}`}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={autocompleteRtlSx}
                />
              ) : (
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('fullName')}
                    value={newPatientData.fullName}
                    onChange={(e) => setNewPatientData({ ...newPatientData, fullName: e.target.value })}
                    required
                  />
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('idNumber')}
                      value={newPatientData.idNumber}
                      onChange={(e) => setNewPatientData({ ...newPatientData, idNumber: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label={t('phoneNumber')}
                      value={newPatientData.phoneNumber}
                      onChange={(e) => setNewPatientData({ ...newPatientData, phoneNumber: e.target.value })}
                    />
                  </Stack>
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Appointment Details Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('appointmentDetails')}
              </Typography>
              <Stack spacing={1.5}>
                <Autocomplete
                  options={doctors || []}
                  getOptionLabel={(option) => option.fullName}
                  value={selectedDoctor}
                  onChange={(_, newValue) => {
                    setSelectedDoctor(newValue);
                    setSelectedService('');
                    setSelectedTime('');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label={t('doctor')} size="small" required fullWidth />
                  )}
                  sx={autocompleteRtlSx}
                />
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label={t('service')}
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      setSelectedTime('');
                    }}
                    required
                    disabled={!selectedDoctor}
                    sx={selectRtlSx}
                  >
                    {selectedDoctor?.specialties.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('date')}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={!selectedDoctor}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Time Slots Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('timeSlot')}
              </Typography>
              {loadingSlots ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">{t('loadingAvailableSlots')}</Typography>
                </Box>
              ) : selectedDoctor && selectedDate ? (
                <>
                  {noSlotsAvailable ? (
                    <Alert severity="warning" >
                      {t('noAvailableSlotsWarning')}
                    </Alert>
                  ) : availableSlots.length === 0 ? (
                    <Alert severity="info">
                      {t('doctorNotAvailable')}
                    </Alert>
                  ) : (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {t('slotsAvailable').replace('{count}', String(availableTimeSlots.length))}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {availableSlots.map((slot) => (
                          <Chip
                            key={slot.time}
                            label={slot.time}
                            size="small"
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            color={selectedTime === slot.time ? 'primary' : 'default'}
                            variant={selectedTime === slot.time ? 'filled' : 'outlined'}
                            disabled={!slot.available}
                            sx={{
                              opacity: slot.available ? 1 : 0.4,
                              cursor: slot.available ? 'pointer' : 'not-allowed',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('selectDoctorAndDate')}
                </Typography>
              )}
            </Box>

            {/* Status & Notes Section (only for editing) */}
            {editingId && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('status')}
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.status}
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value as any })}
                    sx={{
                      borderRadius: '20px',
                      backgroundColor: getStatusBgColor(formData.status),
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      '& .MuiSelect-select': {
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: getStatusBorderColor(formData.status),
                        borderWidth: '1.5px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: getStatusBorderColor(formData.status),
                        borderWidth: '2px',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: getStatusBorderColor(formData.status),
                        borderWidth: '2px',
                      },
                      '&:hover': {
                        boxShadow: `0 2px 8px ${alpha(getStatusBorderColor(formData.status), 0.25)}`,
                      },
                      ...selectRtlSx,
                    }}
                    renderValue={(value) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: getStatusBorderColor(value as string),
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          component="span"
                          sx={{
                            color: getStatusTextColor(value as string),
                            fontWeight: 600,
                            fontSize: '0.875rem',
                          }}
                        >
                          {t(value === 'no-show' ? 'noShow' : value as string)}
                        </Typography>
                      </Box>
                    )}
                  >
                    <MenuItem value="pending" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#FEF3C7' } }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                      <Typography sx={{ color: '#B45309', fontWeight: 600 }}>{t('pending')}</Typography>
                    </MenuItem>
                    <MenuItem value="scheduled" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#CCFBF1' } }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0D9488' }} />
                      <Typography sx={{ color: '#0F766E', fontWeight: 600 }}>{t('scheduled')}</Typography>
                    </MenuItem>
                    <MenuItem value="completed" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#DCFCE7' } }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22C55E' }} />
                      <Typography sx={{ color: '#16A34A', fontWeight: 600 }}>{t('completed')}</Typography>
                    </MenuItem>
                    <MenuItem value="cancelled" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#FEE2E2' } }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444' }} />
                      <Typography sx={{ color: '#DC2626', fontWeight: 600 }}>{t('cancelled')}</Typography>
                    </MenuItem>
                    <MenuItem value="no-show" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderRadius: 1, mx: 0.5, my: 0.25, '&:hover': { backgroundColor: '#F1F5F9' } }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#64748B' }} />
                      <Typography sx={{ color: '#475569', fontWeight: 600 }}>{t('noShow')}</Typography>
                    </MenuItem>
                  </Select>
                </Box>
              </>
            )}

            {/* Notes */}
            <TextField
              fullWidth
              size="small"
              label={t('notesOptional')}
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} size="small">{t('cancel')}</Button>
          {noSlotsAvailable && !editingId && (
            <Button
              onClick={handleAddToWaitingList}
              variant="outlined"
              color="warning"
              size="small"
              startIcon={<WaitingListIcon />}
              disabled={
                (!isNewPatient && !selectedPatient) ||
                (isNewPatient && !newPatientData.fullName) ||
                !selectedDoctor ||
                !selectedService ||
                !selectedDate
              }
            >
              {t('addToWaitingList')}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="small"
            disabled={
              (!isNewPatient && !selectedPatient) ||
              (isNewPatient && !newPatientData.fullName) ||
              !selectedDoctor ||
              !selectedDate ||
              !selectedTime ||
              !selectedService ||
              createMutation.isPending ||
              updateMutation.isPending ||
              createPatientMutation.isPending
            }
            sx={{ color: 'white' }}
          >
            {createPatientMutation.isPending ? t('creating') : editingId ? t('update') : t('createAppointment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{t('deleteAppointment')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirmDeleteAppointment')}{' '}
            <strong>{appointmentToDelete?.patientName}</strong> {t('on')}{' '}
            <strong>
              {appointmentToDelete && (typeof appointmentToDelete.appointmentDate === 'string'
                ? dayjs(appointmentToDelete.appointmentDate).format('MMM DD, YYYY')
                : dayjs(appointmentToDelete.appointmentDate._seconds * 1000).format('MMM DD, YYYY'))}
            </strong>
            {appointmentToDelete?.appointmentTime && ` ${t('at')} ${appointmentToDelete.appointmentTime}`}?
            {t('actionCannotBeUndone')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{t('cancel')}</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Pending Appointment Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={handleScheduleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {t('scheduleAppointment')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Patient Info */}
            {appointmentToSchedule && (
              <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>{t('patient')}:</strong> {appointmentToSchedule.patientName}
                  </Typography>
                </Box>
              </Alert>
            )}

            {/* Doctor Selection */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('appointmentDetails')}
              </Typography>
              <Stack spacing={2}>
                <Autocomplete
                  options={doctors || []}
                  getOptionLabel={(option) => option.fullName}
                  value={scheduleDoctor}
                  onChange={(_, newValue) => {
                    setScheduleDoctor(newValue);
                    setScheduleService('');
                    setScheduleTime('');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label={t('doctor')} size="small" required fullWidth />
                  )}
                  sx={autocompleteRtlSx}
                />
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label={t('service')}
                    value={scheduleService}
                    onChange={(e) => {
                      setScheduleService(e.target.value);
                      setScheduleTime('');
                    }}
                    required
                    disabled={!scheduleDoctor}
                    sx={selectRtlSx}
                  >
                    {scheduleDoctor?.specialties.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('date')}
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => {
                      setScheduleDate(e.target.value);
                      setScheduleTime('');
                    }}
                    slotProps={{ inputLabel: { shrink: true } }}
                    required
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Time Slots */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('selectTimeSlot')}
              </Typography>
              {loadingScheduleSlots ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">{t('loadingAvailableSlots')}</Typography>
                </Box>
              ) : scheduleDoctor && scheduleDate ? (
                <>
                  {scheduleSlots.length === 0 ? (
                    <Alert severity="info">
                      {t('doctorNotAvailable')}
                    </Alert>
                  ) : availableScheduleSlots.length === 0 ? (
                    <Alert severity="warning">
                      {t('allSlotsBookedWarning')}
                    </Alert>
                  ) : (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {t('slotsAvailable').replace('{count}', String(availableScheduleSlots.length))}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {scheduleSlots.map((slot) => (
                          <Chip
                            key={slot.time}
                            label={slot.time}
                            size="small"
                            onClick={() => slot.available && setScheduleTime(slot.time)}
                            disabled={!slot.available}
                            color={scheduleTime === slot.time ? 'primary' : 'default'}
                            variant={scheduleTime === slot.time ? 'filled' : 'outlined'}
                            sx={{ cursor: slot.available ? 'pointer' : 'not-allowed' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('selectDoctorAndDate')}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleScheduleDialogClose} size="small">{t('cancel')}</Button>
          <Button
            onClick={handleScheduleSubmit}
            variant="contained"
            size="small"
            disabled={
              !scheduleDoctor ||
              !scheduleService ||
              !scheduleDate ||
              !scheduleTime ||
              scheduleAppointmentMutation.isPending
            }
            sx={{ color: 'white' }}
          >
            {scheduleAppointmentMutation.isPending ? t('scheduling') : t('scheduleAppointment')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
