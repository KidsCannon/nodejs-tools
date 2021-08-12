import { ConnectionConfig } from './types'
import mysql, { Connection } from 'mysql2/promise'

export class MysqlInvoker {
  constructor(public config: ConnectionConfig) {}

  async invoke(fn: (conn: Connection) => Promise<any>, connectDatabase = false): Promise<any> {
    const conn = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      ...(connectDatabase ? { database: this.config.database } : {}),
      multipleStatements: true,
    })
    try {
      return await fn(conn)
    } finally {
      await conn.end()
    }
  }
}
