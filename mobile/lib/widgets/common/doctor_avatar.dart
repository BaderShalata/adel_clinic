import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../theme/app_theme.dart';
import '../../models/doctor.dart';

/// A widget that displays a doctor's avatar image or initials fallback.
class DoctorAvatar extends StatelessWidget {
  final Doctor doctor;
  final double size;
  final double? borderRadius;
  final Color? backgroundColor;
  final Color? textColor;
  final BoxShape shape;
  final List<BoxShadow>? boxShadow;
  final Gradient? gradient;

  const DoctorAvatar({
    super.key,
    required this.doctor,
    this.size = 60,
    this.borderRadius,
    this.backgroundColor,
    this.textColor,
    this.shape = BoxShape.rectangle,
    this.boxShadow,
    this.gradient,
  });

  String _getInitials(String name) {
    if (name.isEmpty) return 'D';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  String _getDisplayName(BuildContext context) {
    final locale = Localizations.localeOf(context);
    if (locale.languageCode == 'en' && doctor.fullNameEn != null && doctor.fullNameEn!.isNotEmpty) {
      return doctor.fullNameEn!;
    } else if (locale.languageCode == 'he' && doctor.fullNameHe != null && doctor.fullNameHe!.isNotEmpty) {
      return doctor.fullNameHe!;
    }
    return doctor.fullName;
  }

  @override
  Widget build(BuildContext context) {
    final displayName = _getDisplayName(context);
    final initials = _getInitials(displayName);
    final effectiveBorderRadius = borderRadius ?? (shape == BoxShape.circle ? size / 2 : AppTheme.radiusM);
    final effectiveBackgroundColor = backgroundColor ?? AppTheme.primaryColor.withValues(alpha: 0.1);
    final effectiveTextColor = textColor ?? AppTheme.primaryColor;

    // If doctor has an image URL, show the image
    if (doctor.imageUrl != null && doctor.imageUrl!.isNotEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          borderRadius: shape == BoxShape.circle ? null : BorderRadius.circular(effectiveBorderRadius),
          shape: shape,
          boxShadow: boxShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: CachedNetworkImage(
          imageUrl: doctor.imageUrl!,
          fit: BoxFit.cover,
          placeholder: (context, url) => _buildInitialsFallback(
            initials,
            effectiveBackgroundColor,
            effectiveTextColor,
            effectiveBorderRadius,
          ),
          errorWidget: (context, url, error) => _buildInitialsFallback(
            initials,
            effectiveBackgroundColor,
            effectiveTextColor,
            effectiveBorderRadius,
          ),
        ),
      );
    }

    // No image URL, show initials
    return _buildInitialsFallback(
      initials,
      effectiveBackgroundColor,
      effectiveTextColor,
      effectiveBorderRadius,
    );
  }

  Widget _buildInitialsFallback(
    String initials,
    Color bgColor,
    Color txtColor,
    double radius,
  ) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: gradient == null ? bgColor : null,
        gradient: gradient,
        borderRadius: shape == BoxShape.circle ? null : BorderRadius.circular(radius),
        shape: shape,
        boxShadow: boxShadow,
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontSize: size * 0.4,
            fontWeight: FontWeight.bold,
            color: txtColor,
          ),
        ),
      ),
    );
  }
}

/// A large doctor avatar for detail screens with gradient background.
class DoctorAvatarLarge extends StatelessWidget {
  final Doctor doctor;
  final double size;

  const DoctorAvatarLarge({
    super.key,
    required this.doctor,
    this.size = 90,
  });

  @override
  Widget build(BuildContext context) {
    return DoctorAvatar(
      doctor: doctor,
      size: size,
      borderRadius: AppTheme.radiusL,
      backgroundColor: Colors.white,
      textColor: AppTheme.primaryColor,
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.2),
          blurRadius: 16,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }
}

/// A card-style doctor avatar with gradient background.
class DoctorAvatarCard extends StatelessWidget {
  final Doctor doctor;
  final double size;
  final Color? statusColor;

  const DoctorAvatarCard({
    super.key,
    required this.doctor,
    this.size = 70,
    this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = statusColor ?? AppTheme.primaryColor;

    // If doctor has an image, show it with slight border
    if (doctor.imageUrl != null && doctor.imageUrl!.isNotEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: CachedNetworkImage(
          imageUrl: doctor.imageUrl!,
          fit: BoxFit.cover,
          placeholder: (context, url) => _buildGradientFallback(context, color),
          errorWidget: (context, url, error) => _buildGradientFallback(context, color),
        ),
      );
    }

    return _buildGradientFallback(context, color);
  }

  Widget _buildGradientFallback(BuildContext context, Color color) {
    final locale = Localizations.localeOf(context);
    String displayName = doctor.fullName;
    if (locale.languageCode == 'en' && doctor.fullNameEn != null) {
      displayName = doctor.fullNameEn!;
    } else if (locale.languageCode == 'he' && doctor.fullNameHe != null) {
      displayName = doctor.fullNameHe!;
    }

    final parts = displayName.trim().split(' ');
    final initials = parts.length >= 2
        ? '${parts[0][0]}${parts[1][0]}'.toUpperCase()
        : (displayName.isNotEmpty ? displayName[0].toUpperCase() : 'D');

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color,
            color.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontSize: size * 0.35,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }
}
