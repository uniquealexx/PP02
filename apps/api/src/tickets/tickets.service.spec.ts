import { TicketsService } from './tickets.service';
import type { AuditService } from '../audit/audit.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { SlaService } from '../sla/sla.service';
import type { UsersService } from '../users/users.service';
import type { RealtimeService } from '../realtime/realtime.service';

describe('TicketsService', () => {
  it('creates ticket and calls audit/notifications', () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logStatusChanged: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyStatusChanged: jest.fn(),
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
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );
    const ticket = service.createTicket(
      {
        title: 'Printer issue',
        description: 'Office 305',
      },
      'user-1',
    );

    expect(ticket.id).toEqual(expect.any(String));
    expect(ticket.status).toBe('NEW');
    expect(auditService.logTicketCreated).toHaveBeenCalledWith(ticket.id);
    expect(notificationsService.notifyTicketCreated).toHaveBeenCalledWith(
      ticket,
    );
    expect(slaService.createTicketSla).toHaveBeenCalledWith(ticket);
    expect(realtimeService.emitTicketCreated).toHaveBeenCalledWith(ticket);
  });

  it('prevents reopening closed tickets', () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logStatusChanged: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyStatusChanged: jest.fn(),
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
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );
    const ticket = service.createTicket(
      {
        title: 'Printer issue',
      },
      'user-1',
    );
    service.updateTicketStatus(ticket.id, 'CLOSED');

    expect(() =>
      service.updateTicketStatus(ticket.id, 'IN_PROGRESS'),
    ).toThrow('Closed tickets cannot be reopened.');
  });

  it('assigns only to agents and logs audit/notifications', async () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logTicketAssigned: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyTicketAssigned: jest.fn(),
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
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );
    const ticket = service.createTicket(
      {
        title: 'Network',
      },
      'user-1',
    );

    usersService.getUserById = jest.fn().mockResolvedValue({
      id: 'user-1',
      name: 'User',
      role: 'USER',
    });

    await expect(
      service.assignTicket(ticket.id, { assigneeId: 'user-1' }),
    ).rejects.toThrow('Assignee must be an agent.');

    usersService.getUserById = jest.fn().mockResolvedValue({
      id: 'agent-1',
      name: 'Agent',
      role: 'AGENT',
    });

    const updated = await service.assignTicket(ticket.id, { assigneeId: 'agent-1' });
    expect(updated.assigneeId).toBe('agent-1');
    expect(auditService.logTicketAssigned).toHaveBeenCalledWith(
      ticket.id,
      'agent-1',
    );
    expect(notificationsService.notifyTicketAssigned).toHaveBeenCalledWith(
      ticket.id,
      'agent-1',
    );
    expect(realtimeService.emitTicketUpdated).toHaveBeenCalledWith(updated);
  });

  it('logs audit and notifications on status change', () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logStatusChanged: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyStatusChanged: jest.fn(),
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
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );
    const ticket = service.createTicket(
      {
        title: 'Status check',
      },
      'user-1',
    );

    const updated = service.updateTicketStatus(ticket.id, 'IN_PROGRESS');

    expect(auditService.logStatusChanged).toHaveBeenCalledWith(
      ticket.id,
      'IN_PROGRESS',
    );
    expect(notificationsService.notifyStatusChanged).toHaveBeenCalledWith(
      ticket.id,
      'IN_PROGRESS',
    );
    expect(realtimeService.emitTicketUpdated).toHaveBeenCalledWith(updated);
  });

  it('returns only own tickets for USER', () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logStatusChanged: jest.fn(),
      logTicketAssigned: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyStatusChanged: jest.fn(),
      notifyTicketAssigned: jest.fn(),
    } as unknown as NotificationsService;
    const slaService = {
      createTicketSla: jest.fn(),
    } as unknown as SlaService;
    const usersService = {
      getUserById: jest.fn((userId: string) => ({
        id: userId,
        name: userId,
        role: userId.startsWith('agent') ? 'AGENT' : 'USER',
      })),
    } as unknown as UsersService;
    const realtimeService = {
      emitTicketCreated: jest.fn(),
      emitTicketUpdated: jest.fn(),
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );

    service.createTicket({ title: 'Owned' }, 'user-1');
    service.createTicket({ title: 'Other' }, 'user-2');

    const visible = service.getTicketsForUser({
      id: 'user-1',
      name: 'User One',
      role: 'USER',
    });

    expect(visible).toHaveLength(1);
    expect(visible[0].creatorId).toBe('user-1');
  });

  it('returns assigned + created + unassigned tickets for AGENT', async () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logStatusChanged: jest.fn(),
      logTicketAssigned: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyStatusChanged: jest.fn(),
      notifyTicketAssigned: jest.fn(),
    } as unknown as NotificationsService;
    const slaService = {
      createTicketSla: jest.fn(),
    } as unknown as SlaService;
    const usersService = {
      getUserById: jest.fn((userId: string) =>
        Promise.resolve({
          id: userId,
          name: userId,
          role: 'AGENT',
        }),
      ),
    } as unknown as UsersService;
    const realtimeService = {
      emitTicketCreated: jest.fn(),
      emitTicketUpdated: jest.fn(),
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );

    const unassigned = service.createTicket({ title: 'Queue' }, 'user-1');
    const assigned = service.createTicket({ title: 'Assigned' }, 'user-2');
    const otherAssigned = service.createTicket(
      { title: 'Other agent' },
      'user-3',
    );
    const createdByAgent = service.createTicket(
      { title: 'Created by agent' },
      'agent-1',
    );

    await service.assignTicket(assigned.id, { assigneeId: 'agent-1' });
    await service.assignTicket(otherAssigned.id, { assigneeId: 'agent-2' });
    await service.assignTicket(createdByAgent.id, { assigneeId: 'agent-2' });

    const visible = service.getTicketsForUser({
      id: 'agent-1',
      name: 'Agent One',
      role: 'AGENT',
    });

    const visibleIds = visible.map((ticket) => ticket.id);
    expect(visibleIds).toEqual(
      expect.arrayContaining([unassigned.id, assigned.id, createdByAgent.id]),
    );
    expect(visibleIds).not.toContain(otherAssigned.id);
  });

  it('returns all tickets for ADMIN', () => {
    const auditService = {
      logTicketCreated: jest.fn(),
      logStatusChanged: jest.fn(),
    } as unknown as AuditService;
    const notificationsService = {
      notifyTicketCreated: jest.fn(),
      notifyStatusChanged: jest.fn(),
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
    } as unknown as RealtimeService;

    const service = new TicketsService(
      auditService,
      notificationsService,
      slaService,
      usersService,
      realtimeService,
    );

    service.createTicket({ title: 'One' }, 'user-1');
    service.createTicket({ title: 'Two' }, 'user-2');

    const visible = service.getTicketsForUser({
      id: 'admin-1',
      name: 'Admin',
      role: 'ADMIN',
    });

    expect(visible).toHaveLength(2);
  });
});
