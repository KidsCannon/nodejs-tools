# Tools for Node.js Application

## DEVELOPMENT

```
$ npm i
$ npm run test  # test all packages
$ npm run build # build all packages
$ npm run clean # clean build artifacts
```

## RELEASE

### 1. bump version:

Edit packages/\*/package.json

### 2. commit

```
$ git add -A && git commit -m 'Bump versions'
```

### 3. check packages that will be published

```
$ npx zx scripts/version-manager.mjs
```

### 4. publish

```
$ npx zx scripts/version-manager.mjs --publish
```
