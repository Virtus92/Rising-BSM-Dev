import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/errors/api_exception.dart';
import '../../../domain/repositories/auth_repository.dart';

/// Forgot password screen for requesting a password reset
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() {
        _isLoading = true;
      });

      try {
        final AuthRepository authRepository = context.read<AuthRepository>();
        await authRepository.forgotPassword(_emailController.text);
        
        setState(() {
          _isLoading = false;
          _emailSent = true;
        });
      } catch (e) {
        setState(() {
          _isLoading = false;
        });
        
        String message = 'Password reset request failed';
        
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Forgot Password'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: _emailSent
                  ? _buildSuccessContent()
                  : _buildRequestContent(theme),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildRequestContent(ThemeData theme) {
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
        'Forgot Password',
        style: TextStyle(
          fontSize: 24.sp,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 8.h),
      // Description
      Text(
        'Enter your email address and we\'ll send you a link to reset your password.',
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
            // Email field
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'Enter your email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your email';
                }
                if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(value)) {
                  return 'Please enter a valid email';
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
                context.pop();
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
        'Email Sent',
        style: TextStyle(
          fontSize: 24.sp,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 8.h),
      // Description
      Text(
        'We\'ve sent a password reset link to ${_emailController.text}',
        style: TextStyle(
          fontSize: 16.sp,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 32.h),
      // Instructions
      Text(
        'Please check your email and follow the instructions to reset your password.',
        style: TextStyle(fontSize: 14.sp),
        textAlign: TextAlign.center,
      ),
      SizedBox(height: 24.h),
      // Back to login button
      ElevatedButton(
        onPressed: () {
          context.go('/login');
        },
        child: const Text('Back to Login'),
      ),
      SizedBox(height: 16.h),
      // Resend email
      TextButton(
        onPressed: _resetPassword,
        child: Text(
          'Resend Email',
          style: TextStyle(fontSize: 14.sp),
        ),
      ),
    ];
  }
}
