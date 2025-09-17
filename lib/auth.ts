import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "./db";

export interface User {
  id: number;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function verifyToken(token: string): User | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }
    return jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as User;
  } catch (e) {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    "SELECT id, email, role FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  return { id: user.id, email: user.email, role: user.role };
}
