import 'dart:async';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:ride_app/core/constants/api_constants.dart';

import 'widgets/marker_icons.dart';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart' hide Position;
import 'package:go_router/go_router.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart'
    hide LocationSettings;
import 'package:provider/provider.dart';

import '../../../../core/theme/app_color.dart';

import '../data/services//mapbox_direction_service.dart';
import '../data/services/mapbox_places_service.dart';
import '../domain/models/place_search_result.dart';
import '../../rider/presentation/viewmodels/rider_view_model.dart';
import 'widgets/bottom_ride_card.dart';
import 'widgets/common_controls.dart';
import 'widgets/destination_search_overlay.dart';

class RiderHomePage extends StatefulWidget {
  const RiderHomePage({super.key});

  @override
  State<RiderHomePage> createState() => _RiderHomePageState();
}

class _RiderHomePageState extends State<RiderHomePage> {
  final _placesService = MapboxPlacesService();
  final _directionsService = MapboxDirectionsService();

  late final RideViewModel _rideViewModel;

  MapboxMap? _mapboxMap;
  PointAnnotationManager? _pointAnnotationManager;
  Uint8List? _currentLocationIcon;
  Uint8List? _destinationIcon;
  PolylineAnnotationManager? _polylineAnnotationManager;

  // Driver tracking (bike marker + live red line to pickup)
  PointAnnotationManager? _driverMarkerManager;
  PolylineAnnotationManager? _driverLineManager;
  Uint8List? _bikeIcon;
  PointAnnotation? _driverAnnotation;
  Point? _lastDriverPoint;
  Timer? _driverAnimationTimer;

  static const double _defaultLongitude = 85.3240;
  static const double _defaultLatitude = 27.7172;

  Point? _currentLocationPoint;
  Point? _destinationPoint;

  bool _isDestinationMode = false;
  bool _isPickingLocationOnMap = false;
  String pickupLocation = 'Current location';
  String? destinationLocation;
  String? _destinationAddress;

  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _searchDebounce;
  bool _isSearching = false;
  List<PlaceSearchResult> _searchResults = [];

  bool _isLoadingRoute = false;
  double? _routeDistanceMeters;
  double? _routeDurationSeconds;

  int _selectedNavIndex = 0;

  @override
  void initState() {
    super.initState();
    _rideViewModel = context.read<RideViewModel>();
    _rideViewModel.addListener(_onRideStatusChanged);
  }

