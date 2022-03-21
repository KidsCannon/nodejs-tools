export interface ConnectionConfig {
  host: string
  port: number
  user: string
  password?: string
  database: string
  ssl?: string
}

export interface CreateDatabaseConfig {
  characterSet?: string
  collate?: string
}

export interface migrateConfig {
  migrationDirectory: string
}

export interface MigrationFileName {
  fileName: string
  version: string
  description: string
}

export interface SchemaVersion {
  installedRank: number
  version: string
  description: string
  type: string
  script: string
  checksum: number
  installedBy: string
  installedOn: Date
  executionTime: number
  success: boolean
}
