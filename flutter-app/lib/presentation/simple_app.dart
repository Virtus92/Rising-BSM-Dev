import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'blocs/auth/auth_bloc.dart';
import 'routes/app_router.dart';
import 'themes/app_theme.dart';

/// Simplified app for testing
class RisingBSMSimpleApp extends StatelessWidget {
  const RisingBSMSimpleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(390, 844), // Design size for iPhone 14 Pro
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (_, child) {
        return BlocProvider(
          create: (_) => AuthBloc(), // Simplified AuthBloc that doesn't require all dependencies
          child: MaterialApp(
            title: 'Rising BSM',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,
            home: const DashboardTestScreen(), // Use a test dashboard screen
          ),
        );
      },
    );
  }
}

/// Simplified dashboard for testing
class DashboardTestScreen extends StatefulWidget {
  const DashboardTestScreen({super.key});

  @override
  State<DashboardTestScreen> createState() => _DashboardTestScreenState();
}

class _DashboardTestScreenState extends State<DashboardTestScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _screens = [
    const HomeTab(),
    const CustomersTab(),
    const RequestsTab(),
    const AppointmentsTab(),
    const ProfileTab(),
  ];
  
  void _onDestinationSelected(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rising BSM'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // Show notifications
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications will be implemented')),
              );
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') {
                // Logout
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Logout will be implemented')),
                );
              } else if (value == 'settings') {
                // Navigate to settings
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Settings will be implemented')),
                );
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'settings',
                child: ListTile(
                  leading: Icon(Icons.settings),
                  title: Text('Settings'),
                ),
              ),
              const PopupMenuItem<String>(
                value: 'logout',
                child: ListTile(
                  leading: Icon(Icons.logout),
                  title: Text('Logout'),
                ),
              ),
            ],
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _onDestinationSelected,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Customers',
          ),
          NavigationDestination(
            icon: Icon(Icons.question_answer_outlined),
            selectedIcon: Icon(Icons.question_answer),
            label: 'Requests',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today),
            label: 'Appointments',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// Simplified tab screens for testing
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16.r),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome message
          Text(
            'Good morning,',
            style: TextStyle(
              fontSize: 16.sp,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            'Demo User',
            style: TextStyle(
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 24.h),
          
          // Stats cards
          GridView.count(
            crossAxisCount: 2,
            childAspectRatio: 1.5,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16.w,
            mainAxisSpacing: 16.h,
            children: [
              _buildStatsCard(
                context,
                'Customers',
                '156',
                Icons.people,
                Colors.blue,
              ),
              _buildStatsCard(
                context,
                'Requests',
                '243',
                Icons.question_answer,
                Colors.orange,
              ),
              _buildStatsCard(
                context,
                'Appointments',
                '187',
                Icons.calendar_today,
                Colors.green,
              ),
              _buildStatsCard(
                context,
                'Users',
                '12',
                Icons.person,
                Colors.purple,
              ),
            ],
          ),
          SizedBox(height: 24.h),
          
          // Recent activities section
          Text(
            'Recent Activities',
            style: TextStyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12.h),
          _buildActivityCard(
            context,
            'New Customer',
            'John Doe was added as a new customer',
            '2 hours ago',
            Icons.person_add,
          ),
          SizedBox(height: 12.h),
          _buildActivityCard(
            context,
            'Appointment Scheduled',
            'Meeting with ABC Corp. at 3:00 PM',
            '4 hours ago',
            Icons.event,
          ),
          SizedBox(height: 12.h),
          _buildActivityCard(
            context,
            'Request Completed',
            'Website design request was completed',
            '1 day ago',
            Icons.check_circle,
          ),
        ],
      ),
    );
  }
  
  Widget _buildStatsCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16.r),
        child: Column(
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
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
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
        ),
      ),
    );
  }
  
  Widget _buildActivityCard(
    BuildContext context,
    String title,
    String description,
    String timeAgo,
    IconData icon,
  ) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: EdgeInsets.all(16.r),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 20.r,
              backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              child: Icon(
                icon,
                color: Theme.of(context).colorScheme.primary,
                size: 24.r,
              ),
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    timeAgo,
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CustomersTab extends StatelessWidget {
  const CustomersTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.people,
            size: 64.r,
            color: Theme.of(context).colorScheme.primary,
          ),
          SizedBox(height: 16.h),
          Text(
            'Customers Module',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'This feature will be implemented soon',
            style: TextStyle(
              fontSize: 16.sp,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 24.h),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Add Customer feature will be implemented')),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('Add Customer'),
          ),
        ],
      ),
    );
  }
}

class RequestsTab extends StatelessWidget {
  const RequestsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.question_answer,
            size: 64.r,
            color: Theme.of(context).colorScheme.primary,
          ),
          SizedBox(height: 16.h),
          Text(
            'Requests Module',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'This feature will be implemented soon',
            style: TextStyle(
              fontSize: 16.sp,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 24.h),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('New Request feature will be implemented')),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('New Request'),
          ),
        ],
      ),
    );
  }
}

class AppointmentsTab extends StatelessWidget {
  const AppointmentsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.calendar_today,
            size: 64.r,
            color: Theme.of(context).colorScheme.primary,
          ),
          SizedBox(height: 16.h),
          Text(
            'Appointments Module',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'This feature will be implemented soon',
            style: TextStyle(
              fontSize: 16.sp,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          SizedBox(height: 24.h),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Schedule Appointment feature will be implemented')),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('Schedule Appointment'),
          ),
        ],
      ),
    );
  }
}

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16.r),
      child: Column(
        children: [
          // Profile header
          CircleAvatar(
            radius: 50.r,
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: Text(
              'DU',
              style: TextStyle(
                fontSize: 36.sp,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          SizedBox(height: 16.h),
          Text(
            'Demo User',
            style: TextStyle(
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            'demo.user@example.com',
            style: TextStyle(
              fontSize: 16.sp,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            'Administrator',
            style: TextStyle(
              fontSize: 14.sp,
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 32.h),
          
          // Profile menu
          _buildProfileMenuItem(
            context,
            'Edit Profile',
            Icons.edit,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Edit Profile feature will be implemented')),
              );
            },
          ),
          _buildProfileMenuItem(
            context,
            'Change Password',
            Icons.lock,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Change Password feature will be implemented')),
              );
            },
          ),
          _buildProfileMenuItem(
            context,
            'Notification Settings',
            Icons.notifications,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notification Settings feature will be implemented')),
              );
            },
          ),
          _buildProfileMenuItem(
            context,
            'App Settings',
            Icons.settings,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('App Settings feature will be implemented')),
              );
            },
          ),
          _buildProfileMenuItem(
            context,
            'Help & Support',
            Icons.help,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Help & Support feature will be implemented')),
              );
            },
          ),
          _buildProfileMenuItem(
            context,
            'About',
            Icons.info,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('About feature will be implemented')),
              );
            },
          ),
          _buildProfileMenuItem(
            context,
            'Logout',
            Icons.logout,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Logout feature will be implemented')),
              );
            },
            color: Theme.of(context).colorScheme.error,
          ),
        ],
      ),
    );
  }
  
  Widget _buildProfileMenuItem(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap, {
    Color? color,
  }) {
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ListTile(
        leading: Icon(
          icon,
          color: color ?? Theme.of(context).colorScheme.primary,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: color,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
