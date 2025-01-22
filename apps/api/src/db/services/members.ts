import { BaseService, type ServiceConfig } from './base'
import { members } from '../schema/index'
import type { Member } from '../schema/index'
import { DatabaseError } from '../../lib/errors'
import { generateId } from '../../lib/utils'
import { eq, and } from 'drizzle-orm'

export type OrganizationRoleType = 'owner' | 'admin' | 'member'

export interface AddMemberInput {
  organization_id: string
  user_id: string
  role: OrganizationRoleType
}

export class MemberService extends BaseService {
  constructor(config: ServiceConfig) {
    super(config)
  }

  async addMember(input: AddMemberInput): Promise<Member> {
    return this.query(async () => {
      const now = new Date().toISOString()
      const id = generateId()
      
      const [member] = await this.db!.insert(members).values({
        id,
        organization_id: input.organization_id,
        user_id: input.user_id,
        role: input.role,
        created_at: now,
        updated_at: now
      }).returning()

      if (!member) {
        throw new DatabaseError('Failed to add member')
      }

      return member
    })
  }

  async removeMember(organization_id: string, user_id: string): Promise<void> {
    return this.query(async () => {
      const [member] = await this.db!.delete(members)
        .where(
          and(
            eq(members.organization_id, organization_id),
            eq(members.user_id, user_id)
          )
        )
        .returning()

      if (!member) {
        throw new DatabaseError('Member not found', null, 'MEMBER_NOT_FOUND')
      }
    })
  }

  async getMembers(organization_id: string): Promise<Member[]> {
    return this.query(async () => {
      return await this.db!.select()
        .from(members)
        .where(eq(members.organization_id, organization_id))
    })
  }

  async getMember(organization_id: string, user_id: string): Promise<Member | undefined> {
    return this.query(async () => {
      const result = await this.db!.select()
        .from(members)
        .where(
          and(
            eq(members.organization_id, organization_id),
            eq(members.user_id, user_id)
          )
        )
        .limit(1)
      return result[0]
    })
  }
} 