import { Controller, Get, Headers, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/auth-guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users/me — for "who am I" — Gateway forwards this from the verified JWT
  @Get('me')
  async me(@Headers('x-user-id') userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }

  // GET /users/:id — for other services/clients needing someone else's public profile
  // (e.g. rider's app showing "your driver is ...")
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }

  // Never return passwordHash to any client, ever
  private toPublicUser(user: { id: string; email: string; phone: string; role: string }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}