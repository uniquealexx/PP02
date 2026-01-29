# API_CONTRACT

## ����� �������

- ������� ������� API: `/api` (��. `apps/api/src/main.ts`).
- ������ ������: `application/json`.
- ��������������: JWT � httpOnly cookie `sd_token`.
- Swagger �������� �� `/api/docs`.

## HTTP ���������

| ����� | ����                              | ��������                     | ����                       | �����                                 |
| ----- | --------------------------------- | ---------------------------- | -------------------------- | ------------------------------------- |
| GET   | `/api`                            | Health/hello endpoint        | -                          | `string`                              |
| POST  | `/api/auth/register`              | ����������� ������������     | `RegisterDto`              | `AuthResponseDto` + cookie `sd_token` |
| POST  | `/api/auth/login`                 | ����� ������������           | `LoginDto`                 | `AuthResponseDto` + cookie `sd_token` |
| POST  | `/api/auth/logout`                | ����� ������������           | -                          | `200 OK` (cookie ���������)           |
| GET   | `/api/auth/me`                    | ������� ������������         | -                          | `AuthResponseDto`                     |
| GET   | `/api/users`                      | ������ ������������� (ADMIN) | -                          | `AuthUserDto[]`                       |
| GET   | `/api/tickets`                    | ������ ������� (�� ����)     | -                          | `TicketDto[]`                         |
| POST  | `/api/tickets`                    | ������� �����                | `CreateTicketDto`          | `TicketDto`                           |
| GET   | `/api/tickets/:id/sla`            | SLA �� ������                | -                          | `TicketSlaDto`                        |
| PATCH | `/api/tickets/:id/status`         | �������� ������ ������       | `{ status: TicketStatus }` | `TicketDto`                           |
| PATCH | `/api/tickets/:id/assign`         | ��������� �����������        | `{ assigneeId: string }`   | `TicketDto`                           |
| GET   | `/api/tickets/:ticketId/comments` | ����������� ������           | -                          | `CommentDto[]`                        |
| POST  | `/api/tickets/:ticketId/comments` | �������� �����������         | `CreateCommentDto`         | `CommentDto`                          |
| GET   | `/api/sla/policy`                 | SLA ��������                 | -                          | `SlaPolicyDto`                        |

## WebSocket (Socket.IO)

- Namespace: `/ws`
- �������: `ticket.created`, `ticket.updated`, `comment.added`, `sla.breached`
- Payload ������� � `packages/shared` (TicketDto, CommentDto, TicketSlaDto)

## ���� �������

- 200 OK: �������� GET/PATCH, login/logout, /auth/me.
- 201 Created: �������� ��������� (register, tickets, comments).
- 400 Bad Request: ������ ���������/������-������ (��������, �������� ������, ���������� assignee).
- 401 Unauthorized: �����������/������������ JWT.
- 403 Forbidden: ������������ ���� (��������, GET /api/users).
- 404 Not Found: �����/SLA �� ������.
- 422 Unprocessable Entity: �� ������������ � ������� ������ (��������� ���������� 400).
- 500 Internal Server Error: �������������� ������ �������.

## Debug � ������ (����������)

- ��� ������ �������� ��������� `X-Request-Id` (������������� �� ��������� ������� ��� ������������ ��������).
- ������ ������ ������ (��� 400/404/422 � ������ HTTP ������):

```
{
  "errorCode": "BAD_REQUEST",
  "message": "Validation failed.",
  "details": {
    "title": "Title is required."
  },
  "requestId": "1c2b1b0f-2a74-4f26-8a6f-4b6f5f9d5df2"
}
```

- Debug endpoint (������ ��� dev / DEBUG_ENDPOINTS=true):
  - GET `/api/debug/health` -> `{ requestId, time }`
