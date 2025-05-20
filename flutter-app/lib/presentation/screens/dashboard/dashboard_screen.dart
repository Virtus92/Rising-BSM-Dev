import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/notification/notification_bloc.dart';
import 'dashboard_home_screen.dart';

/// Dashboard screen that contains the main navigation and content
class DashboardScreen extends StatefulWidget {
  final Widget child;

  const DashboardScreen({
    super.key,
    required this.child,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  
  @override
  void initState() {
    super.initState();
    // Load notifications
    context.read<NotificationBloc>().add(LoadNotifications());
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateSelectedIndexBasedOnRoute();
  }
  
  @override
  void didUpdateWidget(covariant DashboardScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    _updateSelectedIndexBasedOnRoute();
  }
  
  void _updateSelectedIndexBasedOnRoute() {
    final String location = GoRouterState.of(context).uri.toString();
    
    if (location.contains('/dashboard')) {
      setState(() => _currentIndex = 0);
    } else if (location.contains('/customers')) {
      setState(() => _currentIndex = 1);
    } else if (location.contains('/requests')) {
      setState(() => _currentIndex = 2);
    } else if (location.contains('/appointments')) {
      setState(() => _currentIndex = 3);
    } else if (location.contains('/profile')) {
      setState(() => _currentIndex = 4);
    }
  }
  
  void _onDestinationSelected(int index) {
    setState(() => _currentIndex = index);
    
    switch (index) {
      case 0:
        context.go('/dashboard');
        break;
      case 1:
        context.go('/customers');
        break;
      case 2:
        context.go('/requests');
        break;
      case 3:
        context.go('/appointments');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listenWhen: (previous, current) => current is AuthUnauthenticated,
      listener: (context, state) {
        // Navigate to login if user becomes unauthenticated
        if (state is AuthUnauthenticated) {
          context.go('/login');
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: _getTitle(),
          actions: [
            _buildNotificationButton(),
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'logout') {
                  _logout();
                } else if (value == 'settings') {
                  context.go('/settings');
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
        body: _currentIndex == 0 && GoRouterState.of(context).uri.toString() == '/dashboard'
            ? const DashboardHomeScreen() // Use our custom home screen when on dashboard
            : widget.child, // Otherwise use the routed content
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
      ),
    );
  }
  
  Widget _buildNotificationButton() {
    return BlocBuilder<NotificationBloc, NotificationState>(
      builder: (context, state) {
        final unreadCount = state is NotificationsLoaded 
            ? state.notifications.where((n) => !n.isRead).length 
            : 0;
            
        return Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {
                context.go('/notifications');
              },
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 14,
                    minHeight: 14,
                  ),
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
  
  Widget _getTitle() {
    final String location = GoRouterState.of(context).uri.toString();
    
    if (location.contains('/dashboard')) {
      return const Text('Dashboard');
    } else if (location.contains('/customers')) {
      return const Text('Customers');
    } else if (location.contains('/requests')) {
      return const Text('Requests');
    } else if (location.contains('/appointments')) {
      return const Text('Appointments');
    } else if (location.contains('/profile')) {
      return const Text('Profile');
    } else if (location.contains('/settings')) {
      return const Text('Settings');
    } else if (location.contains('/notifications')) {
      return const Text('Notifications');
    }
    
    return const Text('Rising BSM');
  }
  
  void _logout() {
    context.read<AuthBloc>().add(LogoutRequested());
  }
}
