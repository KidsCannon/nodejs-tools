import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { lsRecursive } from '@kidscannon/ls-recursive'
import fs from 'fs'
import pLimit from 'p-limit'
import path from 'path'

export const s3DirectoryUpload = async (
  source: string,
  destination: { client: S3Client; bucket: string; prefix: string; concurrency?: number },
): Promise<void> => {
  const limit = pLimit(destination.concurrency ?? 100)
  const files = await lsRecursive(source)
  await Promise.all(
    files.map((file) => {
      return limit(() => {
        return destination.client.send(
          new PutObjectCommand({
            Bucket: destination.bucket,
            Key: path.join(destination.prefix, path.relative(source, file)),
            Body: fs.createReadStream(file),
          }),
        )
      })
    }),
  )
}
