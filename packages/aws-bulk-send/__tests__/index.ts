import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'

import { awsBulkSend } from '../lib'

describe('awsS3BulkGet', () => {
  const s3Mock = mockClient(S3Client)

  beforeEach(() => {
    s3Mock.reset()
  })

  it('works', async () => {
    const input = { Bucket: 'bucket', Key: 'key' }
    const output = { Body: 'body' }
    s3Mock.on(GetObjectCommand, input).resolves(output)

    const client = new S3Client({})
    const res = await awsBulkSend({
      client,
      commands: [new GetObjectCommand(input)],
    })

    expect(res).toEqual([[input, output]])
  })
})
