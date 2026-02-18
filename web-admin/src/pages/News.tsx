import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Paper, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, MenuItem, Switch, FormControlLabel,
  CircularProgress, Alert, Stack, Card, CardContent, CardMedia, Tooltip,
  InputAdornment, Grow, alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as PublishedIcon,
  VisibilityOff as DraftIcon,
  Campaign as AnnouncementIcon,
  Favorite as HealthIcon,
  Event as EventIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { healthcareColors, gradients, glassStyles, shadows, animations } from '../theme/healthcareTheme';

interface News {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  authorName: string;
  imageURL?: string;
}

const getCategoryConfig = (category: string) => {
  switch (category) {
    case 'announcement':
      return { color: healthcareColors.info, icon: <AnnouncementIcon />, label: 'Announcement' };
    case 'health-tip':
      return { color: healthcareColors.success, icon: <HealthIcon />, label: 'Health Tip' };
    case 'event':
      return { color: healthcareColors.warning, icon: <EventIcon />, label: 'Event' };
    default:
      return { color: healthcareColors.neutral[500], icon: <ArticleIcon />, label: 'General' };
  }
};

export const News: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
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

  const { data: newsList, isLoading } = useQuery<News[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/news');
      return response.data;
    },
  });

  const filteredNews = useMemo(() => {
    if (!newsList) return [];
    return newsList.filter(news => {
      const matchesSearch = !searchQuery ||
        news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.authorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || news.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'published' && news.isPublished) ||
        (statusFilter === 'draft' && !news.isPublished);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [newsList, searchQuery, categoryFilter, statusFilter]);

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
      setImagePreview(null);
    }
    setSelectedImage(null);
    setUploadError(null);
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
      let imageURL = formData.imageURL;
      if (selectedImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageURL = uploadedUrl;
        } else if (selectedImage) {
          return;
        }
      }

      const newsData = { ...formData, imageURL };

      if (editingId) {
        updateMutation.mutate({ id: editingId, data: newsData });
      } else {
        createMutation.mutate(newsData);
      }
    } catch (error) {
      console.error('Error submitting news:', error);
    }
  };

  const categoryCounts = useMemo(() => {
    if (!newsList) return { total: 0, published: 0, draft: 0 };
    return {
      total: newsList.length,
      published: newsList.filter(n => n.isPublished).length,
      draft: newsList.filter(n => !n.isPublished).length,
    };
  }, [newsList]);

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
                  background: gradients.purpleToBlue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${alpha(healthcareColors.accent.main, 0.4)}`,
                }}
              >
                <ArticleIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  News & Updates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage clinic announcements and health tips
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: gradients.purpleToBlue,
              boxShadow: `0 4px 14px ${alpha(healthcareColors.accent.main, 0.4)}`,
              '&:hover': {
                background: gradients.purpleToBlue,
                filter: 'brightness(0.95)',
                boxShadow: `0 6px 20px ${alpha(healthcareColors.accent.main, 0.5)}`,
              },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Add News
          </Button>
        </Box>

        {/* Stats Row */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          <Chip
            icon={<ArticleIcon />}
            label={`${categoryCounts.total} Total`}
            sx={{
              bgcolor: alpha(healthcareColors.accent.main, 0.1),
              color: healthcareColors.accent.main,
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 2,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
          <Chip
            icon={<PublishedIcon />}
            label={`${categoryCounts.published} Published`}
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
            icon={<DraftIcon />}
            label={`${categoryCounts.draft} Drafts`}
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search news by title, content, or author..."
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
          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="announcement">Announcement</MenuItem>
            <MenuItem value="health-tip">Health Tip</MenuItem>
            <MenuItem value="event">Event</MenuItem>
            <MenuItem value="general">General</MenuItem>
          </TextField>
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
              }}
            />
            <Chip
              icon={<PublishedIcon />}
              label="Published"
              onClick={() => setStatusFilter('published')}
              variant={statusFilter === 'published' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'published' ? healthcareColors.success : 'transparent',
                color: statusFilter === 'published' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
              }}
            />
            <Chip
              icon={<DraftIcon />}
              label="Drafts"
              onClick={() => setStatusFilter('draft')}
              variant={statusFilter === 'draft' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'draft' ? healthcareColors.neutral[500] : 'transparent',
                color: statusFilter === 'draft' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* News Grid */}
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
              <Box sx={{ height: 160 }} />
              <CardContent><Box sx={{ height: 100 }} /></CardContent>
            </Card>
          ))
        ) : filteredNews.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Paper sx={{ p: 6, textAlign: 'center', ...glassStyles.card }}>
              <ArticleIcon sx={{ fontSize: 64, color: healthcareColors.neutral[300], mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery || categoryFilter || statusFilter !== 'all' ? 'No news match your filters' : 'No news yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery || categoryFilter || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first news article'}
              </Typography>
              {!searchQuery && !categoryFilter && statusFilter === 'all' && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                  Add News
                </Button>
              )}
            </Paper>
          </Box>
        ) : (
          filteredNews.map((news, index) => {
            const categoryConfig = getCategoryConfig(news.category);
            return (
              <Grow in timeout={300 + index * 50} key={news.id}>
                <Card
                  sx={{
                    background: '#fff',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: healthcareColors.neutral[200],
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: animations.transition.normal,
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: healthcareColors.neutral[300],
                    },
                  }}
                >
                  {news.imageURL ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={news.imageURL}
                      alt={news.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        background: gradients.subtlePrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 48, color: healthcareColors.neutral[300] }} />
                    </Box>
                  )}
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip
                        size="small"
                        icon={categoryConfig.icon}
                        label={categoryConfig.label}
                        sx={{
                          bgcolor: alpha(categoryConfig.color, 0.1),
                          color: categoryConfig.color,
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          '& .MuiChip-icon': { color: 'inherit', fontSize: 14 },
                        }}
                      />
                      <Chip
                        size="small"
                        icon={news.isPublished ? <PublishedIcon /> : <DraftIcon />}
                        label={news.isPublished ? 'Published' : 'Draft'}
                        sx={{
                          bgcolor: news.isPublished ? alpha(healthcareColors.success, 0.1) : alpha(healthcareColors.neutral[400], 0.1),
                          color: news.isPublished ? healthcareColors.success : healthcareColors.neutral[500],
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          '& .MuiChip-icon': { color: 'inherit', fontSize: 14 },
                        }}
                      />
                    </Box>

                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, lineHeight: 1.3 }}>
                      {news.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {news.content}
                    </Typography>

                    {news.authorName && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        By {news.authorName}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(news)}
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
                          onClick={() => deleteMutation.mutate(news.id)}
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

      {/* Edit/Create Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { ...glassStyles.card } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: gradients.purpleToBlue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {editingId ? <EditIcon sx={{ color: 'white' }} /> : <AddIcon sx={{ color: 'white' }} />}
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {editingId ? 'Edit News' : 'Add News'}
            </Typography>
          </Box>
        </DialogTitle>
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
              <MenuItem value="announcement">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnnouncementIcon sx={{ color: healthcareColors.info }} /> Announcement
                </Box>
              </MenuItem>
              <MenuItem value="health-tip">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealthIcon sx={{ color: healthcareColors.success }} /> Health Tip
                </Box>
              </MenuItem>
              <MenuItem value="event">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon sx={{ color: healthcareColors.warning }} /> Event
                </Box>
              </MenuItem>
              <MenuItem value="general">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArticleIcon sx={{ color: healthcareColors.neutral[500] }} /> General
                </Box>
              </MenuItem>
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
                      borderRadius: 2,
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
                  sx={{ py: 2, width: '100%', borderRadius: 2 }}
                >
                  Upload Image
                </Button>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
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
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formData.isPublished ? <PublishedIcon color="success" /> : <DraftIcon />}
                  <Typography variant="body2">
                    {formData.isPublished ? 'Published' : 'Save as draft'}
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={uploadingImage} sx={{ color: healthcareColors.neutral[600] }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.content || uploadingImage || createMutation.isPending || updateMutation.isPending}
            startIcon={uploadingImage ? <CircularProgress size={16} /> : undefined}
            sx={{
              background: gradients.purpleToBlue,
              '&:hover': { filter: 'brightness(0.95)' },
            }}
          >
            {uploadingImage ? 'Uploading...' : editingId ? 'Update News' : 'Create News'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
