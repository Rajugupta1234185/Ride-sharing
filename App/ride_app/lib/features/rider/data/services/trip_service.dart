// lib/features/rider/data/services/trip_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/trip_model.dart';

class TripService {
  TripService({required this.baseUrl});

  final String baseUrl; // e.g. http://your-nest-service/trips

  Future<TripModel> createTrip({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/trips'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'pickupLat': pickupLat,
        'pickupLng': pickupLng,
        'dropoffLat': dropoffLat,
        'dropoffLng': dropoffLng,
      }),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to create trip: ${response.statusCode} ${response.body}');
    }

    return TripModel.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<TripModel> getTrip(String tripId) async {
    final response = await http.get(Uri.parse('$baseUrl/trips/$tripId'));

    if (response.statusCode != 200) {
      throw Exception('Failed to fetch trip: ${response.statusCode} ${response.body}');
    }

    return TripModel.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }
}