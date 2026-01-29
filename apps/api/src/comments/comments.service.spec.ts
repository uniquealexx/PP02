import { CommentsService } from './comments.service';
import { TicketsService } from '../tickets/tickets.service';
import type { AuditService } from '../audit/audit.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { SlaService } from '../sla/sla.service';
import type { UsersService } from '../users/users.service';
import type { RealtimeService } from '../realtime/realtime.service';

describe('CommentsService', () => {
  it('adds comment, increments commentsCount, and logs audit/notifications', () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logCommentAdded: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyCommentAdded: jest.fn(),
    } as unknown as NotificationsService;
    const slaService = {
      createTicketSla: jest.fn(),
    } as unknown as SlaService;
    const usersService = {
      getUserById: jest.fn(),
    } as unknown as UsersService;
    const realtimeService = {
      emitTicketCreated: jest.fn(),
      emitTicketUpdated: jest.fn(),
      emitCommentAdded: jest.fn(),
    } as unknown as RealtimeService;

    const ticketsService = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );
    const commentsService = new CommentsService(
      ticketsService,
      auditService,
      notificationsService,
      realtimeService,
    );

    const ticket = ticketsService.createTicket({ title: 'Printer' }, 'user-1');
    const comment = commentsService.addComment(ticket.id, 'user-1', {
      text: 'Checking cables',
    });

    expect(ticketsService.getTicketById(ticket.id).commentsCount).toBe(1);
    expect(auditService.logCommentAdded).toHaveBeenCalledWith(
      ticket.id,
      comment.id,
    );
    expect(notificationsService.notifyCommentAdded).toHaveBeenCalledWith(
      ticket.id,
      comment.id,
    );
    expect(realtimeService.emitCommentAdded).toHaveBeenCalledWith(comment);
  });
});
