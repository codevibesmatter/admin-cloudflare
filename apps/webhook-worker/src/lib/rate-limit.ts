export class RateLimit {
  private cache: Map<string, number[]> = new Map()
  private readonly window: number
  private readonly limit: number

  constructor(options?: { window?: number; limit?: number }) {
    this.window = options?.window ?? 60 * 1000 // 1 minute default
    this.limit = options?.limit ?? 100 // 100 requests per window default
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const timestamps = this.cache.get(key) || []
    
    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < this.window)
    
    if (recent.length >= this.limit) return false
    
    recent.push(now)
    this.cache.set(key, recent)
    return true
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, timestamps] of this.cache.entries()) {
      const recent = timestamps.filter(t => now - t < this.window)
      if (recent.length === 0) {
        this.cache.delete(key)
      } else if (recent.length !== timestamps.length) {
        this.cache.set(key, recent)
      }
    }
  }
} 