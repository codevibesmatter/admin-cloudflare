import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getDB, insertUserSchema, updateUserSchema, users, UserRole, UserStatus, type Database } from '../db'
import { eq, desc, asc, and, gt, count, type SQL } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { type SQLiteColumn } from 'drizzle-orm/sqlite-core'

const app = new Hono()

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
  const role = roles[Math.floor(Math.random() * roles.length)]
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  
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

// Add some test data if none exists
app.get('/', async (c) => {
  console.log('GET /users - Fetching users')
  const db = getDB(c)
  
  try {
    // First check if we need to generate test data
    const userCount = await db.select({ value: count() }).from(users)
    
    if (userCount[0].value === 0) {
      console.log('No users found, creating test data')
      const mockUsers = Array.from({ length: 100 }, (_, i) => generateMockUser(i + 1))
      await insertUsersBatch(db, mockUsers)
      console.log('Created 100 test users')
    }
    
    const cursor = c.req.query('cursor')
    const limit = parseInt(c.req.query('limit') || '25')
    const sortField = c.req.query('sortField') || 'createdAt'
    const sortOrder = c.req.query('sortOrder') || 'desc'
    
    // Type-safe way to access columns
    const validColumns: Record<string, SQLiteColumn> = {
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: users.role,
      status: users.status,
    }
    
    let query = db.select().from(users)
    
    // Apply sorting
    const column = validColumns[sortField]
    if (column) {
      query = query.orderBy(sortOrder === 'desc' ? desc(column) : asc(column))
    }
    
    // Apply cursor-based pagination
    if (cursor) {
      const cursorValue = await db
        .select({ value: column })
        .from(users)
        .where(eq(users.id, cursor))
        .limit(1)
      
      if (cursorValue.length > 0) {
        query = query.where(gt(column, cursorValue[0].value))
      }
    }
    
    query = query.limit(limit + 1) // Get one extra to determine if there's more
    
    const userResults = await query
    
    const hasMore = userResults.length > limit
    const userList = hasMore ? userResults.slice(0, -1) : userResults
    const nextCursor = hasMore ? userList[userList.length - 1].id : undefined
    
    // Get total count
    const total = await db.select({ value: count() }).from(users)
    
    return c.json({
      users: userList,
      nextCursor,
      total: total[0].value,
    })
  } catch (error) {
    console.error('Error in GET /users:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

app.post('/populate', async (c) => {
  console.log('POST /users/populate - Populating test users')
  const db = getDB(c)
  
  try {
    // Delete all existing users
    console.log('Deleting existing users...')
    await db.delete(users)
    
    // Generate and insert 100 mock users
    console.log('Generating 100 mock users...')
    const mockUsers = Array.from({ length: 100 }, (_, i) => generateMockUser(i + 1))
    
    console.log('Inserting users in batches...')
    await insertUsersBatch(db, mockUsers)
    
    return c.json({ message: 'Successfully populated 100 users!' })
  } catch (error) {
    console.error('Error populating users:', error)
    return c.json({ error: 'Failed to populate users' }, 500)
  }
})

app.post('/', zValidator('json', insertUserSchema), async (c) => {
  console.log('POST /users - Creating new user')
  const db = getDB(c)
  const data = c.req.valid('json')
  
  try {
    const now = new Date().toISOString()
    const newUser = await db.insert(users).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning()
    
    return c.json(newUser[0])
  } catch (error) {
    console.error('Error in POST /users:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

app.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  console.log('PATCH /users/:id - Updating user')
  const db = getDB(c)
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  try {
    // Process firstName if it exists in the update data
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    if ('firstName' in data && data.firstName) {
      updateData.firstName = data.firstName.charAt(0).toUpperCase() + data.firstName.slice(1).toLowerCase()
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
    
    const updatedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    
    if (updatedUser.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json(updatedUser[0])
  } catch (error) {
    console.error('Error in PATCH /users/:id:', error)
    return c.json({ error: 'Failed to update user' }, 500)
  }
})

app.delete('/:id', async (c) => {
  console.log('DELETE /users/:id - Deleting user')
  const db = getDB(c)
  const id = c.req.param('id')
  
  try {
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning()
    
    if (!deletedUser.length) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json(deletedUser[0])
  } catch (error) {
    console.error('Error in DELETE /users/:id:', error)
    return c.json({ error: 'Failed to delete user' }, 500)
  }
})

export default app
