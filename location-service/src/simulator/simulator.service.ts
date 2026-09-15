import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LocationService } from '../modules/location/location.service';

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);
  private activeMoves = new Map<string, NodeJS.Timeout>();
  private readonly mapboxToken = process.env.MAPBOX_ACCESS_TOKEN ;

  constructor(
    private readonly locationService: LocationService,
    private readonly http: HttpService,
  ) {}

  async seedDrivers(count: number, centerLat: number, centerLng: number, radiusMeters = 1500) {
    const created: string[] = [];
    for (let i = 0; i < count; i++) {
      const driverId = `sim-driver-${Date.now()}-${i}`;
      const [lat, lng] = this.randomPointNear(centerLat, centerLng, radiusMeters);
      await this.locationService.updateDriverLocation(driverId, lat, lng);
      created.push(driverId);
    }
    this.logger.log(`Seeded ${count} test drivers near ${centerLat},${centerLng}`);
    return { created };
  }

  private async getRoutePoints(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<{ lat: number; lng: number }[]> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}`;

    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN is not set — falling back to straight line');
      return [
        { lat: fromLat, lng: fromLng },
        { lat: toLat, lng: toLng },
      ];
    }

    try {
      const response = await firstValueFrom(
        this.http.get(url, {
          params: {
            geometries: 'geojson',
            access_token: this.mapboxToken,
          },
        }),
      );

      const coords = response.data?.routes?.[0]?.geometry?.coordinates;
      this.logger.log(`🗺️ Directions API returned ${coords?.length ?? 0} points`);

      if (!coords || coords.length === 0) {
        this.logger.warn('No route found, falling back to straight line');
        return [
          { lat: fromLat, lng: fromLng },
          { lat: toLat, lng: toLng },
        ];
      }

      return coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    } catch (err: any) {
      this.logger.error(
        `Directions API failed: ${err?.response?.data ? JSON.stringify(err.response.data) : err.message}, falling back to straight line`,
      );
      return [
        { lat: fromLat, lng: fromLng },
        { lat: toLat, lng: toLng },
      ];
    }
  }

  async moveDriverTo(driverId: string, toLat: number, toLng: number, durationSeconds: number) {
    const existing = this.activeMoves.get(driverId);
    if (existing) clearInterval(existing);

    const current = await this.locationService.getDriverPosition(driverId);
    if (!current) throw new Error(`Driver ${driverId} has no known position`);

    const routePoints = await this.getRoutePoints(current.lat, current.lng, toLat, toLng);

    const stepMs = 3000; // matches the Redis-throttle window so every step actually publishes
    const totalSteps = Math.max(1, Math.round((durationSeconds * 1000) / stepMs));
    let step = 0;

    const interval = setInterval(async () => {
      step++;
      const t = Math.min(step / totalSteps, 1);

      // Interpolate smoothly between two adjacent route points instead of
      // snapping to a single index — fixes the "stuck then teleport" bug
      // that happened when routePoints had very few entries (e.g. fallback).
      const floatIndex = t * (routePoints.length - 1);
      const i0 = Math.floor(floatIndex);
      const i1 = Math.min(i0 + 1, routePoints.length - 1);
      const frac = floatIndex - i0;

      const p0 = routePoints[i0];
      const p1 = routePoints[i1];

      const lat = p0.lat + (p1.lat - p0.lat) * frac;
      const lng = p0.lng + (p1.lng - p0.lng) * frac;

      await this.locationService.updateDriverLocation(driverId, lat, lng);

      if (t >= 1) {
        clearInterval(interval);
        this.activeMoves.delete(driverId);
        this.logger.log(`Driver ${driverId} arrived at ${toLat},${toLng}`);
      }
    }, stepMs);

    this.activeMoves.set(driverId, interval);
    return { started: true, driverId, durationSeconds, routePointCount: routePoints.length };
  }

  private randomPointNear(lat: number, lng: number, radiusMeters: number): [number, number] {
    const radiusInDegrees = radiusMeters / 111320;
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const dy = w * Math.sin(t);
    const dx = (w * Math.cos(t)) / Math.cos((lat * Math.PI) / 180);
    return [lat + dy, lng + dx];
  }
}