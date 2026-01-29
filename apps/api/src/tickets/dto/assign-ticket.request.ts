import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AssignTicketRequest {
  @ApiProperty({ example: 'agent-1' })
  @IsString()
  @MinLength(1)
  assigneeId!: string;
}
