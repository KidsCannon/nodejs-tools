export async function* paginate<Input, Output>(params: {
  input: Input
  getOutput: (input: Input) => Promise<Output>
  getNextInput: (input: Input, output: Output) => Input | null
}): AsyncGenerator<Output> {
  const output = await params.getOutput(params.input)
  const nextInput = params.getNextInput(params.input, output)
  if (nextInput) {
    yield output
    yield* paginate({ getOutput: params.getOutput, getNextInput: params.getNextInput, input: nextInput })
  } else {
    yield output
  }
}
