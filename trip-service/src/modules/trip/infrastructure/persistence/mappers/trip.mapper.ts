import { Trip as PrismaTrip } from '@prisma/client';
import { Trip, TripStatus } from '../../../domain/entities/trip.entity';

export class TripMapper {
  static toDomain(row: PrismaTrip): Trip {
    return new Trip(
      row.id,
      row.riderId,
      row.driverId,
      Number(row.pickupLat),
      Number(row.pickupLng),
      Number(row.dropoffLat),
      Number(row.dropoffLng),
      row.status as TripStatus,
      row.fareEstimate ? Number(row.fareEstimate) : null,
      row.finalFare ? Number(row.finalFare) : null,
      row.version,
    );
  }
}