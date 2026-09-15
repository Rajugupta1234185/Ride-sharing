// lib/features/rider/data/models/trip_model.dart
class TripModel {
  final String id;
  final String riderId;
  final String? driverId;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
  final String status; // REQUESTED, MATCHED, NO_DRIVER_FOUND, ...
  final double? fareEstimate;
  final double? finalFare;
  final int version;

  TripModel({
    required this.id,
    required this.riderId,
    required this.driverId,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
    required this.status,
    required this.fareEstimate,
    required this.finalFare,
    required this.version,
  });

  factory TripModel.fromJson(Map<String, dynamic> json) {
    return TripModel(
      id: json['id'] as String,
      riderId: json['riderId'] as String,
      driverId: json['driverId'] as String?,
      pickupLat: (json['pickupLat'] as num).toDouble(),
      pickupLng: (json['pickupLng'] as num).toDouble(),
      dropoffLat: (json['dropoffLat'] as num).toDouble(),
      dropoffLng: (json['dropoffLng'] as num).toDouble(),
      status: json['status'] as String,
      fareEstimate: (json['fareEstimate'] as num?)?.toDouble(),
      finalFare: (json['finalFare'] as num?)?.toDouble(),
      version: json['version'] as int,
    );
  }
}