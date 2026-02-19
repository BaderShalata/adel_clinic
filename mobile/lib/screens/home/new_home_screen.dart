import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/news_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../models/news.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/section_header.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';
import '../doctors/doctors_screen.dart';
import '../booking/service_selection_screen.dart';
import '../auth/login_screen.dart';

class NewHomeScreen extends StatefulWidget {
  const NewHomeScreen({super.key});

  @override
  State<NewHomeScreen> createState() => _NewHomeScreenState();
}

class _NewHomeScreenState extends State<NewHomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<NewsProvider>().loadNews();
    });
  }

  @override
  Widget build(BuildContext context) {
    final newsProvider = context.watch<NewsProvider>();
    final authProvider = context.watch<AuthProvider>();
    final languageProvider = context.watch<LanguageProvider>();

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => newsProvider.loadNews(),
          child: CustomScrollView(
            slivers: [
              // Logo and Welcome Header
              SliverToBoxAdapter(
                child: _buildHeader(context, authProvider, languageProvider),
              ),

              // Quick Actions
              SliverToBoxAdapter(
                child: _buildQuickActions(context, languageProvider),
              ),

              // Location and Social Media Grid
              SliverToBoxAdapter(
                child: _buildLocationAndSocialGrid(context, languageProvider),
              ),

              const SliverToBoxAdapter(
                child: SizedBox(height: AppTheme.spacingM),
              ),

              // News Section Header
              SliverToBoxAdapter(
                child: SectionHeader(title: languageProvider.t('latestNews')),
              ),

              // News Feed
              if (newsProvider.isLoading)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => const ShimmerCard(height: 200),
                      childCount: 3,
                    ),
                  ),
                )
              else if (newsProvider.errorMessage != null)
                SliverFillRemaining(
                  child: ErrorView(
                    message: newsProvider.errorMessage!,
                    onRetry: () => newsProvider.loadNews(),
                  ),
                )
              else if (newsProvider.news.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.article_outlined,
                          size: 64,
                          color: AppTheme.textHint,
                        ),
                        SizedBox(height: AppTheme.spacingM),
                        Text('No news available'),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingM,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return NewsCard(news: newsProvider.news[index]);
                      },
                      childCount: newsProvider.news.length,
                    ),
                  ),
                ),

              // Bottom spacing
              const SliverPadding(
                padding: EdgeInsets.only(bottom: AppTheme.spacingXL),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AuthProvider authProvider, LanguageProvider languageProvider) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingL),
      decoration: BoxDecoration(
        gradient: AppTheme.headerGradient,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(AppTheme.radiusXL),
          bottomRight: Radius.circular(AppTheme.radiusXL),
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Clinic Logo - Large with animation
          Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipOval(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Image.asset(
                  'assets/ClinicLogo.jpeg',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          )
              .animate()
              .fadeIn(duration: AppTheme.animMedium)
              .scale(delay: 100.ms, duration: AppTheme.animMedium),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            authProvider.isLoggedIn
                ? '${languageProvider.t('welcomeBack')}, ${authProvider.user?.displayName ?? languageProvider.t('patient')}!'
                : languageProvider.t('yourHealthOurPriority'),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: AppTheme.animMedium)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, LanguageProvider languageProvider) {
    final authProvider = context.watch<AuthProvider>();

    return Padding(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      child: Row(
        children: [
          Expanded(
            child: _QuickActionButton(
              icon: Icons.medical_services,
              label: languageProvider.t('findDoctor'),
              color: AppTheme.accentColor,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DoctorsScreen()),
                );
              },
            ),
          )
              .animate()
              .fadeIn(delay: 300.ms, duration: AppTheme.animMedium)
              .slideX(begin: -0.2, end: 0),
          const SizedBox(width: AppTheme.spacingM),
          Expanded(
            child: _QuickActionButton(
              icon: Icons.calendar_month,
              label: languageProvider.t('bookAppointment'),
              color: AppTheme.primaryColor,
              onTap: () {
                // Check if user is logged in before allowing booking
                if (!authProvider.isLoggedIn) {
                  _showLoginRequiredDialog(context, languageProvider);
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ServiceSelectionScreen()),
                  );
                }
              },
            ),
          )
              .animate()
              .fadeIn(delay: 400.ms, duration: AppTheme.animMedium)
              .slideX(begin: 0.2, end: 0),
        ],
      ),
    );
  }

  void _showLoginRequiredDialog(BuildContext context, LanguageProvider languageProvider) {
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
            // Icon
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingM),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.login_rounded,
                size: 36,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              languageProvider.t('signInRequired'),
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              languageProvider.t('pleaseSignInToBook'),
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
                    child: Text(languageProvider.t('cancel')),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(languageProvider.t('signIn')),
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

  Widget _buildLocationAndSocialGrid(BuildContext context, LanguageProvider languageProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Location Card
          Expanded(
            child: Animate(
              effects: [
                FadeEffect(delay: 500.ms, duration: AppTheme.animMedium),
                SlideEffect(begin: const Offset(0, 0.2), end: Offset.zero),
              ],
              child: ModernCard(
                onTap: _openMap,
                padding: const EdgeInsets.all(AppTheme.spacingM),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppTheme.spacingM),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.successColor.withValues(alpha: 0.2),
                            AppTheme.successColor.withValues(alpha: 0.05),
                          ],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.location_on,
                        color: AppTheme.successColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingS),
                    Text(
                      languageProvider.t('location'),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Saba Reihana\nMedical Center',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppTheme.spacingS),
                    Text(
                      languageProvider.t('tapToOpen'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: AppTheme.spacingM),
          // Social Media Card
          Expanded(
            child: Animate(
              effects: [
                FadeEffect(delay: 600.ms, duration: AppTheme.animMedium),
                SlideEffect(begin: const Offset(0, 0.2), end: Offset.zero),
              ],
              child: ModernCard(
                padding: const EdgeInsets.all(AppTheme.spacingM),
                child: Column(
                  children: [
                    Text(
                      languageProvider.t('followUs'),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _SocialMediaButton(
                          icon: Icons.facebook,
                          color: const Color(0xFF1877F2),
                          onTap: () => _openSocialMedia('facebook'),
                        ),
                        _SocialMediaButton(
                          icon: Icons.camera_alt,
                          color: const Color(0xFFE4405F),
                          onTap: () => _openSocialMedia('instagram'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingS),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _SocialMediaButton(
                          icon: Icons.phone,
                          color: const Color(0xFF25D366),
                          onTap: () => _openSocialMedia('whatsapp'),
                        ),
                        _SocialMediaButton(
                          icon: Icons.phone_in_talk,
                          color: AppTheme.primaryColor,
                          onTap: () => _openSocialMedia('phone'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openSocialMedia(String platform) async {
    Uri? uri;
    switch (platform) {
      case 'facebook':
        uri = Uri.parse('https://www.facebook.com/seba.rehana');
        break;
      case 'instagram':
        uri = Uri.parse('https://www.instagram.com/sba_rehana_medical_clinic/');
        break;
      case 'whatsapp':
        // Clinic WhatsApp number
        uri = Uri.parse('https://wa.me/972XXXXXXXXX');
        break;
      case 'phone':
        // Clinic phone number
        uri = Uri.parse('tel:+972XXXXXXXXX');
        break;
    }

    if (uri != null) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open $platform')),
          );
        }
      }
    }
  }

  Future<void> _openMap() async {
    final languageProvider = context.read<LanguageProvider>();

    // Clinic coordinates: Saba Reihana Medical Center, Sakhnin
    const lat = 32.8625292;
    const lng = 35.2958923;

    // Show dialog to choose between Google Maps and Waze
    final choice = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                languageProvider.t('openWith'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.map, color: Colors.red),
                title: Text(languageProvider.t('googleMaps')),
                onTap: () => Navigator.pop(ctx, 'google'),
              ),
              ListTile(
                leading: const Icon(Icons.navigation, color: Colors.blue),
                title: Text(languageProvider.t('waze')),
                onTap: () => Navigator.pop(ctx, 'waze'),
              ),
            ],
          ),
        ),
      ),
    );

    if (choice == null) return;

    Uri uri;
    if (choice == 'waze') {
      // Waze URL format (works on both Android and iOS)
      uri = Uri.parse('https://waze.com/ul?ll=$lat,$lng&navigate=yes');
    } else {
      // Google Maps URL format (works on both Android and iOS)
      uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    }

    // Launch directly without checking canLaunchUrl (which can fail on Android 11+)
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      // Fallback: try with platform default mode
      try {
        await launchUrl(uri);
      } catch (e2) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(languageProvider.t('couldNotOpenMaps'))),
          );
        }
      }
    }
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = AppTheme.primaryColor,
  });

  @override
  Widget build(BuildContext context) {
    return ModernCard(
      onTap: onTap,
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(AppTheme.spacingM),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppTheme.spacingM),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color.withValues(alpha: 0.15),
                  color.withValues(alpha: 0.05),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color,
              size: 28,
            ),
          ),
          const SizedBox(height: AppTheme.spacingS),
          Text(
            label,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SocialMediaButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _SocialMediaButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusM),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spacingS),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
        ),
        child: Icon(
          icon,
          color: color,
          size: 24,
        ),
      ),
    );
  }
}

