import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { AcceptTripUseCase } from './application/use-cases/accept-trip.use-case';
import { ArriveTripUseCase } from './application/use-cases/arrive-trip.use-case';
import { CancelTripUseCase } from './application/use-cases/cancel-trip.use-case';
import { CompleteTripUseCase } from './application/use-cases/complete-trip.use-case';
import { GetTripUseCase } from './application/use-cases/get-trip.use-case';
import { MatchTripUseCase } from './application/use-cases/match-trip.use-case';
import { RequestTripUseCase } from './application/use-cases/request-trip.use-case';
import { StartTripUseCase } from './application/use-cases/start-trip.use-case';
import { TripPrismaRepository } from './infrastructure/persistence/trip.prisma-repository';
import { TRIP_REPOSITORY } from './domain/repositories/trip.repository.interface';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { OutboxRelayService } from './outbox-relay.service';
import { Kafka } from 'kafkajs';
import { KafkaModule } from '../kafka/kafka.module';
import { KafkaConsumerService } from './kafka-consumer.service';
import { TripGateway } from './trip.gateway';
import { GetActiveTripByDriverUseCase } from './application/use-cases/get-active-trip-by-driver.use-case';
import { SimulationOrchestratorService } from './simulation-orchestrator.service';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [HttpModule, PrismaModule, KafkaModule],
  controllers: [TripController],
  providers: [TripService,
    OutboxRelayService,
    AcceptTripUseCase,
    ArriveTripUseCase,
    CancelTripUseCase,
    CompleteTripUseCase,
    GetTripUseCase,
    MatchTripUseCase,
    RequestTripUseCase,
    StartTripUseCase,
    KafkaConsumerService,
        GetActiveTripByDriverUseCase,
        SimulationOrchestratorService,
    TripGateway,

    {
      provide:TRIP_REPOSITORY,
      useClass:TripPrismaRepository
    }
  ]
})
export class TripModule {}
