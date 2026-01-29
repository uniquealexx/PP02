# TEST_PLAN

## Test Environment

- OS: Windows 11 (local dev)
- Runtime: Node.js 20+ (recommended Node 22 LTS)
- Package manager: bun 1.1+
- API framework: NestJS 11
- Test framework: Jest + Supertest
- Ports (default):
  - API: http://localhost:3002
  - Web: http://localhost:3000

## How to Run

From repo root:

```bash
bun run test
bun run test:api
```

## Test Data

- In-memory tickets/comments/SLA/audit are reset before each test.
- Test user injected by test guard:
  - default user: `user-1`, role `USER`
  - role can be overridden in tests via `x-test-role` header

## Test Cases (PK 2.4)

| ID    | Name                                   | Preconditions                        | Steps                                                        | Expected Result                                                             | PK 2.4 Link |
| ----- | -------------------------------------- | ------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------- |
| TC-01 | Create ticket (valid)                  | API running                          | 1) POST `/api/tickets` with title/description                | 201 + `TicketDto`, status `NEW`, `commentsCount = 0`                        | PK 2.4      |
| TC-02 | Create ticket (invalid)                | API running                          | 1) POST `/api/tickets` with empty body                       | 400 validation error                                                        | PK 2.4      |
| TC-03 | List tickets after create              | API running                          | 1) Create ticket 2) GET `/api/tickets`                       | Response contains created ticket                                            | PK 2.4      |
| TC-04 | Update status (valid)                  | Ticket exists                        | 1) PATCH `/api/tickets/:id/status` to `IN_PROGRESS`          | 200 + status updated, audit/notification emitted                            | PK 2.4      |
| TC-05 | Update status (forbidden reopen)       | Ticket is `CLOSED`                   | 1) PATCH status to `IN_PROGRESS`                             | 400 error `Closed tickets cannot be reopened`                               | PK 2.4      |
| TC-06 | Assign ticket to AGENT                 | Ticket exists, assignee role AGENT   | 1) PATCH `/api/tickets/:id/assign` with `assigneeId=agent-1` | 200 + `assigneeId=agent-1`, audit + notification                            | PK 2.4      |
| TC-07 | Assign ticket to non-AGENT             | Ticket exists, assignee role USER    | 1) PATCH `/api/tickets/:id/assign` with `assigneeId=user-1`  | 400 error `Assignee must be an agent`                                       | PK 2.4      |
| TC-08 | Add comment increments count           | Ticket exists                        | 1) POST `/api/tickets/:id/comments` 2) GET `/api/tickets`    | 201 comment, ticket `commentsCount` increased                               | PK 2.4      |
| TC-09 | SLA dueAt calculation                  | Ticket exists                        | 1) GET `/api/tickets/:id/sla`                                | `responseDueAt = createdAt + 15m`, `resolveDueAt = createdAt + 120m`        | PK 2.4      |
| TC-10 | SLA breach triggers audit/notification | Ticket exists, SLA overdue           | 1) Call `SlaService.checkBreaches(now)`                      | Audit `SLA_BREACHED` + Notifications + realtime event                       | PK 2.4      |
| TC-11 | Ticket visibility for USER             | Tickets exist from different users   | 1) GET `/api/tickets` as USER                                | Only tickets with `creatorId = user.id`                                     | PK 2.4      |
| TC-12 | Realtime events emitted                | Ticket/comment/SLA actions performed | 1) Create ticket 2) Add comment 3) Breach SLA                | Realtime events emitted (`ticket.created`, `comment.added`, `sla.breached`) | PK 2.4      |
