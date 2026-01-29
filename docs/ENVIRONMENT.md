# ENVIRONMENT

## Версии

- bun: >= 1.1 (проверено на 1.3.5)
- Node.js: >= 20 (проверено на 24.13.0)

## OS

- Проверено на Windows 10/11 (PowerShell). Для macOS/Linux команды аналогичные.

## Порты по умолчанию

- Web: http://localhost:3000
- API: http://localhost:3002 (Swagger: http://localhost:3002/docs)

## Переменные окружения

Web (`apps/web/.env`):

- `NEXT_PUBLIC_API_BASE` — базовый URL API (например, `http://localhost:3002/api`).

API (`apps/api/.env`):

- `PORT` — порт API.
- `WEB_ORIGIN` — origin для CORS (например, `http://localhost:3000`).
- `DATABASE_URL` — SQLite файл (`file:./dev.db`).
- `JWT_SECRET` — секрет для подписи токенов.

Шаблоны:

- `apps/web/.env.example`
- `apps/api/.env.example`

## Быстрая проверка работоспособности

```bash
bun run smoke
```

Если smoke упал:

- Проверьте порты и переменные окружения.
- Запустите `bun run build:shared` вручную.
