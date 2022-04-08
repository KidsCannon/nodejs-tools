import {
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { notEmpty } from '@kidscannon/not-empty'
import { paginate } from '@kidscannon/paginate'
import fs from 'fs'
import mkdirp from 'mkdirp'
import pLimit from 'p-limit'
import path from 'path'

export const s3DirectoryDownload = async (
  source: { client: S3Client; bucket: string; prefix: string; concurrency?: number },
  destination: string,
): Promise<void> => {
  const limit = pLimit(source.concurrency ?? 100)
  for await (const res of paginate<ListObjectsV2CommandInput, ListObjectsV2CommandOutput>({
    input: { Bucket: source.bucket, Prefix: source.prefix },
    getOutput: (input) => source.client.send(new ListObjectsV2Command(input)),
    getNextInput: (input, output) =>
      output.NextContinuationToken ? { ...input, ContinuationToken: output.NextContinuationToken } : null,
  })) {
    const keys = res.Contents?.map((content) => content.Key).filter(notEmpty) ?? []

    await Promise.all(
      keys.map((key) =>
        limit(async () => {
          const filePath = path.join(destination, path.relative(source.prefix, key))
          await mkdirp(path.dirname(filePath))
          const w = fs.createWriteStream(filePath, { flags: 'w' })
          const res = await source.client.send(
            new GetObjectCommand({
              Bucket: source.bucket,
              Key: key,
            }),
          )
          return new Promise<void>((resolve, reject) => {
            res.Body.pipe(w)
              .on('error', (e: Error) => reject(e))
              .on('close', resolve)
          })
        }),
      ),
    )
  }
}
