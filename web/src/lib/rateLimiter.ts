interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map()
  
  private configs: Record<string, RateLimitConfig> = {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 15 * 60 * 1000 // 15 minutes block
    },
    register: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000 // 1 hour block
    },
    forgotPassword: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000 // 1 hour block
    },
    resetPassword: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 15 * 60 * 1000 // 15 minutes block
    }
  }

  private getKey(action: string, identifier: string): string {
    return `${action}:${identifier}`
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key)
      }
    }
  }

  public isBlocked(action: string, identifier: string): boolean {
    this.cleanupExpired()
    
    const config = this.configs[action]
    if (!config) return false

    const key = this.getKey(action, identifier)
    const entry = this.attempts.get(key)
    
    if (!entry) return false
    
    const now = Date.now()
    return entry.count >= config.maxAttempts && now < entry.resetTime
  }

  public recordAttempt(action: string, identifier: string): void {
    this.cleanupExpired()
    
    const config = this.configs[action]
    if (!config) return

    const key = this.getKey(action, identifier)
    const now = Date.now()
    const entry = this.attempts.get(key)

    if (!entry || now > entry.resetTime) {
      // First attempt or window expired
      this.attempts.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
    } else {
      // Increment attempt count
      entry.count++
      if (entry.count >= config.maxAttempts) {
        // Block user - extend reset time
        entry.resetTime = now + config.blockDurationMs
      }
    }
  }

  public getRemainingTime(action: string, identifier: string): number {
    const key = this.getKey(action, identifier)
    const entry = this.attempts.get(key)
    
    if (!entry) return 0
    
    const now = Date.now()
    return Math.max(0, entry.resetTime - now)
  }

  public getAttemptCount(action: string, identifier: string): number {
    const key = this.getKey(action, identifier)
    const entry = this.attempts.get(key)
    return entry?.count || 0
  }

  public getRemainingAttempts(action: string, identifier: string): number {
    const config = this.configs[action]
    if (!config) return Infinity
    
    const currentAttempts = this.getAttemptCount(action, identifier)
    return Math.max(0, config.maxAttempts - currentAttempts)
  }

  public reset(action: string, identifier: string): void {
    const key = this.getKey(action, identifier)
    this.attempts.delete(key)
  }

  public formatRemainingTime(ms: number): string {
    const minutes = Math.ceil(ms / (60 * 1000))
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    const hours = Math.ceil(minutes / 60)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
}

export const rateLimiter = new RateLimiter()

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime?: number
  message?: string
}

export const checkRateLimit = (action: string, identifier: string): RateLimitResult => {
  const isBlocked = rateLimiter.isBlocked(action, identifier)
  
  if (isBlocked) {
    const remainingTime = rateLimiter.getRemainingTime(action, identifier)
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: Date.now() + remainingTime,
      message: `Too many attempts. Please try again in ${rateLimiter.formatRemainingTime(remainingTime)}.`
    }
  }

  const remainingAttempts = rateLimiter.getRemainingAttempts(action, identifier)
  return {
    allowed: true,
    remainingAttempts,
    message: remainingAttempts <= 2 ? `${remainingAttempts} attempts remaining` : undefined
  }
}

export const recordFailedAttempt = (action: string, identifier: string): void => {
  rateLimiter.recordAttempt(action, identifier)
}

export const resetRateLimit = (action: string, identifier: string): void => {
  rateLimiter.reset(action, identifier)
}