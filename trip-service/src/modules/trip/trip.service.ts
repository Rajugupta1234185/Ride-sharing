import { Injectable } from '@nestjs/common';
import { RequestTripUseCase } from './application/use-cases/request-trip.use-case';
import { MatchTripUseCase } from './application/use-cases/match-trip.use-case';
import { AcceptTripUseCase } from './application/use-cases/accept-trip.use-case';
import { ArriveTripUseCase } from './application/use-cases/arrive-trip.use-case';
import { StartTripUseCase } from './application/use-cases/start-trip.use-case';
import { CompleteTripUseCase } from './application/use-cases/complete-trip.use-case';
import { CancelTripUseCase } from './application/use-cases/cancel-trip.use-case';
import { GetTripUseCase } from './application/use-cases/get-trip.use-case';
import { RequestTripDto } from './application/dto/request-trip.dto';
import { GetActiveTripByDriverUseCase } from './application/use-cases/get-active-trip-by-driver.use-case';

@Injectable()
export class TripService {
  constructor(
    private requestTrip: RequestTripUseCase,
    private matchTrip: MatchTripUseCase,
    private acceptTrip: AcceptTripUseCase,
    private arriveTrip: ArriveTripUseCase,
    private startTrip: StartTripUseCase,
    private completeTrip: CompleteTripUseCase,
    private cancelTrip: CancelTripUseCase,
    private getTrip: GetTripUseCase,
    private getActiveTripByDriverId : GetActiveTripByDriverUseCase
  ) {}

  create(riderId: string, dto: RequestTripDto) {
    return this.requestTrip.execute(riderId, dto);
  }

  findOne(id: string) {
    return this.getTrip.execute(id);
  }

  match(id: string, driverId: string) {
    return this.matchTrip.execute(id, driverId);
  }

  notMatch(id: string){
    return this.matchTrip.notMatchExecute(id);
  }

  accept(id: string) {
    return this.acceptTrip.execute(id);
  }

  arrive(id: string) {
    return this.arriveTrip.execute(id);
  }

  start(id: string) {
    return this.startTrip.execute(id);
  }

  complete(id: string, finalFare: number) {
    return this.completeTrip.execute(id, finalFare);
  }

  cancel(id: string) {
    return this.cancelTrip.execute(id);
  }

  async findActiveTripByDriverId(driverId: string){
  return this.getActiveTripByDriverId.execute(driverId);
  }
}