import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { type Producer } from 'kafkajs';
import { KAFKA_PRODUCER } from '../kafka/kafka.provider';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class OutboxRelayService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_PRODUCER) private producer: Producer,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    setInterval(() => this.relay(), 2000);
  }

  private async relay() {
    const pending = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      take: 20,
    });

    for (const event of pending) {
      try {
        await this.producer.send({
          topic: event.eventType,
          messages: [{ value: JSON.stringify(event.payload) }],
        });
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { publishedAt: new Date() },
        });
      } catch (err) {
        console.error(`Failed to publish outbox event ${event.id}:`, err);
      }
    }
  }
}