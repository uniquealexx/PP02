import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'BAD_REQUEST' })
  errorCode!: string;

  @ApiProperty({ example: 'Validation failed.' })
  message!: string;

  @ApiProperty({ required: false, example: { title: 'Title is required.' } })
  details?: Record<string, string> | string[];

  @ApiProperty({ example: '1c2b1b0f-2a74-4f26-8a6f-4b6f5f9d5df2' })
  requestId!: string;
}
