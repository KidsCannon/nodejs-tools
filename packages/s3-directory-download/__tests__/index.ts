import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { lsRecursive } from '@kidscannon/ls-recursive'
import fs from 'fs'
import path from 'path'
import { GenericContainer } from 'testcontainers'
import { StartedTestContainer } from 'testcontainers/dist/test-container'

import { s3DirectoryDownload } from '../lib'

describe('s3-directory-download', () => {
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

    await client.send(
      new PutObjectCommand({
        Bucket: 'testx',
        Key: 'p/a.txt',
        Body: 'aaa',
      }),
    )
    await client.send(
      new PutObjectCommand({
        Bucket: 'testx',
        Key: 'p/b.txt',
        Body: 'bbb',
      }),
    )
    await client.send(
      new PutObjectCommand({
        Bucket: 'testx',
        Key: 'p/c/x.txt',
        Body: 'ccc',
      }),
    )

    const testdata = path.join(__dirname, '..', '__tests__', 'testdata')
    fs.rmSync(path.join(testdata, '01-stg'), { recursive: true, force: true })
    await s3DirectoryDownload({ client, bucket: 'testx', prefix: 'p' }, path.join(testdata, '01-stg'))

    const files = await lsRecursive(path.join(testdata, '01-stg'))
    expect(files).toEqual(['a.txt', 'b.txt', 'c/x.txt'].map((f) => path.join(path.join(testdata, '01-stg'), f)))

    expect(fs.readFileSync(path.join(testdata, '01-stg', 'a.txt')).toString()).toBe('aaa')
    expect(fs.readFileSync(path.join(testdata, '01-stg', 'b.txt')).toString()).toBe('bbb')
    expect(fs.readFileSync(path.join(testdata, '01-stg', 'c', 'x.txt')).toString()).toBe('ccc')
  })
})
