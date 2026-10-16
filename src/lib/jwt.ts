import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

const key = new TextEncoder().encode(env.JWT_SECRET);

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  restaurantId: number | null;
}

export async function encrypt(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function createConfirmationToken(
  orderId: number,
  clientId: number
): Promise<string> {
  return new SignJWT({ clientId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(orderId))
    .setAudience("order-confirmation")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyConfirmationToken(
  token: string,
  orderId: number,
  clientId: number
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      audience: "order-confirmation",
    });
    return payload.sub === String(orderId) && payload.clientId === clientId;
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(plain, hashed);
}
