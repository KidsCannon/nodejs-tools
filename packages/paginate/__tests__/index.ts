import { s3DirectoryUpload, s3ListObjectsV2WithPaging } from '../lib'
import path from 'path'
import { CreateBucketCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { StartedTestContainer } from 'testcontainers/dist/test-container'
import { GenericContainer } from 'testcontainers'

const notEmpty = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

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

    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: 'testx',
      }),
    )
    let output: string[] = []

    for await (const res of s3ListObjectsV2WithPaging(client, { Bucket: 'testx' })) {
      output = [...output, ...(res.Contents?.map((content) => content?.Key)?.filter(notEmpty) ?? [])]
    }
    console.log(output)
    console.log(res.Contents)
  })
})
