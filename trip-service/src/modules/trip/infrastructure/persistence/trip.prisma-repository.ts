import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import type { ITripRepository } from '../../domain/repositories/trip.repository.interface';
import { Trip } from '../../domain/entities/trip.entity';
import { TripMapper } from './mappers/trip.mapper';

@Injectable()
export class TripPrismaRepository implements ITripRepository {
  constructor(private prisma: PrismaService) {}

  async save(trip: Trip): Promise<void> {
    const isInitialCreation = trip.status === "REQUESTED";
    await this.prisma.$transaction([
      this.prisma.trip.upsert({
        where: { id: trip.id },
        update: {
          driverId: trip.driverId,
          status: trip.status,
          finalFare: trip.finalFare,
          version: { increment: 1 },
        },
        create: {
          id: trip.id,
          riderId: trip.riderId,
          pickupLat: trip.pickupLat,
          pickupLng: trip.pickupLng,
          dropoffLat: trip.dropoffLat,
          dropoffLng: trip.dropoffLng,
          status: trip.status,
          fareEstimate: trip.fareEstimate,
        },
      }),
      this.prisma.tripStatusHistory.create({
        data: {
          tripId: trip.id,
          status: trip.status,
        },
      }),
      this.prisma.outboxEvent.create({
        data: {
          tripId: trip.id,
          eventType: isInitialCreation? 'trip.requested' : 'trip.status_changed',
          payload: {
            tripId: trip.id,
            riderId: trip.riderId,
            driverId: trip.driverId,
            status: trip.status,
            pickupLat: trip.pickupLat,
            pickupLng: trip.pickupLng,
          },
        },
      }),
    ]);
  }

  async findById(id: string): Promise<Trip | null> {
    const row = await this.prisma.trip.findUnique({ where: { id } });
    return row ? TripMapper.toDomain(row) : null;
  }

  // trip-prisma.repository.ts
    async findActiveTripByDriverId(driverId: string): Promise<Trip | null> {
      const row = await this.prisma.trip.findFirst({
        where: {
          driverId,
          status: { in: ['MATCHED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] }, // adjust to your real enum values
        },
      });
      return row ? TripMapper.toDomain(row) : null;
    }
}