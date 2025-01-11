import { OrganizationService } from '../db/services/organizations'
import { MemberService } from '../db/services/members'
import { UserService } from '../db/services/users'
import type { ServiceConfig } from '../db/services/base'
import { type OrganizationEvent, type MembershipEvent } from '@admin-cloudflare/api-types'

export class OrganizationSync {
  private organizationService: OrganizationService
  private memberService: MemberService
  private userService: UserService
  private logger: ServiceConfig['logger']

  constructor(config: ServiceConfig) {
    this.logger = config.logger
    this.organizationService = new OrganizationService({
      context: config.context,
      logger: config.logger
    })

    this.memberService = new MemberService({
      context: config.context,
      logger: config.logger
    })

    this.userService = new UserService({
      context: config.context,
      logger: config.logger
    })
  }

  async handleOrganizationCreated(event: OrganizationEvent) {
    if (event.type !== 'organization.created') return

    try {
      const organization = await this.organizationService.createOrganization({
        clerk_id: event.data.id,
        name: event.data.name,
        slug: event.data.slug
      })
      
      this.logger.info('Organization created', { id: organization.id, clerkId: event.data.id })
      return organization
    } catch (error) {
      this.logger.error('Failed to create organization', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async handleOrganizationUpdated(event: OrganizationEvent) {
    if (event.type !== 'organization.updated') return

    try {
      const organization = await this.organizationService.getByClerkId(event.data.id)
      if (!organization) {
        throw new Error(`Organization not found: ${event.data.id}`)
      }

      const updated = await this.organizationService.updateOrganization(organization.id, {
        name: event.data.name,
        slug: event.data.slug
      })

      this.logger.info('Organization updated', { id: organization.id, clerkId: event.data.id })
      return updated
    } catch (error) {
      this.logger.error('Failed to update organization', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async handleOrganizationDeleted(event: OrganizationEvent) {
    if (event.type !== 'organization.deleted') return

    try {
      const organization = await this.organizationService.getByClerkId(event.data.id)
      if (!organization) {
        return // Already deleted or never existed
      }

      await this.organizationService.deleteOrganization(organization.id)
      this.logger.info('Organization deleted', { id: organization.id, clerkId: event.data.id })
    } catch (error) {
      this.logger.error('Failed to delete organization', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async handleMembershipChanged(event: MembershipEvent) {
    if (!['organizationMembership.created', 'organizationMembership.deleted'].includes(event.type)) return

    try {
      const organization = await this.organizationService.getByClerkId(event.data.organization.id)
      if (!organization) {
        throw new Error(`Organization not found: ${event.data.organization.id}`)
      }

      if (event.type === 'organizationMembership.created') {
        await this.memberService.addMember({
          organization_id: organization.id,
          user_id: event.data.public_user_data.user_id,
          role: 'member'
        })
        this.logger.info('Member added to organization', { 
          organizationId: organization.id,
          userId: event.data.public_user_data.user_id
        })
      } else {
        await this.memberService.removeMember(
          organization.id,
          event.data.public_user_data.user_id
        )
        this.logger.info('Member removed from organization', { 
          organizationId: organization.id,
          userId: event.data.public_user_data.user_id
        })
      }
    } catch (error) {
      this.logger.error('Failed to handle membership change', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
} 