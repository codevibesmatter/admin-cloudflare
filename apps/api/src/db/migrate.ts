import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { neon } from '@neondatabase/serverless'
import loadEnv from '../utils/load-env'

// Load environment variables from .dev.vars
loadEnv()

const runMigrations = async () => {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('Database connection string is required')
  }

  const sql = neon(process.env.NEON_DATABASE_URL) as any
  const db = drizzle(sql)

  console.log('Running migrations...')

  await migrate(db, { migrationsFolder: './src/db/migrations' })

  console.log('Migrations completed')
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
}) 