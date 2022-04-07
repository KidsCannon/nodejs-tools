#!/usr/bin/env node

import { create, drop, migrate } from '@kidscannon/mysql-migrate'

import { getCreateOptions } from './get-create-options'
import { getGlobalOptions } from './get-global-options'
import { getMigrateOptions } from './get-migrate-options'

const main = async (argv_: string[]) => {
  const opts = getGlobalOptions(argv_.slice(2))
  const extraOpts = opts.extra
  const subCommand = extraOpts.shift()

  switch (subCommand) {
    case 'create':
      const createOpts = getCreateOptions(extraOpts)
      await create(opts, createOpts)
      break
    case 'drop':
      await drop(opts)
      break
    case 'migrate':
      await migrate(opts, getMigrateOptions(extraOpts))
      break
    default:
      throw new Error(`The ${subCommand} subcommand does not exist`)
  }

  return 0
}

const handleRejection = async (err: any) => {
  if (err) {
    if (err instanceof Error) handleUnexpected(err)
    else console.error(`An unexpected rejection occurred\n  ${err}`)
  } else {
    console.error('An unexpected empty rejection occurred')
  }
  process.exit(1)
}

const handleUnexpected = (err: Error) => {
  console.error(`An unexpected error occurred!\n  ${err.stack}`)
  process.exit(1)
}

process.on('unhandledRejection', handleRejection)
process.on('uncaughtException', handleUnexpected)

main(process.argv)
  .then((exitCode) => (process.exitCode = exitCode))
  .catch(handleUnexpected)
