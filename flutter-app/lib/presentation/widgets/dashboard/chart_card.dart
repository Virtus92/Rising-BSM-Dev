import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ChartCard extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>>? data;
  final Color color;
  final bool isLoading;

  const ChartCard({
    super.key,
    required this.title,
    required this.data,
    required this.color,
  }) : isLoading = false;

  const ChartCard.loading({
    super.key,
    required this.title,
  })  : data = null,
        color = Colors.grey,
        isLoading = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: EdgeInsets.all(16.r),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 16.h),
            isLoading
                ? _buildLoadingContent(theme)
                : _buildChartContent(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildChartContent(ThemeData theme) {
    if (data == null || data!.isEmpty) {
      return SizedBox(
        height: 150.h,
        child: Center(
          child: Text(
            'No data available',
            style: TextStyle(
              fontSize: 14.sp,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    // Extract values for the chart
    final List<double> values = data!
        .map((item) => (item['value'] as num).toDouble())
        .toList();
    
    final double maxValue = values.reduce((max, value) => max > value ? max : value);
    
    return SizedBox(
      height: 150.h,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(
          data!.length,
          (index) {
            final item = data![index];
            final double value = (item['value'] as num).toDouble();
            final double percentage = maxValue > 0 ? value / maxValue : 0;
            
            return Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 4.w),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    // Value
                    Text(
                      value.toInt().toString(),
                      style: TextStyle(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    // Bar
                    Container(
                      height: 100.h * percentage,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.7),
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(4.r),
                        ),
                      ),
                    ),
                    SizedBox(height: 4.h),
                    // Label
                    Text(
                      item['label'] as String,
                      style: TextStyle(
                        fontSize: 10.sp,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLoadingContent(ThemeData theme) {
    return SizedBox(
      height: 150.h,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(
          7, // Number of placeholder bars
          (index) {
            final double height = 30 + (index % 3) * 30.0; // Random heights
            
            return Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 4.w),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      height: 15.h,
                      width: 20.w,
                      decoration: BoxDecoration(
                        color: theme.disabledColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Container(
                      height: height.h,
                      decoration: BoxDecoration(
                        color: theme.disabledColor.withOpacity(0.2),
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(4.r),
                        ),
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Container(
                      height: 10.h,
                      width: 24.w,
                      decoration: BoxDecoration(
                        color: theme.disabledColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
