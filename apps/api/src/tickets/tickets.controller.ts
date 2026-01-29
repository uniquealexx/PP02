import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { TicketDto, TicketSlaDto } from '@servicedesk/shared';
import { TicketSlaResponse } from '../sla/dto/ticket-sla.response';
import { SlaService } from '../sla/sla.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignTicketRequest } from './dto/assign-ticket.request';
import { CreateTicketRequest } from './dto/create-ticket.request';
import { UpdateTicketStatusRequest } from './dto/update-ticket-status.request';
import { TicketsService } from './tickets.service';
import type { AuthUserDto } from '@servicedesk/shared';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly slaService: SlaService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'List tickets.' })
  getTickets(@CurrentUser() user: AuthUserDto): TicketDto[] {
    return this.ticketsService.getTicketsForUser(user);
  }

  @Post()
  @ApiBody({ type: CreateTicketRequest })
  @ApiCreatedResponse({ description: 'Create ticket.' })
  createTicket(
    @CurrentUser() user: AuthUserDto,
    @Body() body: CreateTicketRequest,
  ): TicketDto {
    return this.ticketsService.createTicket(body, user.id);
  }

  @Get(':id/sla')
  @ApiParam({ name: 'id', description: 'Ticket id.' })
  @ApiOkResponse({ description: 'Ticket SLA details.', type: TicketSlaResponse })
  getTicketSla(@Param('id') id: string): TicketSlaDto {
    this.ticketsService.getTicketById(id);
    const sla = this.slaService.getTicketSla(id);
    if (!sla) {
      throw new NotFoundException('SLA not found.');
    }
    return sla;
  }

  @Patch(':id/status')
  @ApiParam({ name: 'id', description: 'Ticket id.' })
  @ApiBody({ type: UpdateTicketStatusRequest })
  @ApiOkResponse({ description: 'Update ticket status.' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusRequest,
  ): TicketDto {
    return this.ticketsService.updateTicketStatus(id, body.status);
  }

  @Patch(':id/assign')
  @ApiParam({ name: 'id', description: 'Ticket id.' })
  @ApiBody({ type: AssignTicketRequest })
  @ApiOkResponse({ description: 'Assign ticket.' })
  async assignTicket(
    @Param('id') id: string,
    @Body() body: AssignTicketRequest,
  ): Promise<TicketDto> {
    return this.ticketsService.assignTicket(id, body);
  }
}
