import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ITripRepository, TRIP_REPOSITORY } from '../../domain/repositories/trip.repository.interface';
import { Trip } from '../../domain/entities/trip.entity';

@Injectable()
export class StartTripUseCase {
  constructor(@Inject(TRIP_REPOSITORY) private repo: ITripRepository) {}

  async execute(tripId: string): Promise<Trip> {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    trip.markInProgress();
    await this.repo.save(trip);
    return trip;
  }
}