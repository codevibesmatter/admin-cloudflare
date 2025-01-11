import { z } from 'zod'

// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'superadmin' | 'admin' | 'manager' | 'cashier'
  status: 'active' | 'inactive' | 'invited' | 'suspended'
  clerkId?: string
  createdAt: string
  updatedAt: string
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  databaseId: string
  clerkId: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

// Schema types
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])
export const organizationRoleSchema = z.enum(['owner', 'admin', 'member'])

export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
})

export const userUpdateSchema = userCreateSchema.partial().extend({
  status: userStatusSchema.optional(),
})

export const organizationCreateSchema = z.object({
  name: z.string(),
  slug: z.string(),
  databaseId: z.string(),
  clerkId: z.string(),
})

export const organizationUpdateSchema = organizationCreateSchema.partial()

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>

export interface GetUsersResponse {
  data: {
    users: User[]
  }
  meta: {
    timestamp: string
  }
}

export interface GetOrganizationsResponse {
  data: {
    organizations: Organization[]
  }
  meta: {
    timestamp: string
  }
} 