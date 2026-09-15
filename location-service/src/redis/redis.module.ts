import { Module, Global } from '@nestjs/common';
import { RedisProvider } from './redis.provider';

@Global() // one Redis connection, usable everywhere without re-importing
@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisModule {}