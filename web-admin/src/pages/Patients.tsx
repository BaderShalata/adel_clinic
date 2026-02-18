import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Typography, Dialog, DialogContent,
  DialogContentText, DialogActions, TextField, MenuItem, Tooltip, Stack,
  InputAdornment, Chip, Avatar, IconButton, Card, CardContent,
  Grow, alpha,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Person as PersonIcon, Phone as PhoneIcon,
  Email as EmailIcon, Cake as BirthIcon, FilterList as FilterIcon,
  Close as CloseIcon, Male as MaleIcon, Female as FemaleIcon,
  Badge as IdIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import { healthcareColors, gradients, glassStyles, shadows, animations } from '../theme/healthcareTheme';

interface Patient {
  id: string;
  fullName: string;
  idNumber?: string;
  dateOfBirth: { _seconds: number };
  gender: string;
  phoneNumber: string;
  email?: string;
}

export const Patients: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    gender: 'male',
    phoneNumber: '',
    email: '',
    address: '',
  });

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/patients');
      return response.data;
    },
  });

  // Filtered patients based on search and gender filter
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter(patient => {
      const matchesSearch = !searchQuery ||
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phoneNumber?.includes(searchQuery) ||
        patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.idNumber?.includes(searchQuery);
      const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [patients, searchQuery, genderFilter]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post('/patients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.put(`/patients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.delete(`/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    },
  });

  const handleOpen = (patient?: Patient) => {
    if (patient) {
      setEditingId(patient.id);
      setFormData({
        fullName: patient.fullName,
        idNumber: patient.idNumber || '',
        dateOfBirth: dayjs(patient.dateOfBirth._seconds * 1000).format('YYYY-MM-DD'),
        gender: patient.gender,
        phoneNumber: patient.phoneNumber,
        email: patient.email || '',
        address: '',
      });
    } else {
      setEditingId(null);
      setFormData({ fullName: '', idNumber: '', dateOfBirth: '', gender: 'male', phoneNumber: '', email: '', address: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (patientToDelete) {
      deleteMutation.mutate(patientToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return <MaleIcon sx={{ color: '#3b82f6' }} />;
      case 'female': return <FemaleIcon sx={{ color: '#ec4899' }} />;
      default: return <PersonIcon sx={{ color: healthcareColors.neutral[400] }} />;
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return '#3b82f6';
      case 'female': return '#ec4899';
      default: return healthcareColors.neutral[400];
    }
  };

  const calculateAge = (seconds: number) => {
    const birthDate = dayjs(seconds * 1000);
    return dayjs().diff(birthDate, 'year');
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
                  background: gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${alpha(healthcareColors.primary.main, 0.4)}`,
                }}
              >
                <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  Patients
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage patient records and information
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: gradients.primary,
              boxShadow: `0 4px 14px ${alpha(healthcareColors.primary.main, 0.4)}`,
              '&:hover': {
                background: gradients.primary,
                filter: 'brightness(0.95)',
                boxShadow: `0 6px 20px ${alpha(healthcareColors.primary.main, 0.5)}`,
              },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Add Patient
          </Button>
        </Box>

        {/* Stats Row */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          <Chip
            icon={<PersonIcon />}
            label={`${patients?.length || 0} Total`}
            sx={{
              bgcolor: alpha(healthcareColors.primary.main, 0.1),
              color: healthcareColors.primary.main,
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
          <Chip
            icon={<MaleIcon />}
            label={`${patients?.filter(p => p.gender === 'male').length || 0} Male`}
            sx={{
              bgcolor: alpha('#3b82f6', 0.1),
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
          <Chip
            icon={<FemaleIcon />}
            label={`${patients?.filter(p => p.gender === 'female').length || 0} Female`}
            sx={{
              bgcolor: alpha('#ec4899', 0.1),
              color: '#ec4899',
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
            placeholder="Search patients by name, phone, email, or ID..."
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
              onClick={() => setGenderFilter('all')}
              variant={genderFilter === 'all' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: genderFilter === 'all' ? healthcareColors.primary.main : 'transparent',
                color: genderFilter === 'all' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                '&:hover': { bgcolor: genderFilter === 'all' ? healthcareColors.primary.dark : healthcareColors.neutral[100] },
              }}
            />
            <Chip
              icon={<MaleIcon />}
              label="Male"
              onClick={() => setGenderFilter('male')}
              variant={genderFilter === 'male' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: genderFilter === 'male' ? '#3b82f6' : 'transparent',
                color: genderFilter === 'male' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                '&:hover': { bgcolor: genderFilter === 'male' ? '#2563eb' : healthcareColors.neutral[100] },
              }}
            />
            <Chip
              icon={<FemaleIcon />}
              label="Female"
              onClick={() => setGenderFilter('female')}
              variant={genderFilter === 'female' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: genderFilter === 'female' ? '#ec4899' : 'transparent',
                color: genderFilter === 'female' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                '&:hover': { bgcolor: genderFilter === 'female' ? '#db2777' : healthcareColors.neutral[100] },
              }}
            />
          </Stack>
        </Stack>
        {searchQuery && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </Typography>
        )}
      </Paper>

      {/* Patients Grid */}
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
          // Skeleton loading
          [...Array(6)].map((_, i) => (
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
                <Box sx={{ height: 140 }} />
              </CardContent>
            </Card>
          ))
        ) : filteredPatients.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                ...glassStyles.card,
              }}
            >
              <PersonIcon sx={{ fontSize: 64, color: healthcareColors.neutral[300], mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery || genderFilter !== 'all' ? 'No patients match your filters' : 'No patients yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery || genderFilter !== 'all' ? 'Try adjusting your search criteria' : 'Add your first patient to get started'}
              </Typography>
              {!searchQuery && genderFilter === 'all' && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                  Add Patient
                </Button>
              )}
            </Paper>
          </Box>
        ) : (
          filteredPatients.map((patient, index) => (
            <Grow in timeout={300 + index * 50} key={patient.id}>
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
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: alpha(getGenderColor(patient.gender), 0.15),
                        color: getGenderColor(patient.gender),
                        fontWeight: 600,
                        fontSize: '1.2rem',
                      }}
                    >
                      {patient.fullName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleOpen(patient); }}
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
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(patient); }}
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

                  {/* Name and Gender */}
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                    {patient.fullName}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Chip
                      size="small"
                      icon={getGenderIcon(patient.gender)}
                      label={patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1) || 'N/A'}
                      sx={{
                        bgcolor: alpha(getGenderColor(patient.gender), 0.1),
                        color: getGenderColor(patient.gender),
                        fontWeight: 500,
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                    {patient.dateOfBirth?._seconds && (
                      <Typography variant="caption" color="text.secondary">
                        {calculateAge(patient.dateOfBirth._seconds)} years old
                      </Typography>
                    )}
                  </Stack>

                  {/* Details */}
                  <Stack spacing={1}>
                    {patient.idNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IdIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.idNumber}
                        </Typography>
                      </Box>
                    )}
                    {patient.dateOfBirth?._seconds && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BirthIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(patient.dateOfBirth._seconds * 1000).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                    )}
                    {patient.phoneNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.phoneNumber}
                        </Typography>
                      </Box>
                    )}
                    {patient.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: healthcareColors.neutral[400] }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {patient.email}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
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
        maxWidth="sm"
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
            background: gradients.primary,
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
              {editingId ? 'Edit Patient' : 'Add New Patient'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: healthcareColors.neutral[400] }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="ID Number"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="National ID"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IdIcon sx={{ color: healthcareColors.neutral[400] }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BirthIcon sx={{ color: healthcareColors.neutral[400] }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <MenuItem value="male">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MaleIcon sx={{ color: '#3b82f6' }} /> Male
                  </Box>
                </MenuItem>
                <MenuItem value="female">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FemaleIcon sx={{ color: '#ec4899' }} /> Female
                  </Box>
                </MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: healthcareColors.neutral[400] }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: healthcareColors.neutral[400] }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: healthcareColors.neutral[50], borderTop: `1px solid ${healthcareColors.neutral[200]}` }}>
          <Button
            onClick={handleClose}
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
            sx={{
              background: gradients.primary,
              borderRadius: 1.5,
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                background: gradients.primary,
                filter: 'brightness(0.95)',
                boxShadow: 'none',
              },
            }}
          >
            {editingId ? 'Update Patient' : 'Add Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        slotProps={{
          paper: {
            sx: {
              ...glassStyles.dialog,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          sx={{
            background: gradients.error,
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
              <DeleteIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color="white">
              Delete Patient
            </Typography>
          </Box>
          <IconButton onClick={handleDeleteCancel} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            Are you sure you want to delete <strong>{patientToDelete?.fullName}</strong>?
            This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: healthcareColors.neutral[50], borderTop: `1px solid ${healthcareColors.neutral[200]}` }}>
          <Button
            onClick={handleDeleteCancel}
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
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{
              background: gradients.error,
              borderRadius: 1.5,
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                background: gradients.error,
                filter: 'brightness(0.95)',
                boxShadow: 'none',
              },
            }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Patient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
