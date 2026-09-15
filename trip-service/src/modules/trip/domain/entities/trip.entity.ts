import { InvalidTripTransitionException } from '../exceptions/invalid-trip-transition.exception';

export type TripStatus =
  | 'REQUESTED' | 'MATCHED' | 'ACCEPTED' | 'ARRIVED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_DRIVER_FOUND';

export class Trip {
  constructor(
    public readonly id: string,
    public readonly riderId: string,
    public driverId: string | null,
    public readonly pickupLat: number,
    public readonly pickupLng: number,
    public readonly dropoffLat: number,
    public readonly dropoffLng: number,
    public status: TripStatus,
    public fareEstimate: number | null,
    public finalFare: number | null,
    public version: number,
  ) {}

  private assertStatus(expected: TripStatus[]) {
    if (!expected.includes(this.status)) {
      throw new InvalidTripTransitionException(
        `Cannot transition from ${this.status}. Expected one of: ${expected.join(', ')}`,
      );
    }
  }

  markMatched(driverId: string) {
    this.assertStatus(['REQUESTED']);
    this.driverId = driverId;
    this.status = 'MATCHED';
  }

  markNoDriverFound() {
    this.assertStatus(['REQUESTED']);
    this.status = 'NO_DRIVER_FOUND';
  }

  markAccepted() {
    this.assertStatus(['MATCHED']);
    this.status = 'ACCEPTED';
  }

  markArrived() {
    this.assertStatus(['ACCEPTED']);
    this.status = 'ARRIVED';
  }

  markInProgress() {
    this.assertStatus(['ARRIVED']);
    this.status = 'IN_PROGRESS';
  }

  markCompleted(finalFare: number) {
    this.assertStatus(['IN_PROGRESS']);
    this.finalFare = finalFare;
    this.status = 'COMPLETED';
  }

  cancel() {
    this.assertStatus(['REQUESTED', 'MATCHED', 'ACCEPTED']);
    this.status = 'CANCELLED';
  }
}