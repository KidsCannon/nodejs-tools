export interface GlobalOptions {
  host: string
  port: number
  user: string
  password?: string
  database: string
  ssl?: string
  extra: string[]
}

export interface CreateOptions {
  characterSet?: string
  collate?: string
}

export interface MigrateOptions {
  migrationDirectory: string
}
