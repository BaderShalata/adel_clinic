import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../models/doctor.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/doctor_avatar.dart';
import 'doctor_detail_screen.dart';
import '../admin/doctor_form_screen.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});

  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<DoctorProvider>().loadDoctors();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Doctor> _filterDoctors(List<Doctor> doctors) {
    if (_searchQuery.isEmpty) return doctors;
    final query = _searchQuery.toLowerCase();
    return doctors.where((doctor) {
      return doctor.fullName.toLowerCase().contains(query) ||
          (doctor.fullNameEn?.toLowerCase().contains(query) ?? false) ||
          doctor.specialties.any((s) => s.toLowerCase().contains(query));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final doctorProvider = context.watch<DoctorProvider>();
    final authProvider = context.watch<AuthProvider>();
    final lang = context.watch<LanguageProvider>();
    final filteredDoctors = _filterDoctors(doctorProvider.doctors);

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('ourDoctors')),
        actions: [
          if (authProvider.isAdmin)
            IconButton(
              icon: const Icon(Icons.person_add),
              tooltip: lang.t('addDoctor'),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DoctorFormScreen()),
                );
              },
            ),
        ],
      ),
      floatingActionButton: authProvider.isAdmin
          ? Padding(
              padding: const EdgeInsets.only(bottom: 100),
              child: FloatingActionButton.extended(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const DoctorFormScreen()),
                  );
                },
                icon: const Icon(Icons.add),
                label: Text(lang.t('addDoctor')),
                backgroundColor: AppTheme.primaryColor,
              ),
            )
          : null,
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingM),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: lang.t('searchDoctors'),
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),

          // Doctors list
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => doctorProvider.loadDoctors(),
              child: doctorProvider.isLoading
                  ? const Padding(
                      padding: EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
                      child: ShimmerList(itemCount: 5, itemHeight: 100),
                    )
                  : doctorProvider.errorMessage != null
                      ? ErrorView(
                          message: doctorProvider.errorMessage!,
                          onRetry: () => doctorProvider.loadDoctors(),
                        )
                      : filteredDoctors.isEmpty
                          ? Center(
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
                                      Icons.search_off,
                                      size: 48,
                                      color: AppTheme.textHint,
                                    ),
                                  ),
                                  const SizedBox(height: AppTheme.spacingM),
                                  Text(
                                    _searchQuery.isEmpty
                                        ? lang.t('noDoctorsAvailable')
                                        : '${lang.t('noDoctorsFound')} "$_searchQuery"',
                                    style: Theme.of(context).textTheme.bodyLarge,
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.only(
                                left: AppTheme.spacingM,
                                right: AppTheme.spacingM,
                                bottom: 120, // Space for floating nav bar
                              ),
                              itemCount: filteredDoctors.length,
                              itemBuilder: (context, index) {
                                return ModernDoctorCard(
                                  doctor: filteredDoctors[index],
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => DoctorDetailScreen(
                                          doctorId: filteredDoctors[index].id,
                                        ),
                                      ),
                                    );
                                  },
                                )
                                    .animate()
                                    .fadeIn(
                                      delay: Duration(milliseconds: 50 * index),
                                      duration: AppTheme.animMedium,
                                    )
                                    .slideX(begin: 0.1, end: 0);
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }
}

class ModernDoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;

  const ModernDoctorCard({
    super.key,
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
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  /// Get the doctor bio based on current locale
  String? _getLocalizedBio(BuildContext context) {
    final locale = Localizations.localeOf(context);
    if (locale.languageCode == 'en' && doctor.bioEn != null && doctor.bioEn!.isNotEmpty) {
      return doctor.bioEn;
    } else if (locale.languageCode == 'he' && doctor.bioHe != null && doctor.bioHe!.isNotEmpty) {
      return doctor.bioHe;
    }
    if (doctor.bio != null && doctor.bio!.isNotEmpty) {
      return doctor.bio;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final languageCode = locale.languageCode;
    final displayName = doctor.getLocalizedName(languageCode);
    final localizedBio = doctor.getLocalizedBio(languageCode);
    final localizedSpecialties = doctor.getLocalizedSpecialties(languageCode);

    return ModernCard(
      onTap: onTap,
      child: Row(
        children: [
          // Avatar with image or initials fallback
          DoctorAvatarCard(
            doctor: doctor,
            size: 70,
          ),
          const SizedBox(width: AppTheme.spacingM),

          // Doctor info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (doctor.fullNameEn != null && doctor.fullNameHe != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      doctor.fullNameHe!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                      textDirection: TextDirection.rtl,
                    ),
                  ),
                // Bio snippet
                if (localizedBio != null && localizedBio.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: AppTheme.spacingXS),
                    child: Text(
                      localizedBio,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textSecondary,
                            height: 1.3,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                const SizedBox(height: AppTheme.spacingS),
                Wrap(
                  spacing: AppTheme.spacingXS,
                  runSpacing: AppTheme.spacingXS,
                  children: localizedSpecialties.take(2).map((spec) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppTheme.spacingS,
                        vertical: 4,
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
                          width: 1,
                        ),
                      ),
                      child: Text(
                        spec,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.primaryDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          // Arrow icon with better styling
          Container(
            padding: const EdgeInsets.all(AppTheme.spacingS),
            decoration: BoxDecoration(
              color: AppTheme.primarySurface,
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
            ),
            child: const Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
