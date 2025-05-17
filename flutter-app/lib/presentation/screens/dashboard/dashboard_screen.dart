import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../blocs/auth/auth_bloc.dart';

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
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {
                // TODO: Implement notifications page
              },
            ),
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
        body: widget.child,
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
    }
    
    return const Text('Rising BSM');
  }
  
  void _logout() {
    context.read<AuthBloc>().add(LogoutRequested());
  }
}
