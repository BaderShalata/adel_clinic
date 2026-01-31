import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, FormControlLabel, Checkbox,
  FormGroup, Divider, Stack, Autocomplete, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
}

interface ScheduleEntry {
  days: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  type: string; // Role/specialty for this schedule block
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

  // Group by day
  const dayMap = new Map<number, DoctorSchedule[]>();
  schedule.forEach(s => {
    if (!dayMap.has(s.dayOfWeek)) {
      dayMap.set(s.dayOfWeek, []);
    }
    dayMap.get(s.dayOfWeek)?.push(s);
  });

  // Format each day
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatted: string[] = [];

  dayMap.forEach((schedules, dayOfWeek) => {
    const times = schedules.map(s => `${s.startTime}-${s.endTime}`).join(', ');
    formatted.push(`${dayNames[dayOfWeek]}: ${times}`);
  });

  return formatted.join(' | ');
};

export const Doctors: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  });
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([
    { days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: '' }
  ]);

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/doctors');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Auto-set type for schedule entries if only one specialty
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

      // Auto-set type for schedule entries if only one specialty
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
      });
      setScheduleEntries([{ days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: defaultType }]);
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
      });
      setScheduleEntries([{ days: [], startTime: '08:00', endTime: '17:00', slotDuration: 15, type: '' }]);
    }
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
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Doctors</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Doctor
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Specialties</TableCell>
              <TableCell>Qualifications</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors?.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{doctor.fullName}</Typography>
                  {doctor.fullNameEn && <Typography variant="caption" color="text.secondary">{doctor.fullNameEn}</Typography>}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    {doctor.specialties.map((spec, idx) => (
                      <Chip key={idx} label={spec} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {doctor.qualifications.slice(0, 2).join(', ')}
                    {doctor.qualifications.length > 2 && ` +${doctor.qualifications.length - 2} more`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {formatSchedule(doctor.schedule)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={doctor.isActive ? 'Active' : 'Inactive'}
                    color={doctor.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(doctor)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(doctor.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
        <DialogContent>
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
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
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
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
