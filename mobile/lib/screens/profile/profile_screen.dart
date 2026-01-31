import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: authProvider.isLoggedIn
          ? _buildLoggedInProfile(context, authProvider)
          : _buildGuestProfile(context),
    );
  }

  Widget _buildGuestProfile(BuildContext context) {
    return Center(
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
              'Welcome to Adel Clinic',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              'Sign in to manage your appointments and profile',
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
                child: const Text('Sign In'),
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
              child: const Text("Don't have an account? Register"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoggedInProfile(BuildContext context, AuthProvider authProvider) {
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
                  user?.displayName ?? 'Patient',
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
                  title: 'Edit Profile',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Edit Profile coming soon!')),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.notifications,
                  title: 'Notifications',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Notifications settings coming soon!')),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.language,
                  title: 'Language',
                  subtitle: 'English',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Language settings coming soon!')),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.help_outline,
                  title: 'Help & Support',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Help & Support coming soon!')),
                    );
                  },
                ),
                const Divider(height: 1),
                _ProfileMenuItem(
                  icon: Icons.info_outline,
                  title: 'About',
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'Adel Clinic',
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
              title: 'Sign Out',
              iconColor: AppTheme.errorColor,
              titleColor: AppTheme.errorColor,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Sign Out'),
                    content: const Text('Are you sure you want to sign out?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('Sign Out'),
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

          const SizedBox(height: AppTheme.spacingXL),
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
