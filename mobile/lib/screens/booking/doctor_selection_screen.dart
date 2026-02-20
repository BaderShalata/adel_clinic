import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/doctor.dart';
import '../../providers/booking_provider.dart';
import '../../providers/language_provider.dart';
import '../../theme/app_theme.dart';
import 'slot_selection_screen.dart';

class DoctorSelectionScreen extends StatelessWidget {
  const DoctorSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('selectDoctor')),
      ),
      body: Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          if (bookingProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (bookingProvider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red[300],
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  Text(
                    lang.t('errorLoadingDoctors'),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppTheme.spacingS),
                  TextButton(
                    onPressed: () {
                      if (bookingProvider.selectedService != null) {
                        bookingProvider
                            .loadDoctorsForService(bookingProvider.selectedService!);
                      }
                    },
                    child: Text(lang.t('retry')),
                  ),
                ],
              ),
            );
          }

          final doctors = bookingProvider.doctorsForService;

          if (doctors.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person_search,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  Text(
                    lang.t('noDoctorsForService'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                ],
              ),
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppTheme.spacingM),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lang.t('selectDoctor'),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: AppTheme.spacingXS),
                    Text(
                      '${lang.t('service')}: ${bookingProvider.selectedService}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingM,
                  ),
                  itemCount: doctors.length,
                  itemBuilder: (context, index) {
                    final doctor = doctors[index];
                    return _DoctorCard(
                      doctor: doctor,
                      onTap: () {
                        bookingProvider.selectDoctor(doctor);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const SlotSelectionScreen(),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;

  const _DoctorCard({
    required this.doctor,
    required this.onTap,
  });

  /// Get the doctor name based on current locale
  String _getLocalizedName(BuildContext context) {
    final locale = Localizations.localeOf(context);
    if (locale.languageCode == 'en' && doctor.fullNameEn != null && doctor.fullNameEn!.isNotEmpty) {
      return doctor.fullNameEn!;
    } else if (locale.languageCode == 'he' && doctor.fullNameHe != null && doctor.fullNameHe!.isNotEmpty) {
      return doctor.fullNameHe!;
    }
    return doctor.fullName;
  }

  /// Get initials from the localized name
  String _getInitials(BuildContext context) {
    final name = _getLocalizedName(context);
    if (name.isEmpty) return 'D';

    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      // Get first letter of first two words
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final languageCode = locale.languageCode;
    final displayName = doctor.getLocalizedName(languageCode);
    final localizedSpecialties = doctor.getLocalizedSpecialties(languageCode);
    final localizedQualifications = doctor.getLocalizedQualifications(languageCode);

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                child: Text(
                  _getInitials(context),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacingM),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: AppTheme.spacingXS),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: localizedSpecialties
                          .map(
                            (s) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                s,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    if (localizedQualifications.isNotEmpty) ...[
                      const SizedBox(height: AppTheme.spacingXS),
                      Text(
                        localizedQualifications.join(', '),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: Colors.grey,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
