// user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { type UserRepository, USER_REPOSITORY } from './domain/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(@Inject(USER_REPOSITORY) private userRepo: UserRepository) {}

  findByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }

  findByPhone(phone: string) {
    return this.userRepo.findByPhone(phone);
  }

  findById(id: string) {
    return this.userRepo.findById(id);
  }

  create(email: string, phone: string, passwordHash: string, role: 'RIDER' | 'DRIVER') {
    return this.userRepo.create(email, phone, passwordHash, role);
  }
}