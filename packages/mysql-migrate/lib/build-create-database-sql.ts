import { CreateDatabaseConfig } from './types'

export const buildCreateDatabaseSql = (
  database: string,
  createConfig: CreateDatabaseConfig,
): [sql: string, values: any[]] => {
  const sql = [`CREATE DATABASE ??`]
  const values = [database]

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
