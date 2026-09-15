// simulator/simulator.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SimulatorService } from './simulator.service';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('seed')
  seed(@Body() dto: { count: number; lat: number; lng: number; radiusMeters?: number }) {
    return this.simulatorService.seedDrivers(dto.count, dto.lat, dto.lng, dto.radiusMeters);
  }

  @Post('move')
  move(@Body() dto: { driverId: string; toLat: number; toLng: number; durationSeconds: number }) {
    return this.simulatorService.moveDriverTo(dto.driverId, dto.toLat, dto.toLng, dto.durationSeconds);
  }
}