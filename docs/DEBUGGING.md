# DEBUGGING

�������� ��� �� 2.3: ������� ������������ ������ � �������������� ������������������ �������.

## �����������

- Swagger UI: `http://localhost:3002/api/docs`
- Postman / curl
- VS Code / IntelliJ IDEA debugger (Node.js inspector)
- requestId (`X-Request-Id`), ������ ������ ������, ����������������� ����

## �������

- `bun run dev:api`
- `bun run dev:api:debug` (Node inspector)

## ���� � ����������

������ HTTP ������ �������� `X-Request-Id` (���� �� ������� �������� � ������������ ��������). ���� ������� � JSON-������� � ��������:
`method`, `url`, `statusCode`, `durationMs`, `requestId`, `userId`, `stack` (��� �������).

��� ����������� �� requestId:

- � �������/���������: ������ �� `"requestId":"<id>"`
- � ���-�����: `rg "<id>"` (���� ��� ����������� � ����)

## ��� ���������� � IDE

### VS Code

1. ��������� `bun run dev:api:debug`.
2. �������� ������� Run and Debug > Attach to Node Process > ���� 9229.
3. ��������� breakpoints:
   - `apps/api/src/tickets/tickets.service.ts` > `createTicket`
   - `apps/api/src/sla/sla.service.ts` > `checkBreaches`
   - `apps/api/src/comments/comments.service.ts` > `addComment`
4. ��������� ������ ����� Swagger/Postman.

### IntelliJ IDEA

1. ��������� `bun run dev:api:debug`.
2. Run > Attach to Node.js/Chrome > ���� 9229.
3. ��������� breakpoints (��. ����) � ��������� ������.

## Debug endpoint

`GET /api/debug/health` (������ dev / `DEBUG_ENDPOINTS=true`) ����������:

```
{
  "requestId": "...",
  "time": "2026-01-29T00:21:45.123Z"
}
```

������� ��� ������� �������� ����������� `requestId`.

## �������� �������

### 1) Create ticket

- ����:
  1. POST `/api/tickets` � `title`, `description`.
  2. ���������, ��� � ������ ���� `X-Request-Id`.
  3. � ����� ����� ������ � ���� `requestId`.
- ����� ��������: `TicketsService.createTicket`.

### 2) Comment added

- ����:
  1. POST `/api/tickets/:id/comments`.
  2. ���������, ��� `commentsCount` ���������� � �������� `comment.added`.
  3. � ����� ����� ������ � `requestId`.
- ����� ��������: `CommentsService.addComment`.

### 3) SLA breach

- ����:
  1. �������� ���������� `responseMinutes = 0` � `apps/api/src/sla/sla.service.ts`.
  2. ������� �����.
  3. ��������� ��������� ���� (�� 30 ������) � ���������, ��� `SLA breached` ����������.
- ����� ��������: `SlaService.checkBreaches`.

## ��������������� ��� � ����������� (�� 2.3)

### �������

SLA breach �� ����������� ����� � ������ ��������: ��� `responseDueAt == now` ��������� �� ���������� �� ���������� ����� ��������.

### ���� ���������������

1. ������� ����� � `createdAt = 2026-01-29T00:00:00.000Z`.
2. ���������� ����� �������� ����� �� `2026-01-29T00:15:00.000Z`.
3. ������� `SlaService.checkBreaches([ticket])`.
4. �������: breach ������ ���� ������������. ���������� (�� �����): breach �� ��������.

### ��� ���������

- �������� breakpoint � `SlaService.checkBreaches`.
- �������� ��������� `now > responseDueAt` � `now > resolveDueAt`.
- �������� ���� �� `requestId` ��� ������� e2e ���������.

### �������

��������� ������������ `>` ������ `>=`, ������� � ������ ��������� �������� breach �� ������������.

### �����������

�������� ������� �� `now >= responseDueAt || now >= resolveDueAt`.

### ��� ��������� ����� �����

- ��������� unit-���� `apps/api/src/sla/sla.service.spec.ts`.
- �������� `marks SLA breach when deadline is reached exactly` ������ ���������.
