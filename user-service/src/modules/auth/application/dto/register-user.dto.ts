
import { IsEmail, IsIn, IsPhoneNumber, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email!: string;

  @IsPhoneNumber('NP')
  phone!: string;

  @MinLength(8)
  password!: string;

  @IsIn(['RIDER', 'DRIVER'])
  role!: 'RIDER' | 'DRIVER';
}