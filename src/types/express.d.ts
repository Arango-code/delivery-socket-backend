import { UserPayload } from "./models";

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      restaurantId?: number;
    }
  }
}
