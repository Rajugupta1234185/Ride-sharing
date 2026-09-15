import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RegisterUserDto } from './application/dto/register-user.dto';
import { LoginUserDto } from './application/dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private registerUser: RegisterUserUseCase,
    private loginUser: LoginUserUseCase,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.registerUser.execute(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.loginUser.execute(dto);
  }
}