import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type ITripRepository, TRIP_REPOSITORY } from '../../domain/repositories/trip.repository.interface';
import { Trip } from '../../domain/entities/trip.entity';
import { RequestTripDto } from '../dto/request-trip.dto';

@Injectable()
export class RequestTripUseCase {
  constructor(@Inject(TRIP_REPOSITORY) private repo: ITripRepository) {}

  async execute(riderId: string, dto: RequestTripDto): Promise<Trip> {
    const trip = new Trip(
      randomUUID(),
      riderId,
      null, // no driver yet
      dto.pickupLat,
      dto.pickupLng,
      dto.dropoffLat,
      dto.dropoffLng,
      'REQUESTED',
      dto.fareEstimate ?? null,
      null,
      0,
    );
    await this.repo.save(trip);
    return trip;
  }
}