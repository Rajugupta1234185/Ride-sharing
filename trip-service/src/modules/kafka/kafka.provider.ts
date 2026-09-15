import { Provider } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

export const KAFKA_PRODUCER = Symbol('KAFKA_PRODUCER');

export const KafkaProducerProvider: Provider = {
  provide: KAFKA_PRODUCER,
  useFactory: async () => {
    const kafka = new Kafka({
      clientId: 'trip-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    const producer = kafka.producer();
    await producer.connect();
    return producer;
  },
};