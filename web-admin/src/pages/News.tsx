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
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'announcement':
        return { color: healthcareColors.info, icon: <AnnouncementIcon />, label: t('announcement') };
      case 'health-tip':
        return { color: healthcareColors.success, icon: <HealthIcon />, label: t('healthTip') };
      case 'event':
        return { color: healthcareColors.warning, icon: <EventIcon />, label: t('eventCategory') };
      default:
        return { color: healthcareColors.neutral[500], icon: <ArticleIcon />, label: t('general') };
    }
  };

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
        setUploadError(t('pleaseSelectImageFile'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(t('imageSizeTooLarge'));
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
      setUploadError(t('failedToUploadImage'));
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
                  {t('newsAndUpdates')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('manageClinicAnnouncements')}
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
            {t('addNews')}
          </Button>
        </Box>

        {/* Stats Row */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          <Chip
            icon={<ArticleIcon />}
            label={`${categoryCounts.total} ${t('total')}`}
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
            label={`${categoryCounts.published} ${t('published')}`}
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
            label={`${categoryCounts.draft} ${t('drafts')}`}
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
            placeholder={t('searchNewsByTitleContentAuthor')}
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
            label={t('category')}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">{t('allCategories')}</MenuItem>
            <MenuItem value="announcement">{t('announcement')}</MenuItem>
            <MenuItem value="health-tip">{t('healthTip')}</MenuItem>
            <MenuItem value="event">{t('eventCategory')}</MenuItem>
            <MenuItem value="general">{t('general')}</MenuItem>
          </TextField>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Chip
              icon={<FilterIcon />}
              label={t('all')}
              onClick={() => setStatusFilter('all')}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'all' ? healthcareColors.primary.main : 'transparent',
                color: statusFilter === 'all' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                minWidth: 'fit-content',
                px: 1,
              }}
            />
            <Chip
              icon={<PublishedIcon />}
              label={t('published')}
              onClick={() => setStatusFilter('published')}
              variant={statusFilter === 'published' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'published' ? healthcareColors.success : 'transparent',
                color: statusFilter === 'published' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                minWidth: 'fit-content',
                px: 1,
              }}
            />
            <Chip
              icon={<DraftIcon />}
              label={t('drafts')}
              onClick={() => setStatusFilter('draft')}
              variant={statusFilter === 'draft' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusFilter === 'draft' ? healthcareColors.neutral[500] : 'transparent',
                color: statusFilter === 'draft' ? 'white' : healthcareColors.neutral[600],
                borderColor: healthcareColors.neutral[300],
                minWidth: 'fit-content',
                px: 1,
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
                {searchQuery || categoryFilter || statusFilter !== 'all' ? t('noNewsMatchFilters') : t('noNewsYet')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery || categoryFilter || statusFilter !== 'all' ? t('tryAdjustingFiltersWaitingList') : t('createFirstNewsArticle')}
              </Typography>
              {!searchQuery && !categoryFilter && statusFilter === 'all' && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                  {t('addNews')}
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
                        label={news.isPublished ? t('published') : t('draft')}
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
                        {t('by')} {news.authorName}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title={t('edit')}>
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
                      <Tooltip title={t('delete')}>
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
        slotProps={{ paper: { sx: { ...glassStyles.dialog, overflow: 'hidden' } } }}
      >
        {/* Modern Dialog Header */}
        <Box
          sx={{
            background: gradients.purpleToBlue,
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
              {editingId ? t('editNews') : t('addNews')}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('title')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              select
              label={t('category')}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="announcement">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnnouncementIcon sx={{ color: healthcareColors.info }} /> {t('announcement')}
                </Box>
              </MenuItem>
              <MenuItem value="health-tip">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealthIcon sx={{ color: healthcareColors.success }} /> {t('healthTip')}
                </Box>
              </MenuItem>
              <MenuItem value="event">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon sx={{ color: healthcareColors.warning }} /> {t('eventCategory')}
                </Box>
              </MenuItem>
              <MenuItem value="general">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArticleIcon sx={{ color: healthcareColors.neutral[500] }} /> {t('general')}
                </Box>
              </MenuItem>
            </TextField>
            <TextField
              fullWidth
              label={t('content')}
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t('newsImage')}
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
                  {t('uploadImage')}
                </Button>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
                  {uploadError}
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('supportedFormats')}
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
                    {formData.isPublished ? t('published') : t('saveAsDraft')}
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: healthcareColors.neutral[50], borderTop: `1px solid ${healthcareColors.neutral[200]}` }}>
          <Button
            onClick={handleClose}
            disabled={uploadingImage}
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
            disabled={!formData.title || !formData.content || uploadingImage || createMutation.isPending || updateMutation.isPending}
            startIcon={uploadingImage ? <CircularProgress size={16} /> : undefined}
            sx={{
              background: gradients.purpleToBlue,
              borderRadius: 1.5,
              px: 3,
              boxShadow: 'none',
              '&:hover': { filter: 'brightness(0.95)', boxShadow: 'none' },
            }}
          >
            {uploadingImage ? t('uploadingImage') : editingId ? t('updateNews') : t('createNewsBtn')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
