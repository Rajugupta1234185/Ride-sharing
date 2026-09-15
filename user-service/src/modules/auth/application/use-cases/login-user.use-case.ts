import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../../user/user.service';
import { LoginUserDto } from '../dto/login-user.dto';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async execute(dto: LoginUserDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
    return { accessToken };
  }
}