import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

interface TripRequestedEvent {
  tripId: string;
  riderId: string;
  driverId: string | null;
  status: string;
  pickupLat: number;
  pickupLng: number;
}

interface NearbyDriver {
  driverId: string;
  distanceKm: number;
  lat: number;
  lng: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private http: HttpService,
    private config: ConfigService,
    private producer: KafkaProducerService,
  ) {}

  async handleTripRequested(event: TripRequestedEvent) {
    console.log(`Matching trip ${event.tripId}...`);
     const locationServiceUrl = this.config.get<string>('LOCATION_SERVICE_URL', 'http://localhost:3004');


    const nearbyDrivers = await this.findNearbyDrivers(event.pickupLat, event.pickupLng);

    if (nearbyDrivers.length === 0) {
      console.log(`No drivers found for trip ${event.tripId}`);
      await this.producer.publish('trip.no_driver_found', { tripId: event.tripId });
      return;
    }

    // Already sorted by distance ascending — nearest first
    const chosenDriver = nearbyDrivers[0];
    console.log(
      `Matched trip ${event.tripId} to driver ${chosenDriver.driverId} (${chosenDriver.distanceKm.toFixed(2)} km away)`,
    );

    // matching.service.ts — after choosing chosenDriver, before publishing trip.matched
    await firstValueFrom(
      this.http.patch(`${locationServiceUrl}/locations/driver/${chosenDriver.driverId}/busy`),
    );

    await this.producer.publish('trip.matched', {
      tripId: event.tripId,
      driverId: chosenDriver.driverId,
    });
  }

  private async findNearbyDrivers(lat: number, lng: number): Promise<NearbyDriver[]> {
    const locationServiceUrl = this.config.get<string>('LOCATION_SERVICE_URL', 'http://localhost:3004');

    try {
      const response = await firstValueFrom(
        this.http.get<NearbyDriver[]>(`${locationServiceUrl}/locations/nearby`, {
          params: { lat, lng, radiusKm: 3 },
        }),
      );
      return response.data;
    } catch (err: any) {
      console.error('Failed to reach Location Service:', err.message);
      return [];
    }
  }


}