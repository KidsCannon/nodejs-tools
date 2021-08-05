import { crc32 } from 'crc'
import { ReadStream } from 'fs'
import { createInterface } from 'readline'

// const test = `CREATE TABLE ... (
// );`
// const stream = new Readable({
//   read() {
//     this.push(Buffer.from(text, 'utf8'));
//     this.push(null);
//   }
// })
// createChecksum(stream) === '123'

export const readSql = async (stream: ReadStream): Promise<[sql: string, checksum: number]> => {
  return new Promise((resolve, reject) => {
    const readInterface = createInterface({
      input: stream,
      terminal: false,
    })

    let sql = ''
    let checksum: number
    readInterface.on('line', (line) => {
      sql += `${line}\n`
      checksum = crc32(line, checksum)
    })

    readInterface.on('close', () => {
      if (checksum == null) {
        return reject(new Error())
      }
      const i32Checksum = Int32Array.from([checksum])[0]
      if (i32Checksum == null) return reject(new Error())
      resolve([sql, i32Checksum])
    })

    readInterface.on('error', (error) => reject(error))
  })
}
