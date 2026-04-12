import { createMiddleware } from 'hono/factory'

type RateLimitStore = Map<string, { count: number; resetAt: number }>

// In-memory store for rate limiting (production should use Redis)
const store: RateLimitStore = new Map()

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  message?: string
}

/**
 * Rate limiting middleware
 * 
 * @param options - Configuration options
 * @param options.maxRequests - Maximum number of requests allowed in the window
 * @param options.windowMs - Time window in milliseconds
 * @param options.message - Custom error message when limit is exceeded
 */
export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs, message = 'Too many requests, please try again later' } = options

  return createMiddleware(async (c, next) => {
    // Get user ID or IP address as identifier
    const user = c.get('user')
    const identifier = user?.id || c.req.raw.headers.get('x-forwarded-for') || 'anonymous'
    
    const key = `ratelimit:${identifier}:${c.req.path}`
    const now = Date.now()
    
    const record = store.get(key)
    
    if (!record || now > record.resetAt) {
      // Create new window
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
    } else {
      // Increment counter
      record.count++
      
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000)
        
        // Set retry-after header
        c.header('Retry-After', String(retryAfter))
        c.header('X-RateLimit-Limit', String(maxRequests))
        c.header('X-RateLimit-Remaining', '0')
        c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)))
        
        return c.json({ error: message }, 429)
      }
      
      store.set(key, record)
    }
    
    const currentRecord = store.get(key)!
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(maxRequests - currentRecord.count))
    c.header('X-RateLimit-Reset', String(Math.ceil(currentRecord.resetAt / 1000)))
    
    await next()
  })
}

/**
 * Cleanup old entries from the store periodically
 * Call this function every few minutes in production
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetAt) {
      store.delete(key)
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
