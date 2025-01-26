import { z } from 'zod'

// Common response types
export const paginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export const metaSchema = z.object({
  timestamp: z.string(),
  requestId: z.string().optional(),
  pagination: paginationSchema.optional(),
})

export const responseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: metaSchema,
  })

// User types
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
  clerkId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
})

export const userUpdateSchema = userCreateSchema.partial()

// Response schemas
export const getUsersResponseSchema = responseSchema(
  z.object({
    users: z.array(userSchema),
  })
)

export const getUserResponseSchema = responseSchema(
  z.object({
    user: userSchema,
  })
)

export const createUserResponseSchema = responseSchema(
  z.object({
    user: userSchema,
  })
)

export const updateUserResponseSchema = responseSchema(
  z.object({
    user: userSchema,
  })
)

export const deleteUserResponseSchema = responseSchema(
  z.object({
    success: z.boolean(),
  })
)

// Type exports
export type User = z.infer<typeof userSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type Meta = z.infer<typeof metaSchema>

// Response types
export type GetUsersResponse = z.infer<typeof getUsersResponseSchema>
export type GetUserResponse = z.infer<typeof getUserResponseSchema>
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>
export type UpdateUserResponse = z.infer<typeof updateUserResponseSchema>
export type DeleteUserResponse = z.infer<typeof deleteUserResponseSchema>