import { z } from 'zod';
// Base webhook event schema
const baseEventSchema = z.object({
    object: z.literal('event')
});
// User webhook events
export const userEventSchema = baseEventSchema.extend({
    type: z.enum(['user.created', 'user.updated', 'user.deleted']),
    data: z.object({
        id: z.string(),
        object: z.literal('user'),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email_addresses: z.array(z.object({
            email_address: z.string().email()
        })).optional(),
        image_url: z.string().optional(),
        deleted: z.boolean().optional()
    })
});
// Organization webhook events
export const organizationEventSchema = baseEventSchema.extend({
    type: z.enum(['organization.created', 'organization.updated', 'organization.deleted']),
    data: z.object({
        id: z.string(),
        object: z.literal('organization'),
        name: z.string().optional(),
        slug: z.string().optional(),
        deleted: z.boolean().optional()
    })
});
// Membership webhook events
export const membershipEventSchema = baseEventSchema.extend({
    type: z.enum(['organizationMembership.created', 'organizationMembership.deleted', 'organizationMembership.updated']),
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
});
// Combined webhook event schema
export const webhookEventSchema = z.discriminatedUnion('type', [
    userEventSchema,
    organizationEventSchema,
    membershipEventSchema
]);
//# sourceMappingURL=webhooks.js.map