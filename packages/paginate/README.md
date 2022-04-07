# `@kidscannon/paginate`

## Install

```
$ npm i @kidscannon/paginate
```

## Example

```
for await (const res of paginate<ListObjectsV2CommandInput, ListObjectsV2CommandOutput>({
  input: input,
  getOutput: (input) => client.send(new ListObjectsV2Command(input)),
  getNextInput: (output) => output.NextContinuationToken ? { ...input, ContinuationToken: output.NextContinuationToken } : null,
})) {
  console.log(res
}
```
