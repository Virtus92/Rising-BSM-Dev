import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../themes/app_design_system.dart';
import 'app_buttons.dart';

/// Utility widgets for displaying various states like empty, error, loading
class AppStateWidgets {
  AppStateWidgets._();

  // Empty state widget
  static Widget emptyState({
    required String message,
    String? title,
    IconData? icon,
    VoidCallback? onActionPressed,
    String? actionLabel,
  }) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppDesignSystem.spacing24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 80.sp,
                color: AppDesignSystem.mediumGray,
              ),
              SizedBox(height: AppDesignSystem.spacing24),
            ],
            if (title != null) ...[
              Text(
                title,
                style: AppDesignSystem.titleMedium,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppDesignSystem.spacing12),
            ],
            Text(
              message,
              style: AppDesignSystem.bodyMedium.copyWith(
                color: AppDesignSystem.mediumGray,
              ),
              textAlign: TextAlign.center,
            ),
            if (onActionPressed != null && actionLabel != null) ...[
              SizedBox(height: AppDesignSystem.spacing24),
              AppButtons.primaryButton(
                text: actionLabel,
                onPressed: onActionPressed,
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Error state widget
  static Widget errorState({
    required String message,
    String? title,
    VoidCallback? onRetry,
  }) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppDesignSystem.spacing24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80.sp,
              color: AppDesignSystem.errorColor,
            ),
            SizedBox(height: AppDesignSystem.spacing24),
            if (title != null) ...[
              Text(
                title,
                style: AppDesignSystem.titleMedium,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppDesignSystem.spacing12),
            ],
            Text(
              message,
              style: AppDesignSystem.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              SizedBox(height: AppDesignSystem.spacing24),
              AppButtons.primaryButton(
                text: 'Retry',
                onPressed: onRetry,
                icon: Icons.refresh,
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Loading state widget
  static Widget loadingState({String? message}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            color: AppDesignSystem.primaryColor,
          ),
          if (message != null) ...[
            SizedBox(height: AppDesignSystem.spacing16),
            Text(
              message,
              style: AppDesignSystem.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  // Item shimmer loading
  static Widget shimmerLoading({
    double? width,
    double? height,
    BorderRadius? borderRadius,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius:
            borderRadius ?? BorderRadius.circular(AppDesignSystem.radiusSmall),
      ),
    );
  }

  // List item shimmer
  static Widget listItemShimmer() {
    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: AppDesignSystem.spacing8,
        horizontal: AppDesignSystem.spacing16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              shimmerLoading(
                width: 48.w,
                height: 48.w,
                borderRadius: BorderRadius.circular(AppDesignSystem.radiusSmall),
              ),
              SizedBox(width: AppDesignSystem.spacing16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    shimmerLoading(
                      width: double.infinity,
                      height: 16.h,
                    ),
                    SizedBox(height: AppDesignSystem.spacing8),
                    shimmerLoading(
                      width: 150.w,
                      height: 12.h,
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: AppDesignSystem.spacing8),
          AppDesignSystem.divider,
        ],
      ),
    );
  }

  // Card shimmer
  static Widget cardShimmer() {
    return Container(
      padding: EdgeInsets.all(AppDesignSystem.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
        boxShadow: AppDesignSystem.shadowSmall,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          shimmerLoading(
            width: 120.w,
            height: 20.h,
          ),
          SizedBox(height: AppDesignSystem.spacing12),
          shimmerLoading(
            width: double.infinity,
            height: 16.h,
          ),
          SizedBox(height: AppDesignSystem.spacing8),
          shimmerLoading(
            width: double.infinity,
            height: 16.h,
          ),
          SizedBox(height: AppDesignSystem.spacing8),
          shimmerLoading(
            width: 180.w,
            height: 16.h,
          ),
        ],
      ),
    );
  }

  // List of shimmer loading items
  static Widget shimmerList({int itemCount = 5}) {
    return ListView.builder(
      itemCount: itemCount,
      padding: EdgeInsets.symmetric(vertical: AppDesignSystem.spacing8),
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemBuilder: (context, index) {
        return listItemShimmer();
      },
    );
  }

  // Grid of shimmer loading cards
  static Widget shimmerGrid({int itemCount = 4, int crossAxisCount = 2}) {
    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: AppDesignSystem.spacing16,
        mainAxisSpacing: AppDesignSystem.spacing16,
        childAspectRatio: 1.5,
      ),
      itemCount: itemCount,
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: EdgeInsets.all(AppDesignSystem.spacing16),
      itemBuilder: (context, index) {
        return cardShimmer();
      },
    );
  }
}
