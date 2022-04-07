import { lsRecursive } from '@kidscannon/ls-recursive'
import fs from 'fs'
import fsPromises from 'fs/promises'
import os from 'os'
import pLimit from 'p-limit'
import zlib from 'zlib'

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
