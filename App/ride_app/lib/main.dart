import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  const accessToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
  );


  MapboxOptions.setAccessToken(accessToken);

  runApp(const RideApp());
}