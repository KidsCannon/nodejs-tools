import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { GenericContainer } from 'testcontainers'
import { StartedTestContainer } from 'testcontainers/dist/test-container'

import { create, drop, migrate } from '../lib'

const selectTableNames = async (conn: Connection, database: string): Promise<string[]> => {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT DISTINCT (`table_name`) FROM `information_schema`.`tables` WHERE `table_schema` = ? ORDER BY `table_name` ASC',
    database,
  )
  return rows.map((row) => row.table_name)
}
const selectSchemata = async (
  conn: Connection,
): Promise<{ schema_name: string; default_character_set_name: string; default_collation_name: string }[]> => {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT `schema_name`, `default_character_set_name` , `default_collation_name` FROM `information_schema`.`schemata`',
  )
  return rows as { schema_name: string; default_character_set_name: string; default_collation_name: string }[]
}

describe('integration test', () => {
  jest.setTimeout(2 * 60 * 1000)

  let container: StartedTestContainer

  beforeAll(async () => {
    container = await new GenericContainer('mysql:5.7')
      .withEnv('MYSQL_ALLOW_EMPTY_PASSWORD', '1')
      .withExposedPorts(3306)
      .start()
  })

  it('create -> migrate -> drop', async () => {
    const user = 'root'
    const host = container?.getHost()
    const port = container?.getMappedPort(3306)

    const infoConn = await mysql.createConnection({ host, port, user, database: 'information_schema' })
    try {
      const config = { host, port, user, database: 'test' }

      await create(config, { characterSet: 'utf8mb4', collate: 'utf8mb4_bin' })
      expect(await selectSchemata(infoConn)).toContainEqual({
        schema_name: 'test',
        default_character_set_name: 'utf8mb4',
        default_collation_name: 'utf8mb4_bin',
      })

      await migrate(config, { migrationDirectory: './__tests__/testdata/migrations' })
      expect(await selectTableNames(infoConn, 'test')).toEqual(['post', 'schema_version', 'user'])

      const [rows] = await infoConn.query('SELECT * FROM `test`.`schema_version`')
      expect(rows).toEqual([
        {
          installed_rank: 1,
          version: '1',
          description: 'create user',
          type: 'SQL',
          script: 'V1__create_user.sql',
          checksum: -1754494796,
          installed_by: user,
          installed_on: expect.any(Date),
          execution_time: expect.any(Number),
          success: 1,
        },
        {
          installed_rank: 2,
          version: '2',
          description: 'create post',
          type: 'SQL',
          script: 'V2__create_post.sql',
          checksum: -1886697914,
          installed_by: user,
          installed_on: expect.any(Date),
          execution_time: expect.any(Number),
          success: 1,
        },
      ])

      await drop(config)
      expect(await selectTableNames(infoConn, 'test')).toEqual([])
      expect(await selectSchemata(infoConn)).not.toContainEqual({
        schema_name: 'test',
        default_character_set_name: 'utf8mb4',
        default_collation_name: 'utf8mb4_bin',
      })
    } finally {
      await infoConn.end()
    }
  })
})
