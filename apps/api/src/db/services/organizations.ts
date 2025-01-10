import { BaseService, type ServiceConfig } from './base'
import type { Organization } from '../schema/organizations'
import { DatabaseError } from '../../lib/errors'
import { generateId } from '../../lib/utils'

export interface CreateOrganizationInput {
  name: string
  slug: string
  clerk_id: string
  metadata?: Record<string, unknown>
}

export interface UpdateOrganizationInput {
  name?: string
  slug?: string
  metadata?: Record<string, unknown>
}

// Helper function to convert database row to Organization type
function rowToOrganization(row: Record<string, any>): Organization {
  return {
    id: row.id,
    clerk_id: row.clerk_id,
    name: row.name,
    slug: row.slug,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export class OrganizationService extends BaseService {
  constructor(config: ServiceConfig) {
    super(config)
  }

  async getById(id: string): Promise<Organization | undefined> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM organizations WHERE id = ?',
        args: [id]
      })
      const row = result.rows[0]
      return row ? rowToOrganization(row as Record<string, any>) : undefined
    })
  }

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    try {
      const now = new Date().toISOString()
      const id = generateId()
      const result = await this.db!.execute({
        sql: `
          INSERT INTO organizations (
            id, clerk_id, name, slug, metadata,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          id,
          input.clerk_id,
          input.name,
          input.slug,
          input.metadata ? JSON.stringify(input.metadata) : null,
          now,
          now
        ]
      })
      return rowToOrganization(result.rows[0] as Record<string, any>)
    } catch (error) {
      this.logError('Failed to create organization', error)
      throw new DatabaseError('Failed to create organization', error)
    }
  }

  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    try {
      // Build dynamic SET clause and args array
      const updates: string[] = []
      const args: any[] = []

      if (input.name !== undefined) {
        updates.push('name = ?')
        args.push(input.name)
      }
      if (input.slug !== undefined) {
        updates.push('slug = ?')
        args.push(input.slug)
      }
      if (input.metadata !== undefined) {
        updates.push('metadata = ?')
        args.push(input.metadata ? JSON.stringify(input.metadata) : null)
      }

      // Always update updated_at
      updates.push('updated_at = ?')
      args.push(new Date().toISOString())

      // Add id to args array for WHERE clause
      args.push(id)

      const result = await this.db!.execute({
        sql: `
          UPDATE organizations 
          SET ${updates.join(', ')}
          WHERE id = ?
          RETURNING *
        `,
        args
      })

      if (result.rows.length === 0) {
        throw new DatabaseError('Organization not found', null, 'ORGANIZATION_NOT_FOUND')
      }

      return rowToOrganization(result.rows[0] as Record<string, any>)
    } catch (error) {
      this.logError('Failed to update organization', error)
      throw new DatabaseError('Failed to update organization', error)
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      const result = await this.db!.execute({
        sql: 'DELETE FROM organizations WHERE id = ? RETURNING *',
        args: [id]
      })

      if (result.rows.length === 0) {
        throw new DatabaseError('Organization not found', null, 'ORGANIZATION_NOT_FOUND')
      }
    } catch (error) {
      this.logError('Failed to delete organization', error)
      throw new DatabaseError('Failed to delete organization', error)
    }
  }

  async getByClerkId(clerk_id: string): Promise<Organization | undefined> {
    try {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM organizations WHERE clerk_id = ?',
        args: [clerk_id]
      })
      const row = result.rows[0]
      return row ? rowToOrganization(row as Record<string, any>) : undefined
    } catch (error) {
      this.logError('Failed to get organization by Clerk ID', error)
      throw new DatabaseError('Failed to get organization by Clerk ID', error)
    }
  }
} 