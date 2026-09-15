import { User } from "../entities/user.entity";

export const USER_REPOSITORY = "USER_REPOSITORY";
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(email: string, phone: string, passwordHash: string, role: 'RIDER' | 'DRIVER'): Promise<User>;
}