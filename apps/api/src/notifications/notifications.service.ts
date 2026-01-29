import { Injectable, Logger } from '@nestjs/common';
import type { TicketDto } from '@servicedesk/shared';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  notifyTicketCreated(ticket: TicketDto): void {
    this.logger.log(`Notify: ticket created ${ticket.id}`);
  }

  notifyTicketAssigned(ticketId: string, assigneeId: string): void {
    this.logger.log(`Notify: ticket assigned ${ticketId} -> ${assigneeId}`);
  }

  notifyCommentAdded(ticketId: string, commentId: string): void {
    this.logger.log(`Notify: comment added ${commentId} on ${ticketId}`);
  }

  notifyStatusChanged(ticketId: string, status: string): void {
    this.logger.log(`Notify: status changed ${ticketId} -> ${status}`);
  }

  notifySlaBreached(ticketId: string): void {
    this.logger.warn(`Notify: SLA breached ${ticketId}`);
  }
}
