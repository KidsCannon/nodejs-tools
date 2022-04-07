import { s3DirectoryUpload } from '../lib'
import path from 'path'
import {
  CreateBucketCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { StartedTestContainer } from 'testcontainers/dist/test-container'
import { GenericContainer } from 'testcontainers'
import { paginate } from '@kidscannon/paginate'
import { notEmpty } from '@kidscannon/not-empty'
import { streamReadAll } from '@kidscannon/stream-read-all'

describe('s3-directory-upload', () => {
  jest.setTimeout(2 * 60 * 1000)

  let container: StartedTestContainer

  beforeAll(async () => {
    container = await new GenericContainer('minio/minio:RELEASE.2022-04-01T03-41-39Z')
      .withEnv('MINIO_ACCESS_KEY', 'access_key_01')
      .withEnv('MINIO_SECRET_KEY', 'secret_key_01')
      .withExposedPorts(9000)
      .withCmd(['server', '/data'])
      .start()
  })

  it('works', async () => {
    const host = container?.getHost()
    const port = container?.getMappedPort(9000)

    const client = new S3Client({
      region: 'us-east-1',
      endpoint: `http://${host}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'access_key_01',
        secretAccessKey: 'secret_key_01',
      },
    })

    await client.send(
      new CreateBucketCommand({
        Bucket: 'testx',
      }),
    )

    const testdata = path.join(__dirname, '..', '__tests__', 'testdata')
    await s3DirectoryUpload(path.join(testdata, '001'), { client, bucket: 'testx', prefix: 'p' })

    const output: (string[] | undefined)[] = []
    for await (const res of paginate<ListObjectsV2CommandInput, ListObjectsV2CommandOutput>({
      input: { Bucket: 'testx' },
      getOutput: (input) => client.send(new ListObjectsV2Command(input)),
      getNextInput: (input, output) =>
        output.NextContinuationToken ? { ...input, ContinuationToken: output.NextContinuationToken } : null,
    })) {
      output.push(res.Contents?.map((content) => content?.Key)?.filter(notEmpty))
    }
    expect(output).toEqual([['p/a.txt', 'p/b.txt', 'p/c/x.txt']])

    {
      const res = await client.send(new GetObjectCommand({ Bucket: 'testx', Key: 'p/a.txt' }))
      expect(Buffer.concat(await streamReadAll(res.Body)).toString('utf-8')).toBe('01\n02\n03\n')
    }
    {
      const res = await client.send(new GetObjectCommand({ Bucket: 'testx', Key: 'p/b.txt' }))
      expect(Buffer.concat(await streamReadAll(res.Body)).toString('utf-8')).toBe('aa\nbb\ncc\n')
    }
    {
      const res = await client.send(new GetObjectCommand({ Bucket: 'testx', Key: 'p/c/x.txt' }))
      expect(Buffer.concat(await streamReadAll(res.Body)).toString('utf-8')).toBe('xxx\nyyy\nzzz\n')
    }
  })
})
