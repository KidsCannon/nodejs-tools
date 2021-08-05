import { getCreateOptions } from '../bin/get-create-options'

describe('getCreateOptions', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('when `--character-set` and `--collate` are passed as arguments', () => {
    it('should return that value set when command line arguments', () => {
      const characterSet = 'utf8mb4'
      const collate = 'utf8mb4_bin'
      const argv = ['create', '--character-set', characterSet, '--collate', collate]

      const opts = getCreateOptions(argv)

      expect(opts).toEqual({
        characterSet: characterSet,
        collate: collate,
      })
    })

    it('should return that value set when process env', () => {
      const characterSet = 'utf8mb4'
      const collate = 'utf8mb4_bin'
      const argv = ['create']

      process.env.MYSQL_CHARACTER_SET = characterSet
      process.env.MYSQL_COLLATE = collate

      const opts = getCreateOptions(argv)

      expect(opts).toEqual({
        characterSet: characterSet,
        collate: collate,
      })
    })

    it('should return the value of the commandline arguments with priority when command line arguments and process env', () => {
      const characterSet = 'utf8mb4'
      const collate = 'utf8mb4_bin'
      const argv = ['create', '--character-set', characterSet, '--collate', collate]
      process.env.MYSQL_CHARACTER_SET = 'utf8'
      process.env.MYSQL_COLLATE = 'utf8_general_ci'

      const opts = getCreateOptions(argv)

      expect(opts).toEqual({
        characterSet: characterSet,
        collate: collate,
      })
    })
  })
})
