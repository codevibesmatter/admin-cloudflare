/**
 * Generates a random ID string using crypto.getRandomValues
 * @returns A random string of 10 characters
 */
export function generateId(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
} 