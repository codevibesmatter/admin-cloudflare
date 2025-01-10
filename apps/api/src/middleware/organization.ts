import type { Next } from 'hono'
import { OrganizationService } from '../db/services/organizations'
import { MemberService } from '../db/services/members'
import { DatabaseError } from '../lib/errors'
import type { HonoContext } from '../types'

export const organizationMiddleware = async (c: HonoContext, next: Next) => {
  try {
    const organizationId = c.req.param('organizationId')
    if (!organizationId) {
      throw new DatabaseError('Organization ID is required', null, 'ORGANIZATION_ID_REQUIRED')
    }

    // Get organization from database
    const organizationService = new OrganizationService({
      context: c,
      logger: c.env.logger
    })

    const organization = await organizationService.getById(organizationId)
    if (!organization) {
      throw new DatabaseError('Organization not found', null, 'ORGANIZATION_NOT_FOUND')
    }

    // Get member role if user is authenticated
    let role = 'member'
    if (c.get('userId')) {
      const memberService = new MemberService({
        context: c,
        logger: c.env.logger
      })
      const member = await memberService.getMember(organizationId, c.get('userId')!)
      if (member) {
        role = member.role
      }
    }

    // Set organization context
    c.set('organizationId', organization.id)
    c.set('organizationRole', role)
    c.set('organizationContext', {
      id: organization.id,
      role,
      organization: {
        id: organization.id,
        clerk_id: organization.clerk_id,
        name: organization.name
      }
    })

    await next()
  } catch (error) {
    c.env.logger.error('Organization middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

export const requireOrganizationRole = (allowedRoles: string[]) => {
  return async (c: HonoContext, next: Next) => {
    const role = c.get('organizationRole')
    if (!role || !allowedRoles.includes(role)) {
      throw new DatabaseError('Insufficient permissions', null, 'INSUFFICIENT_PERMISSIONS')
    }
    await next()
  }
}

export const getOrganizationContext = (c: HonoContext) => {
  const id = c.get('organizationId')
  const role = c.get('organizationRole')
  const context = c.get('organizationContext')

  if (!id || !role || !context) {
    throw new DatabaseError('Organization context not found', null, 'ORGANIZATION_CONTEXT_NOT_FOUND')
  }

  return { id, role, context }
} 