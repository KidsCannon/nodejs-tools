# `@kidscannon/aws-bulk-send`

## Install

```
$ npm i @kidscannon/aws-bulk-send
```

## Usage

```
const client = new S3Client({})
awsBulkSend({
  client,
  commands: [new GetObjectCommand({ Bucket: 'bucketA', Key: 'keyA' })],
})
```
