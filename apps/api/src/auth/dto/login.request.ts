import { IsEmail, IsString } from 'class-validator';
import type { LoginDto } from '@servicedesk/shared';

export class LoginRequest implements LoginDto {
  @IsEmail({ require_tld: false })
  email!: string;

  @IsString()
  password!: string;
}
