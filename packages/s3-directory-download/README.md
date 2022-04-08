# `@kidscannon/s3-directory-download`

## Install

```
$ npm i @kidscannon/s3-directory-download
```

## Usage

```
const client = new S3Client({})
await s3DirectoryDownload({ client, bucket: 'testx', prefix: 'p' }, '/directory')
```
