import { z } from 'zod';
export declare const userEventSchema: z.ZodObject<z.objectUtil.extendShape<{
    object: z.ZodLiteral<"event">;
}, {
    type: z.ZodEnum<["user.created", "user.updated", "user.deleted"]>;
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"user">;
        first_name: z.ZodOptional<z.ZodString>;
        last_name: z.ZodOptional<z.ZodString>;
        email_addresses: z.ZodOptional<z.ZodArray<z.ZodObject<{
            email_address: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email_address: string;
        }, {
            email_address: string;
        }>, "many">>;
        image_url: z.ZodOptional<z.ZodString>;
        deleted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    }, {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    }>;
}>, "strip", z.ZodTypeAny, {
    object: "event";
    type: "user.created" | "user.updated" | "user.deleted";
    data: {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    };
}, {
    object: "event";
    type: "user.created" | "user.updated" | "user.deleted";
    data: {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    };
}>;
export declare const organizationEventSchema: z.ZodObject<z.objectUtil.extendShape<{
    object: z.ZodLiteral<"event">;
}, {
    type: z.ZodEnum<["organization.created", "organization.updated", "organization.deleted"]>;
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"organization">;
        name: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
        deleted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    }, {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    }>;
}>, "strip", z.ZodTypeAny, {
    object: "event";
    type: "organization.created" | "organization.updated" | "organization.deleted";
    data: {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    };
}, {
    object: "event";
    type: "organization.created" | "organization.updated" | "organization.deleted";
    data: {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    };
}>;
export declare const membershipEventSchema: z.ZodObject<z.objectUtil.extendShape<{
    object: z.ZodLiteral<"event">;
}, {
    type: z.ZodEnum<["organizationMembership.created", "organizationMembership.deleted", "organizationMembership.updated"]>;
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"organization_membership">;
        organization: z.ZodObject<{
            id: z.ZodString;
            object: z.ZodLiteral<"organization">;
        }, "strip", z.ZodTypeAny, {
            object: "organization";
            id: string;
        }, {
            object: "organization";
            id: string;
        }>;
        public_user_data: z.ZodObject<{
            user_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            user_id: string;
        }, {
            user_id: string;
        }>;
        role: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    }, {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    }>;
}>, "strip", z.ZodTypeAny, {
    object: "event";
    type: "organizationMembership.created" | "organizationMembership.deleted" | "organizationMembership.updated";
    data: {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    };
}, {
    object: "event";
    type: "organizationMembership.created" | "organizationMembership.deleted" | "organizationMembership.updated";
    data: {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    };
}>;
export declare const webhookEventSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<{
    object: z.ZodLiteral<"event">;
}, {
    type: z.ZodEnum<["user.created", "user.updated", "user.deleted"]>;
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"user">;
        first_name: z.ZodOptional<z.ZodString>;
        last_name: z.ZodOptional<z.ZodString>;
        email_addresses: z.ZodOptional<z.ZodArray<z.ZodObject<{
            email_address: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email_address: string;
        }, {
            email_address: string;
        }>, "many">>;
        image_url: z.ZodOptional<z.ZodString>;
        deleted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    }, {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    }>;
}>, "strip", z.ZodTypeAny, {
    object: "event";
    type: "user.created" | "user.updated" | "user.deleted";
    data: {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    };
}, {
    object: "event";
    type: "user.created" | "user.updated" | "user.deleted";
    data: {
        object: "user";
        id: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        email_addresses?: {
            email_address: string;
        }[] | undefined;
        image_url?: string | undefined;
        deleted?: boolean | undefined;
    };
}>, z.ZodObject<z.objectUtil.extendShape<{
    object: z.ZodLiteral<"event">;
}, {
    type: z.ZodEnum<["organization.created", "organization.updated", "organization.deleted"]>;
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"organization">;
        name: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
        deleted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    }, {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    }>;
}>, "strip", z.ZodTypeAny, {
    object: "event";
    type: "organization.created" | "organization.updated" | "organization.deleted";
    data: {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    };
}, {
    object: "event";
    type: "organization.created" | "organization.updated" | "organization.deleted";
    data: {
        object: "organization";
        id: string;
        name?: string | undefined;
        deleted?: boolean | undefined;
        slug?: string | undefined;
    };
}>, z.ZodObject<z.objectUtil.extendShape<{
    object: z.ZodLiteral<"event">;
}, {
    type: z.ZodEnum<["organizationMembership.created", "organizationMembership.deleted", "organizationMembership.updated"]>;
    data: z.ZodObject<{
        id: z.ZodString;
        object: z.ZodLiteral<"organization_membership">;
        organization: z.ZodObject<{
            id: z.ZodString;
            object: z.ZodLiteral<"organization">;
        }, "strip", z.ZodTypeAny, {
            object: "organization";
            id: string;
        }, {
            object: "organization";
            id: string;
        }>;
        public_user_data: z.ZodObject<{
            user_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            user_id: string;
        }, {
            user_id: string;
        }>;
        role: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    }, {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    }>;
}>, "strip", z.ZodTypeAny, {
    object: "event";
    type: "organizationMembership.created" | "organizationMembership.deleted" | "organizationMembership.updated";
    data: {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    };
}, {
    object: "event";
    type: "organizationMembership.created" | "organizationMembership.deleted" | "organizationMembership.updated";
    data: {
        object: "organization_membership";
        id: string;
        organization: {
            object: "organization";
            id: string;
        };
        public_user_data: {
            user_id: string;
        };
        role: string;
    };
}>]>;
export type UserEvent = z.infer<typeof userEventSchema>;
export type OrganizationEvent = z.infer<typeof organizationEventSchema>;
export type MembershipEvent = z.infer<typeof membershipEventSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
//# sourceMappingURL=webhooks.d.ts.map