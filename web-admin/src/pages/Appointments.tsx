import React, { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: { _seconds: number };
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export const Appointments: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    duration: 30,
    status: 'scheduled' as const,
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

  const handleOpen = (appointment?: Appointment) => {
    if (appointment) {
      setEditingId(appointment.id);
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: dayjs(appointment.appointmentDate._seconds * 1000).format('YYYY-MM-DDTHH:mm'),
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        duration: 30,
        status: 'scheduled',
        notes: '',
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'warning';
      default: return 'default';
    }
  };

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
              <TableCell>Date & Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments?.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>{appointment.patientName}</TableCell>
                <TableCell>{appointment.doctorName}</TableCell>
                <TableCell>
                  {dayjs(appointment.appointmentDate._seconds * 1000).format('MMM DD, YYYY HH:mm')}
                </TableCell>
                <TableCell>{appointment.duration} min</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Appointment' : 'Add Appointment'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Appointment Date & Time"
            type="datetime-local"
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            margin="normal"
          >
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="no-show">No-Show</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
          />
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
