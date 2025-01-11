import { z } from 'zod';
// Error codes
export const errorCodes = [
    'BAD_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'INTERNAL_SERVER_ERROR',
    'DATABASE_ERROR',
    'VALIDATION_ERROR',
    'SYNC_ERROR',
    'RETRYABLE_ERROR',
    'NON_RETRYABLE_ERROR'
];
// Base error schema
export const errorSchema = z.object({
    message: z.string(),
    code: z.enum(errorCodes),
    statusCode: z.number(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
    timestamp: z.string().optional()
});
// Validation error schema
export const validationErrorSchema = errorSchema.extend({
    code: z.literal('VALIDATION_ERROR'),
    details: z.record(z.string(), z.object({
        _errors: z.array(z.string())
    }))
});
// Database error schema
export const databaseErrorSchema = errorSchema.extend({
    code: z.literal('DATABASE_ERROR'),
    details: z.object({
        operation: z.string(),
        table: z.string().optional(),
        constraint: z.string().optional()
    }).optional()
});
// Sync error schema
export const syncErrorSchema = errorSchema.extend({
    code: z.enum(['SYNC_ERROR', 'RETRYABLE_ERROR', 'NON_RETRYABLE_ERROR']),
    details: z.object({
        service: z.string(),
        operation: z.string(),
        entityId: z.string().optional(),
        entityType: z.string().optional()
    }).optional()
});
// Error factories
export const createAPIError = (message, code, statusCode, details) => ({
    message,
    code,
    statusCode,
    details,
    timestamp: new Date().toISOString()
});
export const createValidationError = (message, details) => ({
    message,
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    details,
    timestamp: new Date().toISOString()
});
export const createDatabaseError = (message, details) => ({
    message,
    code: 'DATABASE_ERROR',
    statusCode: 500,
    details,
    timestamp: new Date().toISOString()
});
export const createSyncError = (message, code, details) => ({
    message,
    code,
    statusCode: code === 'RETRYABLE_ERROR' ? 503 : 500,
    details,
    timestamp: new Date().toISOString()
});
//# sourceMappingURL=errors.js.map