import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  driver: 'turso'
} satisfies Config
