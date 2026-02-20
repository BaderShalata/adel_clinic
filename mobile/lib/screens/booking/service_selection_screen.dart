import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/booking_provider.dart';
import '../../providers/language_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/loading_indicator.dart';
import 'doctor_selection_screen.dart';

class ServiceSelectionScreen extends StatefulWidget {
  const ServiceSelectionScreen({super.key});

  @override
  State<ServiceSelectionScreen> createState() =>
      _ServiceSelectionScreenState();
}

class _ServiceSelectionScreenState extends State<ServiceSelectionScreen> {
  List<String> _services = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    final bookingProvider = context.read<BookingProvider>();
    bookingProvider.reset();
    final services = await bookingProvider.getAllServices();
    if (mounted) {
      setState(() {
        _services = services;
        _isLoading = false;
      });
    }
  }

  void _selectService(String service) {
    final bookingProvider = context.read<BookingProvider>();
    bookingProvider.selectService(service);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const DoctorSelectionScreen(),
      ),
    );
  }

  IconData _getServiceIcon(String service) {
    final lowerService = service.toLowerCase();
    if (lowerService.contains('pediatr') ||
        lowerService.contains('child')) {
      return Icons.child_care;
    } else if (lowerService.contains('genet')) {
      return Icons.biotech;
    } else if (lowerService.contains('consult')) {
      return Icons.medical_services;
    } else if (lowerService.contains('cardio') ||
        lowerService.contains('heart')) {
      return Icons.favorite;
    } else if (lowerService.contains('derma') ||
        lowerService.contains('skin')) {
      return Icons.face;
    } else if (lowerService.contains('ortho') ||
        lowerService.contains('bone')) {
      return Icons.accessibility_new;
    } else if (lowerService.contains('neuro') ||
        lowerService.contains('brain')) {
      return Icons.psychology;
    } else if (lowerService.contains('eye') ||
        lowerService.contains('ophthal')) {
      return Icons.visibility;
    }
    return Icons.local_hospital;
  }

  Color _getServiceColor(String service) {
    final lowerService = service.toLowerCase();
    if (lowerService.contains('pediatr') ||
        lowerService.contains('child')) {
      return AppTheme.accentColor;
    } else if (lowerService.contains('genet')) {
      return AppTheme.primaryColor;
    } else if (lowerService.contains('consult')) {
      return AppTheme.successColor;
    } else if (lowerService.contains('cardio') ||
        lowerService.contains('heart')) {
      return AppTheme.errorColor;
    }
    return AppTheme.primaryColor;
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(lang.t('bookAppointment'))),
        body: const Padding(
          padding: EdgeInsets.all(AppTheme.spacingM),
          child: ShimmerList(itemCount: 4, itemHeight: 100),
        ),
      );
    }

    if (_services.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(lang.t('bookAppointment'))),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding:
                    const EdgeInsets.all(AppTheme.spacingL),
                decoration: const BoxDecoration(
                  color: AppTheme.surfaceMedium,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.medical_services_outlined,
                  size: 48,
                  color: AppTheme.textHint,
                ),
              ),
              const SizedBox(height: AppTheme.spacingM),
              Text(
                lang.t('noServicesAvailable'),
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    // 🔥 Explicitly typed header widget
    final Widget header = Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppTheme.spacingL),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryColor.withValues(alpha: 0.1),
            AppTheme.primaryColor.withValues(alpha: 0.02),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.all(AppTheme.spacingS),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor
                      .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(
                      AppTheme.radiusS),
                ),
                child: const Icon(
                  Icons.medical_services,
                  color: AppTheme.primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spacingS),
              Text(
                '${lang.t('step')} 1 ${lang.t('of')} 4',
                style: Theme.of(context)
                    .textTheme
                    .labelMedium
                    ?.copyWith(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            lang.t('selectService'),
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: AppTheme.spacingXS),
          Text(
            lang.t('chooseConsultationNeeded'),
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(
                  color: AppTheme.textSecondary,
                ),
          ),
        ],
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(lang.t('bookAppointment'))),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          header
              .animate()
              .fadeIn(duration: AppTheme.animMedium)
              .slideY(begin: -0.1, end: 0),

          Expanded(
            child: ListView.builder(
              padding:
                  const EdgeInsets.all(AppTheme.spacingM),
              itemCount: _services.length,
              itemBuilder: (context, index) {
                final service = _services[index];
                final color =
                    _getServiceColor(service);

                final Widget card = ModernCard(
                  margin: const EdgeInsets.only(
                      bottom: AppTheme.spacingM),
                  onTap: () =>
                      _selectService(service),
                  child: Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin:
                                Alignment.topLeft,
                            end: Alignment
                                .bottomRight,
                            colors: [
                              color.withValues(
                                  alpha: 0.2),
                              color.withValues(
                                  alpha: 0.05),
                            ],
                          ),
                          borderRadius:
                              BorderRadius.circular(
                                  AppTheme.radiusM),
                        ),
                        child: Icon(
                          _getServiceIcon(service),
                          color: color,
                          size: 28,
                        ),
                      ),
                      const SizedBox(
                          width:
                              AppTheme.spacingM),
                      Expanded(
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,
                          children: [
                            Text(
                              service,
                              style: Theme.of(
                                      context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight:
                                        FontWeight
                                            .w600,
                                  ),
                            ),
                            const SizedBox(
                                height: 4),
                            Text(
                              lang.t('tapToSelect'),
                              style: Theme.of(
                                      context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppTheme
                                        .textHint,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding:
                            const EdgeInsets.all(
                                AppTheme
                                    .spacingS),
                        decoration:
                            BoxDecoration(
                          color: AppTheme
                              .primarySurface,
                          borderRadius:
                              BorderRadius
                                  .circular(
                                      AppTheme
                                          .radiusS),
                        ),
                        child: const Icon(
                          Icons
                              .arrow_forward_ios,
                          size: 14,
                          color: AppTheme
                              .primaryColor,
                        ),
                      ),
                    ],
                  ),
                );

                return card
                    .animate()
                    .fadeIn(
                      delay: Duration(
                          milliseconds:
                              100 +
                                  (50 *
                                      index)),
                      duration:
                          AppTheme.animMedium,
                    )
                    .slideX(
                        begin: 0.1,
                        end: 0);
              },
            ),
          ),
        ],
      ),
    );
  }
}
