import { Trip } from '../entities/trip.entity';

export interface ITripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: string): Promise<Trip | null>;
  findActiveTripByDriverId(driverId: string) : Promise<Trip | null>;
}
export const TRIP_REPOSITORY = Symbol('TRIP_REPOSITORY');