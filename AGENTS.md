# ServiceDesk — AGENTS

## Описание проекта

ServiceDesk — система для работы с заявками (tickets), исполнителями и SLA. Проект предназначен для регистрации, маршрутизации и контроля исполнения заявок, включая историю изменений и уведомления.

## Архитектура и структура репозитория

Monorepo на bun workspaces:

- apps/web — фронтенд на Next.js (App Router, TypeScript)
- apps/api — бэкенд на NestJS (TypeScript)
- packages/shared — общие DTO/типы между фронтом и бэком

## Документация

- `docs/REQUIREMENTS.md` — назначение, роли, функции, ограничения.
- `docs/ARCHITECTURE.md` — структура, модули и взаимодействия.
- `docs/API_CONTRACT.md` — актуальные эндпоинты и коды ответов.
- `docs/TRACEABILITY_PC.md` — трассируемость ПК 2.1–2.5.

## Запуск проекта

Из корня репозитория:

- bun run dev:web — запуск Next.js
- bun run dev:api — запуск NestJS в watch режиме
- bun run build:shared — сборка общего пакета

## Правила разработки

- Все DTO и общие типы живут в packages/shared и импортируются как "@servicedesk/shared".
- API-контракты должны описываться через shared и быть единственным источником истины.
- Модули NestJS структурируются по доменам (Auth, Users, Tickets и т.д.), каждый модуль имеет controller, service, dto, entities.
- Любые изменения API должны сопровождаться обновлением типов в shared.
- Любые новые фичи должны обновлять `docs/API_CONTRACT.md` и `docs/TRACEABILITY_PC.md`.

## Сквозной сценарий #1: создание заявки

Цель: создание тикета с записью в аудит и заглушкой уведомления.

Последовательность:

1. Web /tickets отправляет POST на API.
2. TicketsController принимает CreateTicketRequest и вызывает TicketsService.
3. TicketsService создаёт TicketDto, сохраняет в памяти.
4. TicketsService вызывает AuditService.logTicketCreated(ticketId).
5. TicketsService вызывает NotificationsService.notifyTicketCreated(ticketDto).
6. API возвращает TicketDto фронту.

Примеры запросов/ответов:

POST /api/tickets
Request:
{
"title": "Не работает принтер",
"description": "Принтер в кабинете 305 не печатает."
}

Response:
{
"id": "b0c9f2c0-1a4f-49db-a9f7-5b5f9eebf1b6",
"title": "Не работает принтер",
"description": "Принтер в кабинете 305 не печатает.",
"status": "NEW",
"createdAt": "2026-01-29T00:21:45.123Z",
"updatedAt": "2026-01-29T00:21:45.123Z",
"commentsCount": 0
}

GET /api/tickets
Response:
[
{
"id": "b0c9f2c0-1a4f-49db-a9f7-5b5f9eebf1b6",
"title": "Не работает принтер",
"description": "Принтер в кабинете 305 не печатает.",
"status": "NEW",
"createdAt": "2026-01-29T00:21:45.123Z",
"updatedAt": "2026-01-29T00:21:45.123Z",
"commentsCount": 0
}
]

Как проверить вручную:

1. В первом терминале: bun run dev:api
2. Во втором терминале: bun run dev:web
3. API по умолчанию слушает http://localhost:3002 (можно переопределить PORT).
4. Откройте http://localhost:3000/tickets
5. Создайте тикет, убедитесь что он появился в списке.
6. Проверьте логи API: видны сообщения Audit и Notifications.

## SLA

Политика:

- responseMinutes = 15
- resolveMinutes = 120

Расчёт дедлайнов:

- responseDueAt = createdAt + responseMinutes
- resolveDueAt = createdAt + resolveMinutes
- checkedAt обновляется при каждой проверке фоновой задачи

Фоновая проверка:

- каждые 30 секунд проверяет тикеты со статусом NEW/IN_PROGRESS
- если дедлайн прошёл впервые: помечает SLA breach, пишет Audit "SLA_BREACHED" и вызывает NotificationsService.notifySlaBreached
- для RESOLVED/CLOSED SLA больше не пересчитывается

Новые эндпоинты:

- GET /api/sla/policy
- GET /api/tickets/:id/sla
- PATCH /api/tickets/:id/status

Пример ручной проверки breach:

1. Временно поменяйте responseMinutes в `apps/api/src/sla/sla.service.ts` на 0.
2. Перезапустите API (bun run dev:api).
3. Создайте тикет и подождите до следующей проверки (до 30 секунд).
4. В логах увидите SLA breach, а на странице /tickets появится "SLA просрочен".
5. Верните responseMinutes обратно на 15.

## Auth (SQLite)

SQLite файл:

- `apps/api/dev.db` (DATABASE_URL = `file:./dev.db`)

Миграции и сид:

- `bun run --cwd apps/api prisma:migrate`
- `bun run --cwd apps/api prisma:seed`

Env (см. `apps/api/.env.example`):

- DATABASE_URL, JWT_SECRET, WEB_ORIGIN

Auth эндпоинты:

- POST /api/auth/register -> AuthResponseDto (ставит httpOnly cookie `sd_token`)
- POST /api/auth/login -> AuthResponseDto (ставит httpOnly cookie `sd_token`)
- POST /api/auth/logout -> 200 (очищает cookie)
- GET /api/auth/me -> AuthResponseDto

Фронт и cookie:

- все запросы в API делают `credentials: "include"`
- CORS: `origin` = `WEB_ORIGIN`, `credentials: true`

Пользователи:

- GET /api/users -> AuthUserDto[] (только ADMIN, без passwordHash)
- seed создает admin/agents/user (см. prisma/seed.ts)

Seed аккаунты:

- admin@local / Admin123!
- agent1@local / Agent123!
- agent2@local / Agent123!
- user@local / User123!

## Видимость тикетов (GET /api/tickets)

Текущий пользователь определяется по JWT (cookie `sd_token`).

- USER: только тикеты, где creatorId == currentUser.id
- AGENT: тикеты, где assigneeId == currentUser.id ИЛИ creatorId == currentUser.id + unassigned (assigneeId отсутствует)
- ADMIN: все тикеты

## Назначение тикета

PATCH /api/tickets/:id/assign
Request:
{
"assigneeId": "agent-1"
}

Response: TicketDto (assigneeId, updatedAt, commentsCount)

Правила:

- назначать можно только на пользователей с ролью AGENT
- пишется Audit "TICKET_ASSIGNED"
- вызывается NotificationsService.notifyTicketAssigned
- realtime событие ticket.updated

## Комментарии

POST /api/tickets/:id/comments
Request:
{
"text": "Проверяю кабели."
}

Response:
{
"id": "c7a2a5f1-4bb1-4d1c-a9e8-4b5b7d2b0e3d",
"ticketId": "b0c9f2c0-1a4f-49db-a9f7-5b5f9eebf1b6",
"authorId": "user-1",
"text": "Проверяю кабели.",
"createdAt": "2026-01-29T01:10:00.000Z"
}

GET /api/tickets/:id/comments -> CommentDto[]

Поведение:

- увеличивается commentsCount у тикета
- пишется Audit "COMMENT_ADDED"
- вызывается NotificationsService.notifyCommentAdded
- realtime событие comment.added

## Realtime (WebSocket события)

Socket.io namespace: /ws

События и payload:

- ticket.created -> TicketDto
- ticket.updated -> TicketDto
- comment.added -> CommentDto
- sla.breached -> { "ticketId": "<id>", "sla": TicketSlaDto }

Пример payload:
ticket.updated:
{
"id": "b0c9f2c0-1a4f-49db-a9f7-5b5f9eebf1b6",
"status": "IN_PROGRESS",
"assigneeId": "agent-1",
"updatedAt": "2026-01-29T01:05:00.000Z",
"commentsCount": 2
}

## Минимальная дорожная карта

1. Auth
2. Users
3. Tickets
4. Comments
5. SLA
6. Audit
7. Notifications

## Стандарты качества (план)

- Линтинг: ESLint для web и api, единые правила по возможности.
- Форматирование: Prettier, общие настройки в корне.
- Тесты: unit-тесты для сервисов, e2e для основных сценариев API.
- CI: проверка lint, build и тестов на PR.

## Краткая сводка

Реализовано:

- DTO и типы Ticket/Audit/SLA в shared.
- Tickets/Audit/Notifications/SLA модули в API с валидацией и Swagger.
- Страница /tickets в web с формой, списком, статусами и SLA.
- Unit-тесты TicketsService/SlaService на интеграцию с Audit/Notifications.

Следующие шаги:

- Подключить БД и репозитории (Tickets, Audit).
- Добавить Auth/Users.
- Реализовать реальные уведомления.
