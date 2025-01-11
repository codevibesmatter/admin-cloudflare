/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
export { errorCodes, errorSchema, validationErrorSchema, databaseErrorSchema, syncErrorSchema, createAPIError, createValidationError, createDatabaseError, createSyncError } from './errors';
export * from './webhooks';
// Zod schemas for validation
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier']);
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended']);
export const organizationRoleSchema = z.enum(['owner', 'admin', 'member']);
export const userCreateSchema = z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['superadmin', 'admin', 'manager', 'cashier']),
});
export const userUpdateSchema = userCreateSchema.partial().extend({
    status: z.enum(['active', 'inactive', 'invited', 'suspended']).optional(),
});
export const organizationCreateSchema = z.object({
    name: z.string(),
    slug: z.string(),
    databaseId: z.string(),
    clerkId: z.string(),
});
export const organizationUpdateSchema = organizationCreateSchema.partial();
// Webhook Types
export const webhookEventSchema = z.object({
    data: z.object({
        id: z.string(),
        object: z.string(),
        type: z.enum(['user.created', 'user.updated', 'user.deleted']),
        data: z.record(z.unknown()),
    }),
    type: z.enum(['user.created', 'user.updated', 'user.deleted']),
});
// Create the app with routes
const app = new Hono();
// Chain the handlers for proper type inference
const route = app
    .get('/users', (c) => c.json({
    data: {
        users: [],
    },
    meta: {
        timestamp: new Date().toISOString()
    }
}))
    .post('/users', zValidator('json', userCreateSchema), (c) => c.json({}))
    .get('/users/:id', (c) => c.json({}))
    .put('/users/:id', zValidator('json', userUpdateSchema), (c) => c.json({}))
    .delete('/users/:id', (c) => c.json({ success: true }))
    .post('/users/:id/sync-clerk', (c) => c.json({}))
    .post('/users/sync-from-clerk', (c) => c.json({ success: true }))
    .get('/organizations', (c) => c.json({
    data: {
        organizations: [],
    },
    meta: {
        timestamp: new Date().toISOString()
    }
}))
    .post('/organizations', zValidator('json', organizationCreateSchema), (c) => c.json({}))
    .get('/organizations/:organizationId', (c) => c.json({}))
    .patch('/organizations/:organizationId', zValidator('json', organizationUpdateSchema), (c) => c.json({}))
    .delete('/organizations/:organizationId', (c) => c.json({ success: true }))
    .post('/organizations/set-active', zValidator('json', z.object({ organizationId: z.string() })), (c) => c.json({ success: true }))
    .post('/webhooks/clerk', zValidator('json', webhookEventSchema), (c) => c.json({ success: true }));
// Validation Utilities
export const createSearchParamsSchema = (route, schema) => {
    return {
        validate: (params) => {
            return schema.parse(params);
        },
        schema
    };
};
// Route Builders
export const createTypeSafeRoute = (path, options) => {
    return {
        path,
        buildPath: (params) => {
            return path.replace(/:[a-zA-Z]+/g, (match) => params[match.slice(1)]);
        },
        validateSearchParams: options.searchParamsSchema
            ? (params) => options.searchParamsSchema.parse(params)
            : undefined
    };
};
//# sourceMappingURL=index.js.map