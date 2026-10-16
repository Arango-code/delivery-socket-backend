import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";

export class CategoriesService {
  async getCategories(restaurantId: number) {
    return prisma.categories.findMany({
      where: { restaurant_id: restaurantId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createCategory(
    restaurantId: number,
    data: { name: string; description?: string | null }
  ) {
    return prisma.categories.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        restaurant_id: restaurantId,
      },
    });
  }

  async updateCategory(
    categoryId: number,
    restaurantId: number,
    data: { name?: string; description?: string | null }
  ) {
    const existing = await prisma.categories.findFirst({
      where: { category_id: categoryId, restaurant_id: restaurantId },
    });

    if (!existing) {
      throw new AppError("Categoría no encontrada", 404);
    }

    return prisma.categories.update({
      where: { category_id: categoryId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async deleteCategory(categoryId: number, restaurantId: number) {
    const existing = await prisma.categories.findFirst({
      where: { category_id: categoryId, restaurant_id: restaurantId },
    });

    if (!existing) {
      throw new AppError("Categoría no encontrada", 404);
    }

    const productCount = await prisma.products.count({
      where: { category_id: categoryId },
    });

    if (productCount > 0) {
      throw new AppError(
        "No se puede eliminar la categoría porque tiene productos asociados",
        400
      );
    }

    await prisma.categories.delete({ where: { category_id: categoryId } });
    return { message: "Categoría eliminada" };
  }
}

export const categoriesService = new CategoriesService();
