import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

/// Design system for the Rising BSM application
/// Contains colors, text styles, spacing, and other design elements
class AppDesignSystem {
  AppDesignSystem._();

  // Colors
  static const Color primaryColor = Color(0xFF2563EB); // Blue 600
  static const Color primaryDark = Color(0xFF1D4ED8); // Blue 700
  static const Color primaryLight = Color(0xFF60A5FA); // Blue 400

  static const Color secondaryColor = Color(0xFF4F46E5); // Indigo 600
  static const Color accentColor = Color(0xFF8B5CF6); // Violet 500

  static const Color successColor = Color(0xFF10B981); // Emerald 500
  static const Color warningColor = Color(0xFFF59E0B); // Amber 500
  static const Color errorColor = Color(0xFFEF4444); // Red 500
  static const Color infoColor = Color(0xFF3B82F6); // Blue 500

  // Neutral colors
  static const Color black = Color(0xFF111827); // Gray 900
  static const Color darkGray = Color(0xFF374151); // Gray 700
  static const Color mediumGray = Color(0xFF6B7280); // Gray 500
  static const Color lightGray = Color(0xFFE5E7EB); // Gray 200
  static const Color background = Color(0xFFF9FAFB); // Gray 50
  static const Color white = Color(0xFFFFFFFF);

  // Dark theme colors
  static const Color darkBackground = Color(0xFF1F2937); // Gray 800
  static const Color darkSurface = Color(0xFF374151); // Gray 700
  static const Color darkCard = Color(0xFF4B5563); // Gray 600

  // Spacing
  static double get spacing2 => 2.w;
  static double get spacing4 => 4.w;
  static double get spacing8 => 8.w;
  static double get spacing12 => 12.w;
  static double get spacing16 => 16.w;
  static double get spacing20 => 20.w;
  static double get spacing24 => 24.w;
  static double get spacing32 => 32.w;
  static double get spacing40 => 40.w;
  static double get spacing48 => 48.w;
  static double get spacing56 => 56.w;
  static double get spacing64 => 64.w;

  // Border radius
  static double get radiusSmall => 4.r;
  static double get radiusMedium => 8.r;
  static double get radiusLarge => 12.r;
  static double get radiusExtraLarge => 16.r;
  static double get radiusRound => 999.r;

  // Font sizes
  static double get fontXSmall => 12.sp;
  static double get fontSmall => 14.sp;
  static double get fontMedium => 16.sp;
  static double get fontLarge => 18.sp;
  static double get fontXLarge => 20.sp;
  static double get fontXXLarge => 24.sp;
  static double get fontDisplay => 30.sp;
  static double get fontDisplayLarge => 36.sp;

  // Text styles
  static TextStyle get bodySmall => TextStyle(
        fontSize: fontSmall,
        fontWeight: FontWeight.normal,
        color: darkGray,
      );

  static TextStyle get bodyMedium => TextStyle(
        fontSize: fontMedium,
        fontWeight: FontWeight.normal,
        color: darkGray,
      );

  static TextStyle get bodyLarge => TextStyle(
        fontSize: fontLarge,
        fontWeight: FontWeight.normal,
        color: darkGray,
      );

  static TextStyle get labelSmall => TextStyle(
        fontSize: fontXSmall,
        fontWeight: FontWeight.w500,
        color: mediumGray,
      );

  static TextStyle get labelMedium => TextStyle(
        fontSize: fontSmall,
        fontWeight: FontWeight.w500,
        color: mediumGray,
      );

  static TextStyle get titleSmall => TextStyle(
        fontSize: fontMedium,
        fontWeight: FontWeight.w600,
        color: black,
      );

  static TextStyle get titleMedium => TextStyle(
        fontSize: fontLarge,
        fontWeight: FontWeight.w600,
        color: black,
      );

  static TextStyle get titleLarge => TextStyle(
        fontSize: fontXLarge,
        fontWeight: FontWeight.w600,
        color: black,
      );

  static TextStyle get headlineSmall => TextStyle(
        fontSize: fontXXLarge,
        fontWeight: FontWeight.bold,
        color: black,
      );

  static TextStyle get headlineMedium => TextStyle(
        fontSize: fontDisplay,
        fontWeight: FontWeight.bold,
        color: black,
      );

  static TextStyle get headlineLarge => TextStyle(
        fontSize: fontDisplayLarge,
        fontWeight: FontWeight.bold,
        color: black,
      );

  // Shadows
  static List<BoxShadow> get shadowSmall => [
        BoxShadow(
          color: Colors.black.withOpacity(0.1),
          blurRadius: 4,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get shadowMedium => [
        BoxShadow(
          color: Colors.black.withOpacity(0.1),
          blurRadius: 8,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get shadowLarge => [
        BoxShadow(
          color: Colors.black.withOpacity(0.1),
          blurRadius: 16,
          offset: const Offset(0, 8),
        ),
      ];

  // Input decoration
  static InputDecoration inputDecoration({
    required String labelText,
    String? hintText,
    Widget? prefixIcon,
    Widget? suffixIcon,
    String? errorText,
  }) {
    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      errorText: errorText,
      filled: true,
      fillColor: white,
      contentPadding: EdgeInsets.symmetric(
        horizontal: spacing16,
        vertical: spacing12,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: const BorderSide(color: lightGray),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: const BorderSide(color: lightGray),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: const BorderSide(color: primaryColor),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: const BorderSide(color: errorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: const BorderSide(color: errorColor),
      ),
      labelStyle: labelMedium,
      hintStyle: bodyMedium.copyWith(color: mediumGray),
      errorStyle: labelSmall.copyWith(color: errorColor),
    );
  }

  // Button styles
  static ButtonStyle primaryButtonStyle = ElevatedButton.styleFrom(
    backgroundColor: primaryColor,
    foregroundColor: white,
    padding: EdgeInsets.symmetric(
      horizontal: spacing24,
      vertical: spacing16,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radiusMedium),
    ),
    elevation: 0,
  );

  static ButtonStyle secondaryButtonStyle = ElevatedButton.styleFrom(
    backgroundColor: Colors.transparent,
    foregroundColor: primaryColor,
    padding: EdgeInsets.symmetric(
      horizontal: spacing24,
      vertical: spacing16,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radiusMedium),
      side: const BorderSide(color: primaryColor),
    ),
    elevation: 0,
  );

  static ButtonStyle textButtonStyle = TextButton.styleFrom(
    foregroundColor: primaryColor,
    padding: EdgeInsets.symmetric(
      horizontal: spacing16,
      vertical: spacing12,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radiusMedium),
    ),
  );

  // Card decoration
  static BoxDecoration cardDecoration = BoxDecoration(
    color: white,
    borderRadius: BorderRadius.circular(radiusMedium),
    boxShadow: shadowSmall,
  );

  // Custom divider
  static Divider divider = const Divider(
    color: lightGray,
    thickness: 1,
    height: 1,
  );

  // Status indicators
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return successColor;
      case 'pending':
      case 'in progress':
      case 'waiting':
        return warningColor;
      case 'inactive':
      case 'cancelled':
      case 'rejected':
        return errorColor;
      default:
        return mediumGray;
    }
  }

  // Common widgets
  static Widget statusBadge(String status) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: spacing8,
        vertical: spacing4,
      ),
      decoration: BoxDecoration(
        color: getStatusColor(status).withOpacity(0.1),
        borderRadius: BorderRadius.circular(radiusSmall),
      ),
      child: Text(
        status,
        style: labelSmall.copyWith(
          color: getStatusColor(status),
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
