import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  AssignTicketDto,
  CreateTicketDto,
  TicketDto,
  TicketStatus,
  AuthUserDto,
} from '@servicedesk/shared';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SlaService } from '../sla/sla.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TicketsService implements OnModuleInit {
  private readonly logger = new Logger(TicketsService.name);
  private readonly tickets: TicketDto[] = [];
  private slaInterval?: NodeJS.Timeout;

  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly slaService: SlaService,
    private readonly usersService: UsersService,
    private readonly realtimeService: RealtimeService,
  ) {}

  getTickets(): TicketDto[] {
    return [...this.tickets];
  }

  getTicketsForUser(user: AuthUserDto): TicketDto[] {
    const tickets = [...this.tickets];
    if (user.role === 'ADMIN') {
      return tickets;
    }
    if (user.role === 'USER') {
      return tickets.filter((ticket) => ticket.creatorId === user.id);
    }
    return tickets.filter(
      (ticket) =>
        ticket.creatorId === user.id ||
        ticket.assigneeId === user.id ||
        !ticket.assigneeId,
    );
  }

  getTicketById(ticketId: string): TicketDto {
    const ticket = this.tickets.find((item) => item.id === ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }
    return ticket;
  }

  createTicket(payload: CreateTicketDto, creatorId: string): TicketDto {
    const now = new Date().toISOString();
    const ticket: TicketDto = {
      id: randomUUID(),
      title: payload.title,
      description: payload.description,
      status: 'NEW',
      creatorId,
      createdAt: now,
      updatedAt: now,
      commentsCount: 0,
    };

    this.tickets.push(ticket);
    this.auditService.logTicketCreated(ticket.id);
    this.notificationsService.notifyTicketCreated(ticket);
    this.slaService.createTicketSla(ticket);
    this.realtimeService.emitTicketCreated(ticket);
    this.logger.log(`Ticket created ${ticket.id}`);

    return ticket;
  }

  async assignTicket(ticketId: string, payload: AssignTicketDto): Promise<TicketDto> {
    const ticket = this.getTicketById(ticketId);
    const assignee = await this.usersService.getUserById(payload.assigneeId);

    if (!assignee || assignee.role !== 'AGENT') {
      throw new BadRequestException('Assignee must be an agent.');
    }

    ticket.assigneeId = assignee.id;
    ticket.updatedAt = new Date().toISOString();

    this.auditService.logTicketAssigned(ticket.id, assignee.id);
    this.notificationsService.notifyTicketAssigned(ticket.id, assignee.id);
    this.realtimeService.emitTicketUpdated(ticket);
    this.logger.log(`Ticket assigned ${ticket.id} -> ${assignee.id}`);

    return ticket;
  }

  updateTicketStatus(ticketId: string, status: TicketStatus): TicketDto {
    const ticket = this.getTicketById(ticketId);

    if (ticket.status === 'CLOSED' && status !== 'CLOSED') {
      throw new BadRequestException('Closed tickets cannot be reopened.');
    }

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    this.auditService.logStatusChanged(ticket.id, status);
    this.notificationsService.notifyStatusChanged(ticket.id, status);
    this.realtimeService.emitTicketUpdated(ticket);
    this.logger.log(`Ticket status updated ${ticket.id} -> ${status}`);
    return ticket;
  }

  incrementComments(ticketId: string): TicketDto {
    const ticket = this.getTicketById(ticketId);
    ticket.commentsCount += 1;
    ticket.updatedAt = new Date().toISOString();
    return ticket;
  }

  checkSlaBreaches(): void {
    this.slaService.checkBreaches(this.tickets);
  }

  onModuleInit(): void {
    this.slaInterval = setInterval(() => {
      this.checkSlaBreaches();
    }, 30_000);
    this.slaInterval.unref?.();
  }
}
