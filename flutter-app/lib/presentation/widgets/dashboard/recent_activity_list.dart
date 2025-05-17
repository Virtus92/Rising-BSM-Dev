import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

/// A list widget that displays recent activities in the system
class RecentActivityList extends StatelessWidget {
  const RecentActivityList({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual data from API
    final mockActivities = [
      _ActivityItem(
        title: 'New customer created',
        description: 'John Doe was added as a customer',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        icon: Icons.person_add,
        color: Colors.green,
      ),
      _ActivityItem(
        title: 'Request completed',
        description: 'Request #1234 was marked as completed',
        timestamp: DateTime.now().subtract(const Duration(hours: 5)),
        icon: Icons.check_circle,
        color: Colors.blue,
      ),
      _ActivityItem(
        title: 'Appointment rescheduled',
        description: 'Appointment with Jane Smith was rescheduled',
        timestamp: DateTime.now().subtract(const Duration(hours: 8)),
        icon: Icons.event,
        color: Colors.orange,
      ),
      _ActivityItem(
        title: 'Payment received',
        description: 'Payment of \$1,200 received from Acme Inc.',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        icon: Icons.payments,
        color: Colors.purple,
      ),
    ];

    return Card(
      elevation: 1,
      child: ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        itemCount: mockActivities.length,
        separatorBuilder: (context, index) => Divider(
          height: 1.h,
          indent: 72.w,
        ),
        itemBuilder: (context, index) {
          final activity = mockActivities[index];
          
          return ListTile(
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16.w,
              vertical: 8.h,
            ),
            leading: CircleAvatar(
              backgroundColor: activity.color.withOpacity(0.2),
              child: Icon(
                activity.icon,
                color: activity.color,
                size: 24.w,
              ),
            ),
            title: Text(
              activity.title,
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 4.h),
                Text(
                  activity.description,
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  _formatTimestamp(activity.timestamp),
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.7),
                  ),
                ),
              ],
            ),
            onTap: () {
              // TODO: Navigate to related screen
            },
          );
        },
      ),
    );
  }
  
  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inDays > 0) {
      return DateFormat('MMM d, y').format(timestamp);
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else {
      return 'just now';
    }
  }
}

class _ActivityItem {
  final String title;
  final String description;
  final DateTime timestamp;
  final IconData icon;
  final Color color;
  
  const _ActivityItem({
    required this.title, 
    required this.description, 
    required this.timestamp,
    required this.icon,
    required this.color,
  });
}
