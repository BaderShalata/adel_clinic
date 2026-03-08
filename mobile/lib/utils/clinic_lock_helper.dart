import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/language_provider.dart';
import '../theme/app_theme.dart';

/// Checks if the clinic is locked. If locked, shows a dialog and returns true.
/// If not locked, returns false and the caller can proceed.
Future<bool> checkClinicLockedAndBlock(BuildContext context) async {
  final isLocked = await ApiService().getClinicLockStatus();
  if (!isLocked || !context.mounted) return false;

  final lang = context.read<LanguageProvider>();
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      icon: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppTheme.errorColor.withValues(alpha: 0.1),
        ),
        child: const Icon(Icons.lock_rounded, size: 32, color: AppTheme.errorColor),
      ),
      title: Text(
        lang.t('clinicLocked'),
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
      content: Text(
        lang.t('clinicLockedMessage'),
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.grey[600], height: 1.5),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(lang.t('ok'), style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
      ],
    ),
  );
  return true;
}
