import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CommentDto, CreateCommentDto } from '@servicedesk/shared';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);
  private readonly commentsByTicket = new Map<string, CommentDto[]>();

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  getComments(ticketId: string): CommentDto[] {
    this.ticketsService.getTicketById(ticketId);
    return [...(this.commentsByTicket.get(ticketId) ?? [])];
  }

  addComment(ticketId: string, authorId: string, payload: CreateCommentDto): CommentDto {
    this.ticketsService.getTicketById(ticketId);

    const comment: CommentDto = {
      id: randomUUID(),
      ticketId,
      authorId,
      text: payload.text,
      createdAt: new Date().toISOString(),
    };

    const existing = this.commentsByTicket.get(ticketId) ?? [];
    this.commentsByTicket.set(ticketId, [comment, ...existing]);

    this.ticketsService.incrementComments(ticketId);
    this.auditService.logCommentAdded(ticketId, comment.id);
    this.notificationsService.notifyCommentAdded(ticketId, comment.id);
    this.realtimeService.emitCommentAdded(comment);
    this.logger.log(`Comment added ${comment.id} for ticket ${ticketId}`);

    return comment;
  }

  reset(): void {
    this.commentsByTicket.clear();
  }
}
