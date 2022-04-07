import zlib from 'zlib'
import fs from 'fs'
import os from 'os'
import fsPromises from 'fs/promises'
import pLimit from 'p-limit'
import { lsRecursive } from '@kidscannon/ls-recursive'

export const gunzipR = async (src: string, opts: { concurrency?: number } = {}): Promise<void> => {
  const limit = pLimit(opts.concurrency ?? os.cpus().length)

  const files = await lsRecursive(src)
  await Promise.all(
    files.map((file) => {
      return limit(
        () =>
          new Promise<void>((resolve, reject) => {
            fs.createReadStream(file)
              .pipe(zlib.createGunzip())
              .pipe(fs.createWriteStream(file.replace(/\.gz$/, ''), { flags: 'w' }))
              .on('error', reject)
              .on('close', async () => {
                await fsPromises.rm(file)
                resolve()
              })
          }),
      )
    }),
  )
}
