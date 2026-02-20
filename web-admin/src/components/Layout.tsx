import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EventNote as AppointmentIcon,
  HourglassEmpty as WaitingIcon,
  People as PatientsIcon,
  LocalHospital as DoctorsIcon,
  Article as NewsIcon,
  Person as UsersIcon,
  Logout as LogoutIcon,
  Public as LanguageIcon,
  MedicalServices as ClinicIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { healthcareColors, gradients, shadows } from '../theme/healthcareTheme';

const drawerWidth = 260;

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t, direction } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: t('dashboard'), icon: <DashboardIcon />, path: '/', color: healthcareColors.primary.main },
    { text: t('appointments'), icon: <AppointmentIcon />, path: '/appointments', color: healthcareColors.info },
    { text: t('waitingList'), icon: <WaitingIcon />, path: '/waiting-list', color: healthcareColors.warning },
    { text: t('patients'), icon: <PatientsIcon />, path: '/patients', color: healthcareColors.primary.main },
    { text: t('doctors'), icon: <DoctorsIcon />, path: '/doctors', color: healthcareColors.secondary.main },
    { text: t('news'), icon: <NewsIcon />, path: '/news', color: healthcareColors.accent.main },
    { text: t('users'), icon: <UsersIcon />, path: '/users', color: healthcareColors.neutral[600] },
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
            variant="h6"
            sx={{
              fontWeight: 700,
              background: gradients.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            Adel Clinic
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: healthcareColors.neutral[500],
              fontWeight: 500,
              letterSpacing: '0.02em',
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
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.9rem',
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
    </Box>
  );
};
