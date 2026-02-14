import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../theme/app_theme.dart';

class LoadingIndicator extends StatelessWidget {
  final String? message;

  const LoadingIndicator({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(AppTheme.spacingL),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppTheme.radiusL),
              boxShadow: AppTheme.softShadow,
            ),
            child: const CircularProgressIndicator(
              color: AppTheme.primaryColor,
              strokeWidth: 3,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: AppTheme.spacingL),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ],
      ),
    );
  }
}

// Shimmer loading placeholder
class ShimmerLoading extends StatelessWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerLoading({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.surfaceMedium,
      highlightColor: Colors.white,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppTheme.surfaceMedium,
          borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusS),
        ),
      ),
    );
  }
}

// Shimmer card placeholder
class ShimmerCard extends StatelessWidget {
  final double? height;
  final EdgeInsetsGeometry? margin;

  const ShimmerCard({
    super.key,
    this.height,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.surfaceMedium,
      highlightColor: Colors.white,
      child: Container(
        height: height ?? 120,
        margin: margin ?? const EdgeInsets.only(bottom: AppTheme.spacingM),
        decoration: BoxDecoration(
          color: AppTheme.surfaceMedium,
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
        ),
      ),
    );
  }
}

// Shimmer list placeholder
class ShimmerList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final EdgeInsetsGeometry? padding;

  const ShimmerList({
    super.key,
    this.itemCount = 3,
    this.itemHeight = 80,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
      child: Column(
        children: List.generate(
          itemCount,
          (index) => Padding(
            padding: const EdgeInsets.only(bottom: AppTheme.spacingM),
            child: Shimmer.fromColors(
              baseColor: AppTheme.surfaceMedium,
              highlightColor: Colors.white,
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceMedium,
                      borderRadius: BorderRadius.circular(AppTheme.radiusM),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 16,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMedium,
                            borderRadius: BorderRadius.circular(AppTheme.radiusS),
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingS),
                        Container(
                          height: 12,
                          width: 150,
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMedium,
                            borderRadius: BorderRadius.circular(AppTheme.radiusS),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Shimmer stats grid placeholder
class ShimmerStatsGrid extends StatelessWidget {
  final int count;

  const ShimmerStatsGrid({super.key, this.count = 4});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppTheme.spacingM,
      crossAxisSpacing: AppTheme.spacingM,
      childAspectRatio: 1.3,
      children: List.generate(
        count,
        (index) => Shimmer.fromColors(
          baseColor: AppTheme.surfaceMedium,
          highlightColor: Colors.white,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.surfaceMedium,
              borderRadius: BorderRadius.circular(AppTheme.radiusL),
            ),
          ),
        ),
      ),
    );
  }
}
