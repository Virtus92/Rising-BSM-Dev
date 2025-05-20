import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../../data/models/appointment_model.dart';

class AppointmentCard extends StatelessWidget {
  final AppointmentModel? appointment;
  final VoidCallback? onTap;
  final bool isLoading;

  const AppointmentCard({
    super.key,
    required this.appointment,
    this.onTap,
  }) : isLoading = false;

  const AppointmentCard.loading({
    super.key,
  })  : appointment = null,
        onTap = null,
        isLoading = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 1,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(16.r),
          child: isLoading
              ? _buildLoadingContent(theme)
              : _buildContent(theme),
        ),
      ),
    );
  }

  Widget _buildContent(ThemeData theme) {
    if (appointment == null) {
      return const SizedBox.shrink();
    }

    // Format date and time
    final dateFormat = DateFormat('EEE, MMM d, yyyy');
    final timeFormat = DateFormat('h:mm a');
    final formattedDate = dateFormat.format(appointment!.appointmentDate);
    final formattedTime = timeFormat.format(appointment!.appointmentDate);
    final formattedEndTime = timeFormat.format(appointment!.endTime);

    // Status color
    final Color statusColor = _getStatusColor(appointment!.status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title and status
        Row(
          children: [
            Expanded(
              child: Text(
                appointment!.title,
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: 8.w,
                vertical: 4.h,
              ),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4.r),
              ),
              child: Text(
                _formatStatus(appointment!.status),
                style: TextStyle(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500,
                  color: statusColor,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        
        // Date and time
        Row(
          children: [
            Icon(
              Icons.calendar_today,
              size: 16.r,
              color: theme.colorScheme.primary,
            ),
            SizedBox(width: 8.w),
            Text(
              formattedDate,
              style: TextStyle(
                fontSize: 14.sp,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        SizedBox(height: 4.h),
        Row(
          children: [
            Icon(
              Icons.access_time,
              size: 16.r,
              color: theme.colorScheme.primary,
            ),
            SizedBox(width: 8.w),
            Text(
              '$formattedTime - $formattedEndTime',
              style: TextStyle(
                fontSize: 14.sp,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        SizedBox(height: 4.h),
        
        // Customer
        if (appointment!.customer != null)
          Row(
            children: [
              Icon(
                Icons.person,
                size: 16.r,
                color: theme.colorScheme.primary,
              ),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  appointment!.customer!.name,
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          
        // Location
        if (appointment!.location != null && appointment!.location!.isNotEmpty)
          Padding(
            padding: EdgeInsets.only(top: 4.h),
            child: Row(
              children: [
                Icon(
                  Icons.location_on,
                  size: 16.r,
                  color: theme.colorScheme.primary,
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    appointment!.location!,
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildLoadingContent(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title and status
        Row(
          children: [
            Expanded(
              child: Container(
                height: 16.h,
                decoration: BoxDecoration(
                  color: theme.disabledColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4.r),
                ),
              ),
            ),
            SizedBox(width: 12.w),
            Container(
              width: 60.w,
              height: 24.h,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
          ],
        ),
        SizedBox(height: 12.h),
        
        // Date
        Row(
          children: [
            Container(
              width: 16.r,
              height: 16.r,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8.r),
              ),
            ),
            SizedBox(width: 8.w),
            Container(
              width: 120.w,
              height: 14.h,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        
        // Time
        Row(
          children: [
            Container(
              width: 16.r,
              height: 16.r,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8.r),
              ),
            ),
            SizedBox(width: 8.w),
            Container(
              width: 150.w,
              height: 14.h,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        
        // Customer
        Row(
          children: [
            Container(
              width: 16.r,
              height: 16.r,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8.r),
              ),
            ),
            SizedBox(width: 8.w),
            Container(
              width: 100.w,
              height: 14.h,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'planned':
        return Colors.blue;
      case 'confirmed':
        return Colors.green;
      case 'completed':
        return Colors.purple;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
  
  String _formatStatus(String status) {
    // Capitalize first letter of each word
    return status.split('_').map((word) {
      if (word.isEmpty) return '';
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }
}
