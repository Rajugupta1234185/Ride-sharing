import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { KafkaConsumerService } from 'src/kafka/kafka-consumer.service';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { SimulatorService } from 'src/simulator/simulator.service';
import { SimulatorController } from 'src/simulator/simulator.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[HttpModule],
  controllers: [LocationController, SimulatorController],
  providers: [LocationService, KafkaConsumerService, KafkaProducerService, SimulatorService],
})
export class LocationModule {}