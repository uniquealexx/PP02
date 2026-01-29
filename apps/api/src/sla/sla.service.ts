import { Injectable, Logger } from '@nestjs/common';
import type { SlaPolicyDto, TicketDto, TicketSlaDto, TicketStatus } from '@servicedesk/shared';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

const SLA_POLICY: SlaPolicyDto = {
  responseMinutes: 15,
  resolveMinutes: 120,
};

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);
  private readonly ticketSlas = new Map<string, TicketSlaDto>();

  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  getPolicy(): SlaPolicyDto {
    return { ...SLA_POLICY };
  }

  createTicketSla(ticket: TicketDto): TicketSlaDto {
    const createdAt = new Date(ticket.createdAt);
    const responseDueAt = new Date(
      createdAt.getTime() + SLA_POLICY.responseMinutes * 60_000,
    ).toISOString();
    const resolveDueAt = new Date(
      createdAt.getTime() + SLA_POLICY.resolveMinutes * 60_000,
    ).toISOString();
    const checkedAt = new Date().toISOString();

    const sla: TicketSlaDto = {
      ticketId: ticket.id,
      isBreached: false,
      responseDueAt,
      resolveDueAt,
      checkedAt,
    };

    this.ticketSlas.set(ticket.id, sla);
    this.logger.log(`SLA calculated for ticket ${ticket.id}`);
    return { ...sla };
  }

  getTicketSla(ticketId: string): TicketSlaDto | undefined {
    const sla = this.ticketSlas.get(ticketId);
    return sla ? { ...sla } : undefined;
  }

  checkBreaches(tickets: TicketDto[]): void {
    const now = Date.now();

    for (const ticket of tickets) {
      if (!this.shouldCheckStatus(ticket.status)) {
        continue;
      }

      const sla = this.ticketSlas.get(ticket.id);
      if (!sla) {
        continue;
      }

      const responseDueAt = Date.parse(sla.responseDueAt);
      const resolveDueAt = Date.parse(sla.resolveDueAt);
      const isBreached = now >= responseDueAt || now >= resolveDueAt;

      sla.checkedAt = new Date(now).toISOString();

      if (isBreached && !sla.isBreached) {
        sla.isBreached = true;
        this.auditService.logSlaBreached(ticket.id);
        this.notificationsService.notifySlaBreached(ticket.id);
        this.realtimeService.emitSlaBreached(ticket.id, { ...sla });
        this.logger.warn(`SLA breached for ticket ${ticket.id}`);
      }
    }
  }

  reset(): void {
    this.ticketSlas.clear();
  }

  private shouldCheckStatus(status: TicketStatus): boolean {
    return status === 'NEW' || status === 'IN_PROGRESS';
  }
}
