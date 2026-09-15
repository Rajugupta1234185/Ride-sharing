import { Global, Module } from '@nestjs/common';
import { KafkaProducerProvider } from './kafka.provider';
import { OutboxRelayService } from '../trip/outbox-relay.service';

import { TripModule } from '../trip/trip.module';

@Global()
@Module({

  providers: [KafkaProducerProvider ],
  exports: [KafkaProducerProvider]
})
export class KafkaModule {}