  @override
  void dispose() {
    _rideViewModel.removeListener(_onRideStatusChanged);
    _searchDebounce?.cancel();
    _driverAnimationTimer?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  // Ride is "active" from the moment we request it until it's cancelled,
  // matched-and-done, or fails. While active, destination/pickup are locked.
  bool get _hasActiveRide =>
      _rideViewModel.status == RideRequestStatus.requesting ||
      _rideViewModel.status == RideRequestStatus.searching ||
      _rideViewModel.status == RideRequestStatus.matched;

  void _onRideStatusChanged() {
    if (!mounted) return;

    switch (_rideViewModel.status) {
      case RideRequestStatus.matched:
        final trip = _rideViewModel.activeTrip;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Driver found! ID: ${trip?.driverId ?? "-"}')),
        );
        break;

      case RideRequestStatus.noDriverFound:
        _clearDriverTracking();
        _showNoDriverDialog();
        break;

      case RideRequestStatus.error:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_rideViewModel.errorMessage ?? 'Something went wrong.')),
        );
        break;

      case RideRequestStatus.idle:
        _clearDriverTracking();
        break;

      case RideRequestStatus.requesting:
      case RideRequestStatus.searching:
        break;
    }

    // React to driver location updates pushed from RideViewModel
    final lat = _rideViewModel.driverLat;
    final lng = _rideViewModel.driverLng;
    if (lat != null && lng != null) {
      _animateDriverTo(Point(coordinates: Position(lng, lat)));
    }

    setState(() {}); // rebuild so the overlay / locked UI reflects new status
  }

  void _showNoDriverDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('No drivers nearby'),
        content: const Text(
          'We couldn\'t find a driver near your pickup location right now. '
          'Try again, or choose a different destination.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resetRideAndSearch();
            },
            child: const Text('Change destination'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _rideViewModel.reset();
              _requestRide(); // retry with same pickup/destination
            },
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }

  void _resetRideAndSearch() {
    _rideViewModel.reset();
    setState(() {
      destinationLocation = null;
      _destinationAddress = null;
      _destinationPoint = null;
      _routeDistanceMeters = null;
      _routeDurationSeconds = null;
    });
    _polylineAnnotationManager?.deleteAll();
    _showMarkers(); // redraw with only current-location pin
    _openDestinationSearch();
  }

  Future<void> _onMapCreated(MapboxMap mapboxMap) async {
    _mapboxMap = mapboxMap;

    _pointAnnotationManager =
        await mapboxMap.annotations.createPointAnnotationManager();
    _polylineAnnotationManager =
        await mapboxMap.annotations.createPolylineAnnotationManager();

    // Driver tracking managers
    _driverMarkerManager =
        await mapboxMap.annotations.createPointAnnotationManager();
    _driverLineManager =
        await mapboxMap.annotations.createPolylineAnnotationManager();

    _currentLocationIcon = await MarkerIcons.buildLabeledMarker(
      label: 'C',
      backgroundColor: Colors.green,
    );
    _destinationIcon = await MarkerIcons.buildLabeledMarker(
      label: 'D',
      backgroundColor: Colors.redAccent,
    );
    _bikeIcon = await MarkerIcons.buildLabeledMarker(
      label: 'B',
      backgroundColor: Colors.blueAccent,
    );

    await _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showLocationError('Location services are turned off on this device.');
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _showLocationError('Location permission was denied.');
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );

      final currentPoint =
          Point(coordinates: Position(position.longitude, position.latitude));

      if (!mounted) return;
      setState(() {
        _currentLocationPoint = currentPoint;
        pickupLocation = 'Current location';
      });

      await _showMarkers();
      await _moveCameraToPoint(currentPoint, zoom: 15.0);
    } catch (error) {
      _showLocationError('Location error: $error');
    }
  }

  void _showLocationError(String message) {
    debugPrint(message);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  String _getSearchProximity() {
    final point = _currentLocationPoint;
    if (point == null) return '$_defaultLongitude,$_defaultLatitude';
    final coordinates = point.coordinates;
    return '${coordinates.lng},${coordinates.lat}';
  }

  Future<void> _showMarkers() async {
    final manager = _pointAnnotationManager;
    if (manager == null) return;

    await manager.deleteAll();

    if (_currentLocationPoint != null && _currentLocationIcon != null) {
      await manager.create(
        PointAnnotationOptions(
          geometry: _currentLocationPoint!,
          image: _currentLocationIcon,
          iconAnchor: IconAnchor.CENTER,
        ),
      );
    }

    if (_destinationPoint != null && _destinationIcon != null) {
      await manager.create(
        PointAnnotationOptions(
          geometry: _destinationPoint!,
          image: _destinationIcon,
          iconAnchor: IconAnchor.CENTER,
        ),
      );
    }
  }

  Future<void> _moveCameraToPoint(Point point, {double zoom = 15.0}) async {
    if (_mapboxMap == null) return;
    await _mapboxMap!.flyTo(
      CameraOptions(center: point, zoom: zoom),
      MapAnimationOptions(duration: 700),
    );
  }

  void _openDestinationSearch() {
    if (_hasActiveRide) {
      _showRideLockedMessage();
      return;
    }

    setState(() {
      _isDestinationMode = true;
      _searchResults = [];
      _isSearching = false;
    });

    Future.delayed(const Duration(milliseconds: 200), () {
      if (!mounted) return;
      _searchFocusNode.requestFocus();
    });
  }

  void _showRideLockedMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Cancel your current ride request to change destination.'),
      ),
    );
  }

  void _closeDestinationSearch() {
    _searchDebounce?.cancel();
    _searchController.clear();
    _searchFocusNode.unfocus();
    setState(() {
      _isDestinationMode = false;
      _searchResults = [];
      _isSearching = false;
    });
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    final query = value.trim();

    if (query.length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    _searchDebounce = Timer(
      const Duration(milliseconds: 350),
      () => _searchPlaces(query),
    );
  }

  Future<void> _searchPlaces(String query) async {
    try {
      final results =
          await _placesService.search(query, proximity: _getSearchProximity());

      if (!mounted) return;
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (error) {
      debugPrint('Search error: $error');
      if (!mounted) return;
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
    }
  }

  Future<void> _selectDestination(PlaceSearchResult place) async {
    if (_currentLocationPoint == null) {
      await _getCurrentLocation();
    }

    if (_currentLocationPoint == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to get your current location.')),
      );
      return;
    }

    final destinationPoint =
        Point(coordinates: Position(place.longitude, place.latitude));

    if (!mounted) return;
    setState(() {
      destinationLocation = place.name;
      _destinationAddress = place.address;
      _destinationPoint = destinationPoint;
      _isDestinationMode = false;
      _searchResults = [];
      _isSearching = false;
      _routeDistanceMeters = null;
      _routeDurationSeconds = null;
    });

    _searchController.clear();
    _searchFocusNode.unfocus();

    await _showMarkers();
    await _drawRoadRoute();
    await _fitRouteOnMap();
  }

  Future<void> _drawRoadRoute() async {
    if (_currentLocationPoint == null ||
        _destinationPoint == null ||
        _polylineAnnotationManager == null) {
      return;
    }

    setState(() => _isLoadingRoute = true);

    try {
      final route = await _directionsService.getDrivingRoute(
        origin: _currentLocationPoint!.coordinates,
        destination: _destinationPoint!.coordinates,
      );

      await _polylineAnnotationManager!.deleteAll();
      await _polylineAnnotationManager!.create(
        PolylineAnnotationOptions(
          geometry: LineString(coordinates: route.points),
          lineColor: AppColors.primary.value,
          lineWidth: 6.0,
          lineOpacity: 0.9,
        ),
      );

      if (!mounted) return;
      setState(() {
        _routeDistanceMeters = route.distanceMeters;
        _routeDurationSeconds = route.durationSeconds;
        _isLoadingRoute = false;
      });
    } catch (error) {
      debugPrint('Route error: $error');
      await _drawFallbackStraightLine();
      if (!mounted) return;
      setState(() => _isLoadingRoute = false);
    }
  }

  Future<void> _drawFallbackStraightLine() async {
    if (_currentLocationPoint == null ||
        _destinationPoint == null ||
        _polylineAnnotationManager == null) {
      return;
    }

    await _polylineAnnotationManager!.deleteAll();
    await _polylineAnnotationManager!.create(
      PolylineAnnotationOptions(
        geometry: LineString(
          coordinates: [
            _currentLocationPoint!.coordinates,
            _destinationPoint!.coordinates,
          ],
        ),
        lineColor: Colors.grey.value,
        lineWidth: 4,
        lineOpacity: 0.7,
      ),
    );
  }

  Future<void> _fitRouteOnMap() async {
    if (_mapboxMap == null ||
        _currentLocationPoint == null ||
        _destinationPoint == null) {
      return;
    }

    try {
      final camera = await _mapboxMap!.cameraForCoordinates(
        [_currentLocationPoint!, _destinationPoint!],
        MbxEdgeInsets(top: 150, left: 50, bottom: 360, right: 50),
        null,
        null,
      );

      await _mapboxMap!.flyTo(camera, MapAnimationOptions(duration: 1000));
    } catch (error) {
      debugPrint('Fit route camera error: $error');
    }
  }

  Future<void> _moveToCurrentLocation() async {
    if (_currentLocationPoint == null) {
      await _getCurrentLocation();
      return;
    }
    if (_destinationPoint != null) {
      await _fitRouteOnMap();
      return;
    }
    await _moveCameraToPoint(_currentLocationPoint!, zoom: 15);
  }

  void _toggleLocationPicking() {
    if (_hasActiveRide) {
      _showRideLockedMessage();
      return;
    }

    setState(() => _isPickingLocationOnMap = !_isPickingLocationOnMap);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isPickingLocationOnMap
              ? 'Tap anywhere on the map to set it as your current location'
              : 'Cancelled setting location manually',
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _onMapTap(MapContentGestureContext context) {
    if (!_isPickingLocationOnMap) return;

    final tappedPoint = context.point;

    setState(() {
      _currentLocationPoint = tappedPoint;
      pickupLocation = 'Custom location';
      _isPickingLocationOnMap = false;
    });

    _showMarkers();
    _moveCameraToPoint(tappedPoint, zoom: 15.0);

    if (_destinationPoint != null) {
      _drawRoadRoute();
      _fitRouteOnMap();
    }
  }

  Future<void> _requestRide() async {
    if (_hasActiveRide) return; // guard: button should be disabled anyway

    if (_destinationPoint == null) {
      _openDestinationSearch();
      return;
    }

    if (_currentLocationPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Current location is not available.')),
      );
      return;
    }

    await _rideViewModel.requestRide(
      pickupLat: _currentLocationPoint!.coordinates.lat.toDouble(),
      pickupLng: _currentLocationPoint!.coordinates.lng.toDouble(),
      dropoffLat: _destinationPoint!.coordinates.lat.toDouble(),
      dropoffLng: _destinationPoint!.coordinates.lng.toDouble(),
    );
  }

  Future<void> _cancelRide() async {
    _clearDriverTracking();
    await _rideViewModel.cancelRide();
  }

  // ---------------------------------------------------------------------
  // Driver location tracking: bike marker + smooth animation + red line
  // ---------------------------------------------------------------------

 Future<void> _animateDriverTo(Point newPoint) async {
  final manager = _driverMarkerManager;
  final lineManager = _driverLineManager;
  if (manager == null || lineManager == null || _bikeIcon == null) return;

  // Skip if this is the same point we already animated to / are animating to
  final previousPoint = _lastDriverPoint;
  if (previousPoint != null &&
      previousPoint.coordinates.lat == newPoint.coordinates.lat &&
      previousPoint.coordinates.lng == newPoint.coordinates.lng) {
    return;
  }

  _lastDriverPoint = newPoint;
  _driverAnimationTimer?.cancel(); // cancel any pending scheduled step

  if (previousPoint == null) {
    await manager.deleteAll();
    _driverAnnotation = await manager.create(
      PointAnnotationOptions(
        geometry: newPoint,
        image: _bikeIcon,
        iconAnchor: IconAnchor.CENTER,
      ),
    );
    await _drawDriverLine(newPoint);
    return;
  }

  const steps = 20;
  const stepDuration = Duration(milliseconds: 50);

  final startLng = previousPoint.coordinates.lng.toDouble();
  final startLat = previousPoint.coordinates.lat.toDouble();
  final endLng = newPoint.coordinates.lng.toDouble();
  final endLat = newPoint.coordinates.lat.toDouble();

  await _runAnimationStep(
    manager: manager,
    step: 1,
    totalSteps: steps,
    startLat: startLat,
    startLng: startLng,
    endLat: endLat,
    endLng: endLng,
    stepDuration: stepDuration,
  );
}

Future<void> _runAnimationStep({
  required PointAnnotationManager manager,
  required int step,
  required int totalSteps,
  required double startLat,
  required double startLng,
  required double endLat,
  required double endLng,
  required Duration stepDuration,
}) async {
  final t = step / totalSteps;
  final lerpedLat = startLat + (endLat - startLat) * t;
  final lerpedLng = startLng + (endLng - startLng) * t;
  final lerpedPoint = Point(coordinates: Position(lerpedLng, lerpedLat));

  try {
    if (_driverAnnotation != null) {
      await manager.delete(_driverAnnotation!);
    }
    _driverAnnotation = await manager.create(
      PointAnnotationOptions(
        geometry: lerpedPoint,
        image: _bikeIcon,
        iconAnchor: IconAnchor.CENTER,
      ),
    );
    await _drawDriverLine(lerpedPoint);
  } catch (e) {
    debugPrint('⚠️ Animation step error (ignored): $e');
    try {
      _driverAnnotation = await manager.create(
        PointAnnotationOptions(
          geometry: lerpedPoint,
          image: _bikeIcon,
          iconAnchor: IconAnchor.CENTER,
        ),
      );
    } catch (_) {
      // swallow — next step will retry anyway
    }
  }

  if (step < totalSteps && mounted) {
    _driverAnimationTimer = Timer(stepDuration, () {
      _runAnimationStep(
        manager: manager,
        step: step + 1,
        totalSteps: totalSteps,
        startLat: startLat,
        startLng: startLng,
        endLat: endLat,
        endLng: endLng,
        stepDuration: stepDuration,
      );
    });
  }
}

  Future<void> _drawDriverLine(Point driverPoint) async {
    final lineManager = _driverLineManager;
    final pickupPoint = _currentLocationPoint;
    if (lineManager == null || pickupPoint == null) return;

    await lineManager.deleteAll();
    await lineManager.create(
      PolylineAnnotationOptions(
        geometry: LineString(
          coordinates: [driverPoint.coordinates, pickupPoint.coordinates],
        ),
        lineColor: Colors.red.value,
        lineWidth: 4.0,
        lineOpacity: 0.85,
      ),
    );
  }

  void _clearDriverTracking() {
    _driverAnimationTimer?.cancel();
    _driverAnimationTimer = null;
    _lastDriverPoint = null;
    _driverAnnotation = null;
    _driverMarkerManager?.deleteAll();
    _driverLineManager?.deleteAll();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      body: SizedBox.expand(
        child: Stack(
          children: [
            Positioned.fill(
              child: MapWidget(
                key: const ValueKey('rider-map'),
                cameraOptions: CameraOptions(
                  center: Point(
                    coordinates:
                        Position(_defaultLongitude, _defaultLatitude),
                  ),
                  zoom: 13.5,
                ),
                onMapCreated: _onMapCreated,
                onTapListener: _onMapTap,
              ),
            ),
            if (!_isDestinationMode) _buildTopControls(),
            if (kDebugMode && !_isDestinationMode)
                Positioned(
                  top: MediaQuery.of(context).padding.top + 12,
                  left: 70,
                  child: FloatingIconButton(
                    icon: Icons.bug_report,
                    onTap: _seedDrivers,
                  ),
                ),
            if (!_isDestinationMode && !_hasActiveRide)
              Positioned(
                right: 18,
                bottom: (destinationLocation != null ? 270 : 190) + 60,
                child: FloatingIconButton(
                  icon: _isPickingLocationOnMap
                      ? Icons.close_rounded
                      : Icons.edit_location_alt_rounded,
                  onTap: _toggleLocationPicking,
                ),
              ),
            if (_isDestinationMode)
              DestinationSearchOverlay(
                controller: _searchController,
                focusNode: _searchFocusNode,
                isSearching: _isSearching,
                results: _searchResults,
                onChanged: _onSearchChanged,
                onClear: () {
                  _searchController.clear();
                  setState(() => _searchResults = []);
                },
                onClose: _closeDestinationSearch,
                onSelect: _selectDestination,
              ),
            if (!_isDestinationMode)
              BottomRideCard(
                pickupLabel: pickupLocation,
                destinationLabel: destinationLocation ?? 'Search destination',
                hasDestination: destinationLocation != null,
                isLoadingRoute: _isLoadingRoute,
                distanceText: _formatDistance(_routeDistanceMeters),
                durationText: _formatDuration(_routeDurationSeconds),
                isRequestingRide: _rideViewModel.isRequestingRide,
                onPickupTap: _hasActiveRide ? _showRideLockedMessage : _moveToCurrentLocation,
                onDestinationTap: _openDestinationSearch,
                onRequestRide: _requestRide,
              ),
            if (!_isDestinationMode)
              Positioned(
                right: 18,
                bottom: destinationLocation != null ? 270 : 190,
                child: FloatingIconButton(
                  icon: Icons.my_location_rounded,
                  onTap: _moveToCurrentLocation,
                ),
              ),
            if (!_isDestinationMode)
              RiderBottomNavBar(
                selectedIndex: _selectedNavIndex,
                onItemSelected: _onNavItemSelected,
              ),

            // Searching / matched overlay — blocks interaction with the rest
            // of the screen until the ride is matched, fails, or is cancelled.
            if (_rideViewModel.status == RideRequestStatus.requesting ||
                _rideViewModel.status == RideRequestStatus.searching)
              _buildSearchingOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchingOverlay() {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.45),
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 40),
            padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const _PulsingSearchIcon(),
                const SizedBox(height: 18),
                const Text(
                  'Looking for a nearby rider...',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'This usually takes a few seconds.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                TextButton(
                  onPressed: _cancelRide,
                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Cancel ride'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopControls() {
    final topPadding = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topPadding + 12,
      left: 16,
      right: 16,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          FloatingIconButton(icon: Icons.menu_rounded, onTap: _openMenu),
          FloatingIconButton(
            icon: Icons.notifications_none_rounded,
            onTap: _openNotifications,
          ),
        ],
      ),
    );
  }

  String? _formatDistance(double? distance) {
    if (distance == null) return null;
    return distance >= 1000
        ? '${(distance / 1000).toStringAsFixed(1)} km'
        : '${distance.toStringAsFixed(0)} m';
  }

  String? _formatDuration(double? duration) {
    if (duration == null) return null;
    final minutes = (duration / 60).round();
    return minutes < 60
        ? '$minutes min'
        : '${minutes ~/ 60}h ${minutes % 60}m';
  }

  void _onNavItemSelected(int index) {
    setState(() => _selectedNavIndex = index);
    if (index == 1) context.push('/trips');
    if (index == 2) context.push('/profile');
  }

  void _openMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                MenuSheetItem(
                  icon: Icons.history_rounded,
                  title: 'Trip history',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/trips');
                  },
                ),
                MenuSheetItem(
                  icon: Icons.settings_outlined,
                  title: 'Settings',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/settings');
                  },
                ),
                MenuSheetItem(
                  icon: Icons.person_outline_rounded,
                  title: 'Profile',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/profile');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

      // NEW — paste _seedDrivers() here
    Future<void> _seedDrivers() async {
      final point = _currentLocationPoint;
      if (point == null) return;

      try {
        await Dio().post(
          '${ApiConstants.locationServiceUrl}/simulator/seed',
          data: {
            'count': 3,
            'lat': point.coordinates.lat.toDouble(),
            'lng': point.coordinates.lng.toDouble(),
            'radiusMeters': 1500,
          },
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🚗 Seeded 3 test drivers nearby')),
        );
      } catch (e) {
        debugPrint('Seed drivers error: $e');
      }
    }

  void _openNotifications() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return const SafeArea(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.notifications_none_rounded,
                  size: 40,
                  color: AppColors.primary,
                ),
                SizedBox(height: 12),
                Text(
                  'No new notifications',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'You are all caught up.',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                SizedBox(height: 15),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Simple pulsing search icon for the "looking for a rider" overlay.
class _PulsingSearchIcon extends StatefulWidget {
  const _PulsingSearchIcon();

  @override
  State<_PulsingSearchIcon> createState() => _PulsingSearchIconState();
}

class _PulsingSearchIconState extends State<_PulsingSearchIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween(begin: 0.85, end: 1.15).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
      ),
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.primary.withOpacity(0.12),
        ),
        child: Icon(Icons.two_wheeler_rounded, color: AppColors.primary, size: 32),
      ),
    );
  }
}