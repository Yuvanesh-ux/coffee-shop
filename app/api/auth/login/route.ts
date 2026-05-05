import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, generateToken } from "@/lib/auth";
import {
  loginRateLimiterByIP,
  loginRateLimiterByEmail,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Extract client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    // Check IP-based rate limit before processing the request
    if (loginRateLimiterByIP.isRateLimited(ip)) {
      const retryAfter = loginRateLimiterByIP.getRetryAfter(ip);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Normalize email for consistent rate limiting
    const normalizedEmail = email.toLowerCase().trim();

    // Check email/account-based rate limit
    if (loginRateLimiterByEmail.isRateLimited(normalizedEmail)) {
      const retryAfter = loginRateLimiterByEmail.getRetryAfter(normalizedEmail);
      return NextResponse.json(
        { error: "Too many login attempts for this account. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    // Record the attempt for both IP and email before authentication
    loginRateLimiterByIP.recordAttempt(ip);
    loginRateLimiterByEmail.recordAttempt(normalizedEmail);

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // On successful login, reset rate limits for this IP and email
    loginRateLimiterByIP.reset(ip);
    loginRateLimiterByEmail.reset(normalizedEmail);

    const token = generateToken(user);

    const response = NextResponse.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
