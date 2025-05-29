import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/auth_request_models.dart';
import '../../../domain/repositories/auth_repository.dart';

/// Reset password screen for setting a new password
class ResetPasswordScreen extends StatefulWidget {
  final String token;

  const ResetPasswordScreen({
    super.key,
    required this.token,
  });

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  bool _resetSuccess = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() {
        _isLoading = true;
      });

      try {
        final AuthRepository authRepository = context.read<AuthRepository>();
        final request = ResetPasswordRequest(
          token: widget.token,
          password: _passwordController.text,
          passwordConfirmation: _confirmPasswordController.text,
        );
        
        await authRepository.resetPassword(request);
        
        setState(() {
          _isLoading = false;
          _resetSuccess = true;
        });
      } catch (e) {
        setState(() {
          _isLoading = false;
        });
        
        String message = 'Password reset failed';
        
        if (e is ApiException) {
          message = e.message;
        }
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Check if token is empty or invalid
    if (widget.token.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Reset Password'),
        ),
        body: Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64.w,
                  color: theme.colorScheme.error,
                ),
                SizedBox(height: 24.h),
                Text(
                  'Invalid Reset Link',
                  style: TextStyle(
                    fontSize: 24.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8.h),                Text(
                  'The password reset link is invalid or has expired.',
                  style: TextStyle(
                    fontSize: 16.sp,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 24.h),
                ElevatedButton(
                  onPressed: () {
                    context.go('/forgot-password');
                  },
                  child: const Text('Request New Reset Link'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reset Password'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: _resetSuccess
                  ? _buildSuccessContent()
                  : _buildResetContent(theme),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildResetContent(ThemeData theme) {
    return [
      // Icon
      Icon(
        Icons.lock_reset,
        size: 64.w,
        color: theme.colorScheme.primary,
      ),
      SizedBox(height: 24.h),
      // Title
      Text(
        'Set New Password',
        style: TextStyle(
          fontSize: 24.sp,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 8.h),
      // Description
      Text(
        'Create a new password for your account.',
        style: TextStyle(
          fontSize: 16.sp,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 32.h),
      // Form
      Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Password field
            TextFormField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                labelText: 'New Password',
                hintText: 'Enter your new password',
                prefixIcon: const Icon(Icons.lock_outlined),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a password';
                }
                if (value.length < 6) {
                  return 'Password must be at least 6 characters';
                }
                return null;
              },
            ),
            SizedBox(height: 16.h),
            // Confirm password field
            TextFormField(
              controller: _confirmPasswordController,
              obscureText: _obscureConfirmPassword,
              decoration: InputDecoration(
                labelText: 'Confirm Password',
                hintText: 'Confirm your new password',
                prefixIcon: const Icon(Icons.lock_outlined),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirmPassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscureConfirmPassword = !_obscureConfirmPassword;
                    });
                  },
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please confirm your password';
                }
                if (value != _passwordController.text) {
                  return 'Passwords do not match';
                }
                return null;
              },
            ),
            SizedBox(height: 24.h),
            // Reset button
            ElevatedButton(
              onPressed: _isLoading ? null : _resetPassword,
              child: _isLoading
                  ? SizedBox(
                      width: 20.w,
                      height: 20.h,
                      child: const CircularProgressIndicator(
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Reset Password'),
            ),
            SizedBox(height: 16.h),
            // Back to login
            TextButton(
              onPressed: () {
                context.go('/login');
              },
              child: Text(
                'Back to Login',
                style: TextStyle(fontSize: 14.sp),
              ),
            ),
          ],
        ),
      ),
    ];
  }

  List<Widget> _buildSuccessContent() {
    return [
      // Success icon
      Icon(
        Icons.check_circle_outline,
        size: 64.w,
        color: Colors.green,
      ),
      SizedBox(height: 24.h),
      // Title
      Text(
        'Password Reset Successful',
        style: TextStyle(
          fontSize: 24.sp,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 8.h),
      // Description
      Text(
        'Your password has been reset successfully.',
        style: TextStyle(
          fontSize: 16.sp,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 32.h),
      // Login button
      ElevatedButton(
        onPressed: () {
          context.go('/login');
        },
        child: const Text('Login with New Password'),
      ),
    ];
  }
}
