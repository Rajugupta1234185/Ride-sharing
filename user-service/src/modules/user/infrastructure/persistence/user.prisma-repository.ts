import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    if (!row) return null;
    return new User(row.id, row.email, row.phone, row.password, row.role);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { phone } });
    if (!row) return null;
    return new User(row.id, row.email, row.phone, row.password, row.role);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return new User(row.id, row.email, row.phone, row.password, row.role);
  }

  async create(email: string, phone: string, password: string, role: 'RIDER' | 'DRIVER'): Promise<User> {
    const row = await this.prisma.user.create({ data: { email, phone, password, role } });
    return new User(row.id, row.email, row.phone, row.password, row.role);
  }
}