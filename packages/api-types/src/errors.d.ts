import { z } from 'zod';
export declare const errorCodes: readonly ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR", "DATABASE_ERROR", "VALIDATION_ERROR", "SYNC_ERROR", "RETRYABLE_ERROR", "NON_RETRYABLE_ERROR"];
export type ErrorCode = typeof errorCodes[number];
export declare const errorSchema: z.ZodObject<{
    message: z.ZodString;
    code: z.ZodEnum<["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR", "DATABASE_ERROR", "VALIDATION_ERROR", "SYNC_ERROR", "RETRYABLE_ERROR", "NON_RETRYABLE_ERROR"]>;
    statusCode: z.ZodNumber;
    details: z.ZodOptional<z.ZodUnknown>;
    requestId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR" | "DATABASE_ERROR" | "VALIDATION_ERROR" | "SYNC_ERROR" | "RETRYABLE_ERROR" | "NON_RETRYABLE_ERROR";
    statusCode: number;
    details?: unknown;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}, {
    message: string;
    code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR" | "DATABASE_ERROR" | "VALIDATION_ERROR" | "SYNC_ERROR" | "RETRYABLE_ERROR" | "NON_RETRYABLE_ERROR";
    statusCode: number;
    details?: unknown;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}>;
export type APIErrorResponse = z.infer<typeof errorSchema>;
export declare const validationErrorSchema: z.ZodObject<z.objectUtil.extendShape<{
    message: z.ZodString;
    code: z.ZodEnum<["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR", "DATABASE_ERROR", "VALIDATION_ERROR", "SYNC_ERROR", "RETRYABLE_ERROR", "NON_RETRYABLE_ERROR"]>;
    statusCode: z.ZodNumber;
    details: z.ZodOptional<z.ZodUnknown>;
    requestId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, {
    code: z.ZodLiteral<"VALIDATION_ERROR">;
    details: z.ZodRecord<z.ZodString, z.ZodObject<{
        _errors: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        _errors: string[];
    }, {
        _errors: string[];
    }>>;
}>, "strip", z.ZodTypeAny, {
    message: string;
    code: "VALIDATION_ERROR";
    statusCode: number;
    details: Record<string, {
        _errors: string[];
    }>;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}, {
    message: string;
    code: "VALIDATION_ERROR";
    statusCode: number;
    details: Record<string, {
        _errors: string[];
    }>;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}>;
export type ValidationErrorResponse = z.infer<typeof validationErrorSchema>;
export declare const databaseErrorSchema: z.ZodObject<z.objectUtil.extendShape<{
    message: z.ZodString;
    code: z.ZodEnum<["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR", "DATABASE_ERROR", "VALIDATION_ERROR", "SYNC_ERROR", "RETRYABLE_ERROR", "NON_RETRYABLE_ERROR"]>;
    statusCode: z.ZodNumber;
    details: z.ZodOptional<z.ZodUnknown>;
    requestId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, {
    code: z.ZodLiteral<"DATABASE_ERROR">;
    details: z.ZodOptional<z.ZodObject<{
        operation: z.ZodString;
        table: z.ZodOptional<z.ZodString>;
        constraint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        operation: string;
        table?: string | undefined;
        constraint?: string | undefined;
    }, {
        operation: string;
        table?: string | undefined;
        constraint?: string | undefined;
    }>>;
}>, "strip", z.ZodTypeAny, {
    message: string;
    code: "DATABASE_ERROR";
    statusCode: number;
    details?: {
        operation: string;
        table?: string | undefined;
        constraint?: string | undefined;
    } | undefined;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}, {
    message: string;
    code: "DATABASE_ERROR";
    statusCode: number;
    details?: {
        operation: string;
        table?: string | undefined;
        constraint?: string | undefined;
    } | undefined;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}>;
export type DatabaseErrorResponse = z.infer<typeof databaseErrorSchema>;
export declare const syncErrorSchema: z.ZodObject<z.objectUtil.extendShape<{
    message: z.ZodString;
    code: z.ZodEnum<["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_SERVER_ERROR", "DATABASE_ERROR", "VALIDATION_ERROR", "SYNC_ERROR", "RETRYABLE_ERROR", "NON_RETRYABLE_ERROR"]>;
    statusCode: z.ZodNumber;
    details: z.ZodOptional<z.ZodUnknown>;
    requestId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, {
    code: z.ZodEnum<["SYNC_ERROR", "RETRYABLE_ERROR", "NON_RETRYABLE_ERROR"]>;
    details: z.ZodOptional<z.ZodObject<{
        service: z.ZodString;
        operation: z.ZodString;
        entityId: z.ZodOptional<z.ZodString>;
        entityType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        operation: string;
        service: string;
        entityId?: string | undefined;
        entityType?: string | undefined;
    }, {
        operation: string;
        service: string;
        entityId?: string | undefined;
        entityType?: string | undefined;
    }>>;
}>, "strip", z.ZodTypeAny, {
    message: string;
    code: "SYNC_ERROR" | "RETRYABLE_ERROR" | "NON_RETRYABLE_ERROR";
    statusCode: number;
    details?: {
        operation: string;
        service: string;
        entityId?: string | undefined;
        entityType?: string | undefined;
    } | undefined;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}, {
    message: string;
    code: "SYNC_ERROR" | "RETRYABLE_ERROR" | "NON_RETRYABLE_ERROR";
    statusCode: number;
    details?: {
        operation: string;
        service: string;
        entityId?: string | undefined;
        entityType?: string | undefined;
    } | undefined;
    requestId?: string | undefined;
    timestamp?: string | undefined;
}>;
export type SyncErrorResponse = z.infer<typeof syncErrorSchema>;
export declare const createAPIError: (message: string, code: ErrorCode, statusCode: number, details?: unknown) => APIErrorResponse;
export declare const createValidationError: (message: string, details: ValidationErrorResponse["details"]) => ValidationErrorResponse;
export declare const createDatabaseError: (message: string, details?: DatabaseErrorResponse["details"]) => DatabaseErrorResponse;
export declare const createSyncError: (message: string, code: "SYNC_ERROR" | "RETRYABLE_ERROR" | "NON_RETRYABLE_ERROR", details?: SyncErrorResponse["details"]) => SyncErrorResponse;
//# sourceMappingURL=errors.d.ts.map