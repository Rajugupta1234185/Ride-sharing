import 'package:go_router/go_router.dart';

import '../../features/splash/presentation/splash_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/home/presentation/rider_home_page.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',

  routes: [
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) {
        return const SplashPage();
      },
    ),

    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) {
        return const LoginPage();
      },
    ),

    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) {
        return const RiderHomePage();
      },
    ),
  ],
);