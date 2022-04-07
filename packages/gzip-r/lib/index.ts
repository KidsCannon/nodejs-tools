import path from 'path'
import zlib from 'zlib'
import fs from 'fs'
import os from 'os'
import fsPromises from 'fs/promises'
import pLimit from 'p-limit'

const listFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = []
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true })

  for (const dirent of dirents) {
    const fp = path.join(dir, dirent.name)
    if (dirent.isDirectory()) {
      const childFiles = await listFiles(fp)
      childFiles.forEach((f) => files.push(f))
    } else {
      files.push(fp)
    }
  }
  return files
}

export const gzipR = async (src: string, opts: { concurrency?: number } = {}): Promise<void> => {
  const gZipLimit = pLimit(opts.concurrency ?? os.cpus().length)

  const files = await listFiles(src)
  await Promise.all(
    files.map((file) => {
      return gZipLimit(
        () =>
          new Promise<void>((resolve, reject) => {
            fs.createReadStream(file)
              .pipe(zlib.createGzip())
              .pipe(fs.createWriteStream(file + '.gz', { flags: 'w' }))
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
