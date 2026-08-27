/**
 * PostEx Enterprise Rate Limiter
 * Enforces security throttling on authentication and OTP verification endpoints.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  /**
   * Checks if an identifier is locked
   */
  public isLocked(key: string): { locked: boolean; remainingSeconds: number } {
    const entry = this.store.get(key);
    if (!entry || !entry.lockedUntil) {
      return { locked: false, remainingSeconds: 0 };
    }

    const now = Date.now();
    if (now < entry.lockedUntil) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    // Lock expired, reset
    entry.lockedUntil = null;
    entry.attempts = 0;
    return { locked: false, remainingSeconds: 0 };
  }

  /**
   * Records a failed attempt. If threshold is exceeded, triggers lockout.
   */
  public recordFailure(
    key: string,
    maxAttempts: number = 5,
    lockoutDurationMinutes: number = 15
  ): { attempts: number; isNowLocked: boolean; remainingAttempts: number; lockedForSeconds: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry) {
      entry = {
        attempts: 1,
        firstAttemptAt: now,
        lockedUntil: null,
        lastAttemptAt: now
      };
      this.store.set(key, entry);
    } else {
      // If previous window was more than lockout duration ago, reset
      if (now - entry.lastAttemptAt > lockoutDurationMinutes * 60 * 1000) {
        entry.attempts = 1;
        entry.firstAttemptAt = now;
        entry.lockedUntil = null;
      } else {
        entry.attempts += 1;
      }
      entry.lastAttemptAt = now;
    }

    if (entry.attempts >= maxAttempts) {
      entry.lockedUntil = now + lockoutDurationMinutes * 60 * 1000;
      return {
        attempts: entry.attempts,
        isNowLocked: true,
        remainingAttempts: 0,
        lockedForSeconds: lockoutDurationMinutes * 60
      };
    }

    return {
      attempts: entry.attempts,
      isNowLocked: false,
      remainingAttempts: Math.max(0, maxAttempts - entry.attempts),
      lockedForSeconds: 0
    };
  }

  /**
   * Resets rate limit for key after successful login
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Gets current state for diagnostic inspection
   */
  public getState(key: string) {
    return this.store.get(key) || null;
  }
}

export const authRateLimiter = new InMemoryRateLimiter();
export const otpRateLimiter = new InMemoryRateLimiter();
