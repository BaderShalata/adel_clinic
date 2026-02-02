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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  HourglassEmpty as WaitingListIcon,
  PersonAdd as PersonAddIcon,
  ViewList as ViewListIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: { _seconds: number } | string;
  appointmentTime: string;
  serviceType: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
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

type ViewMode = 'list' | 'calendar' | 'day';

export const Appointments: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs>(dayjs());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    notes: string;
  }>({
    status: 'scheduled',
    notes: '',
  });

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/appointments');
      return response.data;
    },
  });

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
    },
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'warning';
      default: return 'default';
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
        <Typography variant="h4">Appointments</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newView) => newView && setViewMode(newView)}
            size="small"
          >
            <ToggleButton value="list">
              <Tooltip title="List View">
                <ViewListIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="calendar">
              <Tooltip title="Calendar View">
                <CalendarIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add Appointment
          </Button>
        </Box>
      </Box>

      {viewMode === 'list' ? (
        <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : appointments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No appointments found</TableCell>
              </TableRow>
            ) : (
              appointments?.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.patientName}</TableCell>
                  <TableCell>{appointment.doctorName}</TableCell>
                  <TableCell>{appointment.serviceType || '-'}</TableCell>
                  <TableCell>
                    {typeof appointment.appointmentDate === 'string'
                      ? dayjs(appointment.appointmentDate).format('MMM DD, YYYY')
                      : dayjs(appointment.appointmentDate._seconds * 1000).format('MMM DD, YYYY')}
                    {appointment.appointmentTime && ` at ${appointment.appointmentTime}`}
                  </TableCell>
                  <TableCell>
                    <Chip label={appointment.status} color={getStatusColor(appointment.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(appointment)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteMutation.mutate(appointment.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Paper sx={{ p: 2 }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => setCalendarDate(calendarDate.subtract(1, 'month'))}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              {calendarDate.format('MMMM YYYY')}
            </Typography>
            <IconButton onClick={() => setCalendarDate(calendarDate.add(1, 'month'))}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* Week Days Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
            {weekDays.map(day => (
              <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <Box key={`empty-${index}`} sx={{ minHeight: 100 }} />;
              }

              const dayAppointments = getAppointmentsForDate(day);
              const isToday = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

              return (
                <Box
                  key={day.format('YYYY-MM-DD')}
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode('day');
                  }}
                  sx={{
                    minHeight: 100,
                    border: '1px solid',
                    borderColor: isToday ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 0.5,
                    bgcolor: isToday ? 'primary.50' : 'background.paper',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isToday ? 'primary.100' : 'action.hover',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={isToday ? 700 : 500}
                    color={isToday ? 'primary.main' : 'text.secondary'}
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    {day.date()}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {dayAppointments.slice(0, 3).map(apt => (
                      <Chip
                        key={apt.id}
                        label={`${apt.appointmentTime || ''} ${apt.patientName}`}
                        size="small"
                        color={getStatusColor(apt.status)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(apt);
                        }}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        +{dayAppointments.length - 3} more
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
                  {getAppointmentsForDate(selectedDay).length} appointment(s)
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
                Add
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
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
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
                                bgcolor: apt.status === 'completed' ? 'success.50' :
                                         apt.status === 'cancelled' ? 'error.50' :
                                         apt.status === 'no-show' ? 'warning.50' : 'primary.50',
                                borderLeft: '3px solid',
                                borderColor: apt.status === 'completed' ? 'success.main' :
                                             apt.status === 'cancelled' ? 'error.main' :
                                             apt.status === 'no-show' ? 'warning.main' : 'primary.main',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'scale(1.02)', boxShadow: 1 },
                              }}
                              onClick={() => handleOpen(apt)}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="caption" fontWeight={700} color="primary.main">
                                    {apt.appointmentTime}
                                  </Typography>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {apt.patientName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {apt.doctorName} • {apt.serviceType || 'General'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  <Chip
                                    label={apt.status}
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
                          <Typography variant="caption" color="text.secondary">Loading...</Typography>
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
                                No doctors available
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
          {editingId ? 'Edit Appointment' : 'New Appointment'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Patient Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Patient Information
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
                    <Typography variant="body2">New Patient</Typography>
                  </Box>
                }
                sx={{ mb: 1.5 }}
              />
              {!isNewPatient ? (
                <Autocomplete
                  options={patients || []}
                  getOptionLabel={(option) => `${option.fullName}${option.phoneNumber ? ` (${option.phoneNumber})` : ''}`}
                  value={selectedPatient}
                  onChange={(_, newValue) => setSelectedPatient(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Patient" size="small" required fullWidth />
                  )}
                />
              ) : (
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Full Name"
                    value={newPatientData.fullName}
                    onChange={(e) => setNewPatientData({ ...newPatientData, fullName: e.target.value })}
                    required
                  />
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="ID Number"
                      value={newPatientData.idNumber}
                      onChange={(e) => setNewPatientData({ ...newPatientData, idNumber: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number"
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
                Appointment Details
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
                    <TextField {...params} label="Doctor" size="small" required fullWidth />
                  )}
                />
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Service"
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      setSelectedTime('');
                    }}
                    required
                    disabled={!selectedDoctor}
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
                    label="Date"
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
                Time Slot
              </Typography>
              {loadingSlots ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">Loading available slots...</Typography>
                </Box>
              ) : selectedDoctor && selectedDate ? (
                <>
                  {noSlotsAvailable ? (
                    <Alert severity="warning" >
                      No available slots for this date. You can add the patient to the waiting list.
                    </Alert>
                  ) : availableSlots.length === 0 ? (
                    <Alert severity="info">
                      Doctor is not available on this date.
                    </Alert>
                  ) : (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {availableTimeSlots.length} slots available
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
                  Select a doctor and date to see available time slots
                </Typography>
              )}
            </Box>

            {/* Status & Notes Section (only for editing) */}
            {editingId && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Status
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="no-show">No-Show</MenuItem>
                  </TextField>
                </Box>
              </>
            )}

            {/* Notes */}
            <TextField
              fullWidth
              size="small"
              label="Notes (optional)"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} size="small">Cancel</Button>
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
              Add to Waiting List
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
          >
            {createPatientMutation.isPending ? 'Creating...' : editingId ? 'Update' : 'Create Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
