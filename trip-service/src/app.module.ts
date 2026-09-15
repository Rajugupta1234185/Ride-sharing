import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { TripModule } from './modules/trip/trip.module';
import { KafkaModule } from './modules/kafka/kafka.module';

@Module({
  imports: [PrismaModule, KafkaModule, TripModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
