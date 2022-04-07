import { notEmpty } from '../lib'

describe('not-empty', () => {
  it('reject only null or undefined', async () => {
    expect([0, 1, '', 'a', undefined, void 0, null, [], {}].filter(notEmpty)).toEqual([0, 1, '', 'a', [], {}])
  })
})
