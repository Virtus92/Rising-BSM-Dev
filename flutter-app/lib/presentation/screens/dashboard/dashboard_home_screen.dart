import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../data/models/appointment_model.dart';
import '../../../data/models/request_model.dart';
import '../../../data/models/user_model.dart';
import '../../blocs/appointments/appointment_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/dashboard/dashboard_bloc.dart';
import '../../blocs/requests/request_bloc.dart';
import '../../widgets/appointments/appointment_card.dart';
import '../../widgets/dashboard/stats_card.dart';
import '../../widgets/dashboard/chart_card.dart';
import '../../widgets/requests/request_card.dart';

class DashboardHomeScreen extends StatefulWidget {
  const DashboardHomeScreen({super.key});

  @override
  State<DashboardHomeScreen> createState() => _DashboardHomeScreenState();
}

class _DashboardHomeScreenState extends State<DashboardHomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load initial data
    _loadDashboardData();
  }

  void _loadDashboardData() {
    context.read<DashboardBloc>().add(LoadDashboardData());
    context.read<AppointmentBloc>().add(LoadUpcomingAppointments());
    context.read<RequestBloc>().add(LoadRecentRequests());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = context.select((AuthBloc bloc) => 
      bloc.state is AuthAuthenticated ? (bloc.state as AuthAuthenticated).user : null);

    return RefreshIndicator(
      onRefresh: () async {
        _loadDashboardData();
      },
      child: SingleChildScrollView(
        padding: EdgeInsets.all(16.r),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome message
            _buildWelcomeSection(theme, user),
            SizedBox(height: 24.h),
            
            // Stats section
            _buildStatsSection(),
            SizedBox(height: 24.h),
            
            // Charts section
            _buildChartsSection(theme),
            SizedBox(height: 24.h),
            
            // Upcoming appointments section
            _buildUpcomingAppointmentsSection(theme),
            SizedBox(height: 24.h),
            
            // Recent requests section
            _buildRecentRequestsSection(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeSection(ThemeData theme, UserModel? user) {
    final greeting = _getGreeting();
    final userName = user?.name.split(' ').first ?? 'User';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$greeting,',
          style: TextStyle(
            fontSize: 16.sp,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Text(
          userName,
          style: TextStyle(
            fontSize: 24.sp,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now()),
          style: TextStyle(
            fontSize: 14.sp,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsSection() {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          final stats = state.stats;
          
          return GridView.count(
            crossAxisCount: 2,
            childAspectRatio: 1.5,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16.w,
            mainAxisSpacing: 16.h,
            children: [
              StatsCard(
                title: 'Customers',
                value: stats.totalCustomers.toString(),
                icon: Icons.people,
                color: Colors.blue,
                onTap: () => context.go('/customers'),
              ),
              StatsCard(
                title: 'Requests',
                value: stats.totalRequests.toString(),
                icon: Icons.question_answer,
                color: Colors.orange,
                onTap: () => context.go('/requests'),
              ),
              StatsCard(
                title: 'Appointments',
                value: stats.totalAppointments.toString(),
                icon: Icons.calendar_today,
                color: Colors.green,
                onTap: () => context.go('/appointments'),
              ),
              StatsCard(
                title: 'Users',
                value: stats.totalUsers.toString(),
                icon: Icons.person,
                color: Colors.purple,
                onTap: () => context.go('/users'),
              ),
            ],
          );
        }
        
        return GridView.count(
          crossAxisCount: 2,
          childAspectRatio: 1.5,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16.w,
          mainAxisSpacing: 16.h,
          children: List.generate(4, (index) => 
            const StatsCard.loading()
          ),
        );
      },
    );
  }

  Widget _buildChartsSection(ThemeData theme) {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Analytics',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12.h),
              ChartCard(
                title: 'Requests',
                data: state.requestsChartData,
                color: Colors.orange,
              ),
              SizedBox(height: 16.h),
              ChartCard(
                title: 'Appointments',
                data: state.appointmentsChartData,
                color: Colors.green,
              ),
            ],
          );
        }
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Analytics',
              style: TextStyle(
                fontSize: 18.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 12.h),
            const ChartCard.loading(title: 'Requests'),
            SizedBox(height: 16.h),
            const ChartCard.loading(title: 'Appointments'),
          ],
        );
      },
    );
  }

  Widget _buildUpcomingAppointmentsSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Appointments',
              style: TextStyle(
                fontSize: 18.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/appointments'),
              child: const Text('View all'),
            ),
          ],
        ),
        SizedBox(height: 12.h),
        BlocBuilder<AppointmentBloc, AppointmentState>(
          builder: (context, state) {
            if (state is AppointmentsLoaded) {
              final appointments = state.appointments;
              
              if (appointments.isEmpty) {
                return Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.h),
                    child: Text(
                      'No upcoming appointments',
                      style: TextStyle(
                        fontSize: 16.sp,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                );
              }
              
              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: appointments.length.clamp(0, 3), // Show max 3 items
                separatorBuilder: (context, index) => SizedBox(height: 12.h),
                itemBuilder: (context, index) => AppointmentCard(
                  appointment: appointments[index],
                  onTap: () => context.go('/appointments/${appointments[index].id}'),
                ),
              );
            }
            
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 3,
              separatorBuilder: (context, index) => SizedBox(height: 12.h),
              itemBuilder: (context, index) => const AppointmentCard.loading(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildRecentRequestsSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Requests',
              style: TextStyle(
                fontSize: 18.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/requests'),
              child: const Text('View all'),
            ),
          ],
        ),
        SizedBox(height: 12.h),
        BlocBuilder<RequestBloc, RequestState>(
          builder: (context, state) {
            if (state is RequestsLoaded) {
              final requests = state.requests;
              
              if (requests.isEmpty) {
                return Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.h),
                    child: Text(
                      'No recent requests',
                      style: TextStyle(
                        fontSize: 16.sp,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                );
              }
              
              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: requests.length.clamp(0, 3), // Show max 3 items
                separatorBuilder: (context, index) => SizedBox(height: 12.h),
                itemBuilder: (context, index) => RequestCard(
                  request: requests[index],
                  onTap: () => context.go('/requests/${requests[index].id}'),
                ),
              );
            }
            
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 3,
              separatorBuilder: (context, index) => SizedBox(height: 12.h),
              itemBuilder: (context, index) => const RequestCard.loading(),
            );
          },
        ),
      ],
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }
}
