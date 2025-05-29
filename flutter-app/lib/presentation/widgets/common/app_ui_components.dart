import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../themes/app_design_system.dart';

/// Common UI components used throughout the app
class AppComponents {
  AppComponents._();

  // App bar with consistent styling and optional actions
  static AppBar appBar({
    required String title,
    List<Widget>? actions,
    bool automaticallyImplyLeading = true,
    Widget? leading,
    PreferredSizeWidget? bottom,
    Color? backgroundColor,
    Color? foregroundColor,
  }) {
    return AppBar(
      title: Text(title),
      actions: actions,
      automaticallyImplyLeading: automaticallyImplyLeading,
      leading: leading,
      bottom: bottom,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      elevation: 0,
    );
  }

  // Section header with title and optional action button
  static Widget sectionHeader({
    required String title,
    VoidCallback? onActionPressed,
    String? actionLabel,
    bool hasPadding = true,
  }) {
    return Padding(
      padding: hasPadding
          ? EdgeInsets.symmetric(
              horizontal: AppDesignSystem.spacing16,
              vertical: AppDesignSystem.spacing12,
            )
          : EdgeInsets.zero,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppDesignSystem.titleMedium,
          ),
          if (onActionPressed != null && actionLabel != null)
            TextButton(
              onPressed: onActionPressed,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    actionLabel,
                    style: TextStyle(
                      fontSize: AppDesignSystem.fontSmall,
                      color: AppDesignSystem.primaryColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(width: AppDesignSystem.spacing4),
                  Icon(
                    Icons.arrow_forward,
                    size: 16.sp,
                    color: AppDesignSystem.primaryColor,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // Avatar widget with text or image
  static Widget avatar({
    String? text,
    String? imageUrl,
    double size = 40,
    Color? backgroundColor,
    Color? textColor,
  }) {
    final bgColor = backgroundColor ??
        AppDesignSystem.primaryColor.withOpacity(0.2);
    final txtColor = textColor ?? AppDesignSystem.primaryColor;

    if (imageUrl != null && imageUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: Image.network(
          imageUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _textAvatar(
              text: text,
              size: size,
              backgroundColor: bgColor,
              textColor: txtColor,
            );
          },
        ),
      );
    }

    return _textAvatar(
      text: text,
      size: size,
      backgroundColor: bgColor,
      textColor: txtColor,
    );
  }

  // Private helper method for text avatar
  static Widget _textAvatar({
    String? text,
    required double size,
    required Color backgroundColor,
    required Color textColor,
  }) {
    final displayText = text != null && text.isNotEmpty
        ? text.substring(0, text.length > 2 ? 2 : text.length).toUpperCase()
        : 'NA';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: size * 0.4,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  // Badge widget
  static Widget badge({
    required String text,
    Color? backgroundColor,
    Color? textColor,
    double? fontSize,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppDesignSystem.spacing8,
        vertical: AppDesignSystem.spacing4,
      ),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppDesignSystem.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppDesignSystem.radiusSmall),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor ?? AppDesignSystem.primaryColor,
          fontSize: fontSize ?? AppDesignSystem.fontXSmall,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  // Chip widget
  static Widget chip({
    required String label,
    VoidCallback? onDeleted,
    Color? backgroundColor,
    Color? textColor,
  }) {
    return Chip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: AppDesignSystem.fontXSmall,
          color: textColor ?? AppDesignSystem.black,
        ),
      ),
      backgroundColor:
          backgroundColor ?? AppDesignSystem.lightGray.withOpacity(0.5),
      deleteIcon: onDeleted != null
          ? const Icon(
              Icons.close,
              size: 16,
            )
          : null,
      onDeleted: onDeleted,
      padding: EdgeInsets.symmetric(
        horizontal: AppDesignSystem.spacing4,
        vertical: AppDesignSystem.spacing2,
      ),
    );
  }

  // Bottom sheet with consistent styling
  static Future<T?> showBottomSheet<T>({
    required BuildContext context,
    required Widget child,
    String? title,
    bool isScrollControlled = true,
    bool isDismissible = true,
    bool enableDrag = true,
    Color? backgroundColor,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      backgroundColor: backgroundColor ?? AppDesignSystem.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppDesignSystem.radiusLarge),
          topRight: Radius.circular(AppDesignSystem.radiusLarge),
        ),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar
                Container(
                  width: 40.w,
                  height: 4.h,
                  margin: EdgeInsets.symmetric(vertical: AppDesignSystem.spacing12),
                  decoration: BoxDecoration(
                    color: AppDesignSystem.lightGray,
                    borderRadius: BorderRadius.circular(AppDesignSystem.radiusSmall),
                  ),
                ),
                if (title != null) ...[
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: AppDesignSystem.spacing24,
                      vertical: AppDesignSystem.spacing8,
                    ),
                    child: Text(
                      title,
                      style: AppDesignSystem.titleMedium,
                    ),
                  ),
                  AppDesignSystem.divider,
                ],
                Flexible(
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: AppDesignSystem.spacing24,
                        vertical: AppDesignSystem.spacing16,
                      ),
                      child: child,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Dialog with consistent styling
  static Future<T?> showAppDialog<T>({
    required BuildContext context,
    required Widget child,
    String? title,
    bool barrierDismissible = true,
    List<Widget>? actions,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (context) {
        return AlertDialog(
          title: title != null ? Text(title) : null,
          content: child,
          actions: actions,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          ),
        );
      },
    );
  }

  // Confirmation dialog
  static Future<bool?> showConfirmationDialog({
    required BuildContext context,
    required String title,
    required String message,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
    bool isDestructive = false,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                cancelText,
                style: const TextStyle(
                  color: AppDesignSystem.mediumGray,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(
                confirmText,
                style: TextStyle(
                  color: isDestructive
                      ? AppDesignSystem.errorColor
                      : AppDesignSystem.primaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          ),
        );
      },
    );
  }

  // Tab bar with consistent styling
  static TabBar tabBar({
    required List<Tab> tabs,
    TabController? controller,
    bool isScrollable = false,
  }) {
    return TabBar(
      controller: controller,
      tabs: tabs,
      isScrollable: isScrollable,
      labelColor: AppDesignSystem.primaryColor,
      unselectedLabelColor: AppDesignSystem.mediumGray,
      indicatorColor: AppDesignSystem.primaryColor,
      indicatorWeight: 3,
      labelStyle: TextStyle(
        fontSize: AppDesignSystem.fontSmall,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: AppDesignSystem.fontSmall,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
