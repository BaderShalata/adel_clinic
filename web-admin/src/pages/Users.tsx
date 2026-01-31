import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Block, CheckCircle } from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
}

export const Users: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'patient',
  });

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/users');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post(`/users/${id}/${isActive ? 'deactivate' : 'activate'}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingId(user.uid);
      setFormData({
        email: user.email,
        password: '',
        fullName: user.fullName,
        phoneNumber: user.phoneNumber || '',
        role: user.role,
      });
    } else {
      setEditingId(null);
      setFormData({ email: '', password: '', fullName: '', phoneNumber: '', role: 'patient' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (editingId) {
      const { password, ...updateData } = formData;
      updateMutation.mutate({ id: editingId, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Chip label={user.role} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => toggleActiveMutation.mutate({ id: user.uid, isActive: user.isActive })}
                  >
                    {user.isActive ? <Block /> : <CheckCircle />}
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(user.uid)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            disabled={!!editingId}
          />
          {!editingId && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
            />
          )}
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            margin="normal"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="doctor">Doctor</MenuItem>
            <MenuItem value="patient">Patient</MenuItem>
          </TextField>
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
