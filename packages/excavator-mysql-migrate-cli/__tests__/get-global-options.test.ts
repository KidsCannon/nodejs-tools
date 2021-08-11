import { getGlobalOptions } from '../bin/get-global-options'

describe('getGlobalOptions', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('when --user` or `password` is not passed as argument', () => {
    it('should throw new Error when `--user` is not passed as an argument', () => {
      const extra = ['migrate']
      const host = 'localhost'
      const port = 8080
      const password = 'password'
      const database = 'test'

      const argv = [...extra, '--host', host, '--port', `${port}`, '--password', password, '--database', database]

      expect(() => {
        getGlobalOptions(argv)
      }).toThrow('user, database values are required')
    })

    it('should throw new Error when `--database` is not passed as an argument', () => {
      const extra = ['migrate']
      const host = 'localhost'
      const port = 8080
      const user = 'root'
      const password = 'password'

      const argv = [...extra, '--host', host, '--port', `${port}`, '--user', user, '--password', password]

      expect(() => {
        getGlobalOptions(argv)
      }).toThrow('user, database values are required')
    })
  })

  describe('when `--host` and `port` and `--user` and `password` and `database` are passed as arguments', () => {
    it('should return that value set when command line arguments', () => {
      const extra = ['migrate']
      const host = 'localhost'
      const port = 8080
      const user = 'root'
      const password = 'password'
      const database = 'test'

      const argv = [
        ...extra,
        '--host',
        host,
        '--port',
        `${port}`,
        '--user',
        user,
        '--password',
        password,
        '--database',
        database,
      ]

      const opts = getGlobalOptions(argv)

      expect(opts).toEqual({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        extra: extra,
      })
    })

    it('should return that value set when process env', () => {
      const extra = ['migrate']
      const argv = [...extra]
      const host = 'localhost'
      const port = 8080
      const user = 'root'
      const password = 'password'
      const database = 'test'

      process.env.MYSQL_HOST = host
      process.env.MYSQL_PORT = `${port}`
      process.env.MYSQL_USER = user
      process.env.MYSQL_PASSWORD = password
      process.env.MYSQL_DATABASE = database

      const opts = getGlobalOptions(argv)

      expect(opts).toEqual({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        extra: extra,
      })
    })

    it('should return the value of the commandline arguments with priority when command line arguments and process env', () => {
      const extra = ['migrate']
      const host = 'localhost'
      const port = 8080
      const user = 'root'
      const password = 'password'
      const database = 'test'

      const argv = [
        ...extra,
        '--host',
        host,
        '--port',
        `${port}`,
        '--user',
        user,
        '--password',
        password,
        '--database',
        database,
      ]

      process.env.MYSQL_HOST = '127.0.0.1'
      process.env.MYSQL_PORT = `9090`
      process.env.MYSQL_USER = 'user2'
      process.env.MYSQL_PASSWORD = 'password2'
      process.env.MYSQL_DATABASE = 'test2'

      const opts = getGlobalOptions(argv)

      expect(opts).toEqual({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        extra: extra,
      })
    })
  })

  describe('when `--host` and `port` and `password` are not passed as arguments', () => {
    it('should return value with the default value set', () => {
      const extra = ['migrate']
      const user = 'root'
      const database = 'test'
      // default value sets
      const host = 'localhost'
      const port = 3306
      const password = ''

      const argv = [...extra, '--user', user, '--database', database]

      const opts = getGlobalOptions(argv)

      expect(opts).toEqual({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        extra: extra,
      })
    })
  })
})
