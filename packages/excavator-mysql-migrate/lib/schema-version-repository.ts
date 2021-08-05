import { Connection, RowDataPacket } from 'mysql2/promise'

import { SchemaVersion } from './types'

export class SchemaVersionRepository {
  private static readonly tableName = 'schema_version'

  constructor(public conn: Connection) {}

  public toModel(record: RowDataPacket): SchemaVersion {
    return {
      installedRank: record.installed_rank,
      version: record.version,
      description: record.description,
      type: record.type,
      script: record.script,
      checksum: record.checksum,
      installedBy: record.installed_by,
      installedOn: record.installed_on,
      executionTime: record.execution_time,
      success: record.success,
    }
  }

  async findAll(): Promise<SchemaVersion[]> {
    const [schemaVersions] = await this.conn.query<RowDataPacket[]>(`SELECT * FROM ?? ORDER BY installed_rank ASC`, [
      SchemaVersionRepository.tableName,
    ])
    return schemaVersions.map((schemaVersion) => this.toModel(schemaVersion))
  }

  async createTableIfNotExists(): Promise<void> {
    await this.conn.query(
      `
             CREATE TABLE IF NOT EXISTS schema_version(
              installed_rank int(11) NOT NULL,
              version varchar(50) DEFAULT NULL,
              description varchar(200) NOT NULL,
              type varchar(20) NOT NULL,
              script varchar(1000) NOT NULL,
              checksum int(11) DEFAULT NULL,
              installed_by varchar(100) NOT NULL,
              installed_on timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
              execution_time int(11) NOT NULL,
              success tinyint(1) NOT NULL,
              PRIMARY KEY (installed_rank),
              KEY schema_version_s_idx (success)
            ) ENGINE=InnoDB
          `,
      [],
    )
  }

  async create(schemaVersion: SchemaVersion): Promise<void> {
    await this.conn.query('INSERT INTO ?? SET ?', [
      SchemaVersionRepository.tableName,
      {
        installed_rank: schemaVersion.installedRank,
        version: schemaVersion.version,
        description: schemaVersion.description,
        type: schemaVersion.type,
        script: schemaVersion.script,
        checksum: schemaVersion.checksum,
        installed_by: schemaVersion.installedBy,
        installed_on: schemaVersion.installedOn,
        execution_time: schemaVersion.executionTime,
        success: schemaVersion.success,
      },
    ])
  }
}
