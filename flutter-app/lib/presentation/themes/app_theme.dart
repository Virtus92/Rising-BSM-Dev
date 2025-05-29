import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'app_design_system.dart';

class AppTheme {
  // Private constructor to prevent instantiation
  AppTheme._();

  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: AppDesignSystem.primaryColor,
        secondary: AppDesignSystem.secondaryColor,
        error: AppDesignSystem.errorColor,
        surface: AppDesignSystem.background,
        onSurface: AppDesignSystem.black,
      ),
      scaffoldBackgroundColor: AppDesignSystem.background,
      appBarTheme: AppBarTheme(
        backgroundColor: AppDesignSystem.white,
        foregroundColor: AppDesignSystem.black,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppDesignSystem.titleLarge,
        shadowColor: Colors.black.withOpacity(0.1),
      ),
      cardTheme: CardTheme(
        color: AppDesignSystem.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
        ),
        shadowColor: Colors.black.withOpacity(0.1),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: AppDesignSystem.primaryButtonStyle,
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: AppDesignSystem.secondaryButtonStyle,
      ),
      textButtonTheme: TextButtonThemeData(
        style: AppDesignSystem.textButtonStyle,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppDesignSystem.white,
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppDesignSystem.spacing16,
          vertical: AppDesignSystem.spacing16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.lightGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.lightGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.primaryColor, width: 2.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.errorColor, width: 1.0),
        ),
        labelStyle: AppDesignSystem.labelMedium,
        hintStyle: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.mediumGray),
      ),
      textTheme: TextTheme(
        displayLarge: AppDesignSystem.headlineLarge,
        displayMedium: AppDesignSystem.headlineMedium,
        displaySmall: AppDesignSystem.headlineSmall,
        headlineMedium: AppDesignSystem.titleLarge,
        headlineSmall: AppDesignSystem.titleMedium,
        titleLarge: AppDesignSystem.titleSmall,
        bodyLarge: AppDesignSystem.bodyLarge,
        bodyMedium: AppDesignSystem.bodyMedium,
        bodySmall: AppDesignSystem.bodySmall,
        labelSmall: AppDesignSystem.labelSmall,
        labelMedium: AppDesignSystem.labelMedium,
      ),
      fontFamily: 'Poppins',
      dividerTheme: const DividerThemeData(
        color: AppDesignSystem.lightGray,
        thickness: 1,
        space: 1,
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: AppDesignSystem.primaryLight.withOpacity(0.2),
        backgroundColor: AppDesignSystem.white,
        elevation: 3,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppDesignSystem.labelMedium.copyWith(
              color: AppDesignSystem.primaryColor,
              fontWeight: FontWeight.w600,
            );
          }
          return AppDesignSystem.labelMedium;
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              color: AppDesignSystem.primaryColor,
            );
          }
          return const IconThemeData(
            color: AppDesignSystem.mediumGray,
          );
        }),
      ),
    );
  }

  // Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.dark(
        primary: AppDesignSystem.primaryColor,
        secondary: AppDesignSystem.secondaryColor,
        error: AppDesignSystem.errorColor,
        surface: AppDesignSystem.darkSurface,
        onSurface: AppDesignSystem.white,
      ),
      scaffoldBackgroundColor: AppDesignSystem.darkBackground,
      appBarTheme: AppBarTheme(
        backgroundColor: AppDesignSystem.darkSurface,
        foregroundColor: AppDesignSystem.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppDesignSystem.titleLarge.copyWith(color: AppDesignSystem.white),
        shadowColor: Colors.black.withOpacity(0.2),
      ),
      cardTheme: CardTheme(
        color: AppDesignSystem.darkSurface,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
        ),
        shadowColor: Colors.black.withOpacity(0.3),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: AppDesignSystem.primaryButtonStyle,
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: AppDesignSystem.secondaryButtonStyle,
      ),
      textButtonTheme: TextButtonThemeData(
        style: AppDesignSystem.textButtonStyle,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppDesignSystem.darkSurface,
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppDesignSystem.spacing16,
          vertical: AppDesignSystem.spacing16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.darkCard),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.darkCard),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.primaryColor, width: 2.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDesignSystem.radiusMedium),
          borderSide: const BorderSide(color: AppDesignSystem.errorColor, width: 1.0),
        ),
        labelStyle: AppDesignSystem.labelMedium.copyWith(color: AppDesignSystem.lightGray),
        hintStyle: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.lightGray),
      ),
      textTheme: TextTheme(
        displayLarge: AppDesignSystem.headlineLarge.copyWith(color: AppDesignSystem.white),
        displayMedium: AppDesignSystem.headlineMedium.copyWith(color: AppDesignSystem.white),
        displaySmall: AppDesignSystem.headlineSmall.copyWith(color: AppDesignSystem.white),
        headlineMedium: AppDesignSystem.titleLarge.copyWith(color: AppDesignSystem.white),
        headlineSmall: AppDesignSystem.titleMedium.copyWith(color: AppDesignSystem.white),
        titleLarge: AppDesignSystem.titleSmall.copyWith(color: AppDesignSystem.white),
        bodyLarge: AppDesignSystem.bodyLarge.copyWith(color: AppDesignSystem.white),
        bodyMedium: AppDesignSystem.bodyMedium.copyWith(color: AppDesignSystem.white),
        bodySmall: AppDesignSystem.bodySmall.copyWith(color: AppDesignSystem.lightGray),
        labelSmall: AppDesignSystem.labelSmall.copyWith(color: AppDesignSystem.lightGray),
        labelMedium: AppDesignSystem.labelMedium.copyWith(color: AppDesignSystem.lightGray),
      ),
      fontFamily: 'Poppins',
      dividerTheme: const DividerThemeData(
        color: AppDesignSystem.darkCard,
        thickness: 1,
        space: 1,
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: AppDesignSystem.primaryDark.withOpacity(0.3),
        backgroundColor: AppDesignSystem.darkSurface,
        elevation: 3,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppDesignSystem.labelMedium.copyWith(
              color: AppDesignSystem.primaryLight,
              fontWeight: FontWeight.w600,
            );
          }
          return AppDesignSystem.labelMedium.copyWith(color: AppDesignSystem.lightGray);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              color: AppDesignSystem.primaryLight,
            );
          }
          return const IconThemeData(
            color: AppDesignSystem.lightGray,
          );
        }),
      ),
    );
  }
}
