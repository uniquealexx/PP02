# ARCHITECTURE

## ��������� ���������������

- `apps/web` � Next.js (App Router, TypeScript) UI ��� ������ � ��������.
- `apps/api` � NestJS API (TypeScript), ������-������, ���������, Swagger.
- `packages/shared` � ����� DTO/���� ����� ������� � ����� (������ ��������).

## ������ NestJS (�� ����� ����������)

- Tickets: ���������� ��������, �������, ����������.
- SLA: ��������, ������� � �������� SLA breach.
- Audit: ��� ������� ������.
- Notifications: �������� ����������� (�����������).
- Users: ������ ������������� (����� Prisma/SQLite).
- Comments: ����������� � �������.
- Realtime: Socket.IO gateway + ������ ����� �������.
- Auth: �����������/�����/JWT (���������� Prisma).
- Prisma: ���������������� ������ ��.

## �������������� �������

- TicketsService
  - �������� AuditService (��������, ����������, ����� �������)
  - �������� NotificationsService (��������/����������/������)
  - �������� SlaService (�������� SLA, ������������� ��������)
  - �������� RealtimeService (ticket.created, ticket.updated)
  - ���������� � UsersService (��������� assignee ���� AGENT)
- CommentsService
  - �������� TicketsService (�������� ������ � ��������� commentsCount)
  - �������� AuditService (comment.added)
  - �������� NotificationsService (comment.added)
  - �������� RealtimeService (comment.added)
- SlaService
  - ��� breach �������� AuditService, NotificationsService, RealtimeService (sla.breached)
- AuthService/UsersService
  - ���������� PrismaService (SQLite)

## �������� ��������

1. �������� ������

- Web ���������� POST `/api/tickets`.
- TicketsController -> TicketsService.createTicket.
- ��������� TicketDto (in-memory), ������� Audit, Notifications, SLA, Realtime.
- ������������ TicketDto.

2. ���������� �����������

- Web ���������� PATCH `/api/tickets/:id/assign`.
- TicketsService ��������� ������������ ����� UsersService.
- ��������� ticket.assigneeId, ����� Audit � Notifications, ������ ticket.updated.

3. SLA breach

- ������������� �������� � TicketsService �������� SlaService.checkBreaches.
- ��� ������ breach: Audit + Notifications + Realtime ������� `sla.breached`.

4. ����������� + realtime

- Web ���������� POST `/api/tickets/:ticketId/comments`.
- CommentsService ������� CommentDto, ����������� commentsCount ������.
- Audit + Notifications + Realtime `comment.added`.

## ����-��������� ��������������

```
Next.js -> API Controller -> Service
Service -> (Audit/Notifications/SLA/Realtime) -> Response/Event
Service -> Users/Prisma (Auth/Users)
```

## �������� ������

- Tickets, Comments, SLA, Audit � in-memory ��������� � �������� API.
- Users/Auth � SQLite ����� Prisma (��. `apps/api/prisma`).
