import type { Config } from 'drizzle-kit'
import loadEnv from './src/utils/load-env'

// Load environment variables
loadEnv()

// Get database URL and remove pooler if present
const dbUrl = process.env.NEON_DATABASE_URL?.replace('-pooler', '') || ''

export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: dbUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config
