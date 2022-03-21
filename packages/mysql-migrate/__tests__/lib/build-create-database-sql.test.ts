import { buildCreateDatabaseSql } from '../../lib/build-create-database-sql'

describe('buildCreateDatabaseSql', () => {
  it('should return values that are not set when `characterSet` and `collate` are not set in create config', async () => {
    const createConfig = {
      characterSet: '',
      collate: '',
    }

    const [sql, values] = buildCreateDatabaseSql('test', createConfig)

    expect(sql).toEqual(`CREATE DATABASE ??`)
    expect(values).toEqual(['test'])
  })

  it('should return values that are set when `characterSet` is set in create config', () => {
    const characterSet = 'utf8mb4'
    const createConfig = {
      characterSet: characterSet,
      collate: '',
    }

    const [sql, values] = buildCreateDatabaseSql('test', createConfig)

    expect(sql).toEqual(`CREATE DATABASE ?? CHARACTER SET ??`)
    expect(values).toEqual(['test', characterSet])
  })

  it('should return values that are set when `characterSet` and `collate` set in create config', () => {
    const characterSet = 'utf8mb4'
    const collate = 'utf8mb4_bin'
    const createConfig = {
      characterSet: characterSet,
      collate: collate,
    }

    const [sql, values] = buildCreateDatabaseSql('test', createConfig)

    expect(sql).toEqual(`CREATE DATABASE ?? CHARACTER SET ?? COLLATE ??`)
    expect(values).toEqual(['test', characterSet, collate])
  })
})
