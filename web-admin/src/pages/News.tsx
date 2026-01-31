import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, MenuItem, Switch, FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface News {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  authorName: string;
}

export const News: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPublished: false,
    imageURL: '',
  });

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: newsList } = useQuery<News[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/news');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.post('/news', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.put(`/news/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return await apiClient.delete(`/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  const handleOpen = (news?: News) => {
    if (news) {
      setEditingId(news.id);
      setFormData({
        title: news.title,
        content: news.content,
        category: news.category,
        isPublished: news.isPublished,
        imageURL: '',
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', category: 'general', isPublished: false, imageURL: '' });
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">News</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add News
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {newsList?.map((news) => (
              <TableRow key={news.id}>
                <TableCell>{news.title}</TableCell>
                <TableCell>{news.category}</TableCell>
                <TableCell>{news.authorName}</TableCell>
                <TableCell>
                  <Chip
                    label={news.isPublished ? 'Published' : 'Draft'}
                    color={news.isPublished ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(news)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(news.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit News' : 'Add News'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
          >
            <MenuItem value="announcement">Announcement</MenuItem>
            <MenuItem value="health-tip">Health Tip</MenuItem>
            <MenuItem value="event">Event</MenuItem>
            <MenuItem value="general">General</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Image URL"
            value={formData.imageURL}
            onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
            }
            label="Published"
            sx={{ mt: 2 }}
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
