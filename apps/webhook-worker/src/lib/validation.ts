export const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000 // 5 minutes

export function validateTimestamp(timestamp: string): boolean {
  const timestampMs = parseInt(timestamp, 10)
  if (isNaN(timestampMs)) return false
  
  const now = Date.now()
  return Math.abs(now - timestampMs) <= MAX_TIMESTAMP_DIFF
}

export function validateRequiredHeaders(headers: Record<string, string | null>, required: string[]): boolean {
  return required.every(header => {
    const value = headers[header]
    return value !== null && value !== undefined && value !== ''
  })
}

export function validateSignature(
  payload: string,
  signature: string | null,
  secret: string,
  verifyFn: (payload: string, signature: string, secret: string) => boolean
): boolean {
  if (!signature) return false
  try {
    return verifyFn(payload, signature, secret)
  } catch {
    return false
  }
} 