# `@kidscannon/aws-s3-cp`

## Install

```
$ npm i @kidscannon/aws-s3-cp
```

## Usage

```
const client = new S3Client({})
await awsS3Cp({ source: '/directory', destination: { client, bucket: 'testx', prefix: 'p' } })
```
