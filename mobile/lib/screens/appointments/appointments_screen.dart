import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../models/appointment.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/modern_card.dart';
import '../auth/login_screen.dart';
import '../booking/service_selection_screen.dart';

// Status colors matching web admin
class StatusColors {
  static const Color confirmed = Color(0xFF22C55E);
  static const Color scheduled = Color(0xFF3B82F6);
  static const Color pending = Color(0xFFF59E0B);
  static const Color cancelled = Color(0xFFEF4444);
  static const Color completed = Color(0xFF8B5CF6);
  static const Color noShow = Color(0xFF6B7280);
}

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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ServiceSelectionScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Book'),
        backgroundColor: AppTheme.primaryColor,
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
                      showCancelButton: true,
                      isPastTab: false,
                    ),
                    _PastAppointmentList(
                      appointments: appointmentProvider.pastAppointments,
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
  final bool showCancelButton;
  final bool isPastTab;

  const _AppointmentList({
    required this.appointments,
    required this.emptyMessage,
    required this.emptyIcon,
    this.showCancelButton = false,
    this.isPastTab = false,
  });

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingL),
              decoration: const BoxDecoration(
                color: AppTheme.surfaceMedium,
                shape: BoxShape.circle,
              ),
              child: Icon(
                emptyIcon,
                size: 48,
                color: AppTheme.textHint,
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              emptyMessage,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
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
          final Widget card = AppointmentCard(
            appointment: appointments[index],
            showCancelButton: showCancelButton,
          );

          return card
              .animate()
              .fadeIn(
                delay: Duration(milliseconds: 50 * index),
                duration: AppTheme.animMedium,
              )
              .slideX(begin: 0.05, end: 0);
        },
      ),
    );
  }
}

class _PastAppointmentList extends StatelessWidget {
  final List<Appointment> appointments;

  const _PastAppointmentList({
    required this.appointments,
  });

