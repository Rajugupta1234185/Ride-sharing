import 'package:dio/dio.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart'
    hide LocationSettings;

class RouteResult {
  final double distanceMeters;
  final double durationSeconds;
  final List<Position> points;

  const RouteResult({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.points,
  });
}

class MapboxDirectionsService {
  MapboxDirectionsService({Dio? dio}) : _dio = dio ?? Dio();

  final Dio _dio;

  static const _accessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

  Future<RouteResult> getDrivingRoute({
    required Position origin,
    required Position destination,
  }) async {
    if (_accessToken.isEmpty) {
      throw Exception('MAPBOX_ACCESS_TOKEN is not configured.');
    }

    final coordinates =
        '${origin.lng},${origin.lat};${destination.lng},${destination.lat}';

    final response = await _dio.get(
      'https://api.mapbox.com/directions/v5/mapbox/driving/$coordinates',
      queryParameters: {
        'alternatives': 'false',
        'overview': 'full',
        'geometries': 'geojson',
        'steps': 'false',
        'access_token': _accessToken,
      },
    );

    final data = response.data as Map<String, dynamic>;
    final routes = data['routes'] as List<dynamic>? ?? [];

    if (routes.isEmpty) {
      throw Exception('No route found.');
    }

    final route = routes.first as Map<String, dynamic>;
    final distance = (route['distance'] as num?)?.toDouble() ?? 0;
    final duration = (route['duration'] as num?)?.toDouble() ?? 0;

    final geometry = route['geometry'] as Map<String, dynamic>?;
    final rawCoordinates = geometry?['coordinates'] as List<dynamic>?;

    if (rawCoordinates == null || rawCoordinates.isEmpty) {
      throw Exception('Route geometry not found.');
    }

    final points = <Position>[];
    for (final coordinate in rawCoordinates) {
      final pair = coordinate as List<dynamic>;
      if (pair.length < 2) continue;
      points.add(
        Position((pair[0] as num).toDouble(), (pair[1] as num).toDouble()),
      );
    }

    if (points.length < 2) {
      throw Exception('Invalid route geometry.');
    }

    return RouteResult(
      distanceMeters: distance,
      durationSeconds: duration,
      points: points,
    );
  }
}