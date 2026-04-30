import { NextRequest } from "next/server";
import { verifyToken, User } from "./auth";

export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value;
  return token || null;
}

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  return verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<User> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}
