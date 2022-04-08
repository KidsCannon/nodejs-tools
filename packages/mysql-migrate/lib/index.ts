import { createReadStream, readdirSync } from 'fs'
import path from 'path'

import { buildCreateDatabaseSql } from './build-create-database-sql'
import { MysqlInvoker } from './mysql-invorker'
import { parseFileName } from './parse-file-name'
import { readSql } from './read-sql'
import { SchemaVersionRepository } from './schema-version-repository'
import { StopWatch } from './stop-watch'
import { ConnectionConfig, CreateDatabaseConfig, migrateConfig, MigrationFileName, SchemaVersion } from './types'

export const create = async (config: ConnectionConfig, createConfig: CreateDatabaseConfig): Promise<void> => {
  await new MysqlInvoker(config).invoke(async (conn) => {
    const [sql, values] = buildCreateDatabaseSql(config.database, createConfig)
    await conn.query(sql, values)
  })
}

export const drop = async (config: ConnectionConfig): Promise<void> => {
  await new MysqlInvoker(config).invoke(async (conn) => {
    await conn.query(`DROP DATABASE ${config.database}`)
  })
}

export const migrate = async (config: ConnectionConfig, migrateConfig: migrateConfig): Promise<void> => {
  const migrationFileMap = readdirSync(migrateConfig.migrationDirectory).reduce((acc, file) => {
    const fileName = parseFileName(file)
    acc.set(fileName.version, fileName)
    return acc
  }, new Map<string, MigrationFileName>())

  await new MysqlInvoker(config).invoke(async (conn) => {
    const schemaVersionRepo = new SchemaVersionRepository(conn)

    await schemaVersionRepo.createTableIfNotExists()

    const schemaVersions = await schemaVersionRepo.findAll()
    const appliedMigrationVersions = schemaVersions.map((v) => v.version)
    const latestSchemaVersion = schemaVersions[schemaVersions.length - 1]
    const maxAppliedVersion = latestSchemaVersion ? latestSchemaVersion.version : 0
    const maxInstalledRank = latestSchemaVersion ? latestSchemaVersion.installedRank : 0

    schemaVersions.forEach((version) => checkSchemaVersion(migrateConfig.migrationDirectory, migrationFileMap, version))

    const nonAppliedMigrationVersions = [...migrationFileMap.keys()].filter(
      (key) => !appliedMigrationVersions.includes(key),
    )

    if (nonAppliedMigrationVersions.find((version) => parseInt(version, 10) < maxAppliedVersion) != null) {
      throw new Error('schema_versionのテーブルに保存されている最新のバージョンより古いバージョンが指定されています')
    }

    const stopWatch = new StopWatch()

    for (const [index, version] of nonAppliedMigrationVersions.entries()) {
      stopWatch.start()

      const info = migrationFileMap.get(version)
      if (!info) {
        throw new Error('指定されたversionのmigrationファイルが存在しません')
      }

      const filePath = path.join(migrateConfig.migrationDirectory, info.fileName)
      const [sql, checkSum] = await readSql(createReadStream(filePath))

      let isSuccess = true
      try {
        await conn.query(sql)
      } catch (error) {
        isSuccess = false
        throw error
      } finally {
        stopWatch.end()

        await schemaVersionRepo.create({
          installedRank: maxInstalledRank + index + 1,
          version: info.version,
          description: info.description,
          type: 'SQL',
          script: info.fileName,
          checksum: checkSum,
          installedBy: config.user,
          installedOn: new Date(),
          executionTime: stopWatch.getTotal(),
          success: isSuccess,
        })
      }
    }
  }, true)
}

const checkSchemaVersion = async (
  migrationFolder: string,
  localFiles: Map<string, MigrationFileName>,
  schemaVersion: SchemaVersion,
): Promise<void> => {
  const info = localFiles.get(schemaVersion.version)
  // TODO: エラーメッセージ（エラー対象の各種情報も出力すること）
  if (!info) {
    throw new Error('schema_versionのテーブルに存在するバージョンのマイグレーションファイルがない')
  }

  if (info.fileName !== schemaVersion.script) {
    // TODO: エラーメッセージ（エラー対象の各種情報も出力すること）
    throw new Error('schema_versionのテーブルに保存されているファイル名とマイグレーションのファイル名が一致しない')
  }

  const checksum = (await readSql(createReadStream(path.join(migrationFolder, info.fileName))))[1]
  if (checksum !== schemaVersion.checksum) {
    // TODO: エラーメッセージ（エラー対象の各種情報も出力すること）
    throw new Error(
      'schema_versionのテーブルに保存されているチェックサムとマイグレーションファイルのチェックサムが一致しない',
    )
  }
}
