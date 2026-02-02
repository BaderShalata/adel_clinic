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
  FormControl,
  InputLabel,
  Select,
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
  Delete as DeleteIcon,
  EventAvailable as BookIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface WaitingListEntry {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  serviceType: string;
  preferredDate: { _seconds: number };
  status: 'waiting' | 'notified' | 'booked' | 'cancelled';
  priority: number;
  notes?: string;
  createdAt: { _seconds: number };
}

interface Doctor {
  id: string;
  fullName: string;
  specialties: string[];
}

interface Patient {
  id: string;
  fullName: string;
  phoneNumber?: string;
}

interface SlotInfo {
  time: string;
  available: boolean;
}

export const WaitingList: React.FC = () => {
  // Add to waiting list dialog state
  const [open, setOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
  });
  const [notes, setNotes] = useState('');

  // Book from waiting list dialog state
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Filters
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: waitingList, isLoading } = useQuery<WaitingListEntry[]>({
    queryKey: ['waitingList', filterDoctor, filterStatus],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const params = new URLSearchParams();
      if (filterDoctor) params.append('doctorId', filterDoctor);
      if (filterStatus) params.append('status', filterStatus);
      const response = await apiClient.get(`/waiting-list?${params.toString()}`);
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

  // Load available slots when booking
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedEntry || !bookingDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const token = await getToken();
        if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams({ date: bookingDate });
        if (selectedEntry.serviceType) {
          params.append('serviceType', selectedEntry.serviceType);
        }

        const response = await apiClient.get(
          `/doctors/${selectedEntry.doctorId}/available-slots?${params.toString()}`
        );

        setAvailableSlots(response.data.slots || []);
      } catch (error) {
        console.error('Failed to load slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedEntry, bookingDate, getToken]);

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.post('/patients', data);
      return response.data;
    },
  });

  const createMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.delete(`/waiting-list/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitingList'] });
    },
  });

  const bookMutation = useMutation({
    mutationFn: async ({ id, appointmentDate, appointmentTime }: { id: string; appointmentDate: string; appointmentTime: string }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post(`/waiting-list/${id}/book`, { appointmentDate, appointmentTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitingList'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      handleBookDialogClose();
    },
  });

  const handleOpen = () => {
    setSelectedDoctor(null);
    setSelectedPatient(null);
    setSelectedService('');
    setPreferredDate('');
    setIsNewPatient(false);
    setNewPatientData({ fullName: '', idNumber: '', phoneNumber: '' });
    setNotes('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedService || !preferredDate) return;
    if (!isNewPatient && !selectedPatient) return;
    if (isNewPatient && !newPatientData.fullName) return;

    try {
      let patientId = selectedPatient?.id;
      let patientName = selectedPatient?.fullName;

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

      if (!patientId) return;

      createMutation.mutate({
        patientId,
        patientName,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        serviceType: selectedService,
        preferredDate,
        notes,
      });
    } catch (error) {
      console.error('Error adding to waiting list:', error);
    }
  };

  const handleBookClick = (entry: WaitingListEntry) => {
    setSelectedEntry(entry);
    setBookingDate(dayjs(entry.preferredDate._seconds * 1000).format('YYYY-MM-DD'));
    setBookingTime('');
    setAvailableSlots([]);
    setBookDialogOpen(true);
  };

  const handleBookDialogClose = () => {
    setBookDialogOpen(false);
    setSelectedEntry(null);
    setBookingDate('');
    setBookingTime('');
    setAvailableSlots([]);
  };

  const handleBookSubmit = () => {
    if (selectedEntry && bookingDate && bookingTime) {
      bookMutation.mutate({
        id: selectedEntry.id,
        appointmentDate: bookingDate,
        appointmentTime: bookingTime,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'warning';
      case 'notified': return 'info';
      case 'booked': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const availableTimeSlots = availableSlots.filter(s => s.available);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Waiting List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add to Waiting List
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Doctor</InputLabel>
          <Select
            value={filterDoctor}
            label="Filter by Doctor"
            onChange={(e) => setFilterDoctor(e.target.value)}
          >
            <MenuItem value="">All Doctors</MenuItem>
            {doctors?.map((doctor) => (
              <MenuItem key={doctor.id} value={doctor.id}>
                {doctor.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="waiting">Waiting</MenuItem>
            <MenuItem value="notified">Notified</MenuItem>
            <MenuItem value="booked">Booked</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Preferred Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : waitingList?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No entries in waiting list</TableCell>
              </TableRow>
            ) : (
              waitingList?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.patientName}</TableCell>
                  <TableCell>{entry.doctorName}</TableCell>
                  <TableCell>{entry.serviceType}</TableCell>
                  <TableCell>
                    {dayjs(entry.preferredDate._seconds * 1000).format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      color={getStatusColor(entry.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{entry.notes || '-'}</TableCell>
                  <TableCell>
                    {entry.status === 'waiting' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleBookClick(entry)}
                        title="Convert to Appointment"
                      >
                        <BookIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      title="Remove"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add to Waiting List Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Add to Waiting List</DialogTitle>
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
                Waiting List Details
              </Typography>
              <Stack spacing={1.5}>
                <Autocomplete
                  options={doctors || []}
                  getOptionLabel={(option) => option.fullName}
                  value={selectedDoctor}
                  onChange={(_, newValue) => {
                    setSelectedDoctor(newValue);
                    setSelectedService('');
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
                    onChange={(e) => setSelectedService(e.target.value)}
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
                    label="Preferred Date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Notes */}
            <TextField
              fullWidth
              size="small"
              label="Notes (optional)"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} size="small">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="small"
            disabled={
              (!isNewPatient && !selectedPatient) ||
              (isNewPatient && !newPatientData.fullName) ||
              !selectedDoctor ||
              !selectedService ||
              !preferredDate ||
              createMutation.isPending ||
              createPatientMutation.isPending
            }
          >
            {createPatientMutation.isPending ? 'Creating...' : 'Add to Waiting List'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book from Waiting List Dialog */}
      <Dialog open={bookDialogOpen} onClose={handleBookDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Convert to Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedEntry && (
              <>
                {/* Patient & Doctor Info */}
                <Alert severity="info" icon={false}>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {selectedEntry.patientName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Doctor:</strong> {selectedEntry.doctorName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Service:</strong> {selectedEntry.serviceType}
                  </Typography>
                </Alert>

                <Divider />

                {/* Date Selection */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Select Date
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Appointment Date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setBookingTime('');
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Box>

                {/* Time Slots Section */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Select Time Slot
                  </Typography>
                  {loadingSlots ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                      <CircularProgress size={18} />
                      <Typography variant="body2" color="text.secondary">Loading available slots...</Typography>
                    </Box>
                  ) : bookingDate ? (
                    <>
                      {availableSlots.length === 0 ? (
                        <Alert severity="info">
                          Doctor is not available for this service on the selected date.
                        </Alert>
                      ) : availableTimeSlots.length === 0 ? (
                        <Alert severity="warning">
                          All slots are booked for this date. Please select another date.
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
                                onClick={() => slot.available && setBookingTime(slot.time)}
                                color={bookingTime === slot.time ? 'primary' : 'default'}
                                variant={bookingTime === slot.time ? 'filled' : 'outlined'}
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
                      Select a date to see available time slots
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleBookDialogClose} size="small">Cancel</Button>
          <Button
            onClick={handleBookSubmit}
            variant="contained"
            color="success"
            size="small"
            disabled={!bookingDate || !bookingTime || bookMutation.isPending}
          >
            {bookMutation.isPending ? 'Converting...' : 'Convert to Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
