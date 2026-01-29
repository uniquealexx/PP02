import { SlaService } from './sla.service';
import type { AuditService } from '../audit/audit.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { RealtimeService } from '../realtime/realtime.service';
import type { TicketDto } from '@servicedesk/shared';

describe('SlaService', () => {
  const makeTicket = (overrides: Partial<TicketDto> = {}): TicketDto => ({
    id: 'ticket-1',
    title: 'Printer issue',
    description: 'Office 305',
    status: 'NEW',
    creatorId: 'user-1',
    createdAt: '2026-01-29T00:00:00.000Z',
    updatedAt: '2026-01-29T00:00:00.000Z',
    commentsCount: 0,
    ...overrides,
  });

  it('calculates dueAt from ticket creation time', () => {
    const logSlaBreached = jest.fn();
    const auditService = {
      logSlaBreached,
    } as unknown as AuditService;
    const notifySlaBreached = jest.fn();
    const notificationsService = {
      notifySlaBreached,
    } as unknown as NotificationsService;
    const emitSlaBreached = jest.fn();
    const realtimeService = {
      emitSlaBreached,
    } as unknown as RealtimeService;
    const service = new SlaService(auditService, notificationsService, realtimeService);

    const ticket = makeTicket();
    const sla = service.createTicketSla(ticket);

    expect(sla.responseDueAt).toBe('2026-01-29T00:15:00.000Z');
    expect(sla.resolveDueAt).toBe('2026-01-29T02:00:00.000Z');
  });

  it('logs audit and notifications on first breach', () => {
    const logSlaBreached = jest.fn();
    const auditService = {
      logSlaBreached,
    } as unknown as AuditService;
    const notifySlaBreached = jest.fn();
    const notificationsService = {
      notifySlaBreached,
    } as unknown as NotificationsService;
    const emitSlaBreached = jest.fn();
    const realtimeService = {
      emitSlaBreached,
    } as unknown as RealtimeService;
    const service = new SlaService(auditService, notificationsService, realtimeService);

    const ticket = makeTicket({
      createdAt: '2026-01-29T00:00:00.000Z',
    });
    service.createTicketSla(ticket);

    const now = new Date('2026-01-29T03:00:00.000Z').getTime();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    service.checkBreaches([ticket]);
    service.checkBreaches([ticket]);

    expect(logSlaBreached).toHaveBeenCalledTimes(1);
    expect(logSlaBreached).toHaveBeenCalledWith(ticket.id);
    expect(notifySlaBreached).toHaveBeenCalledTimes(1);
    expect(notifySlaBreached).toHaveBeenCalledWith(ticket.id);
    expect(emitSlaBreached).toHaveBeenCalledTimes(1);
    expect(emitSlaBreached).toHaveBeenCalledWith(ticket.id, expect.any(Object));

    nowSpy.mockRestore();
  });

  it('marks SLA breach when deadline is reached exactly', () => {
    const logSlaBreached = jest.fn();
    const auditService = {
      logSlaBreached,
    } as unknown as AuditService;
    const notifySlaBreached = jest.fn();
    const notificationsService = {
      notifySlaBreached,
    } as unknown as NotificationsService;
    const emitSlaBreached = jest.fn();
    const realtimeService = {
      emitSlaBreached,
    } as unknown as RealtimeService;
    const service = new SlaService(auditService, notificationsService, realtimeService);

    const ticket = makeTicket({
      createdAt: '2026-01-29T00:00:00.000Z',
    });
    service.createTicketSla(ticket);

    const dueAt = new Date('2026-01-29T00:15:00.000Z').getTime();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(dueAt);

    service.checkBreaches([ticket]);

    expect(logSlaBreached).toHaveBeenCalledTimes(1);
    expect(notifySlaBreached).toHaveBeenCalledTimes(1);
    expect(emitSlaBreached).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });
});
