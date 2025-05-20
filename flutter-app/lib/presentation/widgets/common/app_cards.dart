import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../themes/app_design_system.dart';

/// Card components used throughout the app
class AppCards {
  AppCards._();

  // Standard card with customizable content
  static Widget standardCard({
    required Widget child,
    EdgeInsets? padding,
    VoidCallback? onTap,
    Color? backgroundColor,
    List<BoxShadow>? boxShadow,
    double? borderRadius,
    bool hasBorder = false,
    Color borderColor = AppDesignSystem.lightGray,
  }) {
    final cardWidget = Container(
      padding: padding ?? EdgeInsets.all(AppDesignSystem.spacing16),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppDesignSystem.white,
        borderRadius: BorderRadius.circular(
            borderRadius ?? AppDesignSystem.radiusMedium),
        boxShadow: boxShadow ?? AppDesignSystem.shadowSmall,
        border: hasBorder
            ? Border.all(
                color: borderColor,
                width: 1,
              )
            : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(
            borderRadius ?? AppDesignSystem.radiusMedium),
        child: cardWidget,
      );
    }

    return cardWidget;
  }

  // Card with title, subtitle and optional icon
  static Widget infoCard({
    required String title,
    required String subtitle,
    IconData? icon,
    Color? iconColor,
    Color? backgroundColor,
    VoidCallback? onTap,
  }) {
    return standardCard(
      backgroundColor: backgroundColor,
      onTap: onTap,
      child: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: EdgeInsets.all(AppDesignSystem.spacing12),
              decoration: BoxDecoration(
                color: (iconColor ?? AppDesignSystem.primaryColor)
                    .withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppDesignSystem.radiusSmall),
              ),
              child: Icon(
                icon,
                color: iconColor ?? AppDesignSystem.primaryColor,
                size: 24.sp,
              ),
            ),
            SizedBox(width: AppDesignSystem.spacing16),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppDesignSystem.titleSmall,
                ),
                SizedBox(height: AppDesignSystem.spacing4),
                Text(
                  subtitle,
                  style: AppDesignSystem.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Stat card with numeric value and label
  static Widget statCard({
    required String value,
    required String label,
    IconData? icon,
    Color? iconColor,
    Color? backgroundColor,
    VoidCallback? onTap,
    Color? valueColor,
    Widget? trailing,
  }) {
    return standardCard(
      backgroundColor: backgroundColor,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (icon != null)
                Container(
                  padding: EdgeInsets.all(AppDesignSystem.spacing8),
                  decoration: BoxDecoration(
                    color: (iconColor ?? AppDesignSystem.primaryColor)
                        .withOpacity(0.1),
                    borderRadius:
                        BorderRadius.circular(AppDesignSystem.radiusSmall),
                  ),
                  child: Icon(
                    icon,
                    color: iconColor ?? AppDesignSystem.primaryColor,
                    size: 20.sp,
                  ),
                ),
              if (trailing != null) trailing,
            ],
          ),
          SizedBox(height: AppDesignSystem.spacing16),
          Text(
            value,
            style: AppDesignSystem.headlineSmall.copyWith(
              color: valueColor,
            ),
          ),
          SizedBox(height: AppDesignSystem.spacing4),
          Text(
            label,
            style: AppDesignSystem.labelMedium,
          ),
        ],
      ),
    );
  }

  // List item card with title, subtitle, and optional icons/actions
  static Widget listItemCard({
    required String title,
    String? subtitle,
    String? status,
    Widget? leading,
    Widget? trailing,
    VoidCallback? onTap,
    EdgeInsets? padding,
  }) {
    return standardCard(
      padding: padding ??
          EdgeInsets.symmetric(
            horizontal: AppDesignSystem.spacing16,
            vertical: AppDesignSystem.spacing12,
          ),
      onTap: onTap,
      child: Row(
        children: [
          if (leading != null) ...[
            leading,
            SizedBox(width: AppDesignSystem.spacing16),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppDesignSystem.titleSmall,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null) ...[
                  SizedBox(height: AppDesignSystem.spacing4),
                  Text(
                    subtitle,
                    style: AppDesignSystem.bodySmall,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 2,
                  ),
                ],
                if (status != null) ...[
                  SizedBox(height: AppDesignSystem.spacing8),
                  AppDesignSystem.statusBadge(status),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[
            SizedBox(width: AppDesignSystem.spacing16),
            trailing,
          ],
        ],
      ),
    );
  }
}
