import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { TripService } from './trip.service';
import { RequestTripDto } from './application/dto/request-trip.dto';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  create(@Headers('x-user-id') riderId: string, @Body() dto: RequestTripDto) {
    return this.tripService.create(riderId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripService.findOne(id);
  }

  // Temporary manual endpoint — Matching Service triggers this automatically later
  @Patch(':id/match')
  match(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.tripService.match(id, driverId);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.tripService.accept(id);
  }

  @Patch(':id/arrive')
  arrive(@Param('id') id: string) {
    return this.tripService.arrive(id);
  }

  @Patch(':id/start')
  start(@Param('id') id: string) {
    return this.tripService.start(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body('finalFare') finalFare: number) {
    return this.tripService.complete(id, finalFare);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.tripService.cancel(id);
  }
}