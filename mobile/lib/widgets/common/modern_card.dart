import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme/app_theme.dart';

class ModernCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final double? elevation;
  final List<BoxShadow>? shadow;
  final Gradient? gradient;
  final BorderRadius? borderRadius;
  final Border? border;
  final bool animate;

  const ModernCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.elevation,
    this.shadow,
    this.gradient,
    this.borderRadius,
    this.border,
    this.animate = false,
  });

  @override
  State<ModernCard> createState() => _ModernCardState();
}

class _ModernCardState extends State<ModernCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final cardBorderRadius = widget.borderRadius ?? BorderRadius.circular(AppTheme.radiusL);

    Widget card = AnimatedContainer(
      duration: AppTheme.animFast,
      margin: widget.margin ?? const EdgeInsets.only(bottom: AppTheme.spacingM),
      decoration: BoxDecoration(
        color: widget.gradient == null ? (widget.backgroundColor ?? Colors.white) : null,
        gradient: widget.gradient,
        borderRadius: cardBorderRadius,
        border: widget.border,
        boxShadow: widget.shadow ?? [
          BoxShadow(
            color: _isPressed
                ? Colors.black.withValues(alpha: 0.02)
                : Colors.black.withValues(alpha: 0.06),
            blurRadius: _isPressed ? 4 : 12,
            offset: Offset(0, _isPressed ? 2 : 4),
            spreadRadius: _isPressed ? -2 : 0,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      transform: _isPressed
          ? (Matrix4.identity()..scale(0.98, 0.98, 1.0))
          : Matrix4.identity(),
      child: Material(
        color: Colors.transparent,
        borderRadius: cardBorderRadius,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: widget.onTap,
          onTapDown: widget.onTap != null ? (_) => setState(() => _isPressed = true) : null,
          onTapUp: widget.onTap != null ? (_) => setState(() => _isPressed = false) : null,
          onTapCancel: widget.onTap != null ? () => setState(() => _isPressed = false) : null,
          borderRadius: cardBorderRadius,
          splashColor: AppTheme.primaryColor.withValues(alpha: 0.08),
          highlightColor: AppTheme.primaryColor.withValues(alpha: 0.04),
          child: Padding(
            padding: widget.padding ?? const EdgeInsets.all(AppTheme.spacingM),
            child: widget.child,
          ),
        ),
      ),
    );

    if (widget.animate) {
      return card
          .animate()
          .fadeIn(duration: 400.ms, curve: Curves.easeOut)
          .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOut);
    }

    return card;
  }
}

// Gradient variant of the card
class GradientCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Gradient gradient;
  final BorderRadius? borderRadius;

  const GradientCard({
    super.key,
    required this.child,
    required this.gradient,
    this.onTap,
    this.padding,
    this.margin,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return ModernCard(
      onTap: onTap,
      padding: padding,
      margin: margin,
      gradient: gradient,
      borderRadius: borderRadius,
      shadow: AppTheme.coloredShadow,
      child: child,
    );
  }
}

// Stats card with icon
class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final bool highlight;
  final VoidCallback? onTap;

  const StatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.highlight = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ModernCard(
      onTap: onTap,
      margin: EdgeInsets.zero,
      border: highlight ? Border.all(color: color, width: 2) : null,
      shadow: highlight ? [
        BoxShadow(
          color: color.withValues(alpha: 0.2),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ] : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: highlight ? color : AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: AppTheme.spacingXS),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
