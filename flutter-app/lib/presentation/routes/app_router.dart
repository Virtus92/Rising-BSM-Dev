import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../blocs/auth/auth_bloc.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/error/error_screen.dart';
import '../screens/splash_screen.dart';

/// App router for handling navigation in the app
class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();
  static final _shellNavigatorKey = GlobalKey<NavigatorState>();
  
  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    debugLogDiagnostics: true,
    
    // Redirect logic based on authentication status
    redirect: (context, state) {
      // Get current auth state from BLoC
      final authState = context.read<AuthBloc>().state;
      final bool isAuthenticated = authState is AuthAuthenticated;
        // Path the user is trying to access
      final String location = state.uri.path;
      
      // Public routes that don't require authentication
      const List<String> publicRoutes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      ];
      
      // Don't redirect on the splash screen
      if (location == '/') {
        return null;
      }
      
      // If not authenticated and trying to access protected route
      if (!isAuthenticated && !publicRoutes.contains(location)) {
        return '/login';
      }
      
      // If authenticated and trying to access auth route
      if (isAuthenticated && publicRoutes.contains(location)) {
        return '/dashboard';
      }
      
      // No redirect needed
      return null;
    },
    
    // Routes configuration
    routes: [
      // Splash screen
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Authentication routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'] ?? '';
          return ResetPasswordScreen(token: token);
        },
      ),
      
      // Main app shell with bottom navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return DashboardScreen(child: child);
        },
        routes: [
          // Dashboard
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const Center(child: Text('Dashboard')),
            routes: const [
              // Dashboard nested routes
            ],
          ),
          
          // Users
          GoRoute(
            path: '/users',
            builder: (context, state) => const Center(child: Text('Users')),
            routes: [
              // User nested routes
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final userId = state.pathParameters['id'] ?? '';
                  return Center(child: Text('User Detail: $userId'));
                },
              ),
            ],
          ),
          
          // Customers
          GoRoute(
            path: '/customers',
            builder: (context, state) => const Center(child: Text('Customers')),
            routes: [
              // Customer nested routes
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final customerId = state.pathParameters['id'] ?? '';
                  return Center(child: Text('Customer Detail: $customerId'));
                },
              ),
            ],
          ),
          
          // Requests
          GoRoute(
            path: '/requests',
            builder: (context, state) => const Center(child: Text('Requests')),
            routes: [
              // Request nested routes
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final requestId = state.pathParameters['id'] ?? '';
                  return Center(child: Text('Request Detail: $requestId'));
                },
              ),
            ],
          ),
          
          // Appointments
          GoRoute(
            path: '/appointments',
            builder: (context, state) => const Center(child: Text('Appointments')),
            routes: [
              // Appointment nested routes
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final appointmentId = state.pathParameters['id'] ?? '';
                  return Center(child: Text('Appointment Detail: $appointmentId'));
                },
              ),
            ],
          ),
          
          // Profile
          GoRoute(
            path: '/profile',
            builder: (context, state) => const Center(child: Text('Profile')),
          ),
          
          // Settings
          GoRoute(
            path: '/settings',
            builder: (context, state) => const Center(child: Text('Settings')),
          ),
        ],
      ),
    ],
    
    // Error handling
    errorBuilder: (context, state) => ErrorScreen(
      error: state.error.toString(),
    ),
  );
}
