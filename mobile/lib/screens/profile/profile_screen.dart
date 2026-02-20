import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final languageProvider = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(languageProvider.t('profile')),
      ),
      body: authProvider.isLoggedIn
          ? _buildLoggedInProfile(context, authProvider, languageProvider)
          : _buildGuestProfile(context, languageProvider),
    );
  }

  Widget _buildGuestProfile(BuildContext context, LanguageProvider languageProvider) {
    return SingleChildScrollView(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingL),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingXL),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person_outline,
                  size: 80,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: AppTheme.spacingXL),
              Text(
                '${languageProvider.t('welcome')} ${languageProvider.t('appName')}',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppTheme.spacingS),
              Text(
                languageProvider.t('pleaseSignInToBook'),
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppTheme.spacingXL),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  child: Text(languageProvider.t('signIn')),
                ),
              ),
              const SizedBox(height: AppTheme.spacingM),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen()),
                  );
                },
                child: Text("${languageProvider.t('dontHaveAccount')} ${languageProvider.t('register')}"),
              ),
              const SizedBox(height: AppTheme.spacingXL),
              // Language selector for guests
              _buildLanguageSelector(context, languageProvider),
              const SizedBox(height: 120), // Space for floating nav bar
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context, LanguageProvider languageProvider) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXL)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
                decoration: BoxDecoration(
                  color: AppTheme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                languageProvider.t('language'),
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: AppTheme.spacingM),
              _LanguageOption(
                label: 'English',
                locale: const Locale('en'),
                isSelected: languageProvider.languageCode == 'en',
                onTap: () {
                  languageProvider.setLanguage('en');
                  Navigator.pop(ctx);
                },
              ),
              _LanguageOption(
                label: 'العربية',
                locale: const Locale('ar'),
                isSelected: languageProvider.languageCode == 'ar',
                onTap: () {
                  languageProvider.setLanguage('ar');
                  Navigator.pop(ctx);
                },
              ),
              _LanguageOption(
                label: 'עברית',
                locale: const Locale('he'),
                isSelected: languageProvider.languageCode == 'he',
                onTap: () {
                  languageProvider.setLanguage('he');
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: AppTheme.spacingM),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageSelector(BuildContext context, LanguageProvider languageProvider) {
    String currentLanguage;
    switch (languageProvider.languageCode) {
      case 'ar':
        currentLanguage = 'العربية';
        break;
      case 'he':
        currentLanguage = 'עברית';
        break;
      default:
        currentLanguage = 'English';
    }

    return ModernCard(
      onTap: () => _showLanguageDialog(context, languageProvider),
      child: Row(
        children: [
          const Icon(Icons.language, color: AppTheme.primaryColor),
          const SizedBox(width: AppTheme.spacingM),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                languageProvider.t('language'),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              Text(
                currentLanguage,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const Spacer(),
          const Icon(Icons.chevron_right, color: AppTheme.textHint),
        ],
      ),
    );
  }

  Widget _buildLoggedInProfile(BuildContext context, AuthProvider authProvider, LanguageProvider languageProvider) {
    final user = authProvider.user;

    String currentLanguage;
    switch (languageProvider.languageCode) {
      case 'ar':
        currentLanguage = 'العربية';
        break;
      case 'he':
        currentLanguage = 'עברית';
        break;
      default:
        currentLanguage = 'English';
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      child: Column(
        children: [
          // Profile header
          ModernCard(
            child: Column(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primaryLight,
                        AppTheme.primaryColor,
                      ],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      (user?.displayName ?? user?.email ?? 'U')[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppTheme.spacingM),
                Text(
                  user?.displayName ?? languageProvider.t('patient'),
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Text(
                  user?.email ?? '',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (user?.phoneNumber != null) ...[
                  const SizedBox(height: AppTheme.spacingXS),
                  Text(
                    user!.phoneNumber!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: AppTheme.spacingM),

          // Menu items
          ModernCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _ProfileMenuItem(
                  icon: Icons.edit,
                  title: languageProvider.t('editProfile'),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(languageProvider.t('editProfileComingSoon'))),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.language,
                  title: languageProvider.t('language'),
                  subtitle: currentLanguage,
                  onTap: () => _showLanguageDialog(context, languageProvider),
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.info_outline,
                  title: languageProvider.t('about'),
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: languageProvider.t('appName'),
                      applicationVersion: '1.0.0',
                      applicationLegalese: '2024 Adel Clinic. All rights reserved.',
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: AppTheme.spacingM),

          // Logout button
          ModernCard(
            padding: EdgeInsets.zero,
            child: _ProfileMenuItem(
              icon: Icons.logout,
              title: languageProvider.t('logout'),
              iconColor: AppTheme.errorColor,
              titleColor: AppTheme.errorColor,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(languageProvider.t('logout')),
                    content: Text(languageProvider.t('signOutConfirmation')),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: Text(languageProvider.t('cancel')),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: Text(languageProvider.t('logout')),
                      ),
                    ],
                  ),
                );

                if (confirm == true && context.mounted) {
                  await authProvider.signOut();
                }
              },
            ),
          ),

          const SizedBox(height: 120), // Space for floating nav bar
        ],
      ),
    );
  }
}

class _LanguageOption extends StatelessWidget {
  final String label;
  final Locale locale;
  final bool isSelected;
  final VoidCallback onTap;

  const _LanguageOption({
    required this.label,
    required this.locale,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(
        label,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          color: isSelected ? AppTheme.primaryColor : null,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppTheme.primaryColor)
          : null,
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? titleColor;

  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
    this.iconColor,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingM,
          vertical: AppTheme.spacingM,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: iconColor ?? AppTheme.textSecondary,
            ),
            const SizedBox(width: AppTheme.spacingM),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: titleColor,
                        ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: AppTheme.textHint,
            ),
          ],
        ),
      ),
    );
  }
}