  void _showClearHistoryDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppTheme.radiusXL),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppTheme.spacingL),
              decoration: BoxDecoration(
                color: AppTheme.dividerColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingM),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.delete_forever,
                size: 32,
                color: AppTheme.errorColor,
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              'Delete Appointment History?',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              'This will permanently delete ${appointments.length} past appointment${appointments.length == 1 ? '' : 's'}. This action cannot be undone.',
              textAlign: TextAlign.center,
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      // Show loading indicator
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Row(
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(width: 12),
                              Text('Deleting history...'),
                            ],
                          ),
                          backgroundColor: AppTheme.primaryColor,
                          duration: Duration(seconds: 10),
                        ),
                      );

                      final deletedCount = await context.read<AppointmentProvider>().clearPastAppointments();

                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).hideCurrentSnackBar();

                      if (deletedCount > 0) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                                const SizedBox(width: 8),
                                Text('$deletedCount appointment(s) deleted'),
                              ],
                            ),
                            backgroundColor: AppTheme.successColor,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Row(
                              children: [
                                Icon(Icons.info_outline, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text('No appointments to delete'),
                              ],
                            ),
                            backgroundColor: AppTheme.warningColor,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.errorColor,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Delete History'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingL),
              decoration: const BoxDecoration(
                color: AppTheme.surfaceMedium,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.history,
                size: 48,
                color: AppTheme.textHint,
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              'No past appointments',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<AppointmentProvider>().loadAppointments(),
      child: CustomScrollView(
        slivers: [
          // Header with clear button
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppTheme.spacingM,
                AppTheme.spacingM,
                AppTheme.spacingM,
                0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${appointments.length} appointment${appointments.length == 1 ? '' : 's'}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  TextButton.icon(
                    onPressed: () => _showClearHistoryDialog(context),
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: const Text('Clear History'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppTheme.textSecondary,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Appointments list
          SliverPadding(
            padding: const EdgeInsets.all(AppTheme.spacingM),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final Widget card = AppointmentCard(
                    appointment: appointments[index],
                    showCancelButton: false,
                  );

                  return card
                      .animate()
                      .fadeIn(
                        delay: Duration(milliseconds: 50 * index),
                        duration: AppTheme.animMedium,
                      )
                      .slideX(begin: 0.05, end: 0);
                },
                childCount: appointments.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AppointmentCard extends StatelessWidget {
  final Appointment appointment;
  final bool showCancelButton;

  const AppointmentCard({
    super.key,
    required this.appointment,
    this.showCancelButton = false,
  });

  Color _getStatusColor() {
    switch (appointment.status.toLowerCase()) {
      case 'confirmed':
        return StatusColors.confirmed;
      case 'scheduled':
        return StatusColors.scheduled;
      case 'pending':
        return StatusColors.pending;
      case 'cancelled':
        return StatusColors.cancelled;
      case 'completed':
        return StatusColors.completed;
      case 'no-show':
        return StatusColors.noShow;
      default:
        return AppTheme.textSecondary;
    }
  }

  String _getLocalizedDoctorName(BuildContext context, DoctorProvider doctorProvider) {
    if (doctorProvider.doctors.isEmpty) return appointment.doctorName ?? 'Doctor';

    final doctor = doctorProvider.doctors.where((d) => d.id == appointment.doctorId).firstOrNull;
    if (doctor == null) return appointment.doctorName ?? 'Doctor';

    final locale = Localizations.localeOf(context);
    if (locale.languageCode == 'en' && doctor.fullNameEn != null) {
      return doctor.fullNameEn!;
    } else if (locale.languageCode == 'he' && doctor.fullNameHe != null) {
      return doctor.fullNameHe!;
    }
    return doctor.fullName;
  }

  String _getDoctorInitials(BuildContext context, DoctorProvider doctorProvider) {
    final name = _getLocalizedDoctorName(context, doctorProvider);
    if (name.isEmpty) return 'D';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEE, MMM d, yyyy');
    final doctorProvider = context.watch<DoctorProvider>();
    final statusColor = _getStatusColor();
    final doctorName = _getLocalizedDoctorName(context, doctorProvider);

    return ModernCard(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status bar header
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingM,
              vertical: AppTheme.spacingS,
            ),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusL),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Date and Time
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_rounded,
                      size: 16,
                      color: statusColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      dateFormat.format(appointment.appointmentDate),
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                _StatusBadge(status: appointment.status),
              ],
            ),
          ),

          // Main content
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingM),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Time slot
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingS,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.primaryColor.withValues(alpha: 0.15),
                        AppTheme.primaryColor.withValues(alpha: 0.05),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(AppTheme.radiusS),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 16,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        appointment.appointmentTime,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppTheme.spacingM),

                // Doctor info row
                Row(
                  children: [
                    // Doctor avatar with gradient
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            statusColor.withValues(alpha: 0.2),
                            statusColor.withValues(alpha: 0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                        border: Border.all(
                          color: statusColor.withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          _getDoctorInitials(context, doctorProvider),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                            fontSize: 18,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingM),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doctorName,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          if (appointment.serviceType.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(
                                  Icons.medical_services_outlined,
                                  size: 14,
                                  color: AppTheme.textHint,
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    appointment.serviceType,
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: AppTheme.textSecondary,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                // Pending notice
                if (appointment.status.toLowerCase() == 'pending') ...[
                  const SizedBox(height: AppTheme.spacingM),
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacingS),
                    decoration: BoxDecoration(
                      color: StatusColors.pending.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                      border: Border.all(
                        color: StatusColors.pending.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.schedule_rounded,
                          size: 16,
                          color: StatusColors.pending,
                        ),
                        const SizedBox(width: AppTheme.spacingXS),
                        Expanded(
                          child: Text(
                            'Awaiting clinic confirmation',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: StatusColors.pending,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Notes if available
                if (appointment.notes != null && appointment.notes!.isNotEmpty) ...[
                  const SizedBox(height: AppTheme.spacingS),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppTheme.spacingS),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceMedium,
                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.note_outlined,
                          size: 16,
                          color: AppTheme.textHint,
                        ),
                        const SizedBox(width: AppTheme.spacingXS),
                        Expanded(
                          child: Text(
                            appointment.notes!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Cancel button for upcoming appointments
                if (showCancelButton && _canCancel()) ...[
                  const SizedBox(height: AppTheme.spacingM),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _showCancelBottomSheet(context),
                      icon: const Icon(Icons.event_busy_rounded, size: 18),
                      label: const Text('Cancel Appointment'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: StatusColors.cancelled.withValues(alpha: 0.1),
                        foregroundColor: StatusColors.cancelled,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppTheme.radiusM),
                          side: BorderSide(
                            color: StatusColors.cancelled.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _canCancel() {
    final cancellableStatuses = ['scheduled', 'confirmed', 'pending'];
    return cancellableStatuses.contains(appointment.status.toLowerCase());
  }

  void _showCancelBottomSheet(BuildContext context) {
    final dateFormat = DateFormat('EEEE, MMMM d, yyyy');

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppTheme.radiusXL),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppTheme.spacingL),
              decoration: BoxDecoration(
                color: AppTheme.dividerColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Icon
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingM),
              decoration: BoxDecoration(
                color: StatusColors.cancelled.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.event_busy_rounded,
                size: 36,
                color: StatusColors.cancelled,
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),

            // Title
            Text(
              'Cancel Appointment?',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingS),

            // Appointment details card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppTheme.spacingM),
              margin: const EdgeInsets.symmetric(vertical: AppTheme.spacingS),
              decoration: BoxDecoration(
                color: AppTheme.surfaceMedium,
                borderRadius: BorderRadius.circular(AppTheme.radiusM),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 18,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          dateFormat.format(appointment.appointmentDate),
                          style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 18,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        appointment.appointmentTime,
                        style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            Text(
              'This action cannot be undone. You will need to book a new appointment if you change your mind.',
              textAlign: TextAlign.center,
              style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                      ),
                    ),
                    child: const Text('Keep Appointment'),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final appointmentProvider = context.read<AppointmentProvider>();
                      final success = await appointmentProvider.cancelAppointment(
                        appointment.id ?? '',
                      );
                      if (context.mounted) {
                        if (success) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Row(
                                children: [
                                  Icon(Icons.check_circle, color: Colors.white, size: 20),
                                  SizedBox(width: 8),
                                  Text('Appointment cancelled'),
                                ],
                              ),
                              backgroundColor: StatusColors.confirmed,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: Colors.white, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      appointmentProvider.errorMessage ?? 'Failed to cancel',
                                    ),
                                  ),
                                ],
                              ),
                              backgroundColor: StatusColors.cancelled,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: StatusColors.cancelled,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                      ),
                    ),
                    child: const Text('Cancel Appointment'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
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
        color = StatusColors.confirmed;
        icon = Icons.check_circle_rounded;
        break;
      case 'scheduled':
        color = StatusColors.scheduled;
        icon = Icons.event_rounded;
        break;
      case 'pending':
        color = StatusColors.pending;
        icon = Icons.schedule_rounded;
        break;
      case 'cancelled':
        color = StatusColors.cancelled;
        icon = Icons.cancel_rounded;
        break;
      case 'completed':
        color = StatusColors.completed;
        icon = Icons.task_alt_rounded;
        break;
      case 'no-show':
        color = StatusColors.noShow;
        icon = Icons.person_off_rounded;
        break;
      default:
        color = AppTheme.textSecondary;
        icon = Icons.info_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingS,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppTheme.radiusRound),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            _formatStatus(status),
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatStatus(String status) {
    return status
        .split('-')
        .map((word) => word.isNotEmpty ? '${word[0].toUpperCase()}${word.substring(1)}' : '')
        .join(' ');
  }
}
