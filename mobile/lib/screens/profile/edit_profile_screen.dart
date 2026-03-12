import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _idNumberController;
  String? _selectedGender;
  bool _isLoading = false;
  bool _isUploadingImage = false;
  File? _selectedImage;
  String? _uploadedPhotoUrl;

  @override
  void initState() {
    super.initState();
    final authProvider = context.read<AuthProvider>();
    _nameController = TextEditingController(text: authProvider.user?.displayName ?? '');
    _phoneController = TextEditingController(text: authProvider.user?.phoneNumber ?? '');
    _idNumberController = TextEditingController(text: authProvider.user?.idNumber ?? '');
    _selectedGender = authProvider.user?.gender;
    _uploadedPhotoUrl = authProvider.user?.photoUrl;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _idNumberController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (pickedFile != null) {
        setState(() {
          _selectedImage = File(pickedFile.path);
        });
        // Automatically upload after picking
        await _uploadImage();
      }
    } catch (e) {
      if (mounted) {
        final lang = context.read<LanguageProvider>();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lang.t('failedToPickImage')),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _uploadImage() async {
    if (_selectedImage == null) return;

    setState(() => _isUploadingImage = true);

    try {
      final bytes = await _selectedImage!.readAsBytes();
      final base64Image = base64Encode(bytes);
      final authProvider = context.read<AuthProvider>();
      final fileName = 'profile_${authProvider.user?.id ?? 'unknown'}_${DateTime.now().millisecondsSinceEpoch}.jpg';

      final url = await ApiService().uploadImage(
        base64Image: base64Image,
        fileName: fileName,
        folder: 'profile-pictures',
        mimeType: 'image/jpeg',
      );

      setState(() {
        _uploadedPhotoUrl = url;
      });

      if (mounted) {
        final lang = context.read<LanguageProvider>();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lang.t('imageUploaded')),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final lang = context.read<LanguageProvider>();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lang.t('failedToUploadImage')),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingImage = false);
      }
    }
  }

  void _showImagePickerOptions() {
    final lang = context.read<LanguageProvider>();
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusL)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingM),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera, color: AppTheme.primaryColor),
                title: Text(lang.t('takePhoto')),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: AppTheme.primaryColor),
                title: Text(lang.t('chooseFromGallery')),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showResetPasswordDialog() {
    final authProvider = context.read<AuthProvider>();
    final email = authProvider.user?.email ?? '';
    final resetEmailController = TextEditingController(text: email);
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
              builder: (_, error, _) {
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
              final emailText = resetEmailController.text.trim();
              if (emailText.isEmpty) return;
              errorNotifier.value = null;
              try {
                await AuthService().sendPasswordResetEmail(emailText);
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
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

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.updateProfile(
        displayName: _nameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        idNumber: _idNumberController.text.trim(),
        gender: _selectedGender,
        photoUrl: _uploadedPhotoUrl,
      );

      if (mounted) {
        final lang = context.read<LanguageProvider>();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lang.t('profileUpdated')),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        final lang = context.read<LanguageProvider>();
        final authProvider = context.read<AuthProvider>();
        // Check if it's an ID number error
        final errorKey = authProvider.errorKey;
        final errorMsg = errorKey != null ? lang.t(errorKey) : lang.t('failedToUpdateProfile');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMsg),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('editProfile')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingM),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Profile picture
              Center(
                child: GestureDetector(
                  onTap: _isUploadingImage ? null : _showImagePickerOptions,
                  child: Stack(
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppTheme.primaryLight,
                              AppTheme.primaryColor,
                            ],
                          ),
                          shape: BoxShape.circle,
                          image: _selectedImage != null
                              ? DecorationImage(
                                  image: FileImage(_selectedImage!),
                                  fit: BoxFit.cover,
                                )
                              : (_uploadedPhotoUrl != null && _uploadedPhotoUrl!.isNotEmpty)
                                  ? DecorationImage(
                                      image: NetworkImage(_uploadedPhotoUrl!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                        ),
                        child: (_selectedImage == null && (_uploadedPhotoUrl == null || _uploadedPhotoUrl!.isEmpty))
                            ? Center(
                                child: Text(
                                  (user?.displayName ?? user?.email ?? 'U')[0].toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 48,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      if (_isUploadingImage)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            ),
                          ),
                        ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: AppTheme.spacingXL),

              // Form fields
              ModernCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lang.t('personalInformation'),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: AppTheme.spacingM),

                    // Email (read-only)
                    TextFormField(
                      initialValue: user?.email ?? '',
                      decoration: InputDecoration(
                        labelText: lang.t('email'),
                        prefixIcon: const Icon(Icons.email_outlined),
                        enabled: false,
                      ),
                    ),

                    const SizedBox(height: AppTheme.spacingM),

                    // Full Name
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: lang.t('fullName'),
                        prefixIcon: const Icon(Icons.person_outline),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return lang.t('pleaseEnterName');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: AppTheme.spacingM),

                    // Phone Number
                    TextFormField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        labelText: lang.t('phoneNumber'),
                        prefixIcon: const Icon(Icons.phone_outlined),
                      ),
                      keyboardType: TextInputType.phone,
                    ),

                    const SizedBox(height: AppTheme.spacingM),

                    // National ID Number
                    TextFormField(
                      controller: _idNumberController,
                      decoration: InputDecoration(
                        labelText: lang.t('idNumber'),
                        prefixIcon: const Icon(Icons.badge_outlined),
                      ),
                      keyboardType: TextInputType.number,
                    ),

                    const SizedBox(height: AppTheme.spacingM),

                    // Gender Selection
                    Text(
                      lang.t('gender'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _GenderOption(
                          icon: Icons.male,
                          label: lang.t('male'),
                          selected: _selectedGender == 'male',
                          onTap: () => setState(() => _selectedGender = 'male'),
                          color: const Color(0xFF2196F3),
                        ),
                        const SizedBox(width: 12),
                        _GenderOption(
                          icon: Icons.female,
                          label: lang.t('female'),
                          selected: _selectedGender == 'female',
                          onTap: () => setState(() => _selectedGender = 'female'),
                          color: const Color(0xFFE91E63),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppTheme.spacingXL),

              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(lang.t('save')),
                ),
              ),
              const SizedBox(height: AppTheme.spacingM),

              // Reset Password button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _showResetPasswordDialog,
                  icon: const Icon(Icons.lock_reset_rounded),
                  label: Text(lang.t('resetPassword')),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryColor,
                    side: const BorderSide(color: AppTheme.primaryColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GenderOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color color;

  const _GenderOption({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.1) : Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? color : Colors.grey[300]!,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? color : Colors.grey[500], size: 28),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  color: selected ? color : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
