import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../di/injection.dart';
import 'blocs/appointments/appointment_bloc.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/customers/customer_bloc.dart';
import 'blocs/dashboard/dashboard_bloc.dart';
import 'blocs/notification/notification_bloc.dart';
import 'blocs/requests/request_bloc.dart';
import 'blocs/users/user_bloc.dart';
import 'routes/app_router.dart';
import 'themes/app_theme.dart';

class RisingBSMApp extends StatelessWidget {
  const RisingBSMApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(390, 844), // Design size for iPhone 14 Pro
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (_, child) {
        return MultiBlocProvider(
          providers: [
            // Core BLoCs
            BlocProvider(create: (_) => getIt<AuthBloc>()..add(CheckAuthStatus())),
            
            // Feature BLoCs
            BlocProvider(create: (_) => getIt<UserBloc>()),
            BlocProvider(create: (_) => getIt<CustomerBloc>()),
            BlocProvider(create: (_) => getIt<RequestBloc>()),
            BlocProvider(create: (_) => getIt<AppointmentBloc>()),
            BlocProvider(create: (_) => getIt<NotificationBloc>()),
            BlocProvider(create: (_) => getIt<DashboardBloc>()),
          ],
          child: MaterialApp.router(
            title: 'Rising BSM',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system, // Can be changed based on user preference
            routerConfig: AppRouter.router,
          ),
        );
      },
    );
  }
}
