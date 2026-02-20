import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';
import 'edit_profile_screen.dart';
import 'about_screen.dart';
import 'privacy_policy_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final languageProvider = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(languageProvider.t('profile')),
        actions: [
          _buildLanguageDropdown(context, languageProvider),
        ],
      ),
      body: authProvider.isLoggedIn
          ? _buildLoggedInProfile(context, authProvider, languageProvider)
          : _buildGuestProfile(context, languageProvider),
    );
  }

  Widget _buildLanguageDropdown(BuildContext context, LanguageProvider languageProvider) {
    String currentLabel;
    switch (languageProvider.languageCode) {
      case 'ar':
        currentLabel = 'عربي';
        break;
      case 'he':
        currentLabel = 'עברית';
        break;
      default:
        currentLabel = 'EN';
    }

    return PopupMenuButton<String>(
      offset: const Offset(0, 45),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
      ),
      onSelected: (String langCode) {
        languageProvider.setLanguage(langCode);
      },
      itemBuilder: (BuildContext context) => [
        PopupMenuItem<String>(
          value: 'en',
          child: Row(
            children: [
              Text(
                'English',
                style: TextStyle(
                  fontWeight: languageProvider.languageCode == 'en' ? FontWeight.w600 : FontWeight.normal,
                  color: languageProvider.languageCode == 'en' ? AppTheme.primaryColor : null,
                ),
              ),
              if (languageProvider.languageCode == 'en') ...[
                const Spacer(),
                const Icon(Icons.check, color: AppTheme.primaryColor, size: 18),
              ],
            ],
          ),
        ),
        PopupMenuItem<String>(
          value: 'ar',
          child: Row(
            children: [
              Text(
                'العربية',
                style: TextStyle(
                  fontWeight: languageProvider.languageCode == 'ar' ? FontWeight.w600 : FontWeight.normal,
                  color: languageProvider.languageCode == 'ar' ? AppTheme.primaryColor : null,
                ),
              ),
              if (languageProvider.languageCode == 'ar') ...[
                const Spacer(),
                const Icon(Icons.check, color: AppTheme.primaryColor, size: 18),
              ],
            ],
          ),
        ),
        PopupMenuItem<String>(
          value: 'he',
          child: Row(
            children: [
              Text(
                'עברית',
                style: TextStyle(
                  fontWeight: languageProvider.languageCode == 'he' ? FontWeight.w600 : FontWeight.normal,
                  color: languageProvider.languageCode == 'he' ? AppTheme.primaryColor : null,
                ),
              ),
              if (languageProvider.languageCode == 'he') ...[
                const Spacer(),
                const Icon(Icons.check, color: AppTheme.primaryColor, size: 18),
              ],
            ],
          ),
        ),
      ],
      child: Container(
        margin: const EdgeInsetsDirectional.only(end: AppTheme.spacingM),
        padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingS, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.language, color: AppTheme.primaryColor, size: 18),
            const SizedBox(width: 4),
            Text(
              currentLabel,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(width: 2),
            const Icon(Icons.arrow_drop_down, color: AppTheme.primaryColor, size: 20),
          ],
        ),
      ),
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
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/ClinicLogo.jpeg',
                    fit: BoxFit.cover,
                    width: 140,
                    height: 140,
                    errorBuilder: (context, error, stackTrace) {
                      // Fallback to icon if image not found
                      return const Icon(
                        Icons.local_hospital,
                        size: 80,
                        color: AppTheme.primaryColor,
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.spacingXL),
              Text(
                '${languageProvider.t('appName')}',
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
              const SizedBox(height: 120), // Space for floating nav bar
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoggedInProfile(BuildContext context, AuthProvider authProvider, LanguageProvider languageProvider) {
    final user = authProvider.user;

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
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.info_outline,
                  title: languageProvider.t('about'),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AboutScreen()),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.privacy_tip_outlined,
                  title: languageProvider.t('privacyPolicy'),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
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
