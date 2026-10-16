import { Prisma } from "./generated/prisma/client";
import { AppError } from "../middlewares/error.middleware";

interface RequestedItem {
  product_id: number;
  quantity: number;
  special_instructions?: string | null;
}

interface PricedProduct {
  product_id: number;
  price: Prisma.Decimal | null;
  is_available: boolean | null;
}

export function priceOrderItems(items: RequestedItem[], products: PricedProduct[]) {
  const productById = new Map(products.map((product) => [product.product_id, product]));
  const pricedItems = items.map((item) => {
    const product = productById.get(item.product_id);
    if (!product) {
      throw new AppError(`Producto ${item.product_id} no encontrado`, 400);
    }
    if (!product.is_available || product.price === null) {
      throw new AppError(`Producto ${item.product_id} no disponible`, 400);
    }

    const unitPrice = new Prisma.Decimal(product.price);
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal: unitPrice.mul(item.quantity),
      special_instructions: item.special_instructions ?? null,
    };
  });

  const subtotal = pricedItems.reduce(
    (sum, item) => sum.plus(item.subtotal),
    new Prisma.Decimal(0)
  );
  return { items: pricedItems, subtotal };
}
