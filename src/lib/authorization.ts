export interface RestaurantPrincipal {
  role: string;
  restaurantId: number | null;
}

export function canAccessRestaurant(
  principal: RestaurantPrincipal,
  restaurantId: number
): boolean {
  return principal.role === "admin" || principal.restaurantId === restaurantId;
}
