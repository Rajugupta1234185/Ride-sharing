import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/router/app_router.dart';
import './features/rider/presentation/viewmodels/rider_view_model.dart';
import '../core/network/api_client.dart'; // wherever ApiClient lives

class RideApp extends StatelessWidget {
  const RideApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => RideViewModel(apiClient: ApiClient()), // adjust construction
        ),
        // add LoginViewModel and any other ChangeNotifiers here too
      ],
      child: MaterialApp.router(
        title: 'Ride App',
        debugShowCheckedModeBanner: false,
        routerConfig: appRouter,
      ),
    );
  }
}