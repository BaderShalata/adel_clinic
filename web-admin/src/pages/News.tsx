import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, MenuItem, Switch, FormControlLabel,
  CircularProgress, Alert, Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface News {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  authorName: string;
  imageURL?: string;
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        imageURL: news.imageURL || '',
      });
      if (news.imageURL) {
        setImagePreview(news.imageURL);
      }
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', category: 'general', isPublished: false, imageURL: '' });
    }
    setOpen(true);
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setUploadError(null);
      // Create preview
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
    setFormData({ ...formData, imageURL: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return formData.imageURL || null;

    setUploadingImage(true);
    try {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Upload to Firebase Storage
      const response = await apiClient.post('/upload/image', {
        image: base64,
        fileName: `news_${Date.now()}.${selectedImage.name.split('.').pop()}`,
        folder: 'news',
        mimeType: selectedImage.type,
      });

      return response.data.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Upload image if selected
      let imageURL = formData.imageURL;
      if (selectedImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageURL = uploadedUrl;
        } else if (selectedImage) {
          // Upload failed but image was selected
          return;
        }
      }

      const newsData = {
        ...formData,
        imageURL,
      };

      if (editingId) {
        updateMutation.mutate({ id: editingId, data: newsData });
      } else {
        createMutation.mutate(newsData);
      }
    } catch (error) {
      console.error('Error submitting news:', error);
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
              <TableCell width={60}>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {newsList?.map((news) => (
              <TableRow key={news.id} hover>
                <TableCell>
                  {news.imageURL ? (
                    <Box
                      component="img"
                      src={news.imageURL}
                      alt={news.title}
                      sx={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ImageIcon sx={{ color: 'grey.400' }} />
                    </Box>
                  )}
                </TableCell>
                <TableCell>{news.title}</TableCell>
                <TableCell>
                  <Chip
                    label={news.category}
                    size="small"
                    variant="outlined"
                    color={
                      news.category === 'announcement' ? 'primary' :
                      news.category === 'health-tip' ? 'success' :
                      news.category === 'event' ? 'warning' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>{news.authorName}</TableCell>
                <TableCell>
                  <Chip
                    label={news.isPublished ? 'Published' : 'Draft'}
                    color={news.isPublished ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => handleOpen(news)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteMutation.mutate(news.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit News' : 'Add News'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              required
            />

            {/* Image Upload Section */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                News Image
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id="news-image-upload"
              />

              {imagePreview ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
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
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor="news-image-upload"
                  startIcon={<UploadIcon />}
                  sx={{ py: 2, width: '100%' }}
                >
                  Upload Image
                </Button>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {uploadError}
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
              }
              label="Publish immediately"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={uploadingImage}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.content || uploadingImage || createMutation.isPending || updateMutation.isPending}
            startIcon={uploadingImage ? <CircularProgress size={16} /> : undefined}
          >
            {uploadingImage ? 'Uploading...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
