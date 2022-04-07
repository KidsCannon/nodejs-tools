import path from 'path'
import fs from 'fs'
import { streamReadAll } from '../lib'

describe('stream-read-all', () => {
  it('works', async () => {
    for (const [fp, data] of [
      ['a.txt', '01\n02\n03\n'],
      ['b.txt', 'aa\nbb\ncc\n'],
      [path.join('c', 'x.txt'), 'xxx\nyyy\nzzz\n'],
    ] as const) {
      const stream = fs.createReadStream(path.join(__dirname, 'testdata', '001', fp))
      expect(Buffer.concat(await streamReadAll(stream)).toString('utf-8')).toBe(data)
    }
  })
})
