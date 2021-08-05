export interface GlobalOptions {
  host: string
  port: number
  user: string
  password: string
  database: string
  extra: string[]
}

export interface CreateOptions {
  characterSet?: string
  collate?: string
}
