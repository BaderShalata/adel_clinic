import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/doctor_provider.dart';
import '../../models/doctor.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';
import 'doctor_detail_screen.dart';

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
    final filteredDoctors = _filterDoctors(doctorProvider.doctors);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Our Doctors'),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingM),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search doctors or specialties...',
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
                  ? const LoadingIndicator(message: 'Loading doctors...')
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
                                  const Icon(
                                    Icons.search_off,
                                    size: 64,
                                    color: AppTheme.textHint,
                                  ),
                                  const SizedBox(height: AppTheme.spacingM),
                                  Text(
                                    _searchQuery.isEmpty
                                        ? 'No doctors available'
                                        : 'No doctors found for "$_searchQuery"',
                                    style: Theme.of(context).textTheme.bodyLarge,
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppTheme.spacingM,
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
                                );
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

  @override
  Widget build(BuildContext context) {
    return ModernCard(
      onTap: onTap,
      child: Row(
        children: [
          // Avatar with gradient
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppTheme.primaryLight,
                  AppTheme.primaryColor,
                ],
              ),
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
            ),
            child: Center(
              child: Text(
                doctor.fullName[0].toUpperCase(),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppTheme.spacingM),

          // Doctor info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doctor.fullNameEn ?? doctor.fullName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                if (doctor.fullNameEn != null && doctor.fullNameHe != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      doctor.fullNameHe!,
                      style: Theme.of(context).textTheme.bodyMedium,
                      textDirection: TextDirection.rtl,
                    ),
                  ),
                const SizedBox(height: AppTheme.spacingS),
                Wrap(
                  spacing: AppTheme.spacingXS,
                  runSpacing: AppTheme.spacingXS,
                  children: doctor.specialties.take(2).map((spec) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppTheme.spacingS,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppTheme.radiusS),
                      ),
                      child: Text(
                        spec,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.primaryDark,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          // Arrow icon
          Container(
            padding: const EdgeInsets.all(AppTheme.spacingS),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
