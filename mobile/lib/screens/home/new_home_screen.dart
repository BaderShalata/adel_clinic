import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/news_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/news.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/section_header.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';

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

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => newsProvider.loadNews(),
          child: CustomScrollView(
            slivers: [
              // Logo and Welcome Header
              SliverToBoxAdapter(
                child: _buildHeader(context, authProvider),
              ),

              // Quick Actions
              SliverToBoxAdapter(
                child: _buildQuickActions(context),
              ),

              // News Section Header
              const SliverToBoxAdapter(
                child: SectionHeader(title: 'Latest News'),
              ),

              // News Feed
              if (newsProvider.isLoading)
                const SliverFillRemaining(
                  child: LoadingIndicator(message: 'Loading news...'),
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

  Widget _buildHeader(BuildContext context, AuthProvider authProvider) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingL),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryDark,
          ],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppTheme.radiusXL),
          bottomRight: Radius.circular(AppTheme.radiusXL),
        ),
      ),
      child: Column(
        children: [
          // Clinic Logo - Large
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
          ),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            authProvider.isLoggedIn
                ? 'Welcome back, ${authProvider.user?.displayName ?? 'Patient'}!'
                : 'Your Health, Our Priority',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      child: Row(
        children: [
          Expanded(
            child: _QuickActionButton(
              icon: Icons.medical_services,
              label: 'Find Doctor',
              onTap: () {
                // Navigate handled by parent MainShell
              },
            ),
          ),
          const SizedBox(width: AppTheme.spacingM),
          Expanded(
            child: _QuickActionButton(
              icon: Icons.calendar_month,
              label: 'Book Appointment',
              onTap: () {
                // Navigate handled by parent MainShell
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
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
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: AppTheme.primaryColor,
              size: 28,
            ),
          ),
          const SizedBox(height: AppTheme.spacingS),
          Text(
            label,
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ],
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
              child: Image.network(
                news.imageURL!,
                height: 150,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 80,
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    child: const Center(
                      child: Icon(
                        Icons.article,
                        size: 40,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  );
                },
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
                      dateFormat.format(news.publishedAt),
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
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
            child: SingleChildScrollView(
              controller: scrollController,
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacingL),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppTheme.dividerColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingL),

                    // Full content
                    Text(
                      news.title,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    Text(
                      DateFormat('MMMM d, yyyy').format(news.publishedAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: AppTheme.spacingL),
                    Text(
                      news.content,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: AppTheme.spacingXL),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
