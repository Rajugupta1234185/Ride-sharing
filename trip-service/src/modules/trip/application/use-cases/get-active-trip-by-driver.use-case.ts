// application/use-cases/get-active-trip-by-driver.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { TRIP_REPOSITORY, type ITripRepository } from '../../domain/repositories/trip.repository.interface';

@Injectable()
export class GetActiveTripByDriverUseCase {
  constructor(
    @Inject(TRIP_REPOSITORY) private readonly tripRepository: ITripRepository,
  ) {}

  execute(driverId: string) {
    return this.tripRepository.findActiveTripByDriverId(driverId);
  }
}