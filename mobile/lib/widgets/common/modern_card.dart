import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class ModernCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final double? elevation;

  const ModernCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.elevation,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.only(bottom: AppTheme.spacingM),
      child: Material(
        elevation: elevation ?? AppTheme.elevationS,
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        color: backgroundColor ?? Colors.white,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
          child: Padding(
            padding: padding ?? const EdgeInsets.all(AppTheme.spacingM),
            child: child,
          ),
        ),
      ),
    );
  }
}
