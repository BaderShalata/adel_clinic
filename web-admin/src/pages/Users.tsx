import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, Chip, MenuItem, Tooltip, Stack, alpha, IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block,
  CheckCircle,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { healthcareColors, gradients, glassStyles } from '../theme/healthcareTheme';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'patient',
  });

  const { getToken } = useAuth();
  const { t } = useLanguage();
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
      setDeleteDialogOpen(false);
      setUserToDelete(null);
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

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.uid);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('users')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            background: gradients.primary,
            color: 'white',
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
          {t('addUser')}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>{t('email')}</TableCell>
              <TableCell>{t('phone')}</TableCell>
              <TableCell>{t('role')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.uid} hover>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Chip label={user.role} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? t('active') : t('inactive')}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={t('editUser')}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpen(user)}
                        sx={{ minWidth: 'auto', px: 1.5 }}
                      >
                        {t('edit')}
                      </Button>
                    </Tooltip>
                    <Tooltip title={user.isActive ? t('deactivateUser') : t('activateUser')}>
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.isActive ? 'warning' : 'success'}
                        startIcon={user.isActive ? <Block /> : <CheckCircle />}
                        onClick={() => toggleActiveMutation.mutate({ id: user.uid, isActive: user.isActive })}
                        sx={{ minWidth: 'auto', px: 1.5 }}
                      >
                        {user.isActive ? t('deactivate') : t('activate')}
                      </Button>
                    </Tooltip>
                    <Tooltip title={t('deleteUser')}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(user)}
                        sx={{ minWidth: 'auto', px: 1.5 }}
                      >
                        {t('delete')}
                      </Button>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
            <Typography variant="h5" fontWeight={700} color="white">
              {editingId ? t('editUser') : t('addUser')}
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
              label={t('fullName')}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingId}
            />
            {!editingId && (
              <TextField
                fullWidth
                label={t('password')}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
            <TextField
              fullWidth
              label={t('phoneNumber')}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <TextField
              fullWidth
              select
              label={t('role')}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <MenuItem value="admin">{t('admin')}</MenuItem>
              <MenuItem value="doctor">{t('doctor')}</MenuItem>
              <MenuItem value="patient">{t('patient')}</MenuItem>
            </TextField>
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
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.fullName || !formData.email || createMutation.isPending || updateMutation.isPending}
            sx={{
              background: gradients.primary,
              color: 'white',
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
            {editingId ? t('update') : t('create')}
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
            <Typography variant="h5" fontWeight={700} color="white">
              {t('deleteUser')}
            </Typography>
          </Box>
          <IconButton onClick={handleDeleteCancel} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            {t('confirmDeleteUser')} <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email})?
            {t('actionCannotBeUndone')}
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
            {t('cancel')}
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
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
