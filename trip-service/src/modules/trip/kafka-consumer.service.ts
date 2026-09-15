import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { TripService } from './trip.service';
import { TripGateway } from './trip.gateway';
import { SimulationOrchestratorService } from './simulation-orchestrator.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;

  constructor(private tripService: TripService , private tripGateway: TripGateway,
    private simulationOrchestrator: SimulationOrchestratorService
  ) {
    const kafka = new Kafka({
      clientId: 'trip-service-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.consumer = kafka.consumer({ groupId: 'trip-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'trip.matched', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'trip.no_driver_found', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'driver.location.updated', fromBeginning :false});

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const event = JSON.parse(message.value!.toString());
        console.log(`Received ${topic} event:`, event);

        try {
          if (topic === 'trip.matched') {
            await this.tripService.match(event.tripId, event.driverId);
            const trip = await this.tripService.findOne(event.tripId);
            this.tripGateway.emitTripUpdate(trip.riderId, trip);
             this.simulationOrchestrator.startPickupSimulation(trip); // NEW — dev/testing onl
          }
          if (topic === 'trip.no_driver_found') {
            console.log(`Trip ${event.tripId} had no available drivers`);
            await this.tripService.notMatch(event.tripId);
            const trip =await this.tripService.findOne(event.tripId);
            this.tripGateway.emitTripUpdate(trip.riderId, trip);
          }

          if (topic === 'driver.location.updated') {
            const activeTrip = await this.tripService.findActiveTripByDriverId(event.driverId);
            if (activeTrip) {
              this.tripGateway.emitDriverLocation(activeTrip.riderId, {
                driverId: event.driverId,
                lat: event.lat,
                lng: event.lng,
              });
            }
            // no active trip for this driver right now — safely ignore
          }
        } catch (err) {
          console.error(`Failed to handle ${topic} event:`, err);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}