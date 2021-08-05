import { ConnectionConfig, CreateDatabaseConfig } from './types'

export const buildCreateDatabaseSql = (
  config: ConnectionConfig,
  createConfig: CreateDatabaseConfig,
): [sql: string, values: any[]] => {
  const sql = [`CREATE DATABASE ??`]
  const values = [config.database]

  if (createConfig.characterSet) {
    sql.push('CHARACTER SET ??')
    values.push(createConfig.characterSet)
  }

  if (createConfig.collate) {
    sql.push('COLLATE ??')
    values.push(createConfig.collate)
  }

  return [sql.join(' '), values]
}
