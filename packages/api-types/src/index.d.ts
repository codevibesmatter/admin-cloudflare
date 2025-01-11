import { z } from 'zod';
import type { D1Database } from '@cloudflare/workers-types';
export type { APIErrorResponse, ValidationErrorResponse, DatabaseErrorResponse, SyncErrorResponse, APIError } from './errors';
export { errorCodes, errorSchema, validationErrorSchema, databaseErrorSchema, syncErrorSchema, createAPIError, createValidationError, createDatabaseError, createSyncError } from './errors';
export * from './webhooks';
export declare const userRoleSchema: z.ZodEnum<["superadmin", "admin", "manager", "cashier"]>;
export declare const userStatusSchema: z.ZodEnum<["active", "inactive", "invited", "suspended"]>;
export declare const organizationRoleSchema: z.ZodEnum<["owner", "admin", "member"]>;
export declare const userCreateSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<["superadmin", "admin", "manager", "cashier"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "superadmin" | "admin" | "manager" | "cashier";
    firstName: string;
    lastName: string;
}, {
    email: string;
    role: "superadmin" | "admin" | "manager" | "cashier";
    firstName: string;
    lastName: string;
}>;
export declare const userUpdateSchema: z.ZodObject<z.objectUtil.extendShape<{
    email: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["superadmin", "admin", "manager", "cashier"]>>;
}, {
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "invited", "suspended"]>>;
}>, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    status?: "active" | "inactive" | "invited" | "suspended" | undefined;
    role?: "superadmin" | "admin" | "manager" | "cashier" | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email?: string | undefined;
    status?: "active" | "inactive" | "invited" | "suspended" | undefined;
    role?: "superadmin" | "admin" | "manager" | "cashier" | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
