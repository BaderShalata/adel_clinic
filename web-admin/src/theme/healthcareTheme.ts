/**
 * Healthcare-optimized UI Theme
 * Based on UI/UX Pro Max design principles for healthcare applications
 *
 * Design Philosophy:
 * - Calming, trust-building colors (teals, soft blues)
 * - Clean, accessible typography
 * - Glassmorphism for modern feel
 * - High contrast for readability
 * - Professional, clinical aesthetic
 */

// Core healthcare color palette
export const healthcareColors = {
  // Primary colors - calming teals
  primary: {
    main: '#0891b2',
    light: '#22d3ee',
    dark: '#0e7490',
    contrastText: '#ffffff',
  },
  // Secondary - healthcare green
  secondary: {
    main: '#0d9488',
    light: '#2dd4bf',
    dark: '#0f766e',
    contrastText: '#ffffff',
  },
  // Accent - soft purple
  accent: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Neutral palette
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Background colors
  background: {
    default: '#f8fafc',
    paper: 'rgba(255, 255, 255, 0.9)',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
};

// Gradient presets
export const gradients = {
  primary: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
  secondary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
  info: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  // Special gradients
  tealToGreen: 'linear-gradient(135deg, #0891b2 0%, #10b981 100%)',
  purpleToBlue: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
  sunsetWarm: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  // Subtle background gradients
  subtlePrimary: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(13, 148, 136, 0.05) 100%)',
  subtleAccent: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
};

// Glassmorphism styles
export const glassStyles = {
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
  },
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  },
  panel: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  overlay: {
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
  },
  // Modern dialog styling - smaller radius to prevent cropping
  dialog: {
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
    border: 'none',
  },
};

// Modern input field styles
export const inputStyles = {
  outlined: {
    borderRadius: 6,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.12)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.24)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 1.5,
    },
  },
  filled: {
    borderRadius: 6,
    bgcolor: 'rgba(0, 0, 0, 0.04)',
    '&:hover': {
      bgcolor: 'rgba(0, 0, 0, 0.06)',
    },
    '&.Mui-focused': {
      bgcolor: 'rgba(0, 0, 0, 0.06)',
    },
  },
};

// Shadow presets
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  colored: (color: string) => `0 8px 24px ${color}40`,
  glow: (color: string) => `0 0 20px ${color}30`,
};

// Animation presets
export const animations = {
  transition: {
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  hover: {
    lift: {
      transform: 'translateY(-4px)',
      boxShadow: shadows.xl,
    },
    scale: {
      transform: 'scale(1.02)',
    },
    glow: (color: string) => ({
      boxShadow: shadows.glow(color),
    }),
  },
};

// Status colors for appointments/medical records
export const statusColors = {
  scheduled: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    gradient: gradients.info,
  },
  completed: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    gradient: gradients.success,
  },
  pending: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    gradient: gradients.warning,
  },
  cancelled: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    gradient: gradients.error,
  },
  'no-show': {
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.1)',
    gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
  },
};

// Typography styles
export const typography = {
  heading: {
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subheading: {
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  body: {
    fontWeight: 400,
    lineHeight: 1.6,
  },
  caption: {
    fontWeight: 500,
    letterSpacing: '0.02em',
    fontSize: '0.75rem',
  },
  overline: {
    fontWeight: 600,
    letterSpacing: '0.08em',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius scale
export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Helper function to get status styles
export const getStatusStyles = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || statusColors['no-show'];
};

// Helper function to create alpha color
export const withAlpha = (color: string, alpha: number) => {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Export default theme object
export const healthcareTheme = {
  colors: healthcareColors,
  gradients,
  glassStyles,
  shadows,
  animations,
  statusColors,
  typography,
  spacing,
  borderRadius,
  inputStyles,
  getStatusStyles,
  withAlpha,
};

export default healthcareTheme;
