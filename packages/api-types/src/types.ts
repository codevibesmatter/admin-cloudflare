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

// Schema types
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])

export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
})

export const userUpdateSchema = userCreateSchema.partial()

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>

export interface GetUsersResponse {
  data: {
    users: User[]
  }
  meta: {
    timestamp: string
  }
} 