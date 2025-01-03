import { z } from 'zod'

export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
  role: userRoleSchema,
  status: userStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type User = z.infer<typeof userSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type UserStatus = z.infer<typeof userStatusSchema>

export const userListResponseSchema = z.object({
  users: z.array(userSchema),
  nextCursor: z.string().optional(),
  total: z.number(),
})

export type GetUsersResponse = z.infer<typeof userListResponseSchema>

export const userCreateSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  status: true 
}).extend({
  password: z.string()
})

export type UserCreate = z.infer<typeof userCreateSchema>

export const userUpdateSchema = userSchema.partial().extend({
  password: z.string().optional()
})

export type UserUpdate = z.infer<typeof userUpdateSchema>
