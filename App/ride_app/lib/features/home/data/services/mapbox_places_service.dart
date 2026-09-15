import 'package:dio/dio.dart';

import '../../domain/models/place_search_result.dart';

/// FIX: uses ONLY Geocoding v6 end-to-end. The old code searched with
/// Geocoding v6 but then tried to "retrieve" the result from the Search
/// Box v1 API using the Geocoding v6 id — those ids are incompatible,
/// so retrieve always 404'd. Geocoding v6 already returns full
/// coordinates, so no retrieve step is needed at all.
class MapboxPlacesService {
  MapboxPlacesService({Dio? dio}) : _dio = dio ?? Dio();

  final Dio _dio;

  static const _accessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

  /// [proximity] = "longitude,latitude" of the user's current location —
  /// biases results toward nearby places, like Google Maps does.
  Future<List<PlaceSearchResult>> search(
    String query, {
    required String proximity,
  }) async {
    if (_accessToken.isEmpty) {
      throw Exception(
        'MAPBOX_ACCESS_TOKEN is empty. Run/build with '
        '--dart-define=MAPBOX_ACCESS_TOKEN=your_token',
      );
    }

    final response = await _dio.get(
      'https://api.mapbox.com/search/geocode/v6/forward',
      queryParameters: {
        'q': query,
        'limit': 10,
        'language': 'en',
        'proximity': proximity,
        'access_token': _accessToken,
      },
    );

    final data = response.data as Map<String, dynamic>;
    final features = data['features'] as List<dynamic>? ?? [];

    final results = <PlaceSearchResult>[];

    for (final feature in features) {
      final featureMap = feature as Map<String, dynamic>;

      final properties =
          featureMap['properties'] as Map<String, dynamic>? ?? {};
      final geometry =
          featureMap['geometry'] as Map<String, dynamic>? ?? {};
      final coordinates = geometry['coordinates'] as List<dynamic>? ?? [];

      if (coordinates.length < 2) continue;

      final name = properties['name']?.toString() ?? '';
      if (name.isEmpty) continue;

      final address = properties['full_address']?.toString() ??
          properties['place_formatted']?.toString() ??
          '';

      results.add(
        PlaceSearchResult(
          mapboxId: featureMap['id']?.toString() ?? '',
          name: name,
          address: address,
          longitude: (coordinates[0] as num).toDouble(),
          latitude: (coordinates[1] as num).toDouble(),
        ),
      );
    }

    return results;
  }
}