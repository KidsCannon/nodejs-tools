import { migrate } from '../../lib'
import { StartedTestContainer } from 'testcontainers/dist/test-container'
import { GenericContainer } from 'testcontainers'

describe('migrate', () => {
  jest.setTimeout(2 * 60 * 1000)

  let container: StartedTestContainer

  beforeAll(async (done) => {
    container = await new GenericContainer('mysql:5.7')
      .withEnv('MYSQL_DATABASE', 'test')
      .withEnv('MYSQL_ALLOW_EMPTY_PASSWORD', '1')
      .withExposedPorts(3306)
      .start()
    done()
  })

  it('test', async () => {
    const host = container?.getHost()
    const port = container?.getMappedPort(3306)

    await migrate(
      {
        host,
        port,
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
