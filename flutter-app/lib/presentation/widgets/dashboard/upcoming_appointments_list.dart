import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

/// A list widget that displays upcoming appointments
class UpcomingAppointmentsList extends StatelessWidget {
  const UpcomingAppointmentsList({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual data from API
    final mockAppointments = [
      _AppointmentItem(
        id: '1',
        customerName: 'John Smith',
        dateTime: DateTime.now().add(const Duration(hours: 3)),
        type: 'Installation',
        status: 'Confirmed',
        statusColor: Colors.green,
      ),
      _AppointmentItem(
        id: '2',
        customerName: 'Alice Johnson',
        dateTime: DateTime.now().add(const Duration(days: 1, hours: 2)),
        type: 'Maintenance',
        status: 'Pending',
        statusColor: Colors.orange,
      ),
      _AppointmentItem(
        id: '3',
        customerName: 'Robert Brown',
        dateTime: DateTime.now().add(const Duration(days: 2)),
        type: 'Consultation',
        status: 'Confirmed',
        statusColor: Colors.green,
      ),
    ];

    if (mockAppointments.isEmpty) {
      return Card(
        elevation: 1,
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.event_busy,
                  size: 48.w,
                  color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5),
                ),
                SizedBox(height: 16.h),
                Text(
                  'No upcoming appointments',
                  style: TextStyle(
                    fontSize: 16.sp,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Card(
      elevation: 1,
      child: ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        itemCount: mockAppointments.length,
        separatorBuilder: (context, index) => Divider(
          height: 1.h,
        ),
        itemBuilder: (context, index) {
          final appointment = mockAppointments[index];
          final theme = Theme.of(context);
          
          return ListTile(
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16.w,
              vertical: 8.h,
            ),
            title: Row(
              children: [
                Expanded(
                  child: Text(
                    appointment.customerName,
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 8.w,
                    vertical: 4.h,
                  ),
                  decoration: BoxDecoration(
                    color: appointment.statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                  child: Text(
                    appointment.status,
                    style: TextStyle(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500,
                      color: appointment.statusColor,
                    ),
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
                        Icons.calendar_today,
                        size: 14.w,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        DateFormat('MMM d, y • h:mm a').format(appointment.dateTime),
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
                        Icons.work_outline,
                        size: 14.w,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        appointment.type,
                        style: TextStyle(
                          fontSize: 14.sp,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            onTap: () {
              // TODO: Navigate to appointment details screen
            },
          );
        },
      ),
    );
  }
}

class _AppointmentItem {
  final String id;
  final String customerName;
  final DateTime dateTime;
  final String type;
  final String status;
  final Color statusColor;
  
  const _AppointmentItem({
    required this.id,
    required this.customerName,
    required this.dateTime,
    required this.type,
    required this.status,
    required this.statusColor,
  });
}
