import 'package:flutter/material.dart';

import '../../../../core/theme/app_color.dart';

class BottomRideCard extends StatelessWidget {
  const BottomRideCard({
    super.key,
    required this.pickupLabel,
    required this.destinationLabel,
    required this.hasDestination,
    required this.isLoadingRoute,
    required this.distanceText,
    required this.durationText,
    required this.isRequestingRide,
    required this.onPickupTap,
    required this.onDestinationTap,
    required this.onRequestRide,
  });

  final String pickupLabel;
  final String destinationLabel;
  final bool hasDestination;
  final bool isLoadingRoute;
  final String? distanceText;
  final String? durationText;
  final bool isRequestingRide;
  final VoidCallback onPickupTap;
  final VoidCallback onDestinationTap;
  final VoidCallback onRequestRide;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 12,
      right: 12,
      bottom: 86,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 22,
              offset: const Offset(0, 7),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _locationRow(
              icon: Icons.my_location_rounded,
              iconColor: AppColors.primary,
              title: 'Pickup',
              value: pickupLabel,
              onTap: onPickupTap,
            ),
            const SizedBox(height: 8),
            _locationRow(
              icon: Icons.location_on_rounded,
              iconColor: Colors.redAccent,
              title: 'Destination',
              value: destinationLabel,
              onTap: onDestinationTap,
            ),
            if (hasDestination &&
                (distanceText != null || durationText != null)) ...[
              const SizedBox(height: 12),
              _routeInfo(),
            ],
            if (isLoadingRoute) ...[
              const SizedBox(height: 12),
              const Row(
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Calculating route...',
                    style: TextStyle(
                        fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ],
            if (hasDestination) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: isRequestingRide ? null : onRequestRide,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: isRequestingRide
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Request ride',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _routeInfo() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.fieldBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.route_rounded, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            distanceText ?? '',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(width: 16),
          const Icon(Icons.access_time_rounded,
              size: 17, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(
            durationText ?? '',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _locationRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.10),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, color: iconColor, size: 19),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                      fontSize: 10, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded,
              size: 20, color: AppColors.textSecondary),
        ],
      ),
    );
  }
}