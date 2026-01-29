import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { SlaPolicyDto } from '@servicedesk/shared';
import { SlaPolicyResponse } from './dto/sla-policy.response';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sla')
@Controller('sla')
@UseGuards(JwtAuthGuard)
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('policy')
  @ApiOkResponse({ description: 'Current SLA policy.', type: SlaPolicyResponse })
  getPolicy(): SlaPolicyDto {
    return this.slaService.getPolicy();
  }
}
