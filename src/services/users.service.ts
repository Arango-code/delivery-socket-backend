import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/jwt";
import { AppError } from "../middlewares/error.middleware";

export class UsersService {
  async getAll() {
    const users = await prisma.usuario.findMany({
      include: { restaurants: { select: { restaurant_id: true, name: true } } },
      orderBy: { username: "asc" },
    });

    return users.map(({ password: _, ...user }) => user);
  }

  async getByRestaurant(restaurantId: number) {
    const users = await prisma.usuario.findMany({
      where: { restaurant_id: restaurantId },
      include: { restaurants: { select: { restaurant_id: true, name: true } } },
      orderBy: { username: "asc" },
    });

    return users.map(({ password: _, ...user }) => user);
  }

  async update(
    userId: number,
    data: {
      username?: string;
      password?: string;
      restaurant_id?: number | null;
      rol?: string | null;
    }
  ) {
    const existing = await prisma.usuario.findUnique({
      where: { usuario_id: userId },
    });

    if (!existing) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const updateData: any = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.password !== undefined) {
      updateData.password = await hashPassword(data.password);
    }
    if (data.restaurant_id !== undefined) updateData.restaurant_id = data.restaurant_id;
    if (data.rol !== undefined) updateData.rol = data.rol;

    const updated = await prisma.usuario.update({
      where: { usuario_id: userId },
      data: updateData,
      include: { restaurants: { select: { restaurant_id: true, name: true } } },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async toggleActive(userId: number) {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: userId },
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const updated = await prisma.usuario.update({
      where: { usuario_id: userId },
      data: { is_active: !user.is_active },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}

export const usersService = new UsersService();
