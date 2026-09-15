// location-service/src/kafka/kafka-producer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'location-service-producer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  async publish(topic: string, message: Record<string, any>) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (err) {
      this.logger.error(`Failed to publish to ${topic}: ${(err as any).message}`);
      // swallow the error — a missed live-location tick shouldn't crash the request
    }
  }
}