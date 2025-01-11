import { z } from 'zod'

// Base webhook event schema
const baseEventSchema = z.object({
  object: z.literal('event'),
  data: z.object({
    id: z.string()
  })
})

// User webhook event schemas
const userCreatedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('user.created'),
  data: z.object({
    id: z.string(),
    object: z.literal('user'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })).optional(),
    image_url: z.string().optional()
  })
})

const userUpdatedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('user.updated'),
  data: z.object({
    id: z.string(),
    object: z.literal('user'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })).optional(),
    image_url: z.string().optional()
  })
})

const userDeletedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('user.deleted'),
  data: z.object({
    id: z.string(),
    object: z.literal('user'),
    deleted: z.literal(true)
  })
})

// Organization webhook event schemas
const organizationCreatedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('organization.created'),
  data: z.object({
    id: z.string(),
    object: z.literal('organization'),
    name: z.string(),
    slug: z.string()
  })
})

const organizationUpdatedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('organization.updated'),
  data: z.object({
    id: z.string(),
    object: z.literal('organization'),
    name: z.string(),
    slug: z.string()
  })
})

const organizationDeletedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('organization.deleted'),
  data: z.object({
    id: z.string(),
    object: z.literal('organization'),
    deleted: z.literal(true)
  })
})

// Membership webhook event schemas
const membershipCreatedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('organizationMembership.created'),
  data: z.object({
    id: z.string(),
    object: z.literal('organization_membership'),
    organization: z.object({
      id: z.string(),
      object: z.literal('organization')
    }),
    public_user_data: z.object({
      user_id: z.string()
    }),
    role: z.string()
  })
})

const membershipUpdatedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('organizationMembership.updated'),
  data: z.object({
    id: z.string(),
    object: z.literal('organization_membership'),
    organization: z.object({
      id: z.string(),
      object: z.literal('organization')
    }),
    public_user_data: z.object({
      user_id: z.string()
    }),
    role: z.string()
  })
})

const membershipDeletedSchema = z.object({
  object: z.literal('event'),
  type: z.literal('organizationMembership.deleted'),
  data: z.object({
    id: z.string(),
    object: z.literal('organization_membership'),
    organization: z.object({
      id: z.string(),
      object: z.literal('organization')
    }),
    public_user_data: z.object({
      user_id: z.string()
    })
  })
})

// Combined schemas
export const userEventSchema = z.discriminatedUnion('type', [
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema
])

export const organizationEventSchema = z.discriminatedUnion('type', [
  organizationCreatedSchema,
  organizationUpdatedSchema,
  organizationDeletedSchema
])

export const membershipEventSchema = z.discriminatedUnion('type', [
  membershipCreatedSchema,
  membershipUpdatedSchema,
  membershipDeletedSchema
])

// Combined webhook event schema
export const webhookEventSchema = z.discriminatedUnion('type', [
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema,
  organizationCreatedSchema,
  organizationUpdatedSchema,
  organizationDeletedSchema,
  membershipCreatedSchema,
  membershipUpdatedSchema,
  membershipDeletedSchema
])

// Export types
export type UserEvent = z.infer<typeof userEventSchema>
export type OrganizationEvent = z.infer<typeof organizationEventSchema>
export type MembershipEvent = z.infer<typeof membershipEventSchema>
export type WebhookEvent = z.infer<typeof webhookEventSchema> 