class NewsCard extends StatelessWidget {
  final News news;

  const NewsCard({super.key, required this.news});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, yyyy');

    return ModernCard(
      onTap: () => _showNewsDetail(context),
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image or category header
          if (news.imageURL != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusM),
              ),
              child: CachedNetworkImage(
                imageUrl: news.imageURL!,
                height: 150,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  height: 150,
                  color: AppTheme.surfaceMedium,
                  child: const Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primaryColor.withValues(alpha: 0.15),
                        AppTheme.primaryColor.withValues(alpha: 0.05),
                      ],
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.article,
                      size: 40,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
            )
          else
            Container(
              height: 6,
              decoration: BoxDecoration(
                color: _getCategoryColor(news.category),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppTheme.radiusM),
                ),
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingM),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category chip
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingS,
                    vertical: AppTheme.spacingXS,
                  ),
                  decoration: BoxDecoration(
                    color: _getCategoryColor(news.category).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(AppTheme.radiusS),
                  ),
                  child: Text(
                    news.category.toUpperCase(),
                    style: TextStyle(
                      color: _getCategoryColor(news.category),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: AppTheme.spacingS),

                // Title
                Text(
                  news.title,
                  style: Theme.of(context).textTheme.titleLarge,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppTheme.spacingS),

                // Content preview
                Text(
                  news.content,
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppTheme.spacingM),

                // Date
                Row(
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 14,
                      color: AppTheme.textHint,
                    ),
                    const SizedBox(width: AppTheme.spacingXS),
                  Text(
                    news.publishedAt != null
                        ? dateFormat.format(news.publishedAt!)
                        : 'No date',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'health-tip':
        return AppTheme.successColor;
      case 'announcement':
        return AppTheme.primaryColor;
      case 'event':
        return AppTheme.warningColor;
      default:
        return AppTheme.accentColor;
    }
  }

  void _showNewsDetail(BuildContext context) {
    final dateFormat = DateFormat('MMMM d, yyyy');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (context, scrollController) {
          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusXL),
              ),
            ),
            child: Column(
              children: [
                // Handle bar
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingM),
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.dividerColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

                // Content
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hero image
                        if (news.imageURL != null)
                          CachedNetworkImage(
                            imageUrl: news.imageURL!,
                            height: 220,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              height: 220,
                              color: AppTheme.surfaceMedium,
                              child: const Center(
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              height: 120,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    _getCategoryColor(news.category).withValues(alpha: 0.2),
                                    _getCategoryColor(news.category).withValues(alpha: 0.05),
                                  ],
                                ),
                              ),
                              child: Center(
                                child: Icon(
                                  Icons.article,
                                  size: 48,
                                  color: _getCategoryColor(news.category),
                                ),
                              ),
                            ),
                          ),

                        Padding(
                          padding: const EdgeInsets.all(AppTheme.spacingL),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Category and date row
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppTheme.spacingS,
                                      vertical: AppTheme.spacingXS,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getCategoryColor(news.category).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                                    ),
                                    child: Text(
                                      news.category.toUpperCase(),
                                      style: TextStyle(
                                        color: _getCategoryColor(news.category),
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Icon(
                                    Icons.calendar_today,
                                    size: 14,
                                    color: AppTheme.textHint,
                                  ),
                                  const SizedBox(width: AppTheme.spacingXS),
                                  Text(
                                    news.publishedAt != null
                                        ? dateFormat.format(news.publishedAt!)
                                        : 'No date',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: AppTheme.textSecondary,
                                        ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppTheme.spacingL),

                              // Title
                              Text(
                                news.title,
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              const SizedBox(height: AppTheme.spacingL),

                              // Divider
                              Container(
                                height: 2,
                                width: 60,
                                decoration: BoxDecoration(
                                  color: _getCategoryColor(news.category),
                                  borderRadius: BorderRadius.circular(1),
                                ),
                              ),
                              const SizedBox(height: AppTheme.spacingL),

                              // Full content
                              Text(
                                news.content,
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                      height: 1.6,
                                      color: AppTheme.textPrimary,
                                    ),
                              ),
                              const SizedBox(height: AppTheme.spacingXL),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
