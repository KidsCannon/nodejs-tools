# Tools for Node.js Application

## DEVELOPMENT

```
$ npm i
$ npm run test  # test all packages
$ npm run build # build all packages
$ npm run clean # clean build artifacts
```

## RELEASE

bump version:

```
$ npx zx scripts/bump.mjs major|minor|patch
```

publish to npm:

```
$ npx zx scripts/publish.mjs
```
