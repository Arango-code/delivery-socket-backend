# Delivery Events Backend

English | [Español](README.es.md)

An Express, Socket.IO, TypeScript and PostgreSQL backend for a multi-restaurant delivery workflow. A trusted automation submits an order; restaurant staff receive real-time updates, set a delivery fee, and the customer confirms or cancels with an order-specific token.

The project includes an initial database migration, local demo data, automated tests and a runnable end-to-end demo. All demo names and addresses are fictional.

## Requirements

- Node.js 22.12+ and npm
- PostgreSQL 16+ (or Docker Compose)

## Run locally

These instructions use a **new, disposable database**. Never run the demo seed or `db:push` against an existing business database.

1. Copy `.env.example` to `.env` (`cp .env.example .env` on macOS/Linux or `Copy-Item .env.example .env` in PowerShell). The included passwords and keys are **for localhost only**. Replace `JWT_SECRET`, `WEBHOOK_API_KEY` and `DEMO_PASSWORD` before any shared deployment.
2. Start PostgreSQL with `docker compose up -d db`. If Docker is unavailable, create an empty PostgreSQL database and set `DATABASE_URL` in `.env` instead.
3. Run these commands in order:

```sh
npm ci
npm run db:migrate
npm run build
npm run db:seed
npm test
npm start
```

4. In a second terminal, run `npm run demo`. It logs in as two restaurant users, creates a webhook order, receives a Socket.IO event, checks HTTP and socket tenant isolation, sets the delivery fee and confirms the order. It prints a success message or exits with an error.

The API listens on `http://localhost:4000` by default. `GET /health` only checks that the process is running; `npm run demo` verifies the database-backed workflow.

## API and trust boundaries

| Action | Endpoint / event | Authentication |
| --- | --- | --- |
| Staff login | `POST /api/auth/login` | Username and password |
| Create order | `POST /api/orders` | `x-webhook-key` header; server-to-server only |
| List or read orders | `GET /api/orders`, `GET /api/orders/:id` | Staff JWT; scoped to restaurant |
| Set delivery fee | `PUT /api/orders/:id/delivery-fee` | Staff JWT; owning restaurant |
| Confirm or cancel | `PUT /api/orders/:id/confirm` | Order-specific `confirmation_token` |
| Real-time staff updates | Socket.IO `order:new`, `order:updated`, `order:confirmed`, `order:cancelled` | Staff JWT in `auth.token` |
| Subscribe to one order | Socket.IO `join:order` | Staff JWT; owning restaurant or admin |

The demo seed creates `demo_north`, `demo_south` and `demo_admin`, all using `DEMO_PASSWORD` from `.env`. The customer is not a Socket.IO user: the trusted automation receives `confirmation_token` from order creation and must deliver it to the correct customer through its own trusted channel. Do not expose `WEBHOOK_API_KEY` in a browser or include confirmation tokens in logs.

Example webhook payload (use IDs printed by `npm run db:seed`):

```json
{
  "external_id": "unique-id-from-the-automation",
  "restaurant_id": 1,
  "client_id": 1,
  "order_items": [{ "product_id": 1, "quantity": 2 }]
}
```

`external_id` is unique: retrying the same integration event returns the original order instead of creating a duplicate. The server looks up each product in the specified restaurant and calculates item prices and totals. The webhook cannot submit its own prices or initial status.

## Design notes

- REST and Socket.IO authenticate staff against the current database record, so disabled accounts and changed restaurant assignments do not keep working on new requests or connections.
- Order-room subscriptions are checked against the order's restaurant. A second restaurant cannot subscribe by guessing an order ID.
- Status changes use conditional database updates to reject competing transitions. Customer confirmation uses a signed, order-specific token rather than a raw session ID.
- Monetary values use PostgreSQL `Decimal(12,2)` and server-side calculations.
- `.env` and generated Prisma code are ignored by Git. Only fictional seed data is included.

This is a portfolio/demo backend, not a production deployment template. Before production use, add rate limiting, operational monitoring, HTTPS, secret rotation and a deployment-specific backup/recovery plan. The public webhook should additionally be restricted to trusted infrastructure where possible.
