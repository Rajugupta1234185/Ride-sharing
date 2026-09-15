import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;

  constructor(private config: ConfigService) {
    const kafka = new Kafka({
      clientId: 'matching-service',
      brokers: [this.config.get<string>('KAFKA_BROKER', 'localhost:9092')],
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async publish(topic: string, payload: Record<string, any>) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}