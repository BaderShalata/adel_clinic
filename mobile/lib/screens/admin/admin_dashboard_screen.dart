import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../models/appointment.dart';

class AdminDashboardScreen extends StatefulWidget {
  final void Function(int)? onSwitchTab;

  const AdminDashboardScreen({super.key, this.onSwitchTab});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  int _todayAppointments = 0;
  int _pendingAppointments = 0;
  int _completedToday = 0;
  int _totalPatients = 0;
  int _totalDoctors = 0;
  int _waitingListCount = 0;
  List<Appointment> _upcomingAppointments = [];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load stats in parallel
      final results = await Future.wait([
        _apiService.getAllAppointments(date: DateTime.now()),
        _apiService.getAllAppointments(status: 'pending'),
        _apiService.getAllPatients(),
        _apiService.getDoctors(),
        _apiService.getAllWaitingList(),
      ]);

      final todayAppts = results[0] as List<Appointment>;
      final pendingAppts = results[1] as List<Appointment>;

      setState(() {
        _todayAppointments = todayAppts.length;
        _completedToday = todayAppts.where((a) => a.status == 'completed').length;
        _pendingAppointments = pendingAppts.length;
        _totalPatients = (results[2] as List).length;
        _totalDoctors = (results[3] as List).length;
        _waitingListCount = (results[4] as List).length;
        _upcomingAppointments = todayAppts
            .where((a) => a.status == 'scheduled' || a.status == 'pending')
            .take(5)
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppTheme.spacingM),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppTheme.spacingM),

            // Stats cards
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'Today\'s Appointments',
                    value: _isLoading ? '-' : _todayAppointments.toString(),
                    icon: Icons.calendar_today,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: _StatCard(
                    title: 'Pending Approval',
                    value: _isLoading ? '-' : _pendingAppointments.toString(),
                    icon: Icons.pending_actions,
                    color: AppTheme.warningColor,
                    highlight: _pendingAppointments > 0,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingM),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'Completed Today',
                    value: _isLoading ? '-' : _completedToday.toString(),
                    icon: Icons.check_circle,
                    color: AppTheme.accentColor,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: _StatCard(
                    title: 'Waiting List',
                    value: _isLoading ? '-' : _waitingListCount.toString(),
                    icon: Icons.hourglass_empty,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingM),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'Total Patients',
                    value: _isLoading ? '-' : _totalPatients.toString(),
                    icon: Icons.people,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: _StatCard(
                    title: 'Doctors',
                    value: _isLoading ? '-' : _totalDoctors.toString(),
                    icon: Icons.medical_services,
                    color: AppTheme.successColor,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppTheme.spacingXL),

            // Upcoming appointments
            if (_upcomingAppointments.isNotEmpty) ...[
              Text(
                'Upcoming Today',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppTheme.spacingM),
              ..._upcomingAppointments.map((apt) => Card(
                margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: apt.status == 'pending'
                        ? AppTheme.warningColor.withValues(alpha: 0.1)
                        : AppTheme.primaryColor.withValues(alpha: 0.1),
                    child: Icon(
                      apt.status == 'pending' ? Icons.pending_actions : Icons.event,
                      color: apt.status == 'pending' ? AppTheme.warningColor : AppTheme.primaryColor,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    apt.patientName ?? 'Patient',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text('${apt.appointmentTime} • ${apt.serviceType}'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: apt.status == 'pending'
                          ? AppTheme.warningColor.withValues(alpha: 0.1)
                          : AppTheme.successColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      apt.status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: apt.status == 'pending' ? AppTheme.warningColor : AppTheme.successColor,
                      ),
                    ),
                  ),
                ),
              )),
              const SizedBox(height: AppTheme.spacingM),
            ],

            // Quick actions
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppTheme.spacingM),
            _QuickActionTile(
              icon: Icons.pending_actions,
              title: 'Review Pending',
              subtitle: 'Confirm or reject pending appointments',
              badge: _pendingAppointments > 0 ? _pendingAppointments.toString() : null,
              onTap: () => widget.onSwitchTab?.call(1), // Appointments tab
            ),
            _QuickActionTile(
              icon: Icons.add_circle_outline,
              title: 'New Appointment',
              subtitle: 'Create a new appointment',
              onTap: () => widget.onSwitchTab?.call(1), // Appointments tab
            ),
            _QuickActionTile(
              icon: Icons.person_add_outlined,
              title: 'Add Patient',
              subtitle: 'Register a new patient',
              onTap: () => widget.onSwitchTab?.call(2), // Patients tab
            ),
            _QuickActionTile(
              icon: Icons.hourglass_empty,
              title: 'Waiting List',
              subtitle: 'View and manage waiting list',
              badge: _waitingListCount > 0 ? _waitingListCount.toString() : null,
              onTap: () => widget.onSwitchTab?.call(4), // Waiting List tab
            ),
            _QuickActionTile(
              icon: Icons.medical_services_outlined,
              title: 'Manage Doctors',
              subtitle: 'Add or edit doctor profiles',
              onTap: () => widget.onSwitchTab?.call(3), // Doctors tab
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final bool highlight;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        border: highlight ? Border.all(color: color, width: 2) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: highlight ? color : null,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? badge;

  const _QuickActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
      child: ListTile(
        leading: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: AppTheme.primaryColor),
            ),
            if (badge != null)
              Positioned(
                right: -8,
                top: -8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    badge!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
