import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../themes/app_design_system.dart';

/// A collection of common button components used across the app
class AppButtons {
  AppButtons._();

  // Primary Button
  static Widget primaryButton({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isFullWidth = false,
    IconData? icon,
  }) {
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      child: ElevatedButton(
        style: AppDesignSystem.primaryButtonStyle,
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? SizedBox(
                width: 24.w,
                height: 24.w,
                child: const CircularProgressIndicator(
                  color: AppDesignSystem.white,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20.sp),
                    SizedBox(width: AppDesignSystem.spacing8),
                  ],
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: AppDesignSystem.fontMedium,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  // Secondary Button
  static Widget secondaryButton({
    required String text,
    required VoidCallback onPressed,
    bool isLoading = false,
    bool isFullWidth = false,
    IconData? icon,
  }) {
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      child: ElevatedButton(
        style: AppDesignSystem.secondaryButtonStyle,
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? SizedBox(
                width: 24.w,
                height: 24.w,
                child: const CircularProgressIndicator(
                  color: AppDesignSystem.primaryColor,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20.sp),
                    SizedBox(width: AppDesignSystem.spacing8),
                  ],
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: AppDesignSystem.fontMedium,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  // Text Button
  static Widget textButton({
    required String text,
    required VoidCallback onPressed,
    IconData? icon,
  }) {
    return TextButton(
      style: AppDesignSystem.textButtonStyle,
      onPressed: onPressed,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 20.sp),
            SizedBox(width: AppDesignSystem.spacing8),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: AppDesignSystem.fontMedium,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
