import { migrate } from '../../lib'

describe('migrate', () => {
  it('test', () => {
    migrate(
      {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'test',
      },
      {
        migrationDirectory: './migrations',
      },
    )
  })
})
