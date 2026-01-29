import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateTicketDto } from '@servicedesk/shared';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketRequest implements CreateTicketDto {
  @ApiProperty({ example: 'Не работает принтер' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Принтер в кабинете 305 не печатает.' })
  @IsOptional()
  @IsString()
  description?: string;
}
