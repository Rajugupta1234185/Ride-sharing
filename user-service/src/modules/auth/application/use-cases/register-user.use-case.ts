import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../user/user.service';
import { RegisterUserDto } from '../dto/register-user.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(private userService: UserService) {}

  async execute(dto: RegisterUserDto) {
    const existingEmail = await this.userService.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingPhone = await this.userService.findByPhone(dto.phone);
    if (existingPhone) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create(dto.email, dto.phone, passwordHash, dto.role);

    return { id: user.id, email: user.email, phone: user.phone, role: user.role };
  }
}