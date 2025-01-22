import { BaseService, type ServiceConfig } from './base'
import { organizations } from '../schema/organizations'
import type { Organization } from '../schema/organizations'
import { DatabaseError } from '../../lib/errors'
import { generateId } from '../../lib/utils'
import { eq } from 'drizzle-orm'

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

export class OrganizationService extends BaseService {
  constructor(config: ServiceConfig) {
    super(config)
  }

  async getById(id: string): Promise<Organization | undefined> {
    return this.query(async () => {
      const result = await this.db!.select().from(organizations).where(eq(organizations.id, id))
      return result[0]
    })
  }

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    try {
      const now = new Date().toISOString()
      const id = generateId()
      
      const [organization] = await this.db!.insert(organizations).values({
        id,
        clerk_id: input.clerk_id,
        name: input.name,
        slug: input.slug,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        created_at: now,
        updated_at: now
      }).returning()

      return organization
    } catch (error) {
      this.logError('Failed to create organization', error)
      throw new DatabaseError('Failed to create organization', error)
    }
  }

  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    return this.query(async () => {
      const [organization] = await this.db!.update(organizations)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.slug !== undefined && { slug: input.slug }),
          ...(input.metadata !== undefined && { 
            metadata: input.metadata ? JSON.stringify(input.metadata) : null 
          }),
          updated_at: new Date().toISOString()
        })
        .where(eq(organizations.id, id))
        .returning()

      if (!organization) {
        throw new DatabaseError('Organization not found', null, 'ORGANIZATION_NOT_FOUND')
      }

      return organization
    })
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      const [organization] = await this.db!.delete(organizations)
        .where(eq(organizations.id, id))
        .returning()

      if (!organization) {
        throw new DatabaseError('Organization not found', null, 'ORGANIZATION_NOT_FOUND')
      }
    } catch (error) {
      this.logError('Failed to delete organization', error)
      throw new DatabaseError('Failed to delete organization', error)
    }
  }

  async getByClerkId(clerkId: string): Promise<Organization | undefined> {
    return this.query(async () => {
      const result = await this.db!.select()
        .from(organizations)
        .where(eq(organizations.clerk_id, clerkId))
      return result[0]
    })
  }
} 