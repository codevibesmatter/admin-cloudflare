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

// Combined schemas
export const userEventSchema = z.discriminatedUnion('type', [
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema
])

// Combined webhook event schema
export const webhookEventSchema = z.discriminatedUnion('type', [
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema
])

// Export types
export type UserEvent = z.infer<typeof userEventSchema>
export type WebhookEvent = z.infer<typeof webhookEventSchema> 