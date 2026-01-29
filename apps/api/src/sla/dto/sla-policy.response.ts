import { ApiProperty } from '@nestjs/swagger';
import type { SlaPolicyDto } from '@servicedesk/shared';

export class SlaPolicyResponse implements SlaPolicyDto {
  @ApiProperty({ example: 15 })
  responseMinutes!: number;

  @ApiProperty({ example: 120 })
  resolveMinutes!: number;
}
