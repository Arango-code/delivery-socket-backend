import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";

export class ProductsService {
  async getProducts(
    restaurantId: number,
    filters?: { categoryId?: number; available?: boolean; search?: string }
  ) {
    const where: any = { restaurant_id: restaurantId };

    if (filters?.categoryId) {
      where.category_id = filters.categoryId;
    }
    if (filters?.available !== undefined) {
      where.is_available = filters.available;
    }
    if (filters?.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    return prisma.products.findMany({
      where,
      include: {
        categories: { select: { category_id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async getProductById(productId: number, restaurantId: number) {
    const product = await prisma.products.findFirst({
      where: { product_id: productId, restaurant_id: restaurantId },
      include: {
        categories: { select: { category_id: true, name: true } },
      },
    });

    if (!product) {
      throw new AppError("Producto no encontrado", 404);
    }

    return product;
  }

  async createProduct(
    restaurantId: number,
    data: {
      name: string;
      description?: string | null;
      price?: number | null;
      category_id: number;
      is_available?: boolean;
      preparation_time?: number | null;
    }
  ) {
    const category = await prisma.categories.findFirst({
      where: { category_id: data.category_id, restaurant_id: restaurantId },
      select: { category_id: true },
    });
    if (!category) {
      throw new AppError("La categoría no pertenece al restaurante", 400);
    }

    return prisma.products.create({
      data: {
        restaurant_id: restaurantId,
        category_id: data.category_id,
        name: data.name,
        description: data.description ?? null,
        price: data.price ?? null,
        is_available: data.is_available ?? true,
        preparation_time: data.preparation_time ?? null,
      },
      include: {
        categories: { select: { category_id: true, name: true } },
      },
    });
  }

  async updateProduct(
    productId: number,
    restaurantId: number,
    data: {
      name?: string;
      description?: string | null;
      price?: number | null;
      category_id?: number;
      is_available?: boolean;
      preparation_time?: number | null;
    }
  ) {
    const existing = await prisma.products.findFirst({
      where: { product_id: productId, restaurant_id: restaurantId },
    });

    if (!existing) {
      throw new AppError("Producto no encontrado", 404);
    }

    if (data.category_id !== undefined) {
      const category = await prisma.categories.findFirst({
        where: { category_id: data.category_id, restaurant_id: restaurantId },
        select: { category_id: true },
      });
      if (!category) {
        throw new AppError("La categoría no pertenece al restaurante", 400);
      }
    }

    return prisma.products.update({
      where: { product_id: productId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.category_id !== undefined && { category_id: data.category_id }),
        ...(data.is_available !== undefined && { is_available: data.is_available }),
        ...(data.preparation_time !== undefined && {
          preparation_time: data.preparation_time,
        }),
        updated_at: new Date(),
      },
      include: {
        categories: { select: { category_id: true, name: true } },
      },
    });
  }

  async toggleAvailability(productId: number, restaurantId: number) {
    const product = await prisma.products.findFirst({
      where: { product_id: productId, restaurant_id: restaurantId },
    });

    if (!product) {
      throw new AppError("Producto no encontrado", 404);
    }

    return prisma.products.update({
      where: { product_id: productId },
      data: { is_available: !product.is_available, updated_at: new Date() },
    });
  }

  async deleteProduct(productId: number, restaurantId: number) {
    const product = await prisma.products.findFirst({
      where: { product_id: productId, restaurant_id: restaurantId },
    });

    if (!product) {
      throw new AppError("Producto no encontrado", 404);
    }

    await prisma.products.delete({ where: { product_id: productId } });
    return { message: "Producto eliminado" };
  }
}

export const productsService = new ProductsService();
