import { Readable } from 'stream'

export const streamReadAll = async <T>(stream: Readable): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const chunks: T[] = []
    stream.on('data', (chunk: T) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(chunks))
  })
}
