import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocationModule } from './modules/location/location.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [LocationModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
