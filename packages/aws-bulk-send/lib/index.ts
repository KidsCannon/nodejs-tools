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
}): Promise<[Input, Output][]> => {
  const limit = pLimit(options?.concurrency ?? 1000)
  return Promise.all(commands.map(async (cmd) => [cmd.input, await limit(() => client.send(cmd))]))
}
