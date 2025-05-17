import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

/// A statistics card widget for the dashboard that shows a key metric
class StatisticsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String? trend;
  final bool isPositiveTrend;

  const StatisticsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.trend,
    this.isPositiveTrend = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Title and icon
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
                Icon(
                  icon,
                  color: color,
                  size: 24.w,
                ),
              ],
            ),
            SizedBox(height: 8.h),
            // Value
            Text(
              value,
              style: TextStyle(
                fontSize: 24.sp,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            // Trend if available
            if (trend != null)
              Row(
                children: [
                  Icon(
                    isPositiveTrend 
                        ? Icons.arrow_upward 
                        : Icons.arrow_downward,
                    size: 14.w,
                    color: isPositiveTrend ? Colors.green : Colors.red,
                  ),
                  SizedBox(width: 4.w),
                  Text(
                    trend!,
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: isPositiveTrend ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
