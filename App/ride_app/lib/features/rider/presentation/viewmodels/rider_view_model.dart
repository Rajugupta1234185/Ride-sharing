// lib/features/rider/presentation/viewmodels/ride_view_model.dart
import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/socket_service.dart';
import '../../../../core/constants/api_constants.dart';
import '../../data/models/trip_model.dart';

enum RideRequestStatus {
  idle,
  requesting,
  searching,
  matched,
  noDriverFound,
  error,
}

class RideViewModel extends ChangeNotifier {
  final ApiClient apiClient;
  final SocketService _socketService = SocketService();

  RideViewModel({required this.apiClient});

  RideRequestStatus status = RideRequestStatus.idle;
  TripModel? activeTrip;
  String? errorMessage;
  double? driverLat;
  double ?driverLng;


  Timer? _timeoutTimer;

  bool get isRequestingRide =>
      status == RideRequestStatus.requesting ||
      status == RideRequestStatus.searching;

  Future<bool> requestRide({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
  }) async {
    status = RideRequestStatus.requesting;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await apiClient.post(
        ApiConstants.trip,
        data: {
          'pickupLat': pickupLat,
          'pickupLng': pickupLng,
          'dropoffLat': dropoffLat,
          'dropoffLng': dropoffLng,
        },
      );

      final trip = TripModel.fromJson(response.data);

      activeTrip = trip;
      status = RideRequestStatus.searching;
      notifyListeners();

      _listenForTripUpdates(trip.riderId);
      _startTimeoutGuard();

      return true;
    } catch (e) {
      errorMessage = e.toString();
      status = RideRequestStatus.error;
      notifyListeners();
      return false;
    }
  }

  void _listenForTripUpdates(String riderId) {
    _socketService.connect(
      baseUrl: ApiConstants.socketUrl,
      riderId: riderId,
      onTripUpdate: (data) {
        final updatedTrip = TripModel.fromJson(data);
        activeTrip = updatedTrip;

        if (updatedTrip.status == 'MATCHED') {
          _timeoutTimer?.cancel();
          status = RideRequestStatus.matched;
        } else if (updatedTrip.status == 'NO_DRIVER_FOUND') {
          _timeoutTimer?.cancel();
          status = RideRequestStatus.noDriverFound;
          _socketService.disconnect();
        }

        notifyListeners();
      },

       onDriverLocation: (data) { // NEW
        driverLat = (data['lat'] as num).toDouble();
        driverLng = (data['lng'] as num).toDouble();
        notifyListeners();
      },
    );
  }

  void _startTimeoutGuard() {
    _timeoutTimer?.cancel();
    _timeoutTimer = Timer(const Duration(seconds: 60), () {
      if (status == RideRequestStatus.searching) {
        status = RideRequestStatus.noDriverFound;
        errorMessage = 'Still searching... please try again.';
        _socketService.disconnect();
        notifyListeners();
      }
    });
  }

  Future<void> cancelRide() async {
    final tripId = activeTrip?.id;
    _timeoutTimer?.cancel();
    _socketService.disconnect();

    if (tripId != null) {
      try {
        await apiClient.post('${ApiConstants.trip}/$tripId/cancel');
      } catch (e) {
        debugPrint('Cancel ride error: $e');
      }
    }

    status = RideRequestStatus.idle;
    activeTrip = null;
    errorMessage = null;
    driverLat =null;
    driverLng= null;
    notifyListeners();
  }

  void reset() {
    _timeoutTimer?.cancel();
    _socketService.disconnect();
    status = RideRequestStatus.idle;
    activeTrip = null;
    errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    _socketService.disconnect();
    super.dispose();
  }
}