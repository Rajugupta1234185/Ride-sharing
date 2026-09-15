// simulation-orchestrator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TripService } from '../trip/trip.service';
import { TripGateway } from '../trip/trip.gateway';

const PICKUP_PHASE_SECONDS = 30;
const TRIP_PHASE_SECONDS = 45;

@Injectable()
export class SimulationOrchestratorService {
  private readonly logger = new Logger(SimulationOrchestratorService.name);
  private readonly locationServiceUrl = process.env.LOCATION_SERVICE_URL || 'http://localhost:3004';

  constructor(
    private readonly http: HttpService,
    private readonly tripService: TripService,
    private readonly tripGateway: TripGateway,
  ) {}

  async startPickupSimulation(trip: any) {
    try {
        console.log("start pick up simulation");
      await firstValueFrom(
        this.http.post(`${this.locationServiceUrl}/simulator/move`, {
          driverId: trip.driverId,
          toLat: trip.pickupLat,
          toLng: trip.pickupLng,
          durationSeconds: PICKUP_PHASE_SECONDS,
        }),
      );
    } catch (err: any) {
        console.log("error happended");
      this.logger.error(`Pickup simulation failed: ${err.message}`);
      return;
    }

    setTimeout(() => this.handleArrivedAtPickup(trip), PICKUP_PHASE_SECONDS * 1000);
  }

  private async handleArrivedAtPickup(trip: any) {
    let updatedTrip = trip;
    try {
        console.log("handle arrived at pickup");
      await this.tripService.accept(trip.id).catch(() => null);
      await this.tripService.arrive(trip.id).catch(() => null);
      updatedTrip = await this.tripService.start(trip.id);
      console.log("updated trip", updatedTrip);
      this.tripGateway.emitTripUpdate(trip.riderId, updatedTrip);
    } catch (err: any) {
      this.logger.error(`Progressing trip after pickup failed: ${err.message}`);
    }

    try {
      await firstValueFrom(
        this.http.post(`${this.locationServiceUrl}/simulator/move`, {
          driverId: trip.driverId,
          toLat: trip.dropoffLat,
          toLng: trip.dropoffLng,
          durationSeconds: TRIP_PHASE_SECONDS,
        }),
      );
    } catch (err: any) {
      this.logger.error(`Dropoff simulation failed: ${err.message}`);
      return;
    }

    setTimeout(() => this.handleTripCompleted(trip), TRIP_PHASE_SECONDS * 1000);
  }

  private async handleTripCompleted(trip: any) {
    try {
      const completed = await this.tripService.complete(trip.id, 250); // dummy test fare
      console.log("completed trip", completed);
      this.tripGateway.emitTripUpdate(trip.riderId, completed);
    } catch (err: any) {
      this.logger.error(`Completing trip failed: ${err.message}`);
    }
  }
}