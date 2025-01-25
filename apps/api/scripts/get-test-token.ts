import { createClerkClient } from '@clerk/backend'

async function getTestToken() {
  try {
    // Get Clerk secret key from dev server
    const response = await fetch('http://localhost:8787/api/dev/clerk-key')
    const { key } = await response.json()
    
    if (!key) {
      throw new Error('Could not get Clerk secret key from dev server')
    }

    // Create Clerk client
    const clerk = createClerkClient({ secretKey: key })

    // Get the first user (or a specific user by ID)
    const users = await clerk.users.getUserList()
    const user = users[0]
    
    if (!user) {
      console.error('No users found')
      process.exit(1)
    }

    // Create a session token
    const token = await clerk.sessions.createSession({
      userId: user.id,
      sessionDuration: 60 * 60 * 24 // 24 hours
    })

    console.log('Test token:', token.id)
    console.log('\nUse it with curl:')
    console.log(`export TOKEN="${token.id}"`)
    console.log('\nTest the API:')
    console.log('curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8787/api/users')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

getTestToken()
