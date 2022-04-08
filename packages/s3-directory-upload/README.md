# `@kidscannon/s3-directory-upload`

## Install

```
$ npm i @kidscannon/s3-directory-upload
```

## Usage

```
const client = new S3Client({})
await s3DirectoryUpload('/directory', { client, bucket: 'testx', prefix: 'p' })
```
