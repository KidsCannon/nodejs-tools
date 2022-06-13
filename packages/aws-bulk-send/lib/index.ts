import type { Command } from '@aws-sdk/smithy-client'
import pLimit from 'p-limit'

interface Client<Input, Output> {
  send(cmd: Command<Input, Output, unknown>): Promise<Output>
}

export const awsBulkSend = async <Input, Output>({
  client,
  commands,
  options,
}: {
  client: Client<Input, Output>
  commands: Command<Input, Output, unknown>[]
  options?: { concurrency?: number }
}): Promise<Output[]> => {
  const limit = pLimit(options?.concurrency ?? 1000)
  return Promise.all(commands.map((cmd) => limit(() => client.send(cmd))))
}

export const awsBulkSendT = async <Input, Output, TransformedOutput>({
  client,
  commands,
  transformer,
  options,
}: {
  client: Client<Input, Output>
  commands: Command<Input, Output, unknown>[]
  transformer: (input: Input, output: Output) => TransformedOutput
  options?: { concurrency?: number }
}): Promise<TransformedOutput[]> => {
  const limit = pLimit(options?.concurrency ?? 1000)
  return Promise.all(
    commands.map((cmd) =>limit(async () => transformer(cmd.input, await client.send(cmd)))),
  )
}
