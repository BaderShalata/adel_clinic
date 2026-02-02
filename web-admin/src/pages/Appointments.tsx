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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  HourglassEmpty as WaitingListIcon,
  PersonAdd as PersonAddIcon,
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

export const Appointments: React.FC = () => {
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Appointments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Appointment
        </Button>
      </Box>

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
