import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as AppointmentIcon,
  LocalHospital as DoctorIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  PersonOff as NoShowIcon,
} from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { healthcareColors, gradients } from '../theme/healthcareTheme';

interface AnalyticsData {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  completedToday: number;
  waitingListCount: number;
  recentPatients: number;
  appointmentsByStatus: {
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
    pending: number;
  };
  appointmentsByDoctor: Array<{
    doctorId: string;
    doctorName: string;
    count: number;
  }>;
}

// Modern glassmorphism stat card
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: number;
}> = ({ title, value, icon, gradient, subtitle, trend }) => (
  <Paper
    elevation={0}
    sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      },
    }}
  >
    {/* Gradient accent bar */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: gradient,
      }}
    />
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: '0.85rem',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              background: gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
              fontSize: '2.5rem',
            }}
          >
            {value.toLocaleString()}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Chip
              size="small"
              label={`${trend >= 0 ? '+' : ''}${trend}%`}
              sx={{
                mt: 1,
                height: 24,
                fontSize: '0.8rem',
                fontWeight: 700,
                bgcolor: trend >= 0 ? alpha(healthcareColors.success, 0.1) : alpha(healthcareColors.error, 0.1),
                color: trend >= 0 ? healthcareColors.success : healthcareColors.error,
              }}
            />
          )}
        </Box>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            background: gradient,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </Box>
  </Paper>
);

// Status item component with progress bar
const StatusItem: React.FC<{
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, total, color, icon }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(color, 0.1) }}>
            {React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>, { style: { fontSize: 20, color } })}
          </Avatar>
          <Typography variant="body1" fontWeight={600} fontSize="1rem">
            {label}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color }}>
          {value}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: alpha(color, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
};

export const Dashboard: React.FC = () => {
  const { getToken, user } = useAuth();
  const { t } = useLanguage();

  const { data: analytics, isLoading, error: analyticsError } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/analytics');
      return response.data;
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: trends, error: trendsError } = useQuery<Array<{ date: string; count: number }>>({
    queryKey: ['appointment-trends'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await apiClient.get('/analytics/trends?days=30');
      return response.data;
    },
    enabled: !!user,
    retry: 1,
  });

  const hasData = analytics && (
    analytics.totalPatients > 0 ||
    analytics.totalDoctors > 0 ||
    analytics.totalAppointments > 0
  );

  const totalStatusAppointments = analytics ? (
    (analytics.appointmentsByStatus?.scheduled || 0) +
    (analytics.appointmentsByStatus?.completed || 0) +
    (analytics.appointmentsByStatus?.cancelled || 0) +
    (analytics.appointmentsByStatus?.noShow || 0) +
    (analytics.appointmentsByStatus?.pending || 0)
  ) : 0;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('dashboard')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('welcomeMessage')}
        </Typography>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: healthcareColors.primary.main }} />
          <Typography color="text.secondary">{t('loadingDashboard')}</Typography>
        </Box>
      ) : analyticsError ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(healthcareColors.warning, 0.1)} 0%, ${alpha(healthcareColors.error, 0.05)} 100%)`,
            border: `1px solid ${alpha(healthcareColors.warning, 0.2)}`,
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            {t('failedToLoadAnalytics')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {analyticsError instanceof Error ? analyticsError.message : 'Unknown error occurred'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {trendsError instanceof Error ? trendsError.message : ''}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            <StatCard
              title={t('totalPatients')}
              value={analytics?.totalPatients || 0}
              icon={<PeopleIcon sx={{ color: 'white', fontSize: 28 }} />}
              gradient={gradients.primary}
              subtitle={t('registeredInSystem')}
            />
            <StatCard
              title={t('totalDoctors')}
              value={analytics?.totalDoctors || 0}
              icon={<DoctorIcon sx={{ color: 'white', fontSize: 28 }} />}
              gradient={gradients.success}
              subtitle={t('activePractitioners')}
            />
            <StatCard
              title={t('todayAppointments')}
              value={analytics?.todayAppointments || 0}
              icon={<TimeIcon sx={{ color: 'white', fontSize: 28 }} />}
              gradient={gradients.warning}
              subtitle={`${analytics?.completedToday || 0} ${t('completed')}`}
            />
            <StatCard
              title={t('upcoming')}
              value={analytics?.upcomingAppointments || 0}
              icon={<TrendingUpIcon sx={{ color: 'white', fontSize: 28 }} />}
              gradient={gradients.secondary}
              subtitle={t('scheduledAppointments')}
            />
          </Box>

          {/* Empty State */}
          {!hasData && (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                mb: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  background: gradients.primary,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                {t('getStarted')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {t('startByAdding')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { icon: '💉', text: t('addDoctorsAction') },
                  { icon: '👥', text: t('registerPatientsAction') },
                  { icon: '📅', text: t('scheduleAppointmentsAction') },
                  { icon: '📰', text: t('postHealthNews') },
                ].map((item, idx) => (
                  <Chip
                    key={idx}
                    label={`${item.icon} ${item.text}`}
                    sx={{
                      px: 1,
                      height: 36,
                      fontSize: '0.875rem',
                      bgcolor: alpha(healthcareColors.primary.main, 0.1),
                      color: healthcareColors.primary.main,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Charts Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
              gap: 3,
            }}
          >
            {/* Trends Chart */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${alpha(healthcareColors.primary.main, 0.15)}`,
                boxShadow: `0 8px 32px ${alpha(healthcareColors.primary.main, 0.12)}, 0 2px 8px rgba(0, 0, 0, 0.06)`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 12px 40px ${alpha(healthcareColors.primary.main, 0.18)}, 0 4px 12px rgba(0, 0, 0, 0.08)`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('appointmentTrends')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'block', fontWeight: 500 }}>
                {t('last30Days')}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={healthcareColors.primary.main} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={healthcareColors.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickLine={false}
                    axisLine={{ stroke: '#f0f0f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: 12,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={healthcareColors.primary.main}
                    strokeWidth={2}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>

            {/* Status Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${alpha(healthcareColors.accent.main, 0.15)}`,
                boxShadow: `0 8px 32px ${alpha(healthcareColors.accent.main, 0.12)}, 0 2px 8px rgba(0, 0, 0, 0.06)`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 12px 40px ${alpha(healthcareColors.accent.main, 0.18)}, 0 4px 12px rgba(0, 0, 0, 0.08)`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {t('appointmentStatus')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: 'block', fontWeight: 500 }}>
                {t('allTimeBreakdown')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <StatusItem
                  label={t('scheduled')}
                  value={analytics?.appointmentsByStatus?.scheduled || 0}
                  total={totalStatusAppointments}
                  color={healthcareColors.info}
                  icon={<AppointmentIcon />}
                />
                <StatusItem
                  label={t('completed')}
                  value={analytics?.appointmentsByStatus?.completed || 0}
                  total={totalStatusAppointments}
                  color={healthcareColors.success}
                  icon={<CheckIcon />}
                />
                <StatusItem
                  label={t('pending')}
                  value={analytics?.appointmentsByStatus?.pending || 0}
                  total={totalStatusAppointments}
                  color={healthcareColors.warning}
                  icon={<PendingIcon />}
                />
                <StatusItem
                  label={t('cancelled')}
                  value={analytics?.appointmentsByStatus?.cancelled || 0}
                  total={totalStatusAppointments}
                  color={healthcareColors.error}
                  icon={<CancelIcon />}
                />
                <StatusItem
                  label={t('noShow')}
                  value={analytics?.appointmentsByStatus?.noShow || 0}
                  total={totalStatusAppointments}
                  color="#64748b"
                  icon={<NoShowIcon />}
                />
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
};
