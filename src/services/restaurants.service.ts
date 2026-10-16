import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";

export class RestaurantsService {
  async getAll() {
    return prisma.restaurants.findMany({
      include: { _count: { select: { orders: true, products: true, usuarios: true } } },
      orderBy: { name: "asc" },
    });
  }

  async getById(restaurantId: number) {
    const restaurant = await prisma.restaurants.findUnique({
      where: { restaurant_id: restaurantId },
    });

    if (!restaurant) {
      throw new AppError("Restaurante no encontrado", 404);
    }

    return restaurant;
  }

  async getByName(name: string) {
    const restaurant = await prisma.restaurants.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: {
        restaurant_id: true,
        name: true,
        delivery_areas: true,
        payment_methods: true,
        phone: true,
        address: true,
        pick_up_location: true,
        return_policy: true,
        cancellation_policy: true,
        delivery_rules: true,
      },
    });

    if (!restaurant) {
      throw new AppError("Restaurante no encontrado", 404);
    }

    return restaurant;
  }

  async create(data: {
    name: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    opening_time?: string | null;
    closing_time?: string | null;
    payment_methods?: string | null;
    delivery_areas?: string | null;
    pick_up_location?: string | null;
    return_policy?: string | null;
    cancellation_policy?: string | null;
    delivery_rules?: string | null;
  }) {
    return prisma.restaurants.create({ data: data as any });
  }

  async update(
    restaurantId: number,
    data: {
      name?: string;
      address?: string;
      phone?: string | null;
      email?: string | null;
      opening_time?: string | null;
      closing_time?: string | null;
      payment_methods?: string | null;
      delivery_areas?: string | null;
      pick_up_location?: string | null;
      return_policy?: string | null;
      cancellation_policy?: string | null;
      delivery_rules?: string | null;
    }
  ) {
    const existing = await prisma.restaurants.findUnique({
      where: { restaurant_id: restaurantId },
    });

    if (!existing) {
      throw new AppError("Restaurante no encontrado", 404);
    }

    return prisma.restaurants.update({
      where: { restaurant_id: restaurantId },
      data,
    });
  }
}

export const restaurantsService = new RestaurantsService();
