# ServiceDesk

ServiceDesk — система для регистрации и обработки заявок (tickets) с контролем SLA, аудитом действий и realtime-событиями.

## Ключевые фичи

- Заявки: создание, список, статусы.
- Назначение исполнителя (AGENT) и контроль доступа по ролям.
- Комментарии к заявкам.
- SLA-политика и статусы просрочки.
- Аудит и уведомления (через сервисы API + логи).
- Realtime-события через WebSocket (/ws).
- Логи с requestId (для отладки).

## Быстрый старт (3 команды)

Из корня репозитория:

```bash
bun install
bun run build:shared
bun run dev
```

Если `bun run dev` не запускается (нет `concurrently` или конфликты портов) — используйте 2 терминала:

```bash
bun run dev:api
```

```bash
bun run dev:web
```

По умолчанию:

- web: http://localhost:3000
- api: http://localhost:3002 (Swagger: http://localhost:3002/docs)

## Демо-сценарий

Короткий сценарий защиты описан в `docs/DEMO.md`. Вкратце:

1. Открыть Swagger и показать контракт API.
2. Создать тикет с веб-страницы `/tickets`.
3. Убедиться в логах Audit/Notifications и в realtime-обновлении списка.
4. Назначить агента, сменить статус, добавить комментарий.
5. Показать SLA и (при необходимости) быстро вызвать breach.
6. Запустить `bun run smoke`.

## Документация

- `docs/REQUIREMENTS.md` — требования и роли.
- `docs/ARCHITECTURE.md` — архитектура и модули.
- `docs/API_CONTRACT.md` — контракт API.
- `docs/TRACEABILITY_PC.md` — трассируемость ПК 2.1–2.5.
- `docs/DEBUGGING.md` — отладка и логи.
- `docs/TEST_PLAN.md` — план тестирования.
- `docs/ENVIRONMENT.md` — окружение и порты.

## Команды качества

```bash
bun run format:check
bun run lint
bun run test
bun run smoke
```

Дополнительно:

```bash
bun run typecheck
```

## Частые проблемы

- Порты заняты: измените `PORT` в `apps/api/.env` и `NEXT_PUBLIC_API_BASE` в `apps/web/.env`.
- CORS: `WEB_ORIGIN` в `apps/api/.env` должен совпадать с адресом web.
- Не работает вход: проверьте `JWT_SECRET` и cookie `sd_token` (см. `docs/DEBUGGING.md`).
- Ошибки переменных окружения: сверяйтесь с `apps/api/.env.example` и `apps/web/.env.example`.

## Структура

- `apps/web` — фронтенд на Next.js (App Router, TypeScript)
- `apps/api` — бэкенд на NestJS (TypeScript)
- `packages/shared` — общие DTO/типы (импорт через `@servicedesk/shared`)
