import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('debug')
@Controller('debug')
export class DebugController {
  @Get('health')
  @ApiOkResponse({
    description: 'Debug health check.',
    schema: {
      example: {
        requestId: '1c2b1b0f-2a74-4f26-8a6f-4b6f5f9d5df2',
        time: '2026-01-29T00:21:45.123Z',
      },
    },
  })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  health(@Req() request: Request): { requestId?: string; time: string } {
    return {
      requestId: request.requestId,
      time: new Date().toISOString(),
    };
  }
}
