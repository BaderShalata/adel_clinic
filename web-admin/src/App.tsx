import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { WaitingList } from './pages/WaitingList';
import { Patients } from './pages/Patients';
import { Doctors } from './pages/Doctors';
import { News } from './pages/News';
import { Users } from './pages/Users';

const queryClient = new QueryClient();

const getTheme = (direction: 'ltr' | 'rtl') => createTheme({
  direction,
  palette: {
    primary: {
      main: '#0D9488', // Teal - medical/clinic feel
      light: '#14B8A6',
      dark: '#0F766E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
    },
    success: {
      main: '#22C55E',
      light: '#4ADE80',
      dark: '#16A34A',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Noto Sans Arabic", "Noto Sans Hebrew", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.625rem',
      lineHeight: 1.35,
      letterSpacing: '-0.005em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.375rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.2rem',
      lineHeight: 1.45,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '1.0625rem',
      lineHeight: 1.5,
      letterSpacing: '0.005em',
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      letterSpacing: '0.005em',
    },
    body1: {
      fontWeight: 500,
      fontSize: '1.0625rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.9375rem',
      letterSpacing: '0.02em',
      textTransform: 'none' as const,
    },
    caption: {
      fontWeight: 500,
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
    },
    overline: {
      fontWeight: 700,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          gap: 6,
        },
        startIcon: {
          marginLeft: direction === 'rtl' ? 4 : -4,
          marginRight: direction === 'rtl' ? -4 : 8,
        },
        endIcon: {
          marginLeft: direction === 'rtl' ? -4 : 8,
          marginRight: direction === 'rtl' ? 4 : -4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            backgroundColor: '#F1F5F9',
            color: '#475569',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          gap: 4,
        },
        icon: {
          // Fix icon positioning in RTL - use margin-inline for logical properties
          marginLeft: direction === 'rtl' ? -2 : 5,
          marginRight: direction === 'rtl' ? 6 : -2,
        },
        label: {
          paddingLeft: direction === 'rtl' ? 8 : 12,
          paddingRight: direction === 'rtl' ? 12 : 8,
        },
      },
    },
    MuiStack: {
      defaultProps: {
        useFlexGap: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          direction: direction,
        },
        input: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          direction: direction,
          '&::placeholder': {
            textAlign: direction === 'rtl' ? 'right' : 'left',
            direction: direction,
          },
          '&::-webkit-input-placeholder': {
            textAlign: direction === 'rtl' ? 'right' : 'left',
            direction: direction,
          },
          '&::-moz-placeholder': {
            textAlign: direction === 'rtl' ? 'right' : 'left',
            direction: direction,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          direction: direction,
        },
        input: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          direction: direction,
          '&::placeholder': {
            textAlign: direction === 'rtl' ? 'right' : 'left',
            direction: direction,
          },
        },
        notchedOutline: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          left: direction === 'rtl' ? 'auto' : 0,
          right: direction === 'rtl' ? 28 : 'auto',
          transformOrigin: direction === 'rtl' ? 'top right' : 'top left',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          paddingRight: direction === 'rtl' ? '14px !important' : '32px !important',
          paddingLeft: direction === 'rtl' ? '48px !important' : '14px !important',
        },
        icon: {
          right: direction === 'rtl' ? 'auto' : 7,
          left: direction === 'rtl' ? 7 : 'auto',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        input: {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          paddingLeft: direction === 'rtl' ? '48px !important' : undefined,
          paddingRight: direction === 'rtl' ? '14px !important' : undefined,
        },
        inputRoot: {
          direction: direction,
          paddingLeft: direction === 'rtl' ? '48px !important' : undefined,
          paddingRight: direction === 'rtl' ? '9px !important' : undefined,
        },
        endAdornment: {
          right: direction === 'rtl' ? 'auto' : 9,
          left: direction === 'rtl' ? 9 : 'auto',
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          // Maintain visual order in RTL by not reversing
          flexDirection: 'row',
          direction: 'ltr',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.35rem',
          fontWeight: 700,
          padding: '20px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
        },
      },
    },
  },
});

function ThemedApp() {
  const { direction } = useLanguage();

  const theme = useMemo(() => getTheme(direction), [direction]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="waiting-list" element={<WaitingList />} />
              <Route path="patients" element={<Patients />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="news" element={<News />} />
              <Route path="users" element={<Users />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemedApp />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
