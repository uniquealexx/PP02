import { ApiProperty } from '@nestjs/swagger';
import type { TicketStatus } from '@servicedesk/shared';
import { IsIn } from 'class-validator';

const TICKET_STATUS_VALUES: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export class UpdateTicketStatusRequest {
  @ApiProperty({ enum: TICKET_STATUS_VALUES, example: 'IN_PROGRESS' })
  @IsIn(TICKET_STATUS_VALUES)
  status!: TicketStatus;
}
