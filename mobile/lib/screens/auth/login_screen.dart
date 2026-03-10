import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/auth_service.dart';
import '../../services/storage_service.dart';
import '../../theme/app_theme.dart';
import '../shell/main_shell.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _localAuth = LocalAuthentication();
  final _storage = StorageService();
  bool _obscurePassword = true;
  int _failedAttempts = 0;
  bool _biometricAvailable = false;
  bool _hasSavedCredentials = false;

  @override
  void initState() {
    super.initState();
    _initBiometric();
  }

  Future<void> _initBiometric() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics || await _localAuth.isDeviceSupported();
      final hasCreds = await _storage.hasCredentials();

      if (hasCreds) {
        final creds = await _storage.getCredentials();
        if (creds != null && mounted) {
          _emailController.text = creds['email']!;
          _passwordController.text = creds['password']!;
        }
      }

      if (mounted) {
        setState(() {
          _biometricAvailable = canCheck;
          _hasSavedCredentials = hasCreds;
        });

        // Auto-trigger biometric if credentials are saved
        if (canCheck && hasCreds) {
          _handleBiometricLogin();
        }
      }
    } catch (_) {}
  }

  Future<void> _handleBiometricLogin() async {
    try {
      final lang = context.read<LanguageProvider>();
      final authenticated = await _localAuth.authenticate(
        localizedReason: lang.t('biometricReason'),
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );

      if (authenticated && mounted) {
        final creds = await _storage.getCredentials();
        if (creds != null) {
          _emailController.text = creds['email']!;
          _passwordController.text = creds['password']!;
          _handleLogin();
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final success = await context.read<AuthProvider>().signIn(
            _emailController.text.trim(),
            _passwordController.text,
          );

      if (mounted) {
        if (success) {
          _failedAttempts = 0;
          // Save credentials for biometric login
          _storage.saveCredentials(
            _emailController.text.trim(),
            _passwordController.text,
          );
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const MainShell()),
            (route) => false,
          );
        } else {
          final errorKey = context.read<AuthProvider>().errorKey;
          final lang = context.read<LanguageProvider>();
          final errorMessage = errorKey != null
              ? lang.t(errorKey)
              : lang.t('loginFailed');

          // Only count failed attempts for credential errors (wrong password)
          final isUserNotFound = errorKey == 'userNotFound';
          if (!isUserNotFound) {
            setState(() => _failedAttempts++);
          }

          if (!isUserNotFound && _failedAttempts >= 5) {
            setState(() => _failedAttempts = 0);
            _showResetPasswordDialog();
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text(errorMessage)),
                  ],
                ),
                backgroundColor: AppTheme.errorColor,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        }
      }
    }
  }

  void _showResetPasswordDialog() {
    final resetEmailController = TextEditingController(text: _emailController.text.trim());
    final lang = context.read<LanguageProvider>();
    final errorNotifier = ValueNotifier<String?>(null);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(lang.t('resetPassword')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(lang.t('resetPasswordDescription')),
            const SizedBox(height: 16),
            TextField(
              controller: resetEmailController,
              decoration: InputDecoration(
                labelText: lang.t('email'),
                prefixIcon: const Icon(Icons.email_outlined),
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            ValueListenableBuilder<String?>(
              valueListenable: errorNotifier,
              builder: (_, error, __) {
                if (error == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    error,
                    style: const TextStyle(color: AppTheme.errorColor, fontSize: 13),
                  ),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(lang.t('cancel')),
          ),
          ElevatedButton(
            onPressed: () async {
              final email = resetEmailController.text.trim();
              if (email.isEmpty) return;
              errorNotifier.value = null;
              try {
                await AuthService().sendPasswordResetEmail(email);
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  setState(() => _failedAttempts = 0);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(lang.t('resetPasswordEmailSent')),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                }
              } on AuthException catch (e) {
                errorNotifier.value = lang.t(e.translationKey);
              } catch (_) {
                errorNotifier.value = lang.t('resetPasswordFailed');
              }
            },
            child: Text(lang.t('sendResetLink')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('signIn')),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [

              // Logo
              Center(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Image.asset(
                        'assets/ClinicLogo.jpeg',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.spacingXL),

              // Header
              Text(
                lang.t('welcomeBack'),
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppTheme.spacingS),
              Text(
                lang.t('signInSubtitle'),
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppTheme.spacingXL),

              // Email
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: lang.t('email'),
                  prefixIcon: const Icon(Icons.email_outlined),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return lang.t('pleaseEnterEmail');
                  }
                  if (!value.contains('@')) {
                    return lang.t('invalidEmail');
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.spacingM),

              // Password
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: lang.t('password'),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return lang.t('pleaseEnterPassword');
                  }
                  if (value.length < 6) {
                    return lang.t('passwordMinLength');
                  }
                  return null;
                },
              ),
              // Forgot Password
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: TextButton(
                  onPressed: _showResetPasswordDialog,
                  child: Text(
                    lang.t('forgotPassword'),
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.spacingS),

              // Login Button
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: authProvider.isLoading ? null : _handleLogin,
                  child: authProvider.isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          lang.t('signIn'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
              // Biometric Login Button
              if (_biometricAvailable && _hasSavedCredentials)
                Padding(
                  padding: const EdgeInsets.only(top: AppTheme.spacingS),
                  child: SizedBox(
                    height: 56,
                    child: OutlinedButton.icon(
                      onPressed: authProvider.isLoading ? null : _handleBiometricLogin,
                      icon: const Icon(Icons.fingerprint, size: 28),
                      label: Text(
                        lang.t('biometricLogin'),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppTheme.primaryColor),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: AppTheme.spacingM),

              // Register Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    lang.t('dontHaveAccount'),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const RegisterScreen(),
                        ),
                      );
                    },
                    child: Text(lang.t('register')),
                  ),
                ],
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }
}
