import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Typography, Dialog, DialogContent,
  DialogActions, TextField, IconButton, Chip, FormControlLabel, Checkbox,
  FormGroup, Divider, Stack, Autocomplete, Select, MenuItem, FormControl, InputLabel,
  Avatar, Alert, CircularProgress, Card, CardContent, Tooltip, InputAdornment,
  Grow, alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { healthcareColors, gradients, glassStyles, shadows, animations } from '../theme/healthcareTheme';

interface DoctorSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  type?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  fullNameEn?: string;
  fullNameHe?: string;
  specialties: string[];
  specialtiesEn?: string[];
  specialtiesHe?: string[];
  qualifications: string[];
  qualificationsEn?: string[];
  qualificationsHe?: string[];
  schedule: DoctorSchedule[];
  isActive: boolean;
  imageUrl?: string;
  bio?: string;
  bioEn?: string;
  bioHe?: string;
}

interface ScheduleEntry {
  days: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  type: string;
}

const DAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const formatSchedule = (schedule: DoctorSchedule[]) => {
  if (!schedule || schedule.length === 0) return 'No schedule';

  const dayMap = new Map<number, DoctorSchedule[]>();
  schedule.forEach(s => {
    if (!dayMap.has(s.dayOfWeek)) {
      dayMap.set(s.dayOfWeek, []);
    }
    dayMap.get(s.dayOfWeek)?.push(s);
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatted: string[] = [];

  dayMap.forEach((schedules, dayOfWeek) => {
    const times = schedules.map(s => `${s.startTime}-${s.endTime}`).join(', ');
    formatted.push(`${dayNames[dayOfWeek]}: ${times}`);
  });

  return formatted.join(' | ');
};

const formatScheduleCompact = (schedule: DoctorSchedule[]) => {
  if (!schedule || schedule.length === 0) return [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const workDays = [...new Set(schedule.map(s => s.dayOfWeek))].sort();
  return workDays.map(d => dayNames[d]);
};

export const Doctors: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    fullNameEn: '',
    fullNameHe: '',
    specialties: [] as string[],
    specialtiesEn: [] as string[],
    specialtiesHe: [] as string[],
    qualifications: '',
    qualificationsEn: '',
    qualificationsHe: '',
    bio: '',
    bioEn: '',
    bioHe: '',
    imageUrl: '',
  });
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([
    { days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: '' }
  ]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/doctors');
      return response.data;
    },
  });

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    return doctors.filter(doctor => {
      const matchesSearch = !searchQuery ||
        doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.fullNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doctor.specialtiesEn?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && doctor.isActive) ||
        (statusFilter === 'inactive' && !doctor.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [doctors, searchQuery, statusFilter]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const processedScheduleEntries = scheduleEntries.map(entry => ({
        ...entry,
        type: entry.type || (data.specialties.length === 1 ? data.specialties[0] : '')
      }));

      const payload = {
        ...data,
        specialties: data.specialties,
        specialtiesEn: data.specialtiesEn || [],
        specialtiesHe: data.specialtiesHe || [],
        qualifications: data.qualifications.split(',').map((q: string) => q.trim()).filter((q: string) => q),
        qualificationsEn: data.qualificationsEn ? data.qualificationsEn.split(',').map((q: string) => q.trim()).filter((q: string) => q) : [],
        qualificationsHe: data.qualificationsHe ? data.qualificationsHe.split(',').map((q: string) => q.trim()).filter((q: string) => q) : [],
        scheduleEntries: processedScheduleEntries,
      };
      return await apiClient.post('/doctors/with-schedule', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const processedScheduleEntries = scheduleEntries.map(entry => ({
        ...entry,
        type: entry.type || (data.specialties.length === 1 ? data.specialties[0] : '')
      }));

      const payload = {
        ...data,
        specialties: data.specialties,
        specialtiesEn: data.specialtiesEn || [],
        specialtiesHe: data.specialtiesHe || [],
        qualifications: data.qualifications.split(',').map((q: string) => q.trim()).filter((q: string) => q),
        qualificationsEn: data.qualificationsEn ? data.qualificationsEn.split(',').map((q: string) => q.trim()).filter((q: string) => q) : [],
        qualificationsHe: data.qualificationsHe ? data.qualificationsHe.split(',').map((q: string) => q.trim()).filter((q: string) => q) : [],
        scheduleEntries: processedScheduleEntries,
      };
      return await apiClient.put(`/doctors/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.delete(`/doctors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const handleOpen = (doctor?: Doctor) => {
    if (doctor) {
      setEditingId(doctor.id);
      const specialties = doctor.specialties || [];
      const defaultType = specialties.length === 1 ? specialties[0] : '';
      setFormData({
        userId: '',
        fullName: doctor.fullName,
        fullNameEn: doctor.fullNameEn || '',
        fullNameHe: doctor.fullNameHe || '',
        specialties,
        specialtiesEn: doctor.specialtiesEn || [],
        specialtiesHe: doctor.specialtiesHe || [],
        qualifications: doctor.qualifications.join(', '),
        qualificationsEn: doctor.qualificationsEn?.join(', ') || '',
        qualificationsHe: doctor.qualificationsHe?.join(', ') || '',
        bio: doctor.bio || '',
        bioEn: doctor.bioEn || '',
        bioHe: doctor.bioHe || '',
        imageUrl: doctor.imageUrl || '',
      });
      if (doctor.imageUrl) {
        setImagePreview(doctor.imageUrl);
      }
      if (doctor.schedule && doctor.schedule.length > 0) {
        const scheduleMap = new Map<string, ScheduleEntry>();
        doctor.schedule.forEach(s => {
          const key = `${s.startTime}-${s.endTime}-${s.slotDuration}-${s.type || ''}`;
          if (scheduleMap.has(key)) {
            const entry = scheduleMap.get(key)!;
            if (!entry.days.includes(s.dayOfWeek)) {
              entry.days.push(s.dayOfWeek);
              entry.days.sort((a, b) => a - b);
            }
          } else {
            scheduleMap.set(key, {
              days: [s.dayOfWeek],
              startTime: s.startTime,
              endTime: s.endTime,
              slotDuration: s.slotDuration,
              type: s.type || defaultType,
            });
          }
        });
        setScheduleEntries(Array.from(scheduleMap.values()));
      } else {
        setScheduleEntries([{ days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: defaultType }]);
      }
    } else {
      setEditingId(null);
      setFormData({
        userId: '',
        fullName: '',
        fullNameEn: '',
        fullNameHe: '',
        specialties: [],
        specialtiesEn: [],
        specialtiesHe: [],
        qualifications: '',
        qualificationsEn: '',
        qualificationsHe: '',
        bio: '',
        bioEn: '',
        bioHe: '',
        imageUrl: '',
      });
      setScheduleEntries([{ days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: '' }]);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setUploadError(null);
    setOpen(true);
  };

  const addScheduleEntry = () => {
    const defaultType = formData.specialties.length === 1 ? formData.specialties[0] : '';
    setScheduleEntries([...scheduleEntries, { days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: defaultType }]);
  };

  const removeScheduleEntry = (index: number) => {
    setScheduleEntries(scheduleEntries.filter((_, i) => i !== index));
  };

  const updateScheduleEntry = (index: number, field: keyof ScheduleEntry, value: any) => {
    const newEntries = [...scheduleEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setScheduleEntries(newEntries);
  };

  const toggleDay = (entryIndex: number, day: number) => {
    const entry = scheduleEntries[entryIndex];
    const days = entry.days.includes(day)
      ? entry.days.filter(d => d !== day)
      : [...entry.days, day].sort((a, b) => a - b);
    updateScheduleEntry(entryIndex, 'days', days);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setSelectedImage(null);
    setImagePreview(null);
    setUploadError(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<{ url: string; path: string | null } | null> => {
    if (!selectedImage) return formData.imageUrl ? { url: formData.imageUrl, path: null } : null;

    setUploadingImage(true);
    try {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      const response = await apiClient.post('/upload/image', {
        image: base64,
        fileName: `doctor_${Date.now()}.${selectedImage.name.split('.').pop()}`,
        folder: 'doctors',
        mimeType: selectedImage.type,
      });

      return { url: response.data.url, path: response.data.path };
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImage = async (path: string): Promise<void> => {
    try {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await apiClient.delete('/upload/image', { data: { path } });
    } catch (error) {
      console.error('Failed to delete uploaded image:', error);
    }
  };

  const handleSubmit = async () => {
    let uploadedImagePath: string | null = null;

    try {
      let imageUrl = formData.imageUrl;

      if (selectedImage) {
        const uploadResult = await uploadImage();
        if (uploadResult) {
          imageUrl = uploadResult.url;
          uploadedImagePath = uploadResult.path ?? null;
        } else {
          return;
        }
      }

      const dataWithImage = { ...formData, imageUrl };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: dataWithImage });
      } else {
        await createMutation.mutateAsync(dataWithImage);
      }
    } catch (error) {
      console.error('Error submitting doctor:', error);
      if (uploadedImagePath) {
        console.log('Rolling back uploaded image:', uploadedImagePath);
        await deleteImage(uploadedImagePath);
        setUploadError('Doctor creation failed. Uploaded image was removed.');
      }
    }
  };

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
                  background: gradients.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${alpha(healthcareColors.secondary.main, 0.4)}`,
                }}
              >
                <HospitalIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  Doctors
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage medical staff and schedules
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: gradients.secondary,
              boxShadow: `0 4px 14px ${alpha(healthcareColors.secondary.main, 0.4)}`,
              '&:hover': {
                background: gradients.secondary,
                filter: 'brightness(0.95)',
                boxShadow: `0 6px 20px ${alpha(healthcareColors.secondary.main, 0.5)}`,
              },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Add Doctor
          </Button>
        </Box>

        {/* Stats Row */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          <Chip
            icon={<HospitalIcon />}
            label={`${doctors?.length || 0} Total`}
            sx={{
              bgcolor: alpha(healthcareColors.secondary.main, 0.1),
              color: healthcareColors.secondary.main,
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
          <Chip
            icon={<ActiveIcon />}
            label={`${doctors?.filter(d => d.isActive).length || 0} Active`}
            sx={{
              bgcolor: alpha(healthcareColors.success, 0.1),
              color: healthcareColors.success,
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
          <Chip
            icon={<InactiveIcon />}
            label={`${doctors?.filter(d => !d.isActive).length || 0} Inactive`}
            sx={{
              bgcolor: alpha(healthcareColors.neutral[500], 0.1),
              color: healthcareColors.neutral[500],
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search doctors by name or specialty..."
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
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<FilterIcon />}
              label="All"
              onClick={() => setStatusFilter('all')}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'all' ? healthcareColors.primary.main : 'transparent',
                color: statusFilter === 'all' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                '&:hover': { bgcolor: statusFilter === 'all' ? healthcareColors.primary.dark : healthcareColors.neutral[100] },
              }}
            />
            <Chip
              icon={<ActiveIcon />}
              label="Active"
              onClick={() => setStatusFilter('active')}
              variant={statusFilter === 'active' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'active' ? healthcareColors.success : 'transparent',
                color: statusFilter === 'active' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                '&:hover': { bgcolor: statusFilter === 'active' ? '#059669' : healthcareColors.neutral[100] },
              }}
            />
            <Chip
              icon={<InactiveIcon />}
              label="Inactive"
              onClick={() => setStatusFilter('inactive')}
              variant={statusFilter === 'inactive' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'inactive' ? healthcareColors.neutral[500] : 'transparent',
                color: statusFilter === 'inactive' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                '&:hover': { bgcolor: statusFilter === 'inactive' ? healthcareColors.neutral[600] : healthcareColors.neutral[100] },
              }}
            />
          </Stack>
        </Stack>
        {searchQuery && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </Typography>
        )}
      </Paper>

      {/* Doctors Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card
              key={i}
              sx={{
                borderRadius: 2,
                height: '100%',
                background: healthcareColors.neutral[100],
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ height: 200 }} />
              </CardContent>
            </Card>
          ))
        ) : filteredDoctors.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                ...glassStyles.card,
              }}
            >
              <HospitalIcon sx={{ fontSize: 64, color: healthcareColors.neutral[300], mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery || statusFilter !== 'all' ? 'No doctors match your filters' : 'No doctors yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search criteria' : 'Add your first doctor to get started'}
              </Typography>
              {!searchQuery && statusFilter === 'all' && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                  Add Doctor
                </Button>
              )}
            </Paper>
          </Box>
        ) : (
          filteredDoctors.map((doctor, index) => (
            <Grow in timeout={300 + index * 50} key={doctor.id}>
              <Card
                sx={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: healthcareColors.neutral[200],
                  boxShadow: shadows.sm,
                  transition: animations.transition.normal,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: shadows.md,
                    borderColor: healthcareColors.neutral[300],
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  {/* Header with Avatar and Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      src={doctor.imageUrl}
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: alpha(healthcareColors.secondary.main, 0.15),
                        color: healthcareColors.secondary.main,
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        border: `3px solid ${doctor.isActive ? healthcareColors.success : healthcareColors.neutral[300]}`,
                      }}
                    >
                      {doctor.fullName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleOpen(doctor); }}
                          sx={{
                            color: healthcareColors.primary.main,
                            bgcolor: alpha(healthcareColors.primary.main, 0.1),
                            '&:hover': { bgcolor: alpha(healthcareColors.primary.main, 0.2) },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doctor.id); }}
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
                  </Box>

                  {/* Name and Status */}
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                    {doctor.fullName}
                  </Typography>
                  {doctor.fullNameEn && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {doctor.fullNameEn}
                    </Typography>
                  )}

                  {/* Status Badge */}
                  <Chip
                    size="small"
                    icon={doctor.isActive ? <ActiveIcon /> : <InactiveIcon />}
                    label={doctor.isActive ? 'Active' : 'Inactive'}
                    sx={{
                      mb: 2,
                      bgcolor: doctor.isActive ? alpha(healthcareColors.success, 0.1) : alpha(healthcareColors.neutral[400], 0.1),
                      color: doctor.isActive ? healthcareColors.success : healthcareColors.neutral[500],
                      fontWeight: 500,
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />

                  {/* Specialties */}
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {doctor.specialties.slice(0, 2).map((spec, idx) => (
                        <Chip
                          key={idx}
                          label={spec}
                          size="small"
                          sx={{
                            bgcolor: alpha(healthcareColors.accent.main, 0.1),
                            color: healthcareColors.accent.main,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                      {doctor.specialties.length > 2 && (
                        <Chip
                          label={`+${doctor.specialties.length - 2}`}
                          size="small"
                          sx={{
                            bgcolor: healthcareColors.neutral[100],
                            color: healthcareColors.neutral[500],
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Bio Preview */}
                  {(doctor.bio || doctor.bioEn) && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.8rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {doctor.bio || doctor.bioEn}
                    </Typography>
                  )}

                  {/* Schedule Preview */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                    <Stack direction="row" spacing={0.5}>
                      {formatScheduleCompact(doctor.schedule).map((day, idx) => (
                        <Chip
                          key={idx}
                          label={day}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            bgcolor: healthcareColors.neutral[100],
                            color: healthcareColors.neutral[600],
                          }}
                        />
                      ))}
                      {doctor.schedule?.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No schedule
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          ))
        )}
      </Box>

      {/* Edit/Create Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...glassStyles.dialog,
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Modern Dialog Header */}
        <Box
          sx={{
            background: gradients.secondary,
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
              {editingId ? <EditIcon sx={{ color: 'white', fontSize: 20 }} /> : <AddIcon sx={{ color: 'white', fontSize: 20 }} />}
            </Box>
            <Typography variant="h6" fontWeight={600} color="white">
              {editingId ? 'Edit Doctor' : 'Add New Doctor'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {/* Doctor Image */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Doctor Photo
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="doctor-image-upload"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={imagePreview}
                    alt="Doctor"
                    sx={{ width: 100, height: 100 }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'grey.200' }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                </Avatar>
              )}
              <Button
                variant="outlined"
                component="label"
                htmlFor="doctor-image-upload"
                startIcon={<UploadIcon />}
              >
                {imagePreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </Box>
            {uploadError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {uploadError}
              </Alert>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Arabic Inputs */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            Arabic (العربية)
          </Typography>
          <TextField
            fullWidth
            label="Full Name (Arabic)"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            margin="dense"
            placeholder="الدكتور عادل شلاعطة"
          />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.specialties}
            onChange={(_, newValue) => setFormData({ ...formData, specialties: newValue })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} key={index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Specialties (Arabic)"
                margin="dense"
                placeholder="اخصائي اطفال (press Enter to add)"
                helperText="Type and press Enter to add each specialty"
              />
            )}
          />
          <TextField
            fullWidth
            label="Qualifications (Arabic)"
            value={formData.qualifications}
            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
            margin="dense"
            placeholder="دكتوراه في طب الأطفال, استشاري"
            helperText="Separate with commas"
          />
          <TextField
            fullWidth
            label="Bio (Arabic)"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            margin="dense"
            multiline
            rows={2}
            placeholder="نبذة قصيرة عن الطبيب..."
          />

          <Divider sx={{ my: 2 }} />

          {/* English Inputs */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            English
          </Typography>
          <TextField
            fullWidth
            label="Full Name (English)"
            value={formData.fullNameEn}
            onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
            margin="dense"
            placeholder="Dr. Adel Shalata"
          />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.specialtiesEn}
            onChange={(_, newValue) => setFormData({ ...formData, specialtiesEn: newValue })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} key={index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Specialties (English)"
                margin="dense"
                placeholder="Pediatrician (press Enter to add)"
                helperText="Type and press Enter to add each specialty"
              />
            )}
          />
          <TextField
            fullWidth
            label="Qualifications (English)"
            value={formData.qualificationsEn}
            onChange={(e) => setFormData({ ...formData, qualificationsEn: e.target.value })}
            margin="dense"
            placeholder="PhD in Pediatrics, Consultant"
            helperText="Separate with commas"
          />
          <TextField
            fullWidth
            label="Bio (English)"
            value={formData.bioEn}
            onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
            margin="dense"
            multiline
            rows={2}
            placeholder="A brief description about the doctor..."
          />
          <Divider sx={{ my: 2 }} />

          {/* Hebrew Inputs */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Hebrew (עברית)
          </Typography>
          <TextField
            fullWidth
            label="Full Name (Hebrew)"
            value={formData.fullNameHe}
            onChange={(e) => setFormData({ ...formData, fullNameHe: e.target.value })}
            margin="dense"
            placeholder="ד״ר עאדל שלאעטה"
          />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.specialtiesHe}
            onChange={(_, newValue) => setFormData({ ...formData, specialtiesHe: newValue })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} key={index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Specialties (Hebrew)"
                margin="dense"
                placeholder="רופא ילדים (press Enter to add)"
                helperText="Type and press Enter to add each specialty"
              />
            )}
          />
          <TextField
            fullWidth
            label="Qualifications (Hebrew)"
            value={formData.qualificationsHe}
            onChange={(e) => setFormData({ ...formData, qualificationsHe: e.target.value })}
            margin="dense"
            placeholder="דוקטורט ברפואת ילדים, יועץ"
            helperText="Separate with commas"
          />
          <TextField
            fullWidth
            label="Bio (Hebrew)"
            value={formData.bioHe}
            onChange={(e) => setFormData({ ...formData, bioHe: e.target.value })}
            margin="dense"
            multiline
            rows={2}
            placeholder="תיאור קצר על הרופא..."
          />

          {!editingId && (
            <>
              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth
                label="User ID"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                margin="dense"
                helperText="Link to existing user account"
              />
            </>
          )}

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Schedule</Typography>
          {scheduleEntries.map((entry, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: healthcareColors.neutral[50], borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2">Schedule Block {index + 1}</Typography>
                {scheduleEntries.length > 1 && (
                  <IconButton size="small" onClick={() => removeScheduleEntry(index)} color="error">
                    <RemoveIcon />
                  </IconButton>
                )}
              </Box>

              {formData.specialties.length > 1 ? (
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Role/Type</InputLabel>
                  <Select
                    value={entry.type}
                    onChange={(e) => updateScheduleEntry(index, 'type', e.target.value)}
                    label="Role/Type"
                  >
                    {formData.specialties.map((specialty, idx) => (
                      <MenuItem key={idx} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>Select Days:</Typography>
              <FormGroup row>
                {DAYS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={entry.days.includes(day.value)}
                        onChange={() => toggleDay(index, day.value)}
                        size="small"
                      />
                    }
                    label={day.label.substring(0, 3)}
                  />
                ))}
              </FormGroup>

              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => updateScheduleEntry(index, 'startTime', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => updateScheduleEntry(index, 'endTime', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Slot (mins)"
                  type="number"
                  value={entry.slotDuration}
                  onChange={(e) => updateScheduleEntry(index, 'slotDuration', parseInt(e.target.value) || 15)}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: 5, max: 60, step: 5 }
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Paper>
          ))}
          <Button startIcon={<AddIcon />} onClick={addScheduleEntry} variant="outlined" fullWidth>
            Add Another Time Block
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: healthcareColors.neutral[50], borderTop: `1px solid ${healthcareColors.neutral[200]}` }}>
          <Button
            onClick={handleClose}
            disabled={uploadingImage}
            sx={{
              color: healthcareColors.neutral[600],
              borderRadius: 1.5,
              px: 2.5,
              '&:hover': { bgcolor: healthcareColors.neutral[100] },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.fullName || uploadingImage || createMutation.isPending || updateMutation.isPending}
            startIcon={uploadingImage ? <CircularProgress size={16} /> : undefined}
            sx={{
              background: gradients.secondary,
              borderRadius: 1.5,
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                background: gradients.secondary,
                filter: 'brightness(0.95)',
                boxShadow: 'none',
              },
            }}
          >
            {uploadingImage ? 'Uploading...' : editingId ? 'Update Doctor' : 'Add Doctor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
