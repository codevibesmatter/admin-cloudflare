import { DatabaseError } from '../../lib/errors'

/**
 * Options for creating a new Turso database
 */
interface CreateDatabaseOptions {
  /** Name of the database */
  name: string
  /** Region where the database should be created (defaults to 'lhr' - London) */
  region?: string
  /** Whether this is a schema database */
  isSchema?: boolean
}

/**
 * Represents a Turso database instance
 */
interface TursoDatabase {
  name: string
  hostname: string
  region: string
}

interface TursoResponse {
  database: TursoDatabase
}

/**
 * Low-level service for interacting with Turso's HTTP API.
 * Handles basic database operations like creation and deletion.
 * Does not handle SQL operations or schema management.
 */
export class TursoDatabaseService {
  private readonly orgToken: string
  private readonly logger: Console
  private readonly baseUrl = 'https://api.turso.tech/v1'

  constructor(orgToken: string, logger: Console = console) {
    this.orgToken = orgToken
    this.logger = logger
  }

  private logError(message: string, error: unknown): void {
    this.logger.error(`[TursoDatabaseService] ${message}:`, error)
  }

  /**
   * Creates a new database in Turso
   * @throws {DatabaseError} If the database creation fails
   */
  async createDatabase(options: CreateDatabaseOptions): Promise<TursoDatabase> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/databases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.orgToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: options.name,
          region: options.region || 'lhr',
          ...(options.isSchema ? { is_schema: true } : {})
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new DatabaseError('Failed to create database', error)
      }

      const { database } = await response.json() as TursoResponse
      return database
    } catch (error) {
      this.logError('Failed to create database', error)
      throw error
    }
  }

  /**
   * Deletes a database from Turso
   * @throws {DatabaseError} If the database deletion fails
   */
  async deleteDatabase(name: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/databases/${name}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.orgToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new DatabaseError('Failed to delete database', error)
      }
    } catch (error) {
      this.logError('Failed to delete database', error)
      throw error
    }
  }

  /**
   * Lists all databases in the organization
   * @throws {DatabaseError} If fetching the database list fails
   */
  async listDatabases(): Promise<TursoDatabase[]> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/databases`, {
        headers: {
          Authorization: `Bearer ${this.orgToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new DatabaseError('Failed to list databases', error)
      }

      const { databases } = await response.json() as { databases: TursoDatabase[] }
      return databases
    } catch (error) {
      this.logError('Failed to list databases', error)
      throw error
    }
  }
} 