import { lsRecursive } from '@kidscannon/ls-recursive'
import { execSync } from 'child_process'
import fsPromises from 'fs/promises'
import path from 'path'

import { gunzipR } from '../lib'

describe('gunzip-r', () => {
  it('works', async () => {
    const testdata = path.join(__dirname, '..', '__tests__', 'testdata')
    execSync(`rm -fr ${path.join(testdata, '001-stg')}`)
    execSync(`cp -r ${path.join(testdata, '001')} ${path.join(testdata, '001-stg')}`)
    await gunzipR(path.join(testdata, '001-stg'))

    expect(await lsRecursive(path.join(testdata, '001-stg'))).toEqual(
      ['a.txt', 'b.txt', 'c/x.txt'].map((f) => path.join(testdata, '001-stg', f)),
    )
    expect((await fsPromises.readFile(path.join(testdata, '001-stg', 'a.txt'))).toString()).toEqual(`01\n02\n03\n`)
    expect((await fsPromises.readFile(path.join(testdata, '001-stg', 'b.txt'))).toString()).toEqual(`aa\nbb\ncc\n`)
    expect((await fsPromises.readFile(path.join(testdata, '001-stg', 'c', 'x.txt'))).toString()).toEqual(
      `xxx\nyyy\nzzz\n`,
    )
  })
})
