import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ITripRepository, TRIP_REPOSITORY } from '../../domain/repositories/trip.repository.interface';

@Injectable()
export class CancelTripUseCase {
  constructor(@Inject(TRIP_REPOSITORY) private repo: ITripRepository) {}

  async execute(tripId: string): Promise<void> {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    trip.cancel();
    await this.repo.save(trip);
  }
}