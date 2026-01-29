import { ApiProperty } from '@nestjs/swagger';
import type { TicketSlaDto } from '@servicedesk/shared';

export class TicketSlaResponse implements TicketSlaDto {
  @ApiProperty({ example: 'b0c9f2c0-1a4f-49db-a9f7-5b5f9eebf1b6' })
  ticketId!: string;

  @ApiProperty({ example: false })
  isBreached!: boolean;

  @ApiProperty({ example: '2026-01-29T00:36:45.123Z' })
  responseDueAt!: string;

  @ApiProperty({ example: '2026-01-29T02:21:45.123Z' })
  resolveDueAt!: string;

  @ApiProperty({ example: '2026-01-29T00:21:50.123Z' })
  checkedAt!: string;
}
