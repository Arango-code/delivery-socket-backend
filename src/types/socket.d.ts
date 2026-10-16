import { OrderWithRelations } from "./models";

export interface ServerToClientEvents {
  "order:new": (order: OrderWithRelations) => void;
  "order:updated": (order: OrderWithRelations) => void;
  "order:waiting-confirmation": (order: OrderWithRelations) => void;
  "order:confirmed": (order: OrderWithRelations) => void;
  "order:cancelled": (order: OrderWithRelations) => void;
}

export interface ClientToServerEvents {
  "join:order": (
    orderId: number,
    acknowledge?: (result: { ok: boolean; error?: string }) => void
  ) => void;
  "leave:order": (orderId: number) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: {
    id: number;
    username: string;
    role: string;
    restaurantId: number | null;
  };
}
