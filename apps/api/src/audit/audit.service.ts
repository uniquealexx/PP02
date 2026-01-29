import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AuditLogDto } from '@servicedesk/shared';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly logs: AuditLogDto[] = [];

  logTicketCreated(ticketId: string): AuditLogDto {
    const log: AuditLogDto = {
      id: randomUUID(),
      eventType: 'TICKET_CREATED',
      entityId: ticketId,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(log);
    this.logger.log(`Audit: ticket created ${ticketId}`);
    return log;
  }

  logSlaBreached(ticketId: string): AuditLogDto {
    const log: AuditLogDto = {
      id: randomUUID(),
      eventType: 'SLA_BREACHED',
      entityId: ticketId,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(log);
    this.logger.warn(`Audit: SLA breached ${ticketId}`);
    return log;
  }

  logTicketAssigned(ticketId: string, assigneeId: string): AuditLogDto {
    const log: AuditLogDto = {
      id: randomUUID(),
      eventType: 'TICKET_ASSIGNED',
      entityId: ticketId,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(log);
    this.logger.log(`Audit: ticket assigned ${ticketId} -> ${assigneeId}`);
    return log;
  }

  logCommentAdded(ticketId: string, commentId: string): AuditLogDto {
    const log: AuditLogDto = {
      id: randomUUID(),
      eventType: 'COMMENT_ADDED',
      entityId: ticketId,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(log);
    this.logger.log(`Audit: comment added ${commentId} on ${ticketId}`);
    return log;
  }

  logStatusChanged(ticketId: string, status: string): AuditLogDto {
    const log: AuditLogDto = {
      id: randomUUID(),
      eventType: 'STATUS_CHANGED',
      entityId: ticketId,
      createdAt: new Date().toISOString(),
    };

    this.logs.push(log);
    this.logger.log(`Audit: status changed ${ticketId} -> ${status}`);
    return log;
  }

  getLogs(): AuditLogDto[] {
    return [...this.logs];
  }

  reset(): void {
    this.logs.length = 0;
  }
}
