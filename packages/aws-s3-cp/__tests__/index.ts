import {
  CreateBucketCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { lsRecursive } from '@kidscannon/ls-recursive'
import { notEmpty } from '@kidscannon/not-empty'
import { paginate } from '@kidscannon/paginate'
import { streamReadAll } from '@kidscannon/stream-read-all'
import fs from 'fs'
import fsPromises from 'fs/promises'
import * as http from 'http'
import os from 'os'
import path from 'path'
import { GenericContainer } from 'testcontainers'
import { StartedTestContainer } from 'testcontainers/dist/test-container'

import { awsS3Cp } from '../lib'

const awsS3MkTempBucket = async (client: S3Client): Promise<string> => {
  const bucket = `b-${Math.random().toString().replace(/^0\./, '')}`
  await client.send(new CreateBucketCommand({ Bucket: bucket }))
  return bucket
}

const awsS3ListAllKeys = async (client: S3Client, bucket: string, prefix: string): Promise<string[]> => {
  const output: string[] = []
  for await (const res of paginate<ListObjectsV2CommandInput, ListObjectsV2CommandOutput>({
    input: { Bucket: bucket, Prefix: prefix },
    getOutput: (input) => client.send(new ListObjectsV2Command(input)),
    getNextInput: (input, output) =>
      output.NextContinuationToken ? { ...input, ContinuationToken: output.NextContinuationToken } : null,
  })) {
    res.Contents?.map((content) => content?.Key)
      ?.filter(notEmpty)
      ?.forEach((key) => output.push(key))
  }
  return output
}

const awsS3GetObjectString = async (client: S3Client, bucket: string, key: string): Promise<string> => {
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  return Buffer.concat(await streamReadAll(res.Body)).toString('utf-8')
}

const mkdtempBorrow = async <T>(prefix: string, fn: (tmpdir: string) => Promise<T>): Promise<T> => {
  let tmpdir: string | undefined
  try {
    tmpdir = await fsPromises.mkdtemp(prefix)
    return await fn(tmpdir)
  } finally {
    if (tmpdir?.startsWith(prefix)) {
      await fsPromises.rm(tmpdir, { force: true, recursive: true })
    }
  }
}

const waitHttp = (
  url: string,
  testFn: (res: http.IncomingMessage) => boolean | Promise<boolean>,
  intervalMs = 100,
  maxRetry = 10,
): Promise<void> => {
  let retry = 0
  return new Promise((resolve, reject) => {
    const onDone = (timer: NodeJS.Timer) => {
      clearInterval(timer)
      resolve()
    }
    const onError = (timer: NodeJS.Timer, error: Error) => {
      retry++
      if (retry > maxRetry) {
        clearInterval(timer)
        reject(new Error(`waitHttpStatus: GET ${url} retry reach to maxRetry(=${maxRetry})`))
      }
    }
    const i = setInterval(() => {
      const req = http.get(url, async (res) => {
        if (await testFn(res)) onDone(i)
        else onError(i, new Error(`res.statusCode=${res.statusCode}`))
      })
      req.end()
      req.on('error', (e) => {
        onError(i, e)
      })
    }, intervalMs)
  })
}

describe('aws-s3-cp', () => {
  jest.setTimeout(60e3)

  let container: StartedTestContainer
  let client: S3Client

  beforeAll(async () => {
    container = await new GenericContainer('minio/minio:RELEASE.2022-04-01T03-41-39Z')
      .withEnv('MINIO_ACCESS_KEY', 'access_key_01')
      .withEnv('MINIO_SECRET_KEY', 'secret_key_01')
      .withExposedPorts(9000)
      .withCmd(['server', '/data'])
      .start()
    const host = container?.getHost()
    const port = container?.getMappedPort(9000)
    await waitHttp(`http://${host}:${port}/minio/health/live`, (res) => res.statusCode === 200)

    client = new S3Client({
      region: 'us-east-1',
      endpoint: `http://${host}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'access_key_01',
        secretAccessKey: 'secret_key_01',
      },
    })
  })

  afterAll(async () => {
    await container.stop()
  })

  it('aws cp --recursive <local> s3://<bucket>/<key>', async () => {
    await mkdtempBorrow(path.join(os.tmpdir(), 'nodejs-tools-test'), async (testdata) => {
      const bucket = await awsS3MkTempBucket(client)

      // create local directory
      await fsPromises.mkdir(path.join(testdata, 'c'), { recursive: true })
      await fsPromises.writeFile(path.join(testdata, 'a.txt'), '01\n02\n03\n')
      await fsPromises.writeFile(path.join(testdata, 'b.txt'), 'aa\nbb\ncc\n')
      await fsPromises.writeFile(path.join(testdata, 'c', 'x.txt'), 'xxx\nyyy\nzzz\n')

      // aws cp --recursive <directory> s3://bucket
      await awsS3Cp({
        source: testdata,
        destination: { client, bucket, key: '' },
        options: { recursive: true },
      })
      // aws cp --recursive <directory> s3://bucket/<prefix>
      await awsS3Cp({
        source: testdata,
        destination: { client, bucket, key: 'p' },
        options: { recursive: true },
      })
      // aws cp --recursive <directory> s3://bucket/<prefix>/
      await awsS3Cp({
        source: testdata,
        destination: { client, bucket, key: 'x/' },
        options: { recursive: true },
      })

      // check keys in s3
      const output = await awsS3ListAllKeys(client, bucket, '')
      expect(output).toEqual([
        `a.txt`,
        `b.txt`,
        `c/x.txt`,
        'p/a.txt',
        'p/b.txt',
        'p/c/x.txt',
        `x/${path.basename(testdata)}/a.txt`,
        `x/${path.basename(testdata)}/b.txt`,
        `x/${path.basename(testdata)}/c/x.txt`,
      ])

      // check objects in s3
      expect(await awsS3GetObjectString(client, bucket, `a.txt`)).toBe('01\n02\n03\n')
      expect(await awsS3GetObjectString(client, bucket, `b.txt`)).toBe('aa\nbb\ncc\n')
      expect(await awsS3GetObjectString(client, bucket, `c/x.txt`)).toBe('xxx\nyyy\nzzz\n')
    })
  })

  it('aws cp --recursive s3://<key> <local>', async () => {
    await mkdtempBorrow(path.join(os.tmpdir(), 'nodejs-tools-test'), async (testdata) => {
      const bucket = await awsS3MkTempBucket(client)

      // create local directory
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: 'p/a.txt', Body: 'aaa' }))
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: 'p/b.txt', Body: 'bbb' }))
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: 'p/c/x.txt', Body: 'ccc' }))

      // aws cp --recursive s3://bucket/<prefix> <directory>
      await awsS3Cp({
        source: { client, bucket: bucket, key: 'p' },
        destination: testdata,
        options: { recursive: true },
      })

      // check files in fs
      const files = await lsRecursive(testdata)
      expect(files).toEqual(['a.txt', 'b.txt', 'c/x.txt'].map((f) => path.join(testdata, f)))

      // check file contents in fs
      expect(fs.readFileSync(path.join(testdata, 'a.txt')).toString()).toBe('aaa')
      expect(fs.readFileSync(path.join(testdata, 'b.txt')).toString()).toBe('bbb')
      expect(fs.readFileSync(path.join(testdata, 'c', 'x.txt')).toString()).toBe('ccc')
    })
  })

  it('aws cp --recursive s3://<key> s3://<key>', async () => {
    const bucket = await awsS3MkTempBucket(client)

    // create objects in S3
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: 'p/a.txt', Body: 'aaa' }))
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: 'p/b.txt', Body: 'bbb' }))
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: 'p/c/x.txt', Body: 'ccc' }))

    // aws cp --recursive s3://bucket/<prefix> s3://bucket/<prefix>
    await awsS3Cp({
      source: { client, bucket: bucket, key: 'p' },
      destination: { client, bucket: bucket, key: 'px' },
      options: { recursive: true },
    })

    // check objects in s3
    const output = await awsS3ListAllKeys(client, bucket, 'px')
    expect(output).toEqual(['px/a.txt', 'px/b.txt', 'px/c/x.txt'])
  })
})
