import { execSync } from 'child_process'
import fsPromises from 'fs/promises'
import path from 'path'

import { gzipR } from '../lib'

describe('gzip-r', () => {
  it('works', async () => {
    const testdata = path.join(__dirname, '..', '__tests__', 'testdata')
    execSync(`rm -fr ${path.join(testdata, '001-stg')}`)
    execSync(`cp -r ${path.join(testdata, '001')} ${path.join(testdata, '001-stg')}`)
    await gzipR(path.join(testdata, '001-stg'))

    {
      const files = await fsPromises.readdir(path.join(testdata, '001-stg'))
      expect(files).toEqual(['a.txt.gz', 'b.txt.gz', 'c'])
    }
    {
      const files = await fsPromises.readdir(path.join(testdata, '001-stg', 'c'))
      expect(files).toEqual(['x.txt.gz'])
    }

    execSync(`gunzip -r ${path.join(testdata, '001-stg')}`)
    execSync(`diff -r  ${path.join(testdata, '001-stg')}  ${path.join(testdata, '001')}`)
  })
})
