class PlaceSearchResult {
  final String mapboxId;
  final String name;
  final String address;
  final double longitude;
  final double latitude;

  const PlaceSearchResult({
    required this.mapboxId,
    required this.name,
    required this.address,
    required this.longitude,
    required this.latitude,
  });
}