import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCommentRequest {
  @ApiProperty({ example: 'Checking the printer cable.' })
  @IsString()
  @MinLength(1)
  text!: string;
}
