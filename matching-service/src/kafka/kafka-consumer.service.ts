import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;

  constructor(
    private config: ConfigService,
    private matchingService: MatchingService,
  ) {
    const kafka = new Kafka({
      clientId: 'matching-service',
      brokers: [this.config.get<string>('KAFKA_BROKER', 'localhost:9092')],
    });
    this.consumer = kafka.consumer({ groupId: 'matching-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'trip.requested', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value!.toString());
        console.log('Received trip.requested event:', event);
        await this.matchingService.handleTripRequested(event);
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}