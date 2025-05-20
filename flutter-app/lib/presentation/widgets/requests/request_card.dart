import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../../data/models/request_model.dart';

class RequestCard extends StatelessWidget {
  final RequestModel? request;
  final VoidCallback? onTap;
  final bool isLoading;

  const RequestCard({
    super.key,
    required this.request,
    this.onTap,
  }) : isLoading = false;

  const RequestCard.loading({
    super.key,
  })  : request = null,
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
    if (request == null) {
      return const SizedBox.shrink();
    }

    // Format date
    final dateFormat = DateFormat('MMM d, yyyy');
    final timeFormat = DateFormat('h:mm a');
    final formattedDate = dateFormat.format(request!.createdAt);
    final formattedTime = timeFormat.format(request!.createdAt);

    // Status color
    final Color statusColor = _getStatusColor(request!.status);
    final Color priorityColor = _getPriorityColor(request!.priority);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title
        Text(
          request!.title,
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.bold,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        SizedBox(height: 8.h),
        
        // Status and priority
        Row(
          children: [
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
                _formatStatus(request!.status),
                style: TextStyle(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500,
                  color: statusColor,
                ),
              ),
            ),
            SizedBox(width: 8.w),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: 8.w,
                vertical: 4.h,
              ),
              decoration: BoxDecoration(
                color: priorityColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4.r),
              ),
              child: Text(
                _formatPriority(request!.priority),
                style: TextStyle(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500,
                  color: priorityColor,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        
        // Date
        Row(
          children: [
            Icon(
              Icons.calendar_today,
              size: 16.r,
              color: theme.colorScheme.primary,
            ),
            SizedBox(width: 8.w),
            Text(
              '$formattedDate at $formattedTime',
              style: TextStyle(
                fontSize: 14.sp,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        SizedBox(height: 4.h),
        
        // Customer
        if (request!.customer != null)
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
                  request!.customer!.name,
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
          
        // Assigned to
        if (request!.assignedToUser != null)
          Padding(
            padding: EdgeInsets.only(top: 4.h),
            child: Row(
              children: [
                Icon(
                  Icons.assignment_ind,
                  size: 16.r,
                  color: theme.colorScheme.primary,
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    'Assigned to: ${request!.assignedToUser!.name}',
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
        // Title
        Container(
          height: 16.h,
          width: double.infinity,
          decoration: BoxDecoration(
            color: theme.disabledColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(4.r),
          ),
        ),
        SizedBox(height: 12.h),
        
        // Status and priority
        Row(
          children: [
            Container(
              width: 60.w,
              height: 24.h,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
            SizedBox(width: 8.w),
            Container(
              width: 70.w,
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
              width: 140.w,
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
              width: 160.w,
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
      case 'new':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      case 'waiting':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
  
  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.red;
      case 'urgent':
        return Colors.deepPurple;
      default:
        return Colors.grey;
    }
  }
  
  String _formatStatus(String status) {
    // Convert snake_case to Title Case
    return status.split('_').map((word) {
      if (word.isEmpty) return '';
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }
  
  String _formatPriority(String priority) {
    // Capitalize first letter
    if (priority.isEmpty) return '';
    return priority[0].toUpperCase() + priority.substring(1).toLowerCase();
  }
}
