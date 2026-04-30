import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { query } from "./db";

export interface User {
  id: number;
  email: string;
  role: string;
}

// Use a cryptographically random ephemeral secret if JWT_SECRET is not configured
// or is too short. This ensures that even if the env var is missing, tokens cannot
// be forged with a known secret. Note: tokens will be invalidated on restart when
// using the ephemeral secret.
const JWT_SECRET_VALUE: string = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
  ? process.env.JWT_SECRET
  : crypto.randomBytes(64).toString("hex");

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
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET_VALUE,
    { expiresIn: "24h" }
  );
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALUE) as {
      id: number;
      email: string;
      role: string;
    };

    // Validate that the user actually exists in the database
    // and that their role matches the token claims
    const result = await query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.id]
    );
    const dbUser = result.rows[0];

    if (!dbUser) {
      return null;
    }

    // Return the database user data, not the token claims
    // This prevents privilege escalation via forged role claims
    return { id: dbUser.id, email: dbUser.email, role: dbUser.role };
  } catch {
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
