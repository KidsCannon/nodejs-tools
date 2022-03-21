import { CreateOptions } from './types'
import arg from 'arg'

export const getCreateOptions = (argv_: string[]): CreateOptions => {
  const argv = arg(
    {
      '--character-set': String,
      '--collate': String,
    },
    {
      argv: argv_,
      permissive: true,
    },
  )

  const characterSet = argv['--character-set'] || process.env['MYSQL_CHARACTER_SET']
  const collate = argv['--collate'] || process.env['MYSQL_COLLATE']

  return {
    characterSet: characterSet,
    collate: collate,
  }
}
