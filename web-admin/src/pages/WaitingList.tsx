import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
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
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  Grow,
  alpha,
  Avatar,
} from '@mui/material';
import { healthcareColors, gradients, glassStyles, shadows, animations } from '../theme/healthcareTheme';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  EventAvailable as BookIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  HourglassEmpty as WaitingIcon,
  CheckCircle as BookedIcon,
  Cancel as CancelledIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  Event as EventIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import dayjs from 'dayjs';

interface WaitingListEntry {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  serviceType: string;
  preferredDate: { _seconds: number };
  status: 'waiting' | 'booked' | 'cancelled';
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
  const [searchQuery, setSearchQuery] = useState('');

  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingService, setBookingService] = useState('');
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { getToken } = useAuth();
  const { t } = useLanguage();
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

  const filteredWaitingList = useMemo(() => {
    if (!waitingList) return [];
    if (!searchQuery) return waitingList;
    return waitingList.filter(entry =>
      entry.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [waitingList, searchQuery]);

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

  useEffect(() => {
    const loadSlots = async () => {
      if (!bookingDoctor || !bookingDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const token = await getToken();
        if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams({ date: bookingDate });
        if (bookingService) {
          params.append('serviceType', bookingService);
        }

        const response = await apiClient.get(
          `/doctors/${bookingDoctor.id}/available-slots?${params.toString()}`
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
  }, [bookingDoctor, bookingDate, bookingService, getToken]);

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
    mutationFn: async ({ id, appointmentDate, appointmentTime, doctorId, serviceType }: { id: string; appointmentDate: string; appointmentTime: string; doctorId?: string; serviceType?: string }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post(`/waiting-list/${id}/book`, { appointmentDate, appointmentTime, doctorId, serviceType });
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
    const doctor = doctors?.find(d => d.id === entry.doctorId);
    setBookingDoctor(doctor || null);
    setBookingService(entry.serviceType);
    setAvailableSlots([]);
    setBookDialogOpen(true);
  };

  const handleBookDialogClose = () => {
    setBookDialogOpen(false);
    setSelectedEntry(null);
    setBookingDate('');
    setBookingTime('');
    setBookingDoctor(null);
    setBookingService('');
    setAvailableSlots([]);
  };

  const handleBookSubmit = () => {
    if (selectedEntry && bookingDate && bookingTime && bookingDoctor && bookingService) {
      bookMutation.mutate({
        id: selectedEntry.id,
        appointmentDate: bookingDate,
        appointmentTime: bookingTime,
        doctorId: bookingDoctor.id,
        serviceType: bookingService,
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { color: healthcareColors.warning, icon: <WaitingIcon />, label: t('waiting') };
      case 'booked':
        return { color: healthcareColors.success, icon: <BookedIcon />, label: t('booked') };
      case 'cancelled':
        return { color: healthcareColors.error, icon: <CancelledIcon />, label: t('cancelled') };
      default:
        return { color: healthcareColors.neutral[400], icon: <WaitingIcon />, label: status };
    }
  };

  const availableTimeSlots = availableSlots.filter(s => s.available);

  const statusCounts = useMemo(() => {
    if (!waitingList) return { waiting: 0, booked: 0, cancelled: 0 };
    return {
      waiting: waitingList.filter(e => e.status === 'waiting').length,
      booked: waitingList.filter(e => e.status === 'booked').length,
      cancelled: waitingList.filter(e => e.status === 'cancelled').length,
    };
  }, [waitingList]);

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: gradients.warning,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${alpha(healthcareColors.warning, 0.4)}`,
                }}
              >
                <WaitingIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  {t('waitingList')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('manageWaitingQueue')}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{
              background: gradients.warning,
              boxShadow: `0 4px 14px ${alpha(healthcareColors.warning, 0.4)}`,
              '&:hover': {
                background: gradients.warning,
                filter: 'brightness(0.95)',
                boxShadow: `0 6px 20px ${alpha(healthcareColors.warning, 0.5)}`,
              },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            {t('addToWaitingList')}
          </Button>
        </Box>

        {/* Stats Row */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          <Chip
            icon={<WaitingIcon />}
            label={`${statusCounts.waiting} ${t('waiting')}`}
            sx={{
              bgcolor: alpha(healthcareColors.warning, 0.1),
              color: healthcareColors.warning,
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
          <Chip
            icon={<BookedIcon />}
            label={`${statusCounts.booked} ${t('booked')}`}
            sx={{
              bgcolor: alpha(healthcareColors.success, 0.1),
              color: healthcareColors.success,
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          ...glassStyles.card,
          boxShadow: shadows.md,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder={t('searchByPatientDoctorService')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 250 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: healthcareColors.neutral[400] }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: healthcareColors.neutral[50],
                  '& fieldset': { border: 'none' },
                },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('doctor')}</InputLabel>
            <Select
              value={filterDoctor}
              label={t('doctor')}
              onChange={(e) => setFilterDoctor(e.target.value)}
            >
              <MenuItem value="">{t('allDoctors')}</MenuItem>
              {doctors?.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<FilterIcon />}
              label={t('all')}
              onClick={() => setFilterStatus('')}
              variant={!filterStatus ? 'filled' : 'outlined'}
              sx={{
                bgcolor: !filterStatus ? healthcareColors.primary.main : 'transparent',
                color: !filterStatus ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
              }}
            />
            <Chip
              icon={<WaitingIcon />}
              label={t('waiting')}
              onClick={() => setFilterStatus('waiting')}
              variant={filterStatus === 'waiting' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: filterStatus === 'waiting' ? healthcareColors.warning : 'transparent',
                color: filterStatus === 'waiting' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
              }}
            />
            <Chip
              icon={<BookedIcon />}
              label={t('booked')}
              onClick={() => setFilterStatus('booked')}
              variant={filterStatus === 'booked' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: filterStatus === 'booked' ? healthcareColors.success : 'transparent',
                color: filterStatus === 'booked' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Waiting List Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card
              key={i}
              sx={{
                borderRadius: 2,
                background: healthcareColors.neutral[100],
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ height: 150 }} />
              </CardContent>
            </Card>
          ))
        ) : filteredWaitingList.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Paper sx={{ p: 6, textAlign: 'center', ...glassStyles.card }}>
              <WaitingIcon sx={{ fontSize: 64, color: healthcareColors.neutral[300], mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery || filterDoctor || filterStatus ? t('noEntriesMatchFilters') : t('noEntriesInWaitingList')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery || filterDoctor || filterStatus ? t('tryAdjustingFiltersWaitingList') : t('addPatientsToGetStarted')}
              </Typography>
              {!searchQuery && !filterDoctor && !filterStatus && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
                  {t('addToWaitingList')}
                </Button>
              )}
            </Paper>
          </Box>
        ) : (
          filteredWaitingList.map((entry, index) => {
            const statusConfig = getStatusConfig(entry.status);
            return (
              <Grow in timeout={300 + index * 50} key={entry.id}>
                <Card
                  sx={{
                    background: '#fff',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: healthcareColors.neutral[200],
                    boxShadow: shadows.sm,
                    transition: animations.transition.normal,
                    borderLeft: `4px solid ${statusConfig.color}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: shadows.md,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha(statusConfig.color, 0.15),
                          color: statusConfig.color,
                          fontWeight: 600,
                        }}
                      >
                        {entry.patientName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Chip
                        size="small"
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        sx={{
                          bgcolor: alpha(statusConfig.color, 0.1),
                          color: statusConfig.color,
                          fontWeight: 500,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>

                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {entry.patientName}
                    </Typography>

                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DoctorIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                        <Typography variant="body2" color="text.secondary">
                          {entry.doctorName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={entry.serviceType}
                          size="small"
                          sx={{
                            bgcolor: alpha(healthcareColors.accent.main, 0.1),
                            color: healthcareColors.accent.main,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(entry.preferredDate._seconds * 1000).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      {entry.notes && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <NotesIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400], mt: 0.25 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.8rem',
                            }}
                          >
                            {entry.notes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {entry.status === 'waiting' && (
                        <Tooltip title={t('convertToAppointment')}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<BookIcon />}
                            onClick={() => handleBookClick(entry)}
                            sx={{
                              background: gradients.success,
                              '&:hover': { filter: 'brightness(0.95)' },
                            }}
                          >
                            {t('book')}
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip title={t('remove')}>
                        <IconButton
                          size="small"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          sx={{
                            color: healthcareColors.error,
                            bgcolor: alpha(healthcareColors.error, 0.1),
                            '&:hover': { bgcolor: alpha(healthcareColors.error, 0.2) },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grow>
            );
          })
        )}
      </Box>

      {/* Add to Waiting List Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { ...glassStyles.dialog, overflow: 'hidden' } } }}
      >
        {/* Modern Dialog Header */}
        <Box
          sx={{
            background: gradients.warning,
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AddIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color="white">
              {t('addToWaitingList')}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
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
                  getOptionLabel={(option) => `${option.fullName}${option.phoneNumber ? ` (${option.phoneNumber})` : ''}`}
                  value={selectedPatient}
                  onChange={(_, newValue) => setSelectedPatient(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label={t('selectPatient')} size="small" required fullWidth />
                  )}
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

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('waitingListDetails')}
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
                    <TextField {...params} label={t('doctor')} size="small" required fullWidth />
                  )}
                />
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label={t('service')}
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
                    label={t('preferredDate')}
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    required
                  />
                </Stack>
              </Stack>
            </Box>

            <TextField
              fullWidth
              size="small"
              label={t('notesOptional')}
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: healthcareColors.neutral[50], borderTop: `1px solid ${healthcareColors.neutral[200]}` }}>
          <Button
            onClick={handleClose}
            size="small"
            sx={{
              color: healthcareColors.neutral[600],
              borderRadius: 1.5,
              px: 2.5,
              '&:hover': { bgcolor: healthcareColors.neutral[100] },
            }}
          >
            {t('cancel')}
          </Button>
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
            sx={{
              background: gradients.warning,
              borderRadius: 1.5,
              px: 3,
              boxShadow: 'none',
              '&:hover': { filter: 'brightness(0.95)', boxShadow: 'none' },
            }}
          >
            {createPatientMutation.isPending ? t('creating') : t('addToWaitingList')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book from Waiting List Dialog */}
      <Dialog
        open={bookDialogOpen}
        onClose={handleBookDialogClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { ...glassStyles.dialog, overflow: 'hidden' } } }}
      >
        {/* Modern Dialog Header */}
        <Box
          sx={{
            background: gradients.success,
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color="white">
              {t('convertToAppointment')}
            </Typography>
          </Box>
          <IconButton onClick={handleBookDialogClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {selectedEntry && (
              <>
                <Alert severity="info" icon={false} sx={{ borderRadius: 2, bgcolor: alpha(healthcareColors.info, 0.08) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2"><strong>{t('patient')}:</strong> {selectedEntry.patientName}</Typography>
                  </Box>
                </Alert>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('appointmentDetails')}
                  </Typography>
                  <Stack spacing={2}>
                    <Autocomplete
                      options={doctors || []}
                      getOptionLabel={(option) => option.fullName}
                      value={bookingDoctor}
                      onChange={(_, newValue) => {
                        setBookingDoctor(newValue);
                        setBookingService('');
                        setBookingTime('');
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label={t('doctor')} size="small" required fullWidth />
                      )}
                    />
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        fullWidth
                        size="small"
                        select
                        label={t('service')}
                        value={bookingService}
                        onChange={(e) => {
                          setBookingService(e.target.value);
                          setBookingTime('');
                        }}
                        required
                        disabled={!bookingDoctor}
                      >
                        {bookingDoctor?.specialties.map((specialty) => (
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
                        value={bookingDate}
                        onChange={(e) => {
                          setBookingDate(e.target.value);
                          setBookingTime('');
                        }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        required
                      />
                    </Stack>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('selectTimeSlot')}
                  </Typography>
                  {loadingSlots ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                      <CircularProgress size={18} />
                      <Typography variant="body2" color="text.secondary">{t('loadingAvailableSlots')}</Typography>
                    </Box>
                  ) : bookingDoctor && bookingService && bookingDate ? (
                    <>
                      {availableSlots.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          {t('doctorNotAvailableForService')}
                        </Alert>
                      ) : availableTimeSlots.length === 0 ? (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          {t('allSlotsBookedWarning')}
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
                      {t('selectDoctorServiceAndDate')}
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: healthcareColors.neutral[50], borderTop: `1px solid ${healthcareColors.neutral[200]}` }}>
          <Button
            onClick={handleBookDialogClose}
            size="small"
            sx={{
              color: healthcareColors.neutral[600],
              borderRadius: 1.5,
              px: 2.5,
              '&:hover': { bgcolor: healthcareColors.neutral[100] },
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleBookSubmit}
            variant="contained"
            size="small"
            disabled={!bookingDoctor || !bookingService || !bookingDate || !bookingTime || bookMutation.isPending}
            sx={{
              background: gradients.success,
              borderRadius: 1.5,
              px: 3,
              boxShadow: 'none',
              '&:hover': { filter: 'brightness(0.95)', boxShadow: 'none' },
            }}
          >
            {bookMutation.isPending ? t('converting') : t('convertToAppointment')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
