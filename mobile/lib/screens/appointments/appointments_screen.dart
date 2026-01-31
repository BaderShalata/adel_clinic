import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../models/appointment.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';
import '../auth/login_screen.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(() {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isLoggedIn) {
        context.read<AppointmentProvider>().loadAppointments();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final appointmentProvider = context.watch<AppointmentProvider>();

    // If not logged in, show login prompt
    if (!authProvider.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('My Appointments'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacingL),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacingL),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.calendar_today,
                    size: 64,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingL),
                Text(
                  'Sign in to view your appointments',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppTheme.spacingS),
                Text(
                  'Track your upcoming appointments and view your medical history',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppTheme.spacingXL),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  child: const Text('Sign In'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: appointmentProvider.isLoading
          ? const LoadingIndicator(message: 'Loading appointments...')
          : appointmentProvider.errorMessage != null
              ? ErrorView(
                  message: appointmentProvider.errorMessage!,
                  onRetry: () => appointmentProvider.loadAppointments(),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _AppointmentList(
                      appointments: appointmentProvider.upcomingAppointments,
                      emptyMessage: 'No upcoming appointments',
                      emptyIcon: Icons.event_available,
                    ),
                    _AppointmentList(
                      appointments: appointmentProvider.pastAppointments,
                      emptyMessage: 'No past appointments',
                      emptyIcon: Icons.history,
                    ),
                  ],
                ),
    );
  }
}

class _AppointmentList extends StatelessWidget {
  final List<Appointment> appointments;
  final String emptyMessage;
  final IconData emptyIcon;

  const _AppointmentList({
    required this.appointments,
    required this.emptyMessage,
    required this.emptyIcon,
  });

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              emptyIcon,
              size: 64,
              color: AppTheme.textHint,
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              emptyMessage,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<AppointmentProvider>().loadAppointments(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spacingM),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          return AppointmentCard(appointment: appointments[index]);
        },
      ),
    );
  }
}

class AppointmentCard extends StatelessWidget {
  final Appointment appointment;

  const AppointmentCard({super.key, required this.appointment});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEEE, MMMM d, yyyy');
    final doctorProvider = context.watch<DoctorProvider>();

    // Find doctor name from provider if available
    String doctorName = 'Doctor';
    if (doctorProvider.doctors.isNotEmpty) {
      final doctor = doctorProvider.doctors.where(
        (d) => d.id == appointment.doctorId,
      ).firstOrNull;
      if (doctor != null) {
        doctorName = doctor.fullNameEn ?? doctor.fullName;
      }
    }

    return ModernCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status badge and time
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatusBadge(status: appointment.status),
              Text(
                appointment.appointmentTime,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppTheme.primaryColor,
                    ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingM),

          // Date
          Row(
            children: [
              const Icon(
                Icons.calendar_today,
                size: 18,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(width: AppTheme.spacingS),
              Text(
                dateFormat.format(appointment.appointmentDate),
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingS),

          // Doctor
          Row(
            children: [
              const Icon(
                Icons.person,
                size: 18,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(width: AppTheme.spacingS),
              Expanded(
                child: Text(
                  'Dr. $doctorName',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
            ],
          ),

          // Notes if available
          if (appointment.notes != null && appointment.notes!.isNotEmpty) ...[
            const SizedBox(height: AppTheme.spacingM),
            const Divider(),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              'Notes: ${appointment.notes}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'confirmed':
        color = AppTheme.successColor;
        icon = Icons.check_circle;
        break;
      case 'pending':
        color = AppTheme.warningColor;
        icon = Icons.schedule;
        break;
      case 'cancelled':
        color = AppTheme.errorColor;
        icon = Icons.cancel;
        break;
      case 'completed':
        color = AppTheme.accentColor;
        icon = Icons.task_alt;
        break;
      default:
        color = AppTheme.textSecondary;
        icon = Icons.info;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingS,
        vertical: AppTheme.spacingXS,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppTheme.radiusS),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: AppTheme.spacingXS),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