export declare const organizationCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    databaseId: z.ZodString;
    clerkId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    databaseId: string;
    clerkId: string;
}, {
    name: string;
    slug: string;
    databaseId: string;
    clerkId: string;
}>;
export declare const organizationUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    databaseId: z.ZodOptional<z.ZodString>;
    clerkId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
    databaseId?: string | undefined;
    clerkId?: string | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
    databaseId?: string | undefined;
    clerkId?: string | undefined;
}>;
export declare const webhookEventSchema: z.ZodObject<{
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodString;
        type: z.ZodEnum<["user.created", "user.updated", "user.deleted"]>;
        data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        object: string;
        id: string;
        type: "user.created" | "user.updated" | "user.deleted";
        data: Record<string, unknown>;
    }, {
        object: string;
        id: string;
        type: "user.created" | "user.updated" | "user.deleted";
        data: Record<string, unknown>;
    }>;
    type: z.ZodEnum<["user.created", "user.updated", "user.deleted"]>;
}, "strip", z.ZodTypeAny, {
    type: "user.created" | "user.updated" | "user.deleted";
    data: {
        object: string;
        id: string;
        type: "user.created" | "user.updated" | "user.deleted";
        data: Record<string, unknown>;
    };
}, {
    type: "user.created" | "user.updated" | "user.deleted";
    data: {
        object: string;
        id: string;
        type: "user.created" | "user.updated" | "user.deleted";
        data: Record<string, unknown>;
    };
}>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'superadmin' | 'admin' | 'manager' | 'cashier';
    status: 'active' | 'inactive' | 'invited' | 'suspended';
    clerkId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Organization {
    id: string;
    name: string;
    slug: string;
    databaseId: string;
    clerkId: string;
    createdAt: string;
    updatedAt: string;
}
export interface OrganizationMember {
    organizationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
    createdAt: string;
}
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;
export interface GetUsersResponse {
    data: {
        users: User[];
    };
    meta: {
        timestamp: string;
    };
}
export interface GetOrganizationsResponse {
    data: {
        organizations: Organization[];
    };
    meta: {
        timestamp: string;
    };
}
export interface Env {
    Bindings: {
        CLERK_SECRET_KEY: string;
        DB: D1Database;
    };
    Variables: {};
}
export type Routes = {
    '/users': {
        get: {
            response: GetUsersResponse;
        };
        post: {
            request: UserCreate;
            response: User;
        };
    };
    '/users/:id': {
        get: {
            response: User;
        };
        put: {
            request: UserUpdate;
            response: User;
        };
        delete: {
            response: {
                success: true;
            };
        };
    };
    '/users/:id/sync-clerk': {
        post: {
            response: User;
        };
    };
    '/users/sync-from-clerk': {
        post: {
            response: {
                success: true;
            };
        };
    };
    '/organizations': {
        get: {
            response: GetOrganizationsResponse;
        };
        post: {
            request: OrganizationCreate;
            response: Organization;
        };
    };
    '/organizations/:organizationId': {
        get: {
            response: Organization;
        };
        patch: {
            request: OrganizationUpdate;
            response: Organization;
        };
        delete: {
            response: {
                success: true;
            };
        };
    };
    '/organizations/set-active': {
        post: {
            request: {
                organizationId: string;
            };
            response: {
                success: true;
            };
        };
    };
    '/webhooks/clerk': {
        post: {
            request: WebhookEvent;
            response: {
                success: true;
            };
        };
    };
};
declare const route: import("hono/hono-base").HonoBase<Env, {
    "/users": {
        $get: {
            input: {};
            output: {
                data: {
                    users: {
                        id: string;
                        email: string;
                        firstName: string;
                        lastName: string;
                        role: "superadmin" | "admin" | "manager" | "cashier";
                        status: "active" | "inactive" | "invited" | "suspended";
                        clerkId?: string | undefined;
                        createdAt: string;
                        updatedAt: string;
                    }[];
                };
                meta: {
                    timestamp: string;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/users": {
        $post: {
            input: {
                json: {
                    email: string;
                    role: "superadmin" | "admin" | "manager" | "cashier";
                    firstName: string;
                    lastName: string;
                };
            };
            output: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: "superadmin" | "admin" | "manager" | "cashier";
                status: "active" | "inactive" | "invited" | "suspended";
                clerkId?: string | undefined;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/users/:id": {
        $get: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: "superadmin" | "admin" | "manager" | "cashier";
                status: "active" | "inactive" | "invited" | "suspended";
                clerkId?: string | undefined;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/users/:id": {
        $put: {
            input: {
                json: {
                    email?: string | undefined;
                    status?: "active" | "inactive" | "invited" | "suspended" | undefined;
                    role?: "superadmin" | "admin" | "manager" | "cashier" | undefined;
                    firstName?: string | undefined;
                    lastName?: string | undefined;
                };
            } & {
                param: {
                    id: string;
                };
            };
            output: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: "superadmin" | "admin" | "manager" | "cashier";
                status: "active" | "inactive" | "invited" | "suspended";
                clerkId?: string | undefined;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/users/:id": {
        $delete: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                success: true;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/users/:id/sync-clerk": {
        $post: {
            input: {
                param: {
                    id: string;
                };
            };
            output: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: "superadmin" | "admin" | "manager" | "cashier";
                status: "active" | "inactive" | "invited" | "suspended";
                clerkId?: string | undefined;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/users/sync-from-clerk": {
        $post: {
            input: {};
            output: {
                success: true;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/organizations": {
        $get: {
            input: {};
            output: {
                data: {
                    organizations: {
                        id: string;
                        name: string;
                        slug: string;
                        databaseId: string;
                        clerkId: string;
                        createdAt: string;
                        updatedAt: string;
                    }[];
                };
                meta: {
                    timestamp: string;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/organizations": {
        $post: {
            input: {
                json: {
                    name: string;
                    slug: string;
                    databaseId: string;
                    clerkId: string;
                };
            };
            output: {
                id: string;
                name: string;
                slug: string;
                databaseId: string;
                clerkId: string;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/organizations/:organizationId": {
        $get: {
            input: {
                param: {
                    organizationId: string;
                };
            };
            output: {
                id: string;
                name: string;
                slug: string;
                databaseId: string;
                clerkId: string;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/organizations/:organizationId": {
        $patch: {
            input: {
                json: {
                    name?: string | undefined;
                    slug?: string | undefined;
                    databaseId?: string | undefined;
                    clerkId?: string | undefined;
                };
            } & {
                param: {
                    organizationId: string;
                };
            };
            output: {
                id: string;
                name: string;
                slug: string;
                databaseId: string;
                clerkId: string;
                createdAt: string;
                updatedAt: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/organizations/:organizationId": {
        $delete: {
            input: {
                param: {
                    organizationId: string;
                };
            };
            output: {
                success: true;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/organizations/set-active": {
        $post: {
            input: {
                json: {
                    organizationId: string;
                };
            };
            output: {
                success: true;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/webhooks/clerk": {
        $post: {
            input: {
                json: {
                    type: "user.created" | "user.updated" | "user.deleted";
                    data: {
                        object: string;
                        id: string;
                        type: "user.created" | "user.updated" | "user.deleted";
                        data: Record<string, unknown>;
                    };
                };
            };
            output: {
                success: true;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
}, "/">;
export type AppType = typeof route;
export type ClientRoutes = {
    '/users': {
        searchParams: {
            status?: 'active' | 'inactive' | 'invited' | 'suspended';
            role?: 'superadmin' | 'admin' | 'manager' | 'cashier';
        };
    };
    '/users/:id': {
        params: {
            id: string;
        };
        searchParams: {
            tab?: 'profile' | 'settings';
        };
    };
    '/organizations': {
        searchParams: {
            status?: 'active' | 'inactive';
        };
    };
    '/organizations/:organizationId': {
        params: {
            organizationId: string;
        };
        searchParams: {
            tab?: 'general' | 'members' | 'settings';
        };
    };
};
export type RouteParams<T extends keyof ClientRoutes> = ClientRoutes[T] extends {
    params: infer P;
} ? P : never;
export type SearchParams<T extends keyof ClientRoutes> = ClientRoutes[T] extends {
    searchParams: infer S;
} ? S : never;
export type NavigateOptions<T extends keyof ClientRoutes> = {
    params?: RouteParams<T>;
    search?: SearchParams<T>;
};
export type TypeSafeNavigate = <T extends keyof ClientRoutes>(route: T, options?: NavigateOptions<T>) => void;
export declare const createSearchParamsSchema: <T extends keyof ClientRoutes>(route: T, schema: z.ZodType<SearchParams<T>>) => {
    validate: (params: unknown) => SearchParams<T>;
    schema: z.ZodType<SearchParams<T>, z.ZodTypeDef, SearchParams<T>>;
};
export declare const createTypeSafeRoute: <T extends keyof ClientRoutes>(path: T, options: {
    searchParamsSchema?: z.ZodType<SearchParams<T>>;
}) => {
    path: T;
    buildPath: (params: RouteParams<T>) => string;
    validateSearchParams: ((params: unknown) => SearchParams<T>) | undefined;
};
export type ExampleRoutes = {
    users: ReturnType<typeof createTypeSafeRoute<'/users'>>;
    userDetails: ReturnType<typeof createTypeSafeRoute<'/users/:id'>>;
    organizations: ReturnType<typeof createTypeSafeRoute<'/organizations'>>;
    organizationDetails: ReturnType<typeof createTypeSafeRoute<'/organizations/:organizationId'>>;
};
//# sourceMappingURL=index.d.ts.map