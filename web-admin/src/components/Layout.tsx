import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  alpha,
  Snackbar,
  Paper,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EventNote as AppointmentIcon,
  HourglassEmpty as WaitingIcon,
  People as PatientsIcon,
  Groups as DoctorsIcon,
  Article as NewsIcon,
  Person as UsersIcon,
  Logout as LogoutIcon,
  Public as LanguageIcon,
  MedicalServices as ClinicIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { healthcareColors, gradients, shadows } from '../theme/healthcareTheme';
import { apiClient } from '../lib/api';
import { useAppointmentNotification, type NotificationAppointment } from '../hooks/useAppointmentNotification';

const drawerWidth = 260;

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const { user, signOut, getToken } = useAuth();
  const { language, setLanguage, t, direction } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Clinic lock status
  const { data: clinicStatus } = useQuery<{ isLocked: boolean }>({
    queryKey: ['clinic-status'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/settings/clinic/status');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const clinicLockMutation = useMutation({
    mutationFn: async (isLocked: boolean) => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.post('/settings/clinic/lock', { isLocked });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-status'] });
    },
  });

  const handleToggleClinicLock = () => {
    setLockDialogOpen(true);
  };

  const handleConfirmToggleLock = () => {
    const newLocked = !clinicStatus?.isLocked;
    clinicLockMutation.mutate(newLocked);
    setLockDialogOpen(false);
  };

  // Global appointment polling — shares cache with Appointments page via same query key
  const { data: globalAppointments } = useQuery<NotificationAppointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = await getToken();
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/appointments');
      return response.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { latestNewAppointments, dismissNotification } = useAppointmentNotification(globalAppointments, true);

  const menuItems = [
    { text: t('dashboard'), icon: <DashboardIcon />, path: '/', color: healthcareColors.primary.main },
    { text: t('appointments'), icon: <AppointmentIcon />, path: '/appointments', color: healthcareColors.info },
    { text: t('waitingList'), icon: <WaitingIcon />, path: '/waiting-list', color: healthcareColors.warning },
    { text: t('patients'), icon: <PatientsIcon />, path: '/patients', color: healthcareColors.success },
    { text: t('doctors'), icon: <DoctorsIcon />, path: '/doctors', color: healthcareColors.accent.main },
    { text: t('news'), icon: <NewsIcon />, path: '/news', color: healthcareColors.info },
    { text: t('users'), icon: <UsersIcon />, path: '/users', color: healthcareColors.primary.main },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangMenuClose = () => {
    setLangAnchorEl(null);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    handleLangMenuClose();
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const languageLabels: Record<Language, string> = {
    en: 'English',
    ar: 'العربية',
    he: 'עברית',
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${healthcareColors.neutral[50]} 0%, #ffffff 100%)`,
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: healthcareColors.neutral[200],
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2.5,
            background: gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.colored(healthcareColors.primary.main),
          }}
        >
          <ClinicIcon sx={{ color: 'white', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: gradients.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              fontSize: '1.35rem',
            }}
          >
            Adel Clinic
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: healthcareColors.neutral[500],
              fontWeight: 600,
              letterSpacing: '0.02em',
              fontSize: '0.85rem',
            }}
          >
            {t('adminPanel')}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 1.5,
                  bgcolor: active ? alpha(item.color, 0.12) : 'transparent',
                  color: active ? item.color : healthcareColors.neutral[700],
                  position: 'relative',
                  overflow: 'hidden',
                  flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                  '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    ...(direction === 'rtl' ? { right: 0 } : { left: 0 }),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: '60%',
                    borderRadius: direction === 'rtl' ? '4px 0 0 4px' : '0 4px 4px 0',
                    background: item.color,
                  } : {},
                  '&:hover': {
                    bgcolor: active ? alpha(item.color, 0.16) : healthcareColors.neutral[100],
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? item.color : healthcareColors.neutral[500],
                    minWidth: 36,
                    justifyContent: 'center',
                    order: direction === 'rtl' ? 2 : 0,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    textAlign: direction === 'rtl' ? 'right' : 'left',
                    order: direction === 'rtl' ? 1 : 0,
                    ...(direction === 'rtl' ? { mr: 0, ml: 1 } : { ml: 0 }),
                  }}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 600,
                    fontSize: '1rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: healthcareColors.neutral[200],
          background: healthcareColors.neutral[50],
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: healthcareColors.neutral[400],
            display: 'block',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          © 2024 Adel Clinic
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', direction }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ...(direction === 'rtl'
            ? { mr: { sm: `${drawerWidth}px` } }
            : { ml: { sm: `${drawerWidth}px` } }
          ),
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: healthcareColors.neutral[200],
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge={direction === 'rtl' ? 'end' : 'start'}
              onClick={handleDrawerToggle}
              sx={{
                display: { sm: 'none' },
                color: healthcareColors.neutral[700],
                ...(direction === 'rtl' ? { ml: 2 } : { mr: 2 })
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              sx={{
                color: healthcareColors.neutral[800],
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              {menuItems.find(item => isActive(item.path))?.text || t('dashboard')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Clinic Lock Toggle */}
            <Tooltip title={clinicStatus?.isLocked ? t('clinicLocked') : t('clinicOpen')}>
              <IconButton
                onClick={handleToggleClinicLock}
                sx={{
                  color: clinicStatus?.isLocked ? healthcareColors.error : healthcareColors.success,
                  '&:hover': {
                    bgcolor: alpha(clinicStatus?.isLocked ? healthcareColors.error : healthcareColors.success, 0.1),
                  },
                }}
              >
                {clinicStatus?.isLocked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>

            {/* Language Switcher */}
            <Tooltip title={t('language')}>
              <IconButton
                onClick={handleLangMenuOpen}
                sx={{
                  color: healthcareColors.neutral[600],
                  '&:hover': {
                    bgcolor: alpha(healthcareColors.primary.main, 0.1),
                    color: healthcareColors.primary.main,
                  },
                }}
              >
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={handleLangMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: shadows.lg,
                    border: `1px solid ${healthcareColors.neutral[200]}`,
                  },
                },
              }}
            >
              {(['en', 'ar', 'he'] as Language[]).map((lang) => (
                <MenuItem
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  selected={language === lang}
                  sx={{
                    minWidth: 140,
                    fontWeight: language === lang ? 600 : 400,
                    color: language === lang ? healthcareColors.primary.main : 'inherit',
                    bgcolor: language === lang ? alpha(healthcareColors.primary.main, 0.08) : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(healthcareColors.primary.main, 0.12),
                    },
                  }}
                >
                  {languageLabels[lang]}
                </MenuItem>
              ))}
            </Menu>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: healthcareColors.neutral[200] }} />

            {/* User Menu */}
            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                alt={user?.email || 'User'}
                src={user?.photoURL || undefined}
                sx={{
                  width: 38,
                  height: 38,
                  background: gradients.primary,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: shadows.sm,
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: shadows.lg,
                    border: `1px solid ${healthcareColors.neutral[200]}`,
                    minWidth: 200,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: healthcareColors.neutral[800] }}>
                  {user?.displayName || 'Admin'}
                </Typography>
                <Typography variant="caption" sx={{ color: healthcareColors.neutral[500] }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: healthcareColors.neutral[200] }} />
              <MenuItem
                onClick={handleSignOut}
                sx={{
                  py: 1.25,
                  '&:hover': {
                    bgcolor: alpha(healthcareColors.error, 0.08),
                  },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: healthcareColors.error }} />
                </ListItemIcon>
                <ListItemText
                  primary={t('logout')}
                  primaryTypographyProps={{
                    color: healthcareColors.error,
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          anchor={direction === 'rtl' ? 'right' : 'left'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          anchor={direction === 'rtl' ? 'right' : 'left'}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              ...(direction === 'rtl'
                ? { borderLeft: '1px solid', borderRight: 'none' }
                : { borderRight: '1px solid', borderLeft: 'none' }
              ),
              borderColor: healthcareColors.neutral[200],
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: healthcareColors.neutral[50],
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* Clinic Lock Confirmation Dialog */}
      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle>
          {clinicStatus?.isLocked ? t('unlockClinic') : t('lockClinic')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {clinicStatus?.isLocked ? t('unlockClinicConfirm') : t('lockClinicConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLockDialogOpen(false)}>{t('cancel')}</Button>
          <Button
            onClick={handleConfirmToggleLock}
            variant="contained"
            color={clinicStatus?.isLocked ? 'success' : 'error'}
          >
            {clinicStatus?.isLocked ? t('unlockClinic') : t('lockClinic')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New appointment toast notification */}
      <Snackbar
        open={latestNewAppointments.length > 0}
        onClose={dismissNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'rtl' ? 'left' : 'right' }}
        slots={{ transition: Slide }}
        sx={{ maxWidth: 380 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 0,
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(healthcareColors.warning, 0.3)}`,
            minWidth: 320,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: `linear-gradient(135deg, ${healthcareColors.warning}, #F59E0B)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AppointmentIcon sx={{ color: 'white', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                {t('newAppointmentRequest')}
              </Typography>
            </Box>
            <IconButton size="small" onClick={dismissNotification} sx={{ color: 'white', p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          {/* Body */}
          <Box sx={{ p: 2 }}>
            {latestNewAppointments.map((apt) => (
              <Box key={apt.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 18, color: healthcareColors.neutral[500] }} />
                  <Typography variant="body2" fontWeight={600}>
                    {apt.patientName || '—'}
                  </Typography>
                </Box>
                {apt.doctorName && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                    Dr. {apt.doctorName}
                  </Typography>
                )}
                {(apt.appointmentTime || apt.serviceType) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3.5 }}>
                    <TimeIcon sx={{ fontSize: 14, color: healthcareColors.neutral[400] }} />
                    <Typography variant="caption" color="text.secondary">
                      {[apt.appointmentTime, apt.serviceType].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      </Snackbar>
    </Box>
  );
};
