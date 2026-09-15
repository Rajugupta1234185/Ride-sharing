import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { KafkaConsumerService } from './kafka/kafka-consumer.service';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { MatchingService } from './matching/matching.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule],
  providers: [KafkaConsumerService, KafkaProducerService, MatchingService],
})
export class AppModule {}