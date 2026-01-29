# Аудит ServiceDesk

Дата: 2026-01-29

## 1) Как устроен проект сейчас и что реализовано

### Архитектура и структура

- Monorepo на bun workspaces: `apps/web`, `apps/api`, `packages/shared` (см. `package.json`).
- `packages/shared` содержит общие DTO/типы: Ticket, Comment, Auth, SLA, Audit и роли (`packages/shared/src/index.ts`).
- `apps/api` — NestJS с модулями по доменам: auth, users, tickets, comments, sla, audit, notifications, realtime, prisma (`apps/api/src/*`).
- `apps/web` — Next.js App Router, страницы `/`, `/login`, `/register`, `/tickets` (`apps/web/src/app/*`).

### Функциональность (по факту кода)

- Авторизация/регистрация с JWT в httpOnly cookie и endpoint `/api/auth/*` (контроллер `apps/api/src/auth/auth.controller.ts`, сервис `apps/api/src/auth/auth.service.ts`).
- Пользователи из SQLite через Prisma (`apps/api/src/users/users.service.ts`, `apps/api/prisma/schema.prisma`).
- Тикеты: создание, список, изменение статуса, назначение агента (контроллер/сервис `apps/api/src/tickets/*`).
- Комментарии: добавление/список, увеличение `commentsCount` (контроллер/сервис `apps/api/src/comments/*`).
- SLA: политика + расчет/проверка breach по таймеру (контроллер/сервис `apps/api/src/sla/*`).
- Audit: логирование ключевых событий (сервис `apps/api/src/audit/audit.service.ts`).
- Notifications: заглушки логирования (сервис `apps/api/src/notifications/notifications.service.ts`).
- Realtime: Socket.io namespace `/ws`, события `ticket.created/updated`, `comment.added`, `sla.breached` (gateway/service `apps/api/src/realtime/*`).
- Web UI: форма создания тикета, список, SLA панель, смена статуса, назначение, комментарии, логин/регистрация (`apps/web/src/app/tickets/page.tsx`, `apps/web/src/app/login/page.tsx`, `apps/web/src/app/register/page.tsx`).
- Тесты:
  - unit: `apps/api/src/tickets/tickets.service.spec.ts`, `apps/api/src/sla/sla.service.spec.ts`
  - e2e: `apps/api/test/app.e2e-spec.ts`

## 2) Что не доделано / сломано

### Функциональные и архитектурные пробелы

- Тикеты/комментарии/SLA/Audit хранятся в памяти и теряются при перезапуске API (`tickets.service.ts`, `comments.service.ts`, `sla.service.ts`, `audit.service.ts`).
- Нет репозиториев/слоя хранения тикетов (Prisma используется только для User).
- Связь тикетов с пользователями не подтверждается БД (creatorId/assigneeId — строка, но тикеты не хранятся в БД).
- Realtime Gateway открыт по CORS `origin: '*'` и не использует авторизацию (минимально безопасно только для локальной разработки).

### UI/UX и стабильность

- Множественные проблемы с кодировками (mojibake) в русских строках UI: `/`, `/login`, `/register`, `/tickets` (`apps/web/src/app/*/page.tsx`).
- Есть смешение русского/английского текста в UI (требует выравнивания).

### Инфраструктура и запуск

- `apps/api/README.md` и `apps/web/README.md` — шаблонные (Nest/Next), не отражают проект.

## 3) Матрица ПК 2.1–2.5 (по факту проекта)

Примечание: формулировки ПК могут различаться в вашей программе. Ниже — типовая интерпретация с привязкой к коду.

| ПК                                                  | Статус   | Подтверждение (файлы/эндпоинты/тесты)                                                                                                                               |
| --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ПК 2.1 — проектирование/архитектура и модель данных | частично | Монорепо + модули, DTO (`packages/shared/src/index.ts`, `apps/api/src/*`), но нет БД для тикетов/комментариев/аудита (`tickets.service.ts`, `comments.service.ts`). |
| ПК 2.2 — разработка серверной части (API)           | есть     | Контроллеры/сервисы tickets/comments/sla/auth/users, Swagger (`apps/api/src/*`).                                                                                    |
| ПК 2.3 — разработка клиентской части                | частично | Next.js страницы `/tickets`, `/login`, `/register` (`apps/web/src/app/*`), но UI с проблемами кодировок.                                                            |
| ПК 2.4 — тестирование                               | частично | Unit тесты tickets/sla и e2e auth (`apps/api/src/*/*.spec.ts`, `apps/api/test/app.e2e-spec.ts`), нет тестов web.                                                    |
| ПК 2.5 — эксплуатация/документация/инфраструктура   | частично | Есть корневые скрипты/README, но нет CI и нет полноценной документации по контрактам/эксплуатации.                                                                  |

## 4) Технический долг

- Архитектура:
  - тикеты/комментарии/аудит/SLA — in-memory, нет репозиториев;
  - realtime без auth и с `origin: '*'` (только dev).
- Типы/DTO:
  - общие DTO есть, но API DTO классы не всегда синхронизированы по всему контракту (нужно держать единый источник истины в shared).
- Повтор кода:
  - в web есть повторяющиеся fetch/обработка ошибок (нет общего API клиента).
- Тесты:
  - отсутствуют тесты web;
  - e2e покрывают только auth.
- Линт/форматирование:
  - lint есть в web/api и в корне, но нет общего стандарта/единой конфигурации.
- Документация:
  - README в apps — шаблонные и не описывают проект.
  - нет описания API/фронтенд-контракта на уровне монорепо.

## 5) Что нужно сделать, чтобы проект был готов к защите (чеклист)

1. Убрать проблемы кодировок в web (все русские строки).
2. Подключить хранение тикетов/комментариев/аудита в БД (Prisma models + репозитории).
3. Привязать тикеты к пользователям в БД (creatorId/assigneeId как FK).
4. Добавить минимальные e2e сценарии: create ticket, comments, SLA breach.
5. Добавить базовые тесты для web (smoke или компонентные).
6. Обновить Swagger/документацию API по текущим контрактам.
7. Привести realtime к авторизации (JWT/cookie) и ограничить CORS.
8. Привести README в apps к описанию ServiceDesk (или удалить дубли).
9. Добавить описание seed-аккаунтов и миграций в корневой README.
10. Добавить CI (lint + test + build).
11. Проверить соответствие DTO shared и контрактов API (никаких расхождений).

## 6) Что я изменил

- `docs/AUDIT.md` (создан)
- `README.md` (создан)
- `package.json` (добавлены root-скрипты и devDependency)
- `apps/api/.env.example` (WEB_ORIGIN -> 3000)
- `apps/api/.env` (WEB_ORIGIN -> 3000)
- `apps/web/.env.example` (создан)
