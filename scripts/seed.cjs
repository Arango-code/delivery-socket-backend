require("dotenv/config");
const bcrypt = require("bcryptjs");
const { prisma } = require("../dist/lib/prisma");

async function restaurant(name) {
  return (await prisma.restaurants.findFirst({ where: { name } })) ??
    prisma.restaurants.create({
      data: { name, address: "Dirección ficticia para la demo" },
    });
}

async function category(restaurantId) {
  return (await prisma.categories.findFirst({
    where: { restaurant_id: restaurantId, name: "Pizzas" },
  })) ?? prisma.categories.create({
    data: { restaurant_id: restaurantId, name: "Pizzas" },
  });
}

async function product(restaurantId, categoryId, name, price) {
  return (await prisma.products.findFirst({
    where: { restaurant_id: restaurantId, name },
  })) ?? prisma.products.create({
    data: {
      restaurant_id: restaurantId,
      category_id: categoryId,
      name,
      price,
      is_available: true,
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("La carga de datos de ejemplo está deshabilitada en producción");
  }
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Define DEMO_PASSWORD con al menos 12 caracteres antes de ejecutar el seed");
  }

  const north = await restaurant("Demo Pizzeria Norte");
  const south = await restaurant("Demo Pizzeria Sur");
  const northCategory = await category(north.restaurant_id);
  const southCategory = await category(south.restaurant_id);
  const northProduct = await product(north.restaurant_id, northCategory.category_id, "Margherita", "12.50");
  await product(south.restaurant_id, southCategory.category_id, "Pepperoni", "15.00");
  const client = (await prisma.clients.findFirst({
    where: { session_id: "demo-client-session" },
  })) ?? await prisma.clients.create({
    data: { name: "Cliente Demo", session_id: "demo-client-session" },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  for (const [username, restaurantId, admin] of [
    ["demo_north", north.restaurant_id, false],
    ["demo_south", south.restaurant_id, false],
    ["demo_admin", null, true],
  ]) {
    await prisma.usuario.upsert({
      where: { username },
      update: { password: passwordHash, restaurant_id: restaurantId, is_super_admin: admin, is_active: true },
      create: { username, password: passwordHash, restaurant_id: restaurantId, is_super_admin: admin, is_active: true },
    });
  }

  console.log(JSON.stringify({
    users: ["demo_north", "demo_south", "demo_admin"],
    northRestaurantId: north.restaurant_id,
    southRestaurantId: south.restaurant_id,
    northProductId: northProduct.product_id,
    clientId: client.client_id,
  }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
