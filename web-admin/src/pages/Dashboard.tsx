import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as AppointmentIcon,
  LocalHospital as DoctorIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}> = ({ title, value, icon, color, highlight }) => (
  <Card sx={{
    border: highlight ? `2px solid ${color}` : 'none',
    boxShadow: highlight ? `0 0 10px ${color}40` : undefined,
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color: highlight ? color : 'inherit' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { getToken, user } = useAuth();

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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to Adel Clinic Admin Panel
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      ) : analyticsError ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3, bgcolor: '#fff3e0' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Failed to load analytics
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
            <StatCard
              title="Total Patients"
              value={analytics?.totalPatients || 0}
              icon={<PeopleIcon sx={{ color: 'white' }} />}
              color="#1976d2"
            />
            <StatCard
              title="Total Doctors"
              value={analytics?.totalDoctors || 0}
              icon={<DoctorIcon sx={{ color: 'white' }} />}
              color="#2e7d32"
            />
            <StatCard
              title="Today's Appointments"
              value={analytics?.todayAppointments || 0}
              icon={<AppointmentIcon sx={{ color: 'white' }} />}
              color="#ed6c02"
            />
            <StatCard
              title="Upcoming Appointments"
              value={analytics?.upcomingAppointments || 0}
              icon={<TrendingUpIcon sx={{ color: 'white' }} />}
              color="#9c27b0"
            />
          </Box>

          {!hasData && (
            <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom color="text.secondary">
                Get Started with Adel Clinic
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Start by adding doctors, patients, and scheduling appointments to see your clinic data here.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="primary">
                  💉 Add your first doctor
                </Typography>
                <Typography variant="body2" color="primary">
                  👥 Register patients
                </Typography>
                <Typography variant="body2" color="primary">
                  📅 Schedule appointments
                </Typography>
                <Typography variant="body2" color="primary">
                  📰 Post health news
                </Typography>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Appointment Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Appointment Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Scheduled</Typography>
                  <Typography fontWeight="bold">{analytics?.appointmentsByStatus?.scheduled || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Completed</Typography>
                  <Typography fontWeight="bold">{analytics?.appointmentsByStatus?.completed || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Cancelled</Typography>
                  <Typography fontWeight="bold">{analytics?.appointmentsByStatus?.cancelled || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>No-Show</Typography>
                  <Typography fontWeight="bold">{analytics?.appointmentsByStatus?.noShow || 0}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
};
