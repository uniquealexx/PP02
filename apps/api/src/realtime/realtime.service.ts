import { Injectable } from '@nestjs/common';
import type { CommentDto, TicketDto, TicketSlaDto } from '@servicedesk/shared';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitTicketCreated(ticket: TicketDto): void {
    this.gateway.emit('ticket.created', ticket);
  }

  emitTicketUpdated(ticket: TicketDto): void {
    this.gateway.emit('ticket.updated', ticket);
  }

  emitCommentAdded(comment: CommentDto): void {
    this.gateway.emit('comment.added', comment);
  }

  emitSlaBreached(ticketId: string, sla: TicketSlaDto): void {
    this.gateway.emit('sla.breached', { ticketId, sla });
  }
}
