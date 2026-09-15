import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { UserPrismaRepository } from './infrastructure/persistence/user.prisma-repository';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
 imports: [PrismaModule, JwtModule],
  controllers: [UserController],
   providers: [UserService,
    {
      provide: USER_REPOSITORY,
      useClass : UserPrismaRepository
    }
  ],
  exports: [UserService]
})
export class UserModule {}
