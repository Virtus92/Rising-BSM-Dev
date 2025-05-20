import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../themes/app_design_system.dart';

/// Form components used throughout the app
class AppForms {
  AppForms._();

  // Text form field with consistent styling
  static Widget textField({
    required String label,
    String? hintText,
    String? initialValue,
    TextEditingController? controller,
    TextInputType? keyboardType,
    bool obscureText = false,
    bool enabled = true,
    bool readOnly = false,
    String? errorText,
    String? helperText,
    int? maxLines = 1,
    int? minLines,
    int? maxLength,
    Widget? prefixIcon,
    Widget? suffixIcon,
    void Function(String)? onChanged,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
    TextCapitalization textCapitalization = TextCapitalization.none,
    FocusNode? focusNode,
    void Function()? onTap,
    void Function(String)? onFieldSubmitted,
    TextInputAction? textInputAction,
    AutovalidateMode? autovalidateMode,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          decoration: AppDesignSystem.inputDecoration(
            labelText: label,
            hintText: hintText,
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            errorText: errorText,
          ).copyWith(
            helperText: helperText,
            helperStyle: AppDesignSystem.labelSmall,
            contentPadding: EdgeInsets.symmetric(
              horizontal: AppDesignSystem.spacing16,
              vertical: maxLines != null && maxLines > 1
                  ? AppDesignSystem.spacing16
                  : AppDesignSystem.spacing12,
            ),
          ),
          keyboardType: keyboardType,
          obscureText: obscureText,
          enabled: enabled,
          readOnly: readOnly,
          maxLines: maxLines,
          minLines: minLines,
          maxLength: maxLength,
          onChanged: onChanged,
          validator: validator,
          inputFormatters: inputFormatters,
          textCapitalization: textCapitalization,
          focusNode: focusNode,
          onTap: onTap,
          onFieldSubmitted: onFieldSubmitted,
          textInputAction: textInputAction,
          autovalidateMode: autovalidateMode,
        ),
      ],
    );
  }

  // Dropdown form field
  static Widget dropdownField<T>({
    required String label,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
    String? hintText,
    bool enabled = true,
    String? errorText,
    Widget? prefixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<T>(
          value: value,
          items: items,
          onChanged: enabled ? onChanged : null,
          decoration: AppDesignSystem.inputDecoration(
            labelText: label,
            hintText: hintText,
            prefixIcon: prefixIcon,
            errorText: errorText,
          ),
          icon: const Icon(Icons.arrow_drop_down, color: AppDesignSystem.mediumGray),
          isExpanded: true,
          elevation: 2,
          dropdownColor: AppDesignSystem.white,
        ),
      ],
    );
  }

  // Date picker field
  static Widget datePickerField({
    required String label,
    required DateTime? selectedDate,
    required Function(DateTime) onDateSelected,
    String? hintText,
    bool enabled = true,
    String? errorText,
    DateTime? firstDate,
    DateTime? lastDate,
  }) {
    final controller = TextEditingController(
      text: selectedDate != null
          ? '${selectedDate.day}/${selectedDate.month}/${selectedDate.year}'
          : '',
    );

    return textField(
      label: label,
      hintText: hintText ?? 'Select date',
      controller: controller,
      readOnly: true,
      enabled: enabled,
      errorText: errorText,
      prefixIcon: const Icon(Icons.calendar_today, size: 20),
      onTap: enabled
          ? () async {
              final DateTime? picked = await showDatePicker(
                context: navigatorKey.currentContext!,
                initialDate: selectedDate ?? DateTime.now(),
                firstDate: firstDate ?? DateTime(2000),
                lastDate: lastDate ?? DateTime(2100),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: const ColorScheme.light(
                        primary: AppDesignSystem.primaryColor,
                        onPrimary: AppDesignSystem.white,
                        surface: AppDesignSystem.white,
                        onSurface: AppDesignSystem.black,
                      ),
                    ),
                    child: child!,
                  );
                },
              );
              if (picked != null) {
                controller.text =
                    '${picked.day}/${picked.month}/${picked.year}';
                onDateSelected(picked);
              }
            }
          : null,
    );
  }

  // Time picker field
  static Widget timePickerField({
    required String label,
    required TimeOfDay? selectedTime,
    required Function(TimeOfDay) onTimeSelected,
    String? hintText,
    bool enabled = true,
    String? errorText,
  }) {
    final controller = TextEditingController(
      text: selectedTime != null
          ? '${selectedTime.hour}:${selectedTime.minute.toString().padLeft(2, '0')}'
          : '',
    );

    return textField(
      label: label,
      hintText: hintText ?? 'Select time',
      controller: controller,
      readOnly: true,
      enabled: enabled,
      errorText: errorText,
      prefixIcon: const Icon(Icons.access_time, size: 20),
      onTap: enabled
          ? () async {
              final TimeOfDay? picked = await showTimePicker(
                context: navigatorKey.currentContext!,
                initialTime: selectedTime ?? TimeOfDay.now(),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: const ColorScheme.light(
                        primary: AppDesignSystem.primaryColor,
                        onPrimary: AppDesignSystem.white,
                        surface: AppDesignSystem.white,
                        onSurface: AppDesignSystem.black,
                      ),
                    ),
                    child: child!,
                  );
                },
              );
              if (picked != null) {
                controller.text =
                    '${picked.hour}:${picked.minute.toString().padLeft(2, '0')}';
                onTimeSelected(picked);
              }
            }
          : null,
    );
  }

  // Checkbox field
  static Widget checkboxField({
    required String label,
    required bool value,
    required Function(bool?) onChanged,
    bool enabled = true,
  }) {
    return Row(
      children: [
        SizedBox(
          height: 24.h,
          width: 24.w,
          child: Checkbox(
            value: value,
            onChanged: enabled ? onChanged : null,
            activeColor: AppDesignSystem.primaryColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4.r),
            ),
          ),
        ),
        SizedBox(width: AppDesignSystem.spacing12),
        Expanded(
          child: Text(
            label,
            style: AppDesignSystem.bodyMedium,
          ),
        ),
      ],
    );
  }

  // Switch field
  static Widget switchField({
    required String label,
    required bool value,
    required Function(bool) onChanged,
    bool enabled = true,
    String? subtitle,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppDesignSystem.bodyMedium,
              ),
              if (subtitle != null) ...[
                SizedBox(height: AppDesignSystem.spacing4),
                Text(
                  subtitle,
                  style: AppDesignSystem.labelSmall,
                ),
              ],
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: enabled ? onChanged : null,
          activeColor: AppDesignSystem.primaryColor,
        ),
      ],
    );
  }

  // Search field
  static Widget searchField({
    required String hintText,
    required TextEditingController controller,
    Function(String)? onChanged,
    VoidCallback? onClear,
    bool autofocus = false,
    FocusNode? focusNode,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: AppDesignSystem.bodyMedium.copyWith(
          color: AppDesignSystem.mediumGray,
        ),
        filled: true,
        fillColor: AppDesignSystem.white,
        prefixIcon: const Icon(
          Icons.search,
          color: AppDesignSystem.mediumGray,
        ),
        suffixIcon: controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(
                  Icons.clear,
                  color: AppDesignSystem.mediumGray,
                ),
                onPressed: () {
                  controller.clear();
                  if (onClear != null) {
                    onClear();
                  }
                  if (onChanged != null) {
                    onChanged('');
                  }
                },
              )
            : null,
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppDesignSystem.spacing16,
          vertical: AppDesignSystem.spacing12,
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
          borderSide:
              const BorderSide(color: AppDesignSystem.primaryColor, width: 1.5),
        ),
      ),
      style: AppDesignSystem.bodyMedium,
      onChanged: onChanged,
      autofocus: autofocus,
      focusNode: focusNode,
      textInputAction: TextInputAction.search,
    );
  }
}

// Global navigator key for context access
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
