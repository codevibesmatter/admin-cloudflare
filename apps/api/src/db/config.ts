import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import type { HonoContext } from '../types'

export async function createDatabase(context: HonoContext): Promise<Client> {
  if (!context.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required')
  }
  if (!context.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required')
  }

  try {
    // Try libSQL protocol first
    const libsqlUrl = context.env.TURSO_DATABASE_URL
    console.log('Trying libSQL connection:', {
      url: libsqlUrl.split('://')[0] + '://' + libsqlUrl.split('://')[1]?.split('.')[0] + '...'
    })
    
    try {
      const libsqlClient = createClient({ 
        url: libsqlUrl,
        authToken: context.env.TURSO_AUTH_TOKEN
      })
      await libsqlClient.execute('SELECT 1')
      console.log('libSQL connection successful')
      return libsqlClient
    } catch (libsqlError) {
      console.log('libSQL connection failed:', libsqlError)

      // Try HTTP protocol
      const httpUrl = libsqlUrl.replace('libsql://', 'https://')
      console.log('Trying HTTP connection:', {
        url: httpUrl.split('://')[0] + '://' + httpUrl.split('://')[1]?.split('.')[0] + '...'
      })

      const httpClient = createClient({ 
        url: httpUrl,
        authToken: context.env.TURSO_AUTH_TOKEN
      })
      await httpClient.execute('SELECT 1')
      console.log('HTTP connection successful')
      return httpClient
    }
  } catch (error) {
    console.error('Failed to create database client:', error)
    throw error
  }
} 