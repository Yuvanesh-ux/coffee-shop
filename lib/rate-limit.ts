/**
 * In-memory rate limiter for authentication endpoints.
 * Tracks attempts by key (IP address or email) and enforces
 * configurable limits within a sliding time window.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RateLimiterOptions {
  /** Maximum number of attempts allowed within the window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxAttempts = options.maxAttempts;
    this.windowMs = options.windowMs;

    // Periodically clean up expired entries to prevent memory leaks
    setInterval(() => this.cleanup(), this.windowMs * 2).unref();
  }

  /**
   * Check if a key is rate limited. Returns true if the request should be blocked.
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      return false;
    }

    // If the window has expired, reset
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.delete(key);
      return false;
    }

    return entry.count >= this.maxAttempts;
  }

  /**
   * Record an attempt for a key.
   */
  recordAttempt(key: string): void {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now - entry.firstAttempt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    } else {
      entry.count++;
      entry.lastAttempt = now;
    }
  }

  /**
   * Get remaining attempts for a key.
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now - entry.firstAttempt > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - entry.count);
  }

  /**
   * Get time until the window resets for a key (in seconds).
   */
  getRetryAfter(key: string): number {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      return 0;
    }

    const elapsed = now - entry.firstAttempt;
    const remaining = this.windowMs - elapsed;
    return Math.ceil(Math.max(0, remaining) / 1000);
  }

  /**
   * Reset attempts for a key (e.g., after successful login).
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clean up expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    this.attempts.forEach((entry, key) => {
      if (now - entry.firstAttempt > this.windowMs) {
        this.attempts.delete(key);
      }
    });
  }
}

// Rate limiter for login attempts per IP address
// Allow 5 attempts per 15-minute window per IP
export const loginRateLimiterByIP = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

// Rate limiter for login attempts per email/account
// Allow 5 attempts per 15-minute window per account
export const loginRateLimiterByEmail = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});
