import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Prisma } from "../lib/generated/prisma/client";
import { canAccessRestaurant } from "../lib/authorization";
import { priceOrderItems } from "../lib/order-pricing";

process.env.DATABASE_URL ??= "postgresql://demo:demo@127.0.0.1:59999/demo";
process.env.JWT_SECRET ??= "test-jwt-secret-with-at-least-32-characters";
process.env.WEBHOOK_API_KEY ??= "test-webhook-key-with-at-least-32-characters";

test("un usuario solo accede a su restaurante; el admin puede acceder a todos", () => {
  assert.equal(canAccessRestaurant({ role: "user", restaurantId: 1 }, 1), true);
  assert.equal(canAccessRestaurant({ role: "user", restaurantId: 1 }, 2), false);
  assert.equal(canAccessRestaurant({ role: "admin", restaurantId: null }, 2), true);
});

test("los importes se calculan con precios del servidor y decimales", () => {
  const result = priceOrderItems(
    [{ product_id: 10, quantity: 3 }],
    [{ product_id: 10, price: new Prisma.Decimal("12.50"), is_available: true }]
  );
  assert.equal(result.items[0].unit_price.toString(), "12.5");
  assert.equal(result.subtotal.toFixed(2), "37.50");
  assert.throws(
    () => priceOrderItems([{ product_id: 99, quantity: 1 }], []),
    /no encontrado/
  );
  assert.throws(
    () => priceOrderItems(
      [{ product_id: 10, quantity: 1 }],
      [{ product_id: 10, price: new Prisma.Decimal("12.50"), is_available: false }]
    ),
    /no disponible/
  );
});

test("el token de confirmación queda limitado al pedido y cliente", async () => {
  const { createConfirmationToken, verifyConfirmationToken } = require("../lib/jwt") as typeof import("../lib/jwt");
  const token = await createConfirmationToken(17, 4);
  assert.equal(await verifyConfirmationToken(token, 17, 4), true);
  assert.equal(await verifyConfirmationToken(token, 18, 4), false);
  assert.equal(await verifyConfirmationToken(token, 17, 5), false);
  assert.equal(await verifyConfirmationToken("invalido", 17, 4), false);
});

test("el webhook rechaza solicitudes sin clave antes de usar la base de datos", async () => {
  const { app } = require("../app") as typeof import("../app");
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;

  try {
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);

    const unauthorized = await fetch(`http://127.0.0.1:${port}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(unauthorized.status, 401);

    const invalidBody = await fetch(`http://127.0.0.1:${port}/api/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-key": process.env.WEBHOOK_API_KEY!,
      },
      body: "{}",
    });
    assert.equal(invalidBody.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
});
