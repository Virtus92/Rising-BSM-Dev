import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

/// A list widget that displays recent requests
class RecentRequestsList extends StatelessWidget {
  const RecentRequestsList({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual data from API
    final mockRequests = [
      _RequestItem(
        id: '1001',
        customerName: 'Acme Corporation',
        dateCreated: DateTime.now().subtract(const Duration(hours: 4)),
        type: 'Technical Support',
        status: 'Open',
        statusColor: Colors.blue,
        priority: 'High',
        priorityColor: Colors.red,
      ),
      _RequestItem(
        id: '1002',
        customerName: 'Johnson & Co',
        dateCreated: DateTime.now().subtract(const Duration(days: 1)),
        type: 'Installation',
        status: 'In Progress',
        statusColor: Colors.orange,
        priority: 'Medium',
        priorityColor: Colors.orange,
      ),
      _RequestItem(
        id: '1003',
        customerName: 'Tech Solutions Inc',
        dateCreated: DateTime.now().subtract(const Duration(days: 2)),
        type: 'Billing Inquiry',
        status: 'Open',
        statusColor: Colors.blue,
        priority: 'Low',
        priorityColor: Colors.green,
      ),
    ];

    return Card(
      elevation: 1,
      child: ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        itemCount: mockRequests.length,
        separatorBuilder: (context, index) => Divider(
          height: 1.h,
        ),
        itemBuilder: (context, index) {
          final request = mockRequests[index];
          final theme = Theme.of(context);
          
          return ListTile(
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16.w,
              vertical: 8.h,
            ),
            title: Row(
              children: [
                Text(
                  '#${request.id}',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w500,
                    color: theme.colorScheme.primary,
                  ),
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    request.customerName,
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            subtitle: Padding(
              padding: EdgeInsets.only(top: 4.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.category,
                        size: 14.w,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        request.type,
                        style: TextStyle(
                          fontSize: 14.sp,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      SizedBox(width: 16.w),
                      Icon(
                        Icons.access_time,
                        size: 14.w,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        _formatDate(request.dateCreated),
                        style: TextStyle(
                          fontSize: 14.sp,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8.h),
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 8.w,
                          vertical: 4.h,
                        ),
                        decoration: BoxDecoration(
                          color: request.statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                        child: Text(
                          request.status,
                          style: TextStyle(
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w500,
                            color: request.statusColor,
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
                          color: request.priorityColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                        child: Text(
                          request.priority,
                          style: TextStyle(
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w500,
                            color: request.priorityColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            onTap: () {
              // TODO: Navigate to request details screen
            },
          );
        },
      ),
    );
  }
  
  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return DateFormat('MMM d, y').format(date);
    }
  }
}

class _RequestItem {
  final String id;
  final String customerName;
  final DateTime dateCreated;
  final String type;
  final String status;
  final Color statusColor;
  final String priority;
  final Color priorityColor;
  
  const _RequestItem({
    required this.id,
    required this.customerName,
    required this.dateCreated,
    required this.type,
    required this.status,
    required this.statusColor,
    required this.priority,
    required this.priorityColor,
  });
}
