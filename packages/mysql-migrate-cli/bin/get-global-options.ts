import { GlobalOptions } from './types'
import arg from 'arg'

export const getGlobalOptions = (argv_: string[]): GlobalOptions => {
  const argv = arg(
    {
      '--host': String,
      '--port': String,
      '--user': String,
      '--password': String,
      '--database': String,
      '--ssl': String,
    },
    {
      argv: argv_,
      permissive: true,
    },
  )

  const host = argv['--host'] || process.env['MYSQL_HOST'] || 'localhost'
  const port = parseInt(argv['--port'] || process.env['MYSQL_PORT'] || '3306', 10)
  const user = argv['--user'] || process.env['MYSQL_USER']
  const password = argv['--password'] || process.env['MYSQL_PASSWORD']
  const database = argv['--database'] || process.env['MYSQL_DATABASE']
  const ssl = argv['--ssl'] || process.env['MYSQL_SSL']

  if (!user || !database) {
    throw new Error('user, database values are required')
  }

  return {
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    ssl,
    extra: argv._,
  }
}
