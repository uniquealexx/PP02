import { CommentsService } from './comments.service';
import { TicketsService } from '../tickets/tickets.service';
import type { AuditService } from '../audit/audit.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { SlaService } from '../sla/sla.service';
import type { UsersService } from '../users/users.service';
import type { RealtimeService } from '../realtime/realtime.service';

describe('CommentsService', () => {
  it('adds comment, increments commentsCount, and logs audit/notifications', () => {
    const logTicketCreated = jest.fn();
    const logCommentAdded = jest.fn();
    const auditService = {
      logTicketCreated,
      logCommentAdded,
    } as unknown as AuditService;
    const notifyTicketCreated = jest.fn();
    const notifyCommentAdded = jest.fn();
    const notificationsService = {
      notifyTicketCreated,
      notifyCommentAdded,
    } as unknown as NotificationsService;
    const createTicketSla = jest.fn();
    const slaService = {
      createTicketSla,
    } as unknown as SlaService;
    const getUserById = jest.fn();
    const usersService = {
      getUserById,
    } as unknown as UsersService;
    const emitTicketCreated = jest.fn();
    const emitTicketUpdated = jest.fn();
    const emitCommentAdded = jest.fn();
    const realtimeService = {
      emitTicketCreated,
      emitTicketUpdated,
      emitCommentAdded,
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
    expect(logCommentAdded).toHaveBeenCalledWith(ticket.id, comment.id);
    expect(notifyCommentAdded).toHaveBeenCalledWith(ticket.id, comment.id);
    expect(emitCommentAdded).toHaveBeenCalledWith(comment);
  });
});
