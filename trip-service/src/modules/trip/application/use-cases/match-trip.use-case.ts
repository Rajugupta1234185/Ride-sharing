import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ITripRepository, TRIP_REPOSITORY } from '../../domain/repositories/trip.repository.interface';

@Injectable()
export class MatchTripUseCase {
  constructor(@Inject(TRIP_REPOSITORY) private repo: ITripRepository) {}

  async execute(tripId: string, driverId: string): Promise<void> {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    trip.markMatched(driverId);
    await this.repo.save(trip);
    
  }

  async notMatchExecute( tripId: string) : Promise<void>{
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    trip.markNoDriverFound();
    await this.repo.save(trip);
  }
}