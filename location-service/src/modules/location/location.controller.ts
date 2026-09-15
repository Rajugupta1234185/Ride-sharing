import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Patch('driver/:driverId')
  updateLocation(@Param('driverId') driverId: string, @Body() dto: UpdateLocationDto) {
    return this.locationService.updateDriverLocation(driverId, dto.lat, dto.lng);
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.locationService.findNearbyDrivers(
      Number(lat),
      Number(lng),
      radiusKm ? Number(radiusKm) : undefined,
    );
  }

  @Patch('driver/:driverId/offline')
  setOffline(@Param('driverId') driverId: string) {
    return this.locationService.setDriverOffline(driverId);
  }

  // location.controller.ts — add this route
@Patch('driver/:driverId/online')
setOnline(@Param('driverId') driverId: string, @Body() dto: { lat?: number; lng?: number }) {
  return this.locationService.setDriverOnline(driverId, dto.lat, dto.lng);
}

// location.controller.ts
@Patch('driver/:driverId/busy')
setBusy(@Param('driverId') driverId: string) {
  return this.locationService.setDriverBusy(driverId);
}
}