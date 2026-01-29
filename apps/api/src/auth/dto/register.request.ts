import { IsEmail, IsString, MinLength } from 'class-validator';
import type { RegisterDto } from '@servicedesk/shared';

export class RegisterRequest implements RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail({ require_tld: false })
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
