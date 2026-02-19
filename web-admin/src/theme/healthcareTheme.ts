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

// Core healthcare color palette - matching mobile app theme
export const healthcareColors = {
  // Primary colors - deep rich teal (matching mobile)
  primary: {
    main: '#0F766E',      // Deep teal - matches mobile primaryColor
    light: '#0D9488',     // Lighter teal - matches mobile primaryLight
    dark: '#115E59',      // Darker teal - matches mobile primaryDark
    surface: '#CCFBF1',   // Teal surface tint - matches mobile primarySurface
    contrastText: '#ffffff',
  },
  // Secondary - matches primary for consistency
  secondary: {
    main: '#0D9488',
    light: '#14B8A6',
    dark: '#0F766E',
    contrastText: '#ffffff',
  },
  // Accent - soft purple (matching mobile)
  accent: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  // Semantic colors (matching mobile)
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3b82f6',

  // Neutral palette - warm beige tones (matching mobile)
  neutral: {
    50: '#FFFDF9',        // cardBackground - warm off-white
    100: '#F7F3EE',       // surfaceLight - warm beige
    200: '#F0EBE3',       // surfaceMedium - slightly darker beige
    300: '#E5DFD5',       // dividerColor - warm beige divider
    400: '#94a3b8',       // textHint
    500: '#64748b',
    600: '#475569',       // textSecondary
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',       // textPrimary
  },

  // Background colors - warm beige palette (matching mobile)
  background: {
    default: '#F7F3EE',   // surfaceLight - warm beige background
    paper: '#FFFDF9',     // cardBackground - warm off-white
    glass: 'rgba(255, 253, 249, 0.92)',
    surface: '#F0EBE3',   // surfaceMedium
  },
};

// Gradient presets - matching mobile app theme
export const gradients = {
  primary: 'linear-gradient(135deg, #0D9488 0%, #115E59 100%)',    // Deep teal gradient
  header: 'linear-gradient(180deg, #0F766E 0%, #115E59 100%)',     // Header gradient (matching mobile)
  secondary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  success: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  info: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  // Special gradients
  tealToGreen: 'linear-gradient(135deg, #0F766E 0%, #22C55E 100%)',
  purpleToBlue: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
  sunsetWarm: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  // Subtle background gradients
  subtlePrimary: 'linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(17, 94, 89, 0.05) 100%)',
  subtleAccent: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
  // Warm beige background gradient
  warmBeige: 'linear-gradient(180deg, #F7F3EE 0%, #F0EBE3 100%)',
};

// Glassmorphism styles - warm beige tones
export const glassStyles = {
  card: {
    background: '#FFFDF9',                          // Warm off-white
    backdropFilter: 'blur(20px)',
    border: '1px solid #E5DFD5',                    // Warm beige border
    borderRadius: 16,
  },
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(15, 118, 110, 0.08)',  // Teal-tinted shadow
  },
  panel: {
    background: 'rgba(255, 253, 249, 0.92)',
    backdropFilter: 'blur(16px)',
    border: '1px solid #E5DFD5',
    borderRadius: 16,
  },
  overlay: {
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(8px)',
  },
  // Modern dialog styling
  dialog: {
    background: '#FFFDF9',
    borderRadius: '16px',
    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.15)',
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

// Status colors for appointments/medical records (matching mobile)
export const statusColors = {
  scheduled: {
    color: '#0F766E',                               // Primary teal
    bg: '#CCFBF1',                                  // Primary surface
    gradient: gradients.primary,
  },
  completed: {
    color: '#22C55E',                               // Success green
    bg: '#DCFCE7',                                  // Success light
    gradient: gradients.success,
  },
  pending: {
    color: '#F59E0B',                               // Warning amber
    bg: '#FEF3C7',                                  // Warning light
    gradient: gradients.warning,
  },
  cancelled: {
    color: '#EF4444',                               // Error red
    bg: '#FEE2E2',                                  // Error light
    gradient: gradients.error,
  },
  'no-show': {
    color: '#475569',                               // Text secondary
    bg: '#F0EBE3',                                  // Surface medium
    gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
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

// Border radius scale (matching mobile app)
export const borderRadius = {
  xs: 4,      // radiusXS
  sm: 8,      // radiusS
  md: 12,     // radiusM
  lg: 16,     // radiusL
  xl: 24,     // radiusXL
  full: 100,  // radiusRound
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
