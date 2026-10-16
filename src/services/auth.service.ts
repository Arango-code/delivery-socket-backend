import { prisma } from "../lib/prisma";
import { encrypt, comparePassword, hashPassword } from "../lib/jwt";
import { AppError } from "../middlewares/error.middleware";

export class AuthService {
  async login(username: string, password: string) {
    const user = await prisma.usuario.findUnique({
      where: { username },
      include: { restaurants: true },
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 401);
    }

    if (!user.is_active) {
      throw new AppError("Usuario inactivo", 403);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Contraseña incorrecta", 401);
    }

    const token = await encrypt({
      id: user.usuario_id,
      username: user.username,
      role: user.is_super_admin ? "admin" : "user",
      restaurantId: user.restaurant_id,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async register(data: {
    username: string;
    password: string;
    restaurant_id?: number | null;
    is_super_admin?: boolean;
    rol?: string | null;
  }) {
    const existing = await prisma.usuario.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new AppError("El nombre de usuario ya está en uso", 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await prisma.usuario.create({
      data: {
        username: data.username,
        password: hashedPassword,
        restaurant_id: data.restaurant_id ?? null,
        is_super_admin: data.is_super_admin || false,
        is_active: true,
        rol: data.rol ?? null,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async getMe(userId: number) {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: userId },
      include: { restaurants: true },
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
