import arg from 'arg'
import path from 'path'

import { MigrateOptions } from './types'

export const getMigrateOptions = (argv_: string[]): MigrateOptions => {
  const argv = arg(
    {
      '--migration-directory': String,
    },
    {
      argv: argv_,
      permissive: true,
    },
  )

  const migrationDirectory = argv['--migration-directory'] || path.join(process.cwd(), 'migrations')

  return {
    migrationDirectory,
  }
}
