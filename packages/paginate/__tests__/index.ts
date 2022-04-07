import { paginate } from '../lib'

const list = (data: number[], params: { offset: number; limit: number }): Promise<number[]> => {
  return Promise.resolve(data.slice(params.offset, params.offset + params.limit))
}

describe('paginate', () => {
  it('works', async () => {
    {
      const output: number[][] = []
      for await (const res of paginate<{ offset: number; limit: number }, number[]>({
        input: { offset: 0, limit: 2 },
        getOutput: (input) => list([0, 1, 2, 3, 4], input),
        getNextInput: (input, output) => {
          if (output.length < input.limit) return null
          else return { ...input, offset: input.offset + input.limit }
        },
      })) {
        output.push(res)
      }
      expect(output).toEqual([[0, 1], [2, 3], [4]])
    }
    {
      const output: number[][] = []
      for await (const res of paginate<{ offset: number; limit: number }, number[]>({
        input: { offset: 0, limit: 2 },
        getOutput: (input) => list([0, 1, 2, 3], input),
        getNextInput: (input, output) => {
          if (output.length < input.limit) return null
          else return { ...input, offset: input.offset + input.limit }
        },
      })) {
        output.push(res)
      }
      expect(output).toEqual([[0, 1], [2, 3], []])
    }
  })
})
