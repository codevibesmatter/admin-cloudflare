import { createClerkClient } from '@clerk/backend'
import * as dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required')
}

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY })

async function main() {
  const { data: users } = await clerk.users.getUserList()
  for (const user of users) {
    await clerk.users.deleteUser(user.id)
  }

  const { data: orgs } = await clerk.organizations.getOrganizationList()
  for (const org of orgs) {
    await clerk.organizations.deleteOrganization(org.id)
  }
}

main().catch(console.error) 