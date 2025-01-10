import { BaseService, type ServiceConfig } from './base'
import type { Member } from '../schema/index'
import { DatabaseError } from '../../lib/errors'
import { generateId } from '../../lib/utils'

export type OrganizationRoleType = 'owner' | 'admin' | 'member'

export interface AddMemberInput {
  organization_id: string
  user_id: string
  role: OrganizationRoleType
}

// Helper function to convert database row to Member type
function rowToMember(row: Record<string, any>): Member {
  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    role: row.role as OrganizationRoleType,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export class MemberService extends BaseService {
  constructor(config: ServiceConfig) {
    super(config)
  }

  async addMember(input: AddMemberInput): Promise<Member> {
    return this.query(async () => {
      const now = new Date().toISOString()
      const id = generateId()
      const result = await this.db!.execute({
        sql: `
          INSERT INTO members (
            id, organization_id, user_id, role,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          id,
          input.organization_id,
          input.user_id,
          input.role,
          now,
          now
        ]
      })

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to add member')
      }

      return rowToMember(result.rows[0] as Record<string, any>)
    })
  }

  async removeMember(organization_id: string, user_id: string): Promise<void> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: `
          DELETE FROM members 
          WHERE organization_id = ? AND user_id = ?
          RETURNING *
        `,
        args: [organization_id, user_id]
      })

      if (result.rows.length === 0) {
        throw new DatabaseError('Member not found', null, 'MEMBER_NOT_FOUND')
      }
    })
  }

  async getMembers(organization_id: string): Promise<Member[]> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM members WHERE organization_id = ?',
        args: [organization_id]
      })
      return result.rows.map(row => rowToMember(row as Record<string, any>))
    })
  }

  async getMember(organization_id: string, user_id: string): Promise<Member | undefined> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: `
          SELECT * FROM members 
          WHERE organization_id = ? AND user_id = ?
          LIMIT 1
        `,
        args: [organization_id, user_id]
      })
      const row = result.rows[0]
      return row ? rowToMember(row as Record<string, any>) : undefined
    })
  }
} 