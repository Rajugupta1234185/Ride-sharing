import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { LocationService } from '../modules/location/location.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;

  constructor(private locationService: LocationService) {
    const kafka = new Kafka({
      clientId: 'location-service-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.consumer = kafka.consumer({ groupId: 'location-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'trip.status_changed', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value!.toString());
        console.log('Received trip.status_changed event:', event);

        try {
          if (
            (event.status === 'COMPLETED' || event.status === 'CANCELLED') &&
            event.driverId
          ) {
            await this.locationService.setDriverOnline(event.driverId);
            console.log(`Driver ${event.driverId} marked back ONLINE after trip ${event.tripId}`);
          }
        } catch (err) {
          console.error('Failed to handle trip.status_changed event:', err);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}