import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { JwtAuthGuard } from './guards/auth-guard';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot(
      {
        isGlobal: true
      }
    ),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [RegisterUserUseCase, LoginUserUseCase, JwtAuthGuard],
  exports: [JwtAuthGuard]
})
export class AuthModule {}