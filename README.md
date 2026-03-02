# ThingWorx Studio Monorepo

## Run
1. `cp .env.example .env`
2. `docker compose -f infra/docker-compose.yml up -d`
3. `pnpm install`
4. `pnpm dev`

## Scripts
- `pnpm dev`
- `pnpm test`
- `pnpm test:integration`
- `pnpm coverage`
- `pnpm eval`
- `pnpm build`

## Structure
- `apps/desktop` Electron + React
- `apps/api` NestJS API + mock ThingWorx
- `packages/shared` zod schemas/types
- `packages/metering` offline metering queue SDK
