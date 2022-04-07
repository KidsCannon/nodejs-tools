import path from 'path'

import { lsRecursive } from '../lib'

describe('ls-recursive', () => {
  it('works', async () => {
    const testdata = path.join(__dirname, '..', '__tests__', 'testdata')
    const files = await lsRecursive(path.join(testdata, '001'))
    expect(files).toEqual(['a.txt', 'b.txt', 'c/x.txt'].map((f) => path.join(testdata, '001', f)))
  })
})
