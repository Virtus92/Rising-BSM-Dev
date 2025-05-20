import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final bool isLoading;

  const StatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  }) : isLoading = false;

  const StatsCard.loading({
    super.key,
  })  : title = '',
        value = '',
        icon = Icons.query_stats,
        color = Colors.grey,
        onTap = null,
        isLoading = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      elevation: 2,
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            Icon(
              icon,
              color: color,
              size: 24.r,
            ),
          ],
        ),
        SizedBox(height: 8.h),
        Text(
          value,
          style: TextStyle(
            fontSize: 24.sp,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingContent(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 80.w,
              height: 16.h,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4.r),
              ),
            ),
            Container(
              width: 24.r,
              height: 24.r,
              decoration: BoxDecoration(
                color: theme.disabledColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        Container(
          width: 60.w,
          height: 24.h,
          decoration: BoxDecoration(
            color: theme.disabledColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(4.r),
          ),
        ),
      ],
    );
  }
}
