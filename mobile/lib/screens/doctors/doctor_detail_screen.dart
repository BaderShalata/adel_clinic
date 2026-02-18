import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/service_utils.dart';
import '../../widgets/common/modern_card.dart';
import '../auth/login_screen.dart';
import '../booking/slot_selection_screen.dart';
import '../admin/doctor_form_screen.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({
    super.key,
    required this.doctorId,
  });

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<DoctorProvider>().loadDoctorDetails(widget.doctorId);
      context.read<DoctorProvider>().loadWeeklySchedule(widget.doctorId);
    });
  }

  String _getLocalizedName(BuildContext context) {
    final doctor = context.read<DoctorProvider>().selectedDoctor;
    if (doctor == null) return '';

    final locale = Localizations.localeOf(context);
    if (locale.languageCode == 'en' && doctor.fullNameEn != null && doctor.fullNameEn!.isNotEmpty) {
      return doctor.fullNameEn!;
    } else if (locale.languageCode == 'he' && doctor.fullNameHe != null && doctor.fullNameHe!.isNotEmpty) {
      return doctor.fullNameHe!;
    }
    return doctor.fullName;
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'D';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  void _handleBookAppointment() {
    final authProvider = context.read<AuthProvider>();
    final doctorProvider = context.read<DoctorProvider>();
    final bookingProvider = context.read<BookingProvider>();
    final doctor = doctorProvider.selectedDoctor;

    if (doctor == null) return;

    // Check if logged in
    if (!authProvider.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.info_outline, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text('Please sign in to book an appointment'),
            ],
          ),
          backgroundColor: AppTheme.warningColor,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Sign In',
            textColor: Colors.white,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
          ),
        ),
      );
      return;
    }

    // If doctor has multiple specialties, let user pick
    if (doctor.specialties.length > 1) {
      _showServiceSelectionSheet(doctor, bookingProvider);
    } else if (doctor.specialties.isNotEmpty) {
      // Single specialty, proceed directly
      _navigateToSlotSelection(bookingProvider, doctor, doctor.specialties.first);
    } else {
      // No specialties defined
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No services available for this doctor'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showServiceSelectionSheet(doctor, BookingProvider bookingProvider) {
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
            Text(
              'Select Service',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              'Choose the type of consultation',
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),
            ...doctor.specialties.map<Widget>((specialty) {
              return Container(
                margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
                child: ListTile(
                  onTap: () {
                    Navigator.pop(ctx);
                    _navigateToSlotSelection(bookingProvider, doctor, specialty);
                  },
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusM),
                    side: BorderSide(color: AppTheme.dividerColor),
                  ),
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                    ),
                    child: const Icon(
                      Icons.medical_services_outlined,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  title: Text(
                    specialty,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  trailing: const Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: AppTheme.textHint,
                  ),
                ),
              );
            }),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
      ),
    );
  }

  void _navigateToSlotSelection(BookingProvider bookingProvider, doctor, String service) {
    // Preselect the doctor and service
    bookingProvider.preselectDoctor(doctor, service: service);

    // Navigate to slot selection
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SlotSelectionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final doctorProvider = context.watch<DoctorProvider>();
    final doctor = doctorProvider.selectedDoctor;
    final displayName = _getLocalizedName(context);

    if (doctorProvider.isLoading || doctor == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Doctor Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      body: CustomScrollView(
        slivers: [
          // Custom App Bar with doctor header
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Doctor avatar - show image if available
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppTheme.radiusL),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: doctor.imageUrl != null && doctor.imageUrl!.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: doctor.imageUrl!,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Center(
                                  child: Text(
                                    _getInitials(displayName),
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryColor,
                                    ),
                                  ),
                                ),
                                errorWidget: (context, url, error) => Center(
                                  child: Text(
                                    _getInitials(displayName),
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryColor,
                                    ),
                                  ),
                                ),
                              )
                            : Center(
                                child: Text(
                                  _getInitials(displayName),
                                  style: const TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                      ),
                      const SizedBox(height: AppTheme.spacingM),
                      Text(
                        displayName,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (doctor.fullNameHe != null && doctor.fullNameEn != null)
                        Text(
                          doctor.fullNameHe!,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                          textDirection: TextDirection.rtl,
                        ),
                    ],
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              if (context.watch<AuthProvider>().isAdmin)
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.white),
                  tooltip: 'Edit Doctor',
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DoctorFormScreen(doctor: doctor),
                      ),
                    );
                  },
                ),
            ],
          ),

          // Content
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Specialties Section
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingM),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(AppTheme.radiusS),
                            ),
                            child: const Icon(
                              Icons.medical_services_outlined,
                              color: AppTheme.primaryColor,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacingS),
                          Text(
                            'Specialties',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingM),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: doctor.specialties
                            .map(
                              (spec) => Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppTheme.spacingM,
                                  vertical: AppTheme.spacingS,
                                ),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppTheme.primaryColor.withValues(alpha: 0.15),
                                      AppTheme.primaryColor.withValues(alpha: 0.05),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(AppTheme.radiusRound),
                                  border: Border.all(
                                    color: AppTheme.primaryColor.withValues(alpha: 0.2),
                                  ),
                                ),
                                child: Text(
                                  spec,
                                  style: const TextStyle(
                                    color: AppTheme.primaryDark,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: AppTheme.animMedium).slideY(begin: 0.1, end: 0),

                // Bio Section
                if (doctor.bio != null && doctor.bio!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
                    child: ModernCard(
                      margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.purple.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(AppTheme.radiusS),
                                ),
                                child: const Icon(
                                  Icons.info_outline,
                                  color: Colors.purple,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: AppTheme.spacingS),
                              Text(
                                'About',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppTheme.spacingM),
                          Text(
                            doctor.bio!,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  height: 1.5,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: 100.ms, duration: AppTheme.animMedium).slideY(begin: 0.1, end: 0),

                // Qualifications Section
                if (doctor.qualifications.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
                    child: ModernCard(
                      margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(AppTheme.radiusS),
                                ),
                                child: const Icon(
                                  Icons.school_outlined,
                                  color: AppTheme.accentColor,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: AppTheme.spacingS),
                              Text(
                                'Qualifications',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppTheme.spacingM),
                          ...doctor.qualifications.map(
                            (qual) => Padding(
                              padding: const EdgeInsets.only(bottom: AppTheme.spacingS),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(
                                    Icons.check_circle,
                                    color: AppTheme.successColor,
                                    size: 18,
                                  ),
                                  const SizedBox(width: AppTheme.spacingS),
                                  Expanded(
                                    child: Text(
                                      qual,
                                      style: Theme.of(context).textTheme.bodyMedium,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: 150.ms, duration: AppTheme.animMedium).slideY(begin: 0.1, end: 0),

                // Schedule Section
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingM),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.successColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(AppTheme.radiusS),
                            ),
                            child: const Icon(
                              Icons.calendar_month_outlined,
                              color: AppTheme.successColor,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacingS),
                          Text(
                            'Weekly Schedule',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingM),
                      if (doctorProvider.weeklySchedule != null)
                        ..._buildWeeklySchedule(
                          doctorProvider.weeklySchedule!['weeklySchedule'] as List,
                        )
                      else
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(AppTheme.spacingL),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms, duration: AppTheme.animMedium).slideY(begin: 0.1, end: 0),

                // Bottom padding for FAB
                const SizedBox(height: 100),
              ],
            ),
          ),
        ],
      ),
      // Book Appointment Button
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _handleBookAppointment,
        icon: const Icon(Icons.calendar_today),
        label: const Text('Book Appointment'),
        backgroundColor: AppTheme.primaryColor,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  List<Widget> _buildWeeklySchedule(List weeklySchedule) {
    final dayAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    final dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build a map of day -> schedules and collect all service types
    final Map<int, List<Map<String, dynamic>>> daySchedules = {};
    final Set<String> allServiceTypes = {};

    for (final day in weeklySchedule) {
      final dayOfWeek = day['dayOfWeek'] as int;
      final schedules = (day['schedules'] as List).cast<Map<String, dynamic>>();
      if (schedules.isNotEmpty) {
        daySchedules[dayOfWeek] = schedules;
        for (final s in schedules) {
          final type = s['type'] as String?;
          if (type != null && type.isNotEmpty) {
            allServiceTypes.add(type);
          }
        }
      }
    }

    // Service type colors
    final serviceColors = <String, Color>{};
    final colorPalette = [
      AppTheme.primaryColor,
      AppTheme.accentColor,
      AppTheme.successColor,
      Colors.orange,
      Colors.purple,
      Colors.teal,
    ];
    int colorIdx = 0;
    for (final type in allServiceTypes) {
      serviceColors[type] = colorPalette[colorIdx % colorPalette.length];
      colorIdx++;
    }

    if (daySchedules.isEmpty) {
      return [
        Center(
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacingL),
            child: Column(
              children: [
                Icon(
                  Icons.event_busy,
                  size: 48,
                  color: AppTheme.textHint,
                ),
                const SizedBox(height: AppTheme.spacingM),
                Text(
                  'No schedule available',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ),
      ];
    }

    return [
      ModernCard(
        margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Compact Week View - 7 day grid
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (index) {
                final hasSchedule = daySchedules.containsKey(index);
                final schedules = daySchedules[index];

                return Expanded(
                  child: GestureDetector(
                    onTap: hasSchedule
                        ? () => _showDayScheduleDetail(index, schedules!, dayNames[index])
                        : null,
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingS),
                      decoration: BoxDecoration(
                        color: hasSchedule
                            ? AppTheme.primaryColor.withValues(alpha: 0.15)
                            : AppTheme.surfaceMedium,
                        borderRadius: BorderRadius.circular(AppTheme.radiusS),
                        border: hasSchedule
                            ? Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3))
                            : null,
                      ),
                      child: Column(
                        children: [
                          Text(
                            dayAbbr[index],
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: hasSchedule ? AppTheme.primaryColor : AppTheme.textHint,
                            ),
                          ),
                          const SizedBox(height: 4),
                          if (hasSchedule) ...[
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.successColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ] else ...[
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: AppTheme.textHint.withValues(alpha: 0.3),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: AppTheme.spacingM),
            // Schedule summary
            ...daySchedules.entries.map((entry) {
              final day = entry.key;
              final schedules = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.spacingS),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Center(
                        child: Text(
                          dayNames[day],
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingS),
                    Expanded(
                      child: Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: schedules.map((s) {
                          final startTime = s['startTime'] as String? ?? '';
                          final endTime = s['endTime'] as String? ?? '';
                          final type = s['type'] as String?;
                          final color = type != null ? serviceColors[type] ?? AppTheme.textSecondary : AppTheme.textSecondary;

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: color.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              '$startTime-$endTime',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: color,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
      // Legend (only if there are different service types)
      if (allServiceTypes.length > 1)
        ModernCard(
          margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Services',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: AppTheme.spacingS),
              Wrap(
                spacing: AppTheme.spacingM,
                runSpacing: AppTheme.spacingS,
                children: serviceColors.entries.map((entry) {
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: entry.value,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        getServiceDisplayName(entry.key),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  );
                }).toList(),
              ),
            ],
          ),
        ),
    ];
  }

  void _showDayScheduleDetail(int dayOfWeek, List<Map<String, dynamic>> schedules, String dayName) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXL)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppTheme.spacingL),
                decoration: BoxDecoration(
                  color: AppTheme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusM),
                  ),
                  child: const Icon(Icons.calendar_today, color: AppTheme.primaryColor, size: 20),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Text(
                  '$dayName Schedule',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingL),
            ...schedules.map((schedule) {
              final startTime = schedule['startTime'] as String? ?? '';
              final endTime = schedule['endTime'] as String? ?? '';
              final slotDuration = schedule['slotDuration'] as int? ?? 15;
              final type = schedule['type'] as String?;
              final serviceType = getServiceDisplayName(type);

              return Container(
                margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
                padding: const EdgeInsets.all(AppTheme.spacingM),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(AppTheme.radiusM),
                  border: Border.all(color: AppTheme.dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 18, color: AppTheme.primaryColor),
                        const SizedBox(width: 8),
                        Text(
                          '$startTime - $endTime',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (serviceType.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(AppTheme.radiusS),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.medical_services, size: 14, color: AppTheme.accentColor),
                                const SizedBox(width: 4),
                                Text(
                                  serviceType,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.accentColor,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacingS),
                        ],
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.successColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(AppTheme.radiusS),
                          ),
                          child: Text(
                            '$slotDuration min slots',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.successColor,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
      ),
    );
  }
}
