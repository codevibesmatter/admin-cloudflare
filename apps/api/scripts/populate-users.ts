import { drizzle } from 'drizzle-orm/d1'
import { users, UserRole, UserStatus } from '../src/db'
import { v4 as uuidv4 } from 'uuid'

// Helper function to generate random mock data
function generateMockUser(index: number) {
  const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Emma', 'William', 'Olivia']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  const domains = ['example.com', 'test.com', 'mockdata.com', 'demo.org', 'sample.net']
  const roles = Object.values(UserRole)
  const statuses = Object.values(UserStatus)
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const role = roles[Math.floor(Math.random() * roles.length)] as UserRole
  const status = statuses[Math.floor(Math.random() * statuses.length)] as UserStatus
  
  const now = new Date().toISOString()
  
  return {
    id: uuidv4(),
    firstName,
    lastName,
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`,
    role,
    status,
    createdAt: now,
    updatedAt: now,
  }
}

// Helper function to insert users in batches
async function insertUsersBatch(db: any, mockUsers: any[]) {
  const batchSize = 5 // D1 SQLite seems to have a lower variable limit
  for (let i = 0; i < mockUsers.length; i += batchSize) {
    const batch = mockUsers.slice(i, i + batchSize)
    await db.insert(users).values(batch)
    console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(mockUsers.length / batchSize)}`)
  }
}

// Main function to populate users
export default {
  async fetch(request: Request, env: any) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      })
    }
    
    const db = drizzle(env.DB)
    
    try {
      // Delete all existing users
      console.log('Deleting existing users...')
      await db.delete(users)
      
      // Generate and insert 100 mock users
      console.log('Generating 100 mock users...')
      const mockUsers = Array.from({ length: 100 }, (_, i) => generateMockUser(i + 1))
      
      console.log('Inserting users in batches...')
      await insertUsersBatch(db, mockUsers)
      
      return new Response('Successfully populated 100 users!', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        },
      })
    } catch (error) {
      console.error('Error populating users:', error)
      return new Response('Failed to populate users', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain',
        },
      })
    }
  }
}
