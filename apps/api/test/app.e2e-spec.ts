import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { TicketsController } from '../src/tickets/tickets.controller';
import { TicketsService } from '../src/tickets/tickets.service';
import { CommentsController } from '../src/comments/comments.controller';
import { CommentsService } from '../src/comments/comments.service';
import { SlaController } from '../src/sla/sla.controller';
import { SlaService } from '../src/sla/sla.service';
import { AuditService } from '../src/audit/audit.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { UsersService } from '../src/users/users.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import type { TicketDto, TicketSlaDto } from '@servicedesk/shared';

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: TestUser }>();
    const roleHeader = request.headers['x-test-role'];
    const userHeader = request.headers['x-test-user'];
    const role = (Array.isArray(roleHeader) ? roleHeader[0] : roleHeader) ?? 'USER';
    const id = (Array.isArray(userHeader) ? userHeader[0] : userHeader) ?? 'user-1';
    request.user = {
      id,
      email: `${id}@local`,
      name: id,
      role,
    };
    return true;
  }
}

describe('Tickets API (e2e)', () => {
  let app: INestApplication;
  let ticketsService: TicketsService;
  let commentsService: CommentsService;
  let slaService: SlaService;
  let auditService: AuditService;
  const getServer = () => app.getHttpServer() as Parameters<typeof request>[0];

  const realtimeMock = {
    emitTicketCreated: jest.fn(),
    emitTicketUpdated: jest.fn(),
    emitCommentAdded: jest.fn(),
    emitSlaBreached: jest.fn(),
  };

  const usersServiceMock = {
    getUserById: jest.fn((id: string) =>
      Promise.resolve({
        id,
        name: id,
        email: `${id}@local`,
        role: id.startsWith('agent') ? 'AGENT' : 'USER',
      }),
    ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController, CommentsController, SlaController],
      providers: [
        TicketsService,
        CommentsService,
        SlaService,
        AuditService,
        NotificationsService,
        { provide: RealtimeService, useValue: realtimeMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    ticketsService = moduleFixture.get(TicketsService);
    commentsService = moduleFixture.get(CommentsService);
    slaService = moduleFixture.get(SlaService);
    auditService = moduleFixture.get(AuditService);

    ticketsService.stopSlaMonitor();
  });

  beforeEach(() => {
    ticketsService.reset();
    commentsService.reset();
    slaService.reset();
    auditService.reset();
    realtimeMock.emitTicketCreated.mockClear();
    realtimeMock.emitTicketUpdated.mockClear();
    realtimeMock.emitCommentAdded.mockClear();
    realtimeMock.emitSlaBreached.mockClear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createTicket = async (): Promise<TicketDto> => {
    const response = await request(getServer())
      .post('/api/tickets')
      .send({ title: 'Printer issue', description: 'Office 305' })
      .expect(201);
    return response.body as TicketDto;
  };

  it('POST /api/tickets creates a ticket', async () => {
    const ticket = await createTicket();

    expect(ticket.id).toEqual(expect.any(String));
    expect(ticket.title).toBe('Printer issue');
    expect(ticket.status).toBe('NEW');
    expect(ticket.commentsCount).toBe(0);
  });

  it('POST /api/tickets rejects invalid payload', async () => {
    await request(getServer()).post('/api/tickets').send({}).expect(400);
  });

  it('GET /api/tickets returns created tickets', async () => {
    const ticket = await createTicket();

    const response = await request(getServer()).get('/api/tickets').expect(200);
    const tickets = response.body as TicketDto[];

    expect(tickets.map((item) => item.id)).toContain(ticket.id);
  });

  it('PATCH /api/tickets/:id/status updates status', async () => {
    const ticket = await createTicket();

    const response = await request(getServer())
      .patch(`/api/tickets/${ticket.id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    const updated = response.body as TicketDto;
    expect(updated.status).toBe('IN_PROGRESS');
  });

  it('POST /api/tickets/:id/comments adds comment and increments count', async () => {
    const ticket = await createTicket();

    const response = await request(getServer())
      .post(`/api/tickets/${ticket.id}/comments`)
      .send({ text: 'Checking cables.' })
      .expect(201);

    const createdComment = response.body as { ticketId: string };
    expect(createdComment.ticketId).toBe(ticket.id);

    const ticketsResponse = await request(getServer()).get('/api/tickets').expect(200);
    const updated = (ticketsResponse.body as TicketDto[]).find((item) => item.id === ticket.id);

    expect(updated?.commentsCount).toBe(1);
  });

  it('GET /api/tickets/:id/sla returns SLA data', async () => {
    const ticket = await createTicket();

    const response = await request(getServer()).get(`/api/tickets/${ticket.id}/sla`).expect(200);

    const sla = response.body as TicketSlaDto;
    expect(sla.ticketId).toBe(ticket.id);

    const createdAtMs = Date.parse(ticket.createdAt);
    const responseDueMs = Date.parse(sla.responseDueAt);
    const resolveDueMs = Date.parse(sla.resolveDueAt);

    expect(responseDueMs - createdAtMs).toBe(15 * 60 * 1000);
    expect(resolveDueMs - createdAtMs).toBe(120 * 60 * 1000);
  });
});
