import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.provider';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';

const GEO_KEY = 'driver:locations';
const STATUS_TTL_SECONDS = 30; // heartbeat window — no location ping in 30s = offline

@Injectable()
export class LocationService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis , private kafka : KafkaProducerService) {}

  async updateDriverLocation(driverId: string, lat: number, lng: number) {
    // GEOADD expects (member, longitude, latitude) — lng before lat, easy to mix up
    await this.redis.geoadd(GEO_KEY, lng, lat, driverId);
    await this.redis.set(`driver:status:${driverId}`, 'ONLINE', 'EX', STATUS_TTL_SECONDS);


    const throttleKey = `driver:location:throttle:${driverId}`;
    const canPublish = await this.redis.set(throttleKey, 1, 'EX', 3, 'NX');
    if(canPublish){
      this.kafka.publish('driver.location.updated', { driverId, lat, lng});
    }
  }

  // async findNearbyDrivers(lat: number, lng: number, radiusKm = 3, limit = 10) {
  //   // GEOSEARCH returns member names within radius, sorted ascending by distance
  //   const raw = await this.redis.geosearch(
  //     GEO_KEY,
  //     'FROMLONLAT', lng, lat,
  //     'BYRADIUS', radiusKm, 'km',
  //     'ASC',
  //     'COUNT', limit,
  //     'WITHCOORD',
  //     'WITHDIST',
  //   );

  //   // raw shape: [ [driverId, distanceKm, [lng, lat]], ... ]
  //   const onlineOnly = await Promise.all(
  //     raw.map(async (entry: any) => {
  //       const [driverId, distanceKm, coords] = entry;
  //       const status = await this.redis.get(`driver:status:${driverId}`);
  //       return status === 'ONLINE'
  //         ? { driverId, distanceKm: Number(distanceKm), lng: Number(coords[0]), lat: Number(coords[1]) }
  //         : null;
  //     }),
  //   );

  //   return onlineOnly.filter(Boolean);
  // }

  async findNearbyDrivers(lat: number, lng: number, radiusKm = 3, limit = 10) {
  const raw = await this.redis.geosearch(
    GEO_KEY,
    'FROMLONLAT', lng, lat,
    'BYRADIUS', radiusKm, 'km',
    'ASC',
    'COUNT', limit,
    'WITHCOORD',
    'WITHDIST',
  );

  const onlineOnly = await Promise.all(
    raw.map(async (entry: any) => {
      const [driverId, distanceKm, coords] = entry;
      const status = await this.redis.get(`driver:status:${driverId}`);
      return status === 'ONLINE' // explicitly ONLINE only — excludes BUSY and expired/offline
        ? { driverId, distanceKm: Number(distanceKm), lng: Number(coords[0]), lat: Number(coords[1]) }
        : null;
    }),
  );

  return onlineOnly.filter(Boolean);
  }

  async setDriverOffline(driverId: string) {
    await this.redis.del(`driver:status:${driverId}`);
    await this.redis.zrem(GEO_KEY, driverId); // remove from the geo set entirely
  }

    // location.service.ts — add this method
  async setDriverOnline(driverId: string, lat?: number, lng?: number) {
    await this.redis.set(`driver:status:${driverId}`, 'ONLINE', 'EX', STATUS_TTL_SECONDS);
    if (lat !== undefined && lng !== undefined) {
      await this.redis.geoadd(GEO_KEY, lng, lat, driverId);
    }
  }

  async setDriverBusy(driverId: string) {
  await this.redis.set(`driver:status:${driverId}`, 'BUSY', 'EX', 3600); // long TTL, or no expiry
 }


 // location.service.ts — ADD these methods
async getDriverPosition(driverId: string): Promise<{ lat: number; lng: number } | null> {
  const result = await this.redis.geopos(GEO_KEY, driverId);
  if (!result || !result[0]) return null;
  const [lng, lat] = result[0];
  return { lat: parseFloat(lat as any), lng: parseFloat(lng as any) };
}
}