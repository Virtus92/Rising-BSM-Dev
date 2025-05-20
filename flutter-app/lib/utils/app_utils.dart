import 'package:flutter/foundation.dart';

/// Utility class containing helper functions for the application
class AppUtils {
  /// Logs a message with a tag in debug mode
  static void logDebug(String tag, String message) {
    if (kDebugMode) {
      debugPrint('[$tag] $message');
    }
  }
  
  /// Logs an error with a tag in debug mode
  static void logError(String tag, String message, [dynamic error]) {
    if (kDebugMode) {
      debugPrint('[$tag] ❌ ERROR: $message');
      if (error != null) {
        debugPrint('[$tag] ❌ ERROR DETAILS: $error');
      }
    }
  }
  
  /// Format a date for display
  static String formatDate(DateTime date, {bool includeTime = false}) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year.toString();
    
    if (!includeTime) {
      return '$day/$month/$year';
    }
    
    final hours = date.hour.toString().padLeft(2, '0');
    final minutes = date.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hours:$minutes';
  }
  
  /// Truncate a string to the specified length
  static String truncateString(String text, int maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return '${text.substring(0, maxLength)}...';
  }
}
