import { readlineAsync } from '../lib'
import fs from 'fs'
import path from 'path'

describe('readline-async', () => {
  it ('works', async () => {
    let data = ''
    await readlineAsync({ input: fs.createReadStream(path.join(__dirname, 'testdata', '01.txt')), terminal: false }, (line) => {
      data += line + "\n"
    })
    expect(data).toEqual("aaa\nbbb\nccc\n01\n")
  })
})
