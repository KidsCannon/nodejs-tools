import readline, { ReadLineOptions } from 'readline'

export const readlineAsync = async (opts: ReadLineOptions, fn: (input: string) => void) => {
  return new Promise((resolve, reject) => {
    readline.createInterface(opts).on('line', fn).on('error', reject).on('close', resolve)
  })
}
