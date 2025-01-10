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

/**
 * Generate a URL-friendly slug from a string
 * @param str The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and _ with -
    .replace(/^-+|-+$/g, '') // Remove leading/trailing -
} 