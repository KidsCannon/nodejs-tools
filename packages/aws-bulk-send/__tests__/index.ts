import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3'

import { awsBulkSend, awsBulkSendT } from '../lib'

const $metadata = {
  httpStatusCode: 200,
}

jest.mock('@aws-sdk/client-s3', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-s3'),
    S3Client: jest.fn(),
  }
})

jest.mocked(S3Client).mockImplementation((): any => {
  return {
    send: (command: GetObjectCommand): GetObjectCommandOutput => {
      return {
        $metadata,
        Body: `${command.input.Bucket}-${command.input.Key}`,
      }
    },
  }
})

describe('awsBulkSend', () => {
  it('works', async () => {
    const client = new S3Client({})
    const res = await awsBulkSend({
      client,
      commands: [
        new GetObjectCommand({ Bucket: 'B1', Key: 'K1' }),
        new GetObjectCommand({ Bucket: 'B3', Key: 'K3' }),
        new GetObjectCommand({ Bucket: 'B2', Key: 'K2' }),
      ],
    })

    expect(res).toEqual([
      [
        { Bucket: 'B1', Key: 'K1' },
        { $metadata, Body: 'B1-K1' },
      ],
      [
        { Bucket: 'B3', Key: 'K3' },
        { $metadata, Body: 'B3-K3' },
      ],
      [
        { Bucket: 'B2', Key: 'K2' },
        { $metadata, Body: 'B2-K2' },
      ],
    ])
  })
})

describe('awsBulkSendT', () => {
  it('works', async () => {
    const client = new S3Client({})
    const res = await awsBulkSendT({
      client,
      transformer: (output: GetObjectCommandOutput) => {
        return { $metadata, Body: `transformed-${output.Body}` }
      },
      commands: [
        new GetObjectCommand({ Bucket: 'B1', Key: 'K1' }),
        new GetObjectCommand({ Bucket: 'B3', Key: 'K3' }),
        new GetObjectCommand({ Bucket: 'B2', Key: 'K2' }),
      ],
    })
    expect(res).toEqual([
      [
        { Bucket: 'B1', Key: 'K1' },
        { $metadata, Body: 'transformed-B1-K1' },
      ],
      [
        { Bucket: 'B3', Key: 'K3' },
        { $metadata, Body: 'transformed-B3-K3' },
      ],
      [
        { Bucket: 'B2', Key: 'K2' },
        { $metadata, Body: 'transformed-B2-K2' },
      ],
    ])
  })
})
