import { useState, useCallback } from 'react'
import { checkRateLimit, recordFailedAttempt, resetRateLimit, RateLimitResult } from '@/lib/rateLimiter'

interface UseRateLimitOptions {
  action: string
  identifier: string
  maxAttempts?: number
  windowMs?: number
  onBlocked?: (result: RateLimitResult) => void
  onWarning?: (result: RateLimitResult) => void
}

interface UseRateLimitReturn {
  isBlocked: boolean
  remainingAttempts: number
  message?: string
  checkLimit: () => RateLimitResult
  recordFailure: () => void
  reset: () => void
  executeWithRateLimit: <T>(
    fn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: any) => void
  ) => Promise<T | null>
}

export const useRateLimit = ({
  action,
  identifier,
  onBlocked,
  onWarning
}: UseRateLimitOptions): UseRateLimitReturn => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitResult>(() => 
    checkRateLimit(action, identifier)
  )

  const checkLimit = useCallback((): RateLimitResult => {
    const result = checkRateLimit(action, identifier)
    setRateLimitState(result)
    
    if (!result.allowed && onBlocked) {
      onBlocked(result)
    } else if (result.allowed && result.remainingAttempts <= 2 && onWarning) {
      onWarning(result)
    }
    
    return result
  }, [action, identifier, onBlocked, onWarning])

  const recordFailure = useCallback(() => {
    recordFailedAttempt(action, identifier)
    const newState = checkRateLimit(action, identifier)
    setRateLimitState(newState)
    
    if (!newState.allowed && onBlocked) {
      onBlocked(newState)
    }
  }, [action, identifier, onBlocked])

  const reset = useCallback(() => {
    resetRateLimit(action, identifier)
    const newState = checkRateLimit(action, identifier)
    setRateLimitState(newState)
  }, [action, identifier])

  const executeWithRateLimit = useCallback(async <T>(
    fn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: any) => void
  ): Promise<T | null> => {
    // Check rate limit before executing
    const limitResult = checkLimit()
    
    if (!limitResult.allowed) {
      const error = new Error(limitResult.message || 'Rate limit exceeded')
      if (onError) {
        onError(error)
      }
      return null
    }

    try {
      const result = await fn()
      
      // Success - reset rate limit for this action
      reset()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      // Record failed attempt
      recordFailure()
      
      if (onError) {
        onError(error)
      }
      
      throw error
    }
  }, [checkLimit, recordFailure, reset])

  return {
    isBlocked: !rateLimitState.allowed,
    remainingAttempts: rateLimitState.remainingAttempts,
    message: rateLimitState.message,
    checkLimit,
    recordFailure,
    reset,
    executeWithRateLimit
  }
}