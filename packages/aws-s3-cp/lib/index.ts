import {
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
import fs from 'fs'
import fsPromises from 'fs/promises'
import pLimit from 'p-limit'
import path from 'path'
import { Readable } from 'stream'

type Resource = FsResource | S3Resource

type FsResource = string

interface S3Resource {
  client: S3Client
  bucket: string
  key: string
}

const resourceAppendPath = (resource: Resource, append: string): Resource => {
  if (typeof resource === 'string') {
    return path.join(resource, append)
  } else {
    return { ...resource, key: path.join(resource.key, append) }
  }
}

const pathOf = (resource: Resource): string => {
  return typeof resource === 'string' ? resource : resource.key
}

const pathBasename = (resource: Resource): string => {
  return typeof resource === 'string' ? path.basename(resource) : path.basename(resource.key)
}

const list = async function* (source: Resource): AsyncGenerator<Resource[]> {
  if (typeof source === 'string') {
    const files = await lsRecursive(source)
    yield files
  } else {
    for await (const res of paginate<ListObjectsV2CommandInput, ListObjectsV2CommandOutput>({
      input: { Bucket: source.bucket, Prefix: source.key },
      getOutput: (input) => source.client.send(new ListObjectsV2Command(input)),
      getNextInput: (input, output) =>
        output.NextContinuationToken ? { ...input, ContinuationToken: output.NextContinuationToken } : null,
    })) {
      const keys = res.Contents?.map((content) => content.Key).filter(notEmpty) ?? []
      yield keys.map((key) => ({ ...source, key }))
    }
  }
}

const get = async (source: Resource): Promise<Readable> => {
  if (typeof source === 'string') {
    return fs.createReadStream(source)
  } else {
    const res = await source.client.send(
      new GetObjectCommand({
        Bucket: source.bucket,
        Key: source.key,
      }),
    )
    // https://github.com/aws/aws-sdk-js-v3/blob/v3.67.0/packages/util-body-length-node/src/calculateBodyLength.ts#L9-L11
    res.Body.byteLength = res.ContentLength
    return res.Body
  }
}

const put = async (source: Readable, destination: Resource, dirCache: Set<string>): Promise<void> => {
  if (typeof destination === 'string') {
    const dir = path.dirname(destination)
    if (!dirCache.has(dir)) {
      if (!fs.existsSync(dir)) {
        await fsPromises.mkdir(dir, { recursive: true })
      }
      dirCache.add(dir)
    }
    const w = fs.createWriteStream(destination, { flags: 'w' })
    await new Promise<void>((resolve, reject) => {
      return source
        .pipe(w)
        .on('error', (e: Error) => {
          source.destroy(e)
          reject(e)
        })
        .on('close', resolve)
    })
  } else {
    try {
      await destination.client.send(
        new PutObjectCommand({
          Bucket: destination.bucket,
          Key: destination.key,
          Body: source,
        }),
      )
    } catch (e) {
      source.destroy(e instanceof Error ? e : undefined)
      throw e
    }
  }
}

export const awsS3Cp = async (
  params: (
    | {
        source: S3Resource
        destination: Resource
      }
    | {
        source: Resource
        destination: S3Resource
      }
  ) & { options?: { recursive?: boolean; concurrency?: number } },
): Promise<void> => {
  const limit = pLimit(params.options?.concurrency ?? 100)

  const src = params.source
  const dst = pathOf(params.destination).endsWith('/')
    ? resourceAppendPath(params.destination, pathBasename(src))
    : params.destination
  const opts = params.options

  const dirCache = new Set<string>()
  if (opts?.recursive) {
    for await (const sources of list(src)) {
      await Promise.all(
        sources.map(async (source) => {
          return limit(async () => {
            const stream = await get(source)
            const rel = path.relative(pathOf(src), pathOf(source))

            if (typeof dst === 'string') {
              const fp = path.join(dst, rel)
              await put(stream, fp, dirCache)
            } else {
              await put(stream, { ...dst, key: path.join(dst.key, rel) }, dirCache)
            }
          })
        }),
      )
    }
  } else {
    const stream = await get(src)
    await put(stream, dst, dirCache)
  }
}
