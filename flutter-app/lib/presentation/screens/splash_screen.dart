import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../blocs/auth/auth_bloc.dart';

/// Splash screen shown when the app starts
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {  @override
  void initState() {
    super.initState();
    
    // Check auth status after a short delay to show the splash screen
    Future.delayed(const Duration(seconds: 2), () {
      // Verify the widget is still mounted before using context
      if (mounted) {
        // Trigger auth check
        context.read<AuthBloc>().add(CheckAuthStatus());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          // Navigate to dashboard if authenticated
          context.go('/dashboard');
        } else if (state is AuthUnauthenticated) {
          // Navigate to login if not authenticated
          context.go('/login');
        }
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).colorScheme.primary,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: 120.w,
                height: 120.w,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20.r),
                ),
                padding: EdgeInsets.all(20.w),
                // Replace with actual logo
                child: const FlutterLogo(size: 80),
              ),
              SizedBox(height: 24.h),
              // App name
              Text(
                'Rising BSM',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8.h),
              // Tagline
              Text(                'Business Service Management',
                style: TextStyle(
                  color: Colors.white.withAlpha(204), // 0.8 * 255 = 204
                  fontSize: 16.sp,
                ),
              ),
              SizedBox(height: 48.h),
              // Loading indicator
              SizedBox(
                width: 40.w,
                height: 40.w,
                child: const CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
