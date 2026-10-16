require("dotenv/config");
const { randomUUID } = require("node:crypto");
const { io } = require("socket.io-client");
const { prisma } = require("../dist/lib/prisma");

const baseUrl = process.env.DEMO_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4000}`;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path}: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function waitForEvent(socket, eventName) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No llegó ${eventName}`)), 5000);
    socket.once(eventName, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, { auth: { token }, transports: ["websocket"], timeout: 5000 });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => { socket.disconnect(); reject(error); });
  });
}

async function main() {
  if (!process.env.DEMO_PASSWORD || !process.env.WEBHOOK_API_KEY) {
    throw new Error("Define DEMO_PASSWORD y WEBHOOK_API_KEY en el entorno");
  }
  const restaurant = await prisma.restaurants.findFirst({
    where: { name: "Demo Pizzeria Norte" },
  });
  const product = await prisma.products.findFirst({
    where: { restaurant_id: restaurant?.restaurant_id, name: "Margherita" },
  });
  const client = await prisma.clients.findFirst({
    where: { session_id: "demo-client-session" },
  });
  const northUser = await prisma.usuario.findUnique({ where: { username: "demo_north" } });
  const northCategory = await prisma.categories.findFirst({
    where: { restaurant_id: restaurant?.restaurant_id, name: "Pizzas" },
  });
  if (!restaurant || !product || !client || !northUser || !northCategory) {
    throw new Error("Faltan datos demo. Ejecuta npm run db:seed primero");
  }

  const login = async (username) => {
    const result = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password: process.env.DEMO_PASSWORD }),
    });
    return result.token;
  };
  const northToken = await login("demo_north");
  const southToken = await login("demo_south");
  const northSocket = await connect(northToken);
  const southSocket = await connect(southToken);

  try {
    const newOrderEvent = waitForEvent(northSocket, "order:new");
    const orderPayload = {
      external_id: randomUUID(),
      restaurant_id: restaurant.restaurant_id,
      client_id: client.client_id,
      order_items: [{ product_id: product.product_id, quantity: 2 }],
    };
    const order = await request("/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-key": process.env.WEBHOOK_API_KEY,
      },
      body: JSON.stringify(orderPayload),
    });
    const eventOrder = await newOrderEvent;
    if (eventOrder.order_id !== order.order_id || Number(order.subtotal) !== 25) {
      throw new Error("El evento o el subtotal no coinciden con el pedido creado");
    }
    const repeated = await request("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-key": process.env.WEBHOOK_API_KEY },
      body: JSON.stringify(orderPayload),
    });
    if (repeated.order_id !== order.order_id) {
      throw new Error("El webhook duplicado creó otro pedido");
    }

    const unauthorizedRead = await fetch(`${baseUrl}/api/orders/${order.order_id}`, {
      headers: { authorization: `Bearer ${southToken}` },
    });
    if (unauthorizedRead.status !== 404) {
      throw new Error(`Aislamiento HTTP falló: ${unauthorizedRead.status}`);
    }
    const unauthorizedUserEdit = await fetch(`${baseUrl}/api/users/${northUser.usuario_id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Bearer ${southToken}` },
      body: JSON.stringify({ username: "should_not_change" }),
    });
    if (unauthorizedUserEdit.status !== 403) {
      throw new Error(`Permiso de edición de usuarios falló: ${unauthorizedUserEdit.status}`);
    }
    const unauthorizedRestaurantEdit = await fetch(`${baseUrl}/api/restaurants/${restaurant.restaurant_id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Bearer ${southToken}` },
      body: JSON.stringify({ name: "should_not_change" }),
    });
    if (unauthorizedRestaurantEdit.status !== 403) {
      throw new Error(`Permiso de edición de restaurantes falló: ${unauthorizedRestaurantEdit.status}`);
    }
    const crossTenantProduct = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${southToken}` },
      body: JSON.stringify({ name: "should_not_create", category_id: northCategory.category_id, price: 1 }),
    });
    if (crossTenantProduct.status !== 400) {
      throw new Error(`Validación de categoría entre restaurantes falló: ${crossTenantProduct.status}`);
    }
    const forbiddenJoin = await southSocket.timeout(5000).emitWithAck("join:order", order.order_id);
    if (forbiddenJoin.ok !== false) {
      throw new Error("Aislamiento Socket.IO falló");
    }
    const allowedJoin = await northSocket.timeout(5000).emitWithAck("join:order", order.order_id);
    if (allowedJoin.ok !== true) {
      throw new Error("El restaurante propietario no pudo unirse al pedido");
    }

    const priced = await request(`/api/orders/${order.order_id}/delivery-fee`, {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Bearer ${northToken}` },
      body: JSON.stringify({ delivery_fee: 2.5 }),
    });
    if (Number(priced.total_amount) !== 27.5) {
      throw new Error("El total con entrega no coincide");
    }
    const wrongConfirmation = await fetch(`${baseUrl}/api/orders/${order.order_id}/confirm`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "confirm", confirmation_token: "invalid" }),
    });
    if (wrongConfirmation.status !== 403) {
      throw new Error(`Token de confirmación inválido fue aceptado: ${wrongConfirmation.status}`);
    }
    const confirmedEvent = waitForEvent(northSocket, "order:confirmed");
    const confirmed = await request(`/api/orders/${order.order_id}/confirm`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "confirm", confirmation_token: order.confirmation_token }),
    });
    await confirmedEvent;
    if (confirmed.status !== "CONFIRMED") {
      throw new Error("La confirmación no cambió el estado del pedido");
    }

    console.log(`Demo correcta: pedido ${order.order_id}, subtotal 25.00, total 27.50.`);
    console.log("Verificados: webhook/idempotencia, cálculo servidor, Socket.IO, permisos entre restaurantes y confirmación.");
  } finally {
    northSocket.disconnect();
    southSocket.disconnect();
  }
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
