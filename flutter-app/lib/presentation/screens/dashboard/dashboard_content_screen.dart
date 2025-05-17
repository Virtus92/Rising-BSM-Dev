import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../widgets/dashboard/statistics_card.dart';
import '../../widgets/dashboard/recent_activity_list.dart';
import '../../widgets/dashboard/upcoming_appointments_list.dart';
import '../../widgets/dashboard/recent_requests_list.dart';

/// Dashboard content screen that displays statistics and recent activity
class DashboardContentScreen extends StatelessWidget {
  const DashboardContentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          // TODO: Implement refresh logic
          await Future.delayed(const Duration(milliseconds: 1500));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome message
              Text(
                'Welcome back',
                style: TextStyle(
                  fontSize: 24.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                'Here\'s your business overview',
                style: TextStyle(
                  fontSize: 16.sp,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              SizedBox(height: 24.h),
              
              // Statistics cards
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16.h,
                crossAxisSpacing: 16.w,
                childAspectRatio: 1.5,
                children: const [
                  StatisticsCard(
                    title: 'Customers',
                    value: '124',
                    icon: Icons.people,
                    color: Colors.blue,
                    trend: '+5%',
                    isPositiveTrend: true,
                  ),
                  StatisticsCard(
                    title: 'Requests',
                    value: '38',
                    icon: Icons.question_answer,
                    color: Colors.amber,
                    trend: '+12%',
                    isPositiveTrend: true,
                  ),
                  StatisticsCard(
                    title: 'Appointments',
                    value: '27',
                    icon: Icons.calendar_today,
                    color: Colors.green,
                    trend: '-3%',
                    isPositiveTrend: false,
                  ),
                  StatisticsCard(
                    title: 'Revenue',
                    value: '\$8,920',
                    icon: Icons.attach_money,
                    color: Colors.purple,
                    trend: '+8%',
                    isPositiveTrend: true,
                  ),
                ],
              ),
              SizedBox(height: 24.h),
              
              // Upcoming appointments
              Text(
                'Upcoming Appointments',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12.h),
              const UpcomingAppointmentsList(),
              SizedBox(height: 24.h),
              
              // Recent requests
              Text(
                'Recent Requests',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12.h),
              const RecentRequestsList(),
              SizedBox(height: 24.h),
              
              // Recent activity
              Text(
                'Recent Activity',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12.h),
              const RecentActivityList(),
            ],
          ),
        ),
      ),
    );
  }
}
