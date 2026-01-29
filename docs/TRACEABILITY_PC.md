# TRACEABILITY_PC

Трассируемость по ПК 2.1–2.5. Формулировки ПК уточняются у преподавателя.

| ПК     | Доказательная база (файлы/команды)                                                                                                                                                                                                         | Статус                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| ПК 2.1 | Требования и контракт: `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, Swagger http://localhost:3002/docs                                                                                                          | есть                                               |
| ПК 2.2 | Структура данных и интеграция: `packages/shared` (DTO/типы), `apps/api/src/tickets`, `apps/api/src/comments`, `apps/api/src/sla`, `apps/api/src/audit`, `apps/api/src/notifications`, Web `/tickets` (`apps/web/src/app/tickets/page.tsx`) | частично (хранение тикетов/комментариев in-memory) |
| ПК 2.3 | Реализация и отладка: `apps/api/src/common/logging.interceptor.ts`, `apps/api/src/common/request-id.middleware.ts`, `docs/DEBUGGING.md`, логи при `bun run dev:api`                                                                        | есть                                               |
| ПК 2.4 | Тестирование: `docs/TEST_PLAN.md`, unit-тесты `apps/api/src/**/*.spec.ts`, e2e `apps/api/test/app.e2e-spec.ts`, команды `bun run test`, `bun run test:api`                                                                                 | есть                                               |
| ПК 2.5 | Стандарты и инспектирование: `docs/CODING_STANDARDS.md`, `.prettierrc`, `.prettierignore`, `apps/web/eslint.config.mjs`, `apps/api/eslint.config.mjs`, команды `bun run lint`, `bun run format:check`, `bun run typecheck`                 | есть                                               |

## План улучшения (для частичных пунктов)

ПК 2.2:

- Добавить репозитории и реальную персистентность для тикетов/комментариев.
- Обновить `docs/API_CONTRACT.md` и `docs/TRACEABILITY_PC.md` после миграций